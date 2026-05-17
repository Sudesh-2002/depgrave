import { resolve } from './resolvers/index';
import { analyzeGitHub } from './analyzers/github';

const projectRoot = process.argv[2] ?? process.cwd();

console.log(`\n🪦 depgrave — scanning: ${projectRoot}\n`);

async function main() {
  const packages = resolve(projectRoot);
  console.log(`Found ${packages.length} packages. Analyzing first 3...\n`);

  const sample = packages.slice(0, 3);

  for (const pkg of sample) {
    console.log(`Analyzing ${pkg.name}@${pkg.version}...`);
    const result = await analyzeGitHub(pkg.name);

    if (!result.repoFound) {
      console.log(`  ❌ No GitHub repo found\n`);
      continue;
    }

    console.log(`  Last commit : ${result.lastCommit}`);
    console.log(`  Days since  : ${result.daysSinceCommit}`);
    console.log(`  Bus factor  : ${result.busFactor} contributor(s)\n`);
  }
}

main().catch(console.error);