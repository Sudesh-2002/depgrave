import { resolve } from './resolvers/index';

const projectRoot = process.argv[2] ?? process.cwd();

console.log(`\n🪦 depgrave — scanning: ${projectRoot}\n`);

try {
  const packages = resolve(projectRoot);
  console.log(`Found ${packages.length} packages:\n`);
  packages.slice(0, 10).forEach(p => {
    console.log(`  ${p.name}@${p.version}`);
  });
  if (packages.length > 10) {
    console.log(`  ... and ${packages.length - 10} more`);
  }
} catch (err: any) {
  console.error('Error:', err.message);
}