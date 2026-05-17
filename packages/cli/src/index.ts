import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';
import { analyzeOSV } from './analyzers/osv';
import { calculateRisk, RiskLevel } from './analyzers/scorer';
import { getWeeklyDownloads } from './analyzers/npm';
import { renderTable, TableRow } from './output/table';
import { exportJson } from './output/json';
import { exportCsv } from './output/csv';
import { parseArgs } from './args';
import { pLimit } from './utils';
import chalk from 'chalk';
import { cacheClear, cacheStats } from './cache';

const args = parseArgs(process.argv);

if (args.clearCache) { cacheClear(); process.exit(0); }
if (args.cacheStats) { cacheStats(); process.exit(0); }

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
  console.log(chalk.bold(`\n🪦 depgrave — scanning: ${args.projectRoot}\n`));

  const allPackages = resolve(args.projectRoot);
  const packages    = args.limit
    ? allPackages.slice(0, args.limit)
    : allPackages;

  console.log(chalk.gray(
    `Found ${allPackages.length} packages.` +
    (args.limit ? ` Analyzing first ${args.limit}...` : ' Analyzing all...') +
    '\n'
  ));

  let done = 0;

  const rows: TableRow[] = await pLimit(packages, 10, async (pkg) => {
    const row = await analyzePackage(pkg.name, pkg.version);
    done++;
    process.stdout.write(
      `\r${chalk.gray(`Analyzed ${done}/${packages.length} packages...`)}`
    );
    return row;
  });

  process.stdout.write('\r' + ' '.repeat(50) + '\r');

  // always render terminal table
  renderTable(rows);

  // export if --output flag provided
  if (args.outputFile && args.outputFormat === 'json') {
    exportJson(rows, args.projectRoot, args.outputFile);
  }

  if (args.outputFile && args.outputFormat === 'csv') {
    exportCsv(rows, args.outputFile);
  }

  // CI exit code — fail if packages exceed threshold
  if (args.failOn) {
    const order: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const threshold = order.indexOf(args.failOn);
    const failing   = rows.filter(r => order.indexOf(r.riskLevel) >= threshold);

    if (failing.length > 0) {
      console.log(chalk.red(
        `\n❌ ${failing.length} package(s) at or above "${args.failOn}" risk. Exiting with code 1.\n`
      ));
      process.exit(1);
    }
  }
}

main().catch(console.error);