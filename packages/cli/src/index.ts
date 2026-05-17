import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';
import { analyzeOSV } from './analyzers/osv';
import { calculateRisk, RiskLevel } from './analyzers/scorer';
import { getWeeklyDownloads } from './analyzers/npm';
import { renderTable, TableRow } from './output/table';
import { pLimit } from './utils';
import chalk from 'chalk';

const projectRoot    = process.argv[2] ?? process.cwd();
const CONCURRENCY    = 10;

async function analyzePackage(
  name   : string,
  version: string
): Promise<TableRow> {
  const [github, osv, weeklyDownloads] = await Promise.all([
    analyzeGitHub(name),
    analyzeOSV(name, version),
    getWeeklyDownloads(name),
  ]);

  const risk = calculateRisk(
    github.daysSinceCommit,
    osv.openCVEs,
    osv.maxCvssScore,
    github.busFactor,
    weeklyDownloads
  );

  return {
    name,
    version,
    daysSinceCommit : github.daysSinceCommit,
    cveCount        : osv.cveCount,
    maxCvssScore    : osv.maxCvssScore,
    busFactor       : github.busFactor,
    weeklyDownloads,
    riskScore       : risk.riskScore,
    riskLevel       : risk.riskLevel,
  };
}

async function main() {
  console.log(chalk.bold(`\n🪦 depgrave — scanning: ${projectRoot}\n`));

  const packages = resolve(projectRoot);
  console.log(chalk.gray(`Found ${packages.length} packages. Analyzing...\n`));

  let done = 0;

  const rows = await pLimit(packages, CONCURRENCY, async (pkg) => {
    const row = await analyzePackage(pkg.name, pkg.version);
    done++;
    process.stdout.write(
      `\r${chalk.gray(`Analyzed ${done}/${packages.length} packages...`)}`
    );
    return row;
  });

  process.stdout.write('\r' + ' '.repeat(50) + '\r');

  renderTable(rows);
}

main().catch(console.error);