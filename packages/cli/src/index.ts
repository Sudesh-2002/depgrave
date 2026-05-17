import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';
import { analyzeOSV } from './analyzers/osv';
import { calculateRisk, RiskLevel } from './analyzers/scorer';

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

    const [github, osv] = await Promise.all([
      analyzeGitHub(pkg.name),
      analyzeOSV(pkg.name, pkg.version),
    ]);

    const risk = calculateRisk(
      github.daysSinceCommit,
      osv.openCVEs,
      github.busFactor
    );

    const icon = LEVEL_ICON[risk.riskLevel];

    console.log(` ${icon} ${risk.riskLevel.toUpperCase()} (${risk.riskScore}/100)`);
    console.log(`  Days since commit : ${github.daysSinceCommit ?? 'unknown'}`);
    console.log(`  Open CVEs         : ${osv.cveCount}`);
    console.log(`  Bus factor        : ${github.busFactor} contributor(s)`);
    console.log(`  Score breakdown   : commit=${risk.breakdown.commitScore} cve=${risk.breakdown.cveScore} bus=${risk.breakdown.busScore}`);
    console.log('');
  }
}

main().catch(console.error);