import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';
import { analyzeOSV } from './analyzers/osv';
import { calculateRisk, RiskLevel } from './analyzers/scorer';
import { getWeeklyDownloads } from './analyzers/npm';

const projectRoot = process.argv[2] ?? process.cwd();

const LEVEL_ICON: Record<RiskLevel, string> = {
  low      : '🟢',
  medium   : '🟡',
  high     : '🟠',
  critical : '🔴',
};

console.log(`\n🪦 depgrave — scanning: ${projectRoot}\n`);

async function main() {
  const packages = resolve(projectRoot);
  console.log(`Found ${packages.length} packages. Analyzing first 5...\n`);

  const sample = packages.slice(0, 5);

  for (const pkg of sample) {
    process.stdout.write(`Analyzing ${pkg.name}@${pkg.version}...`);

    const [github, osv, weeklyDownloads] = await Promise.all([
      analyzeGitHub(pkg.name),
      analyzeOSV(pkg.name, pkg.version),
      getWeeklyDownloads(pkg.name),
    ]);

    const risk = calculateRisk(
      github.daysSinceCommit,
      osv.openCVEs,
      osv.maxCvssScore,
      github.busFactor,
      weeklyDownloads
    );

    const icon = LEVEL_ICON[risk.riskLevel];

    console.log(` ${icon} ${risk.riskLevel.toUpperCase()} (${risk.riskScore}/100)`);
    console.log(`  Days since commit : ${github.daysSinceCommit ?? 'unknown'}`);
    console.log(`  Open CVEs         : ${osv.cveCount}${osv.maxCvssScore ? ` (max CVSS: ${osv.maxCvssScore})` : ''}`);
    console.log(`  Bus factor        : ${github.busFactor} contributor(s)`);
    console.log(`  Weekly downloads  : ${weeklyDownloads?.toLocaleString() ?? 'unknown'}`);
    console.log(`  Score breakdown   : commit=${risk.breakdown.commitScore} cve=${risk.breakdown.cveScore} bus=${risk.breakdown.busScore} popularity=${risk.breakdown.popularityScore}`);

    if (osv.openCVEs.length > 0) {
      console.log(`  CVEs:`);
      osv.openCVEs.forEach(cve => {
        const score = cve.cvssScore ? ` CVSS:${cve.cvssScore}` : '';
        console.log(`    ⚠️  ${cve.id}${score} [${cve.severity}] — ${cve.summary}`);
      });
    }

    console.log('');
  }
}

main().catch(console.error);