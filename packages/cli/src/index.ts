import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';
import { analyzeOSV } from './analyzers/osv';

const projectRoot = process.argv[2] ?? process.cwd();

console.log(`\n🪦 depgrave — scanning: ${projectRoot}\n`);

async function main() {
  const packages = resolve(projectRoot);
  console.log(`Found ${packages.length} packages. Analyzing first 5...\n`);

  const sample = packages.slice(0, 5);

  for (const pkg of sample) {
    console.log(`Analyzing ${pkg.name}@${pkg.version}...`);

    const [github, osv] = await Promise.all([
      analyzeGitHub(pkg.name),
      analyzeOSV(pkg.name, pkg.version),
    ]);

    console.log(`  Last commit  : ${github.lastCommit ?? 'unknown'}`);
    console.log(`  Days since   : ${github.daysSinceCommit ?? 'unknown'}`);
    console.log(`  Bus factor   : ${github.busFactor}`);
    console.log(`  Open CVEs    : ${osv.cveCount}`);

    if (osv.openCVEs.length > 0) {
      osv.openCVEs.forEach(cve => {
        console.log(`    ⚠️  ${cve.id} [${cve.severity}] — ${cve.summary}`);
      });
    }

    console.log('');
  }
}

main().catch(console.error);