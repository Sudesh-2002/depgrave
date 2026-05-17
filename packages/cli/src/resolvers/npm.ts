import * as fs from 'fs';
import * as path from 'path';

export interface ResolvedPackage {
  name: string;
  version: string;
}

export function resolveNpm(projectRoot: string): ResolvedPackage[] {
  // Try package-lock.json first (npm)
  const lockPath = path.join(projectRoot, 'package-lock.json');
  const pkgPath  = path.join(projectRoot, 'package.json');

  if (fs.existsSync(lockPath)) {
    return fromPackageLock(lockPath);
  }

  if (fs.existsSync(pkgPath)) {
    return fromPackageJson(pkgPath);
  }

  throw new Error(`No package-lock.json or package.json found in: ${projectRoot}`);
}

function fromPackageLock(lockPath: string): ResolvedPackage[] {
  const raw  = fs.readFileSync(lockPath, 'utf-8');
  const lock = JSON.parse(raw);

  const results: ResolvedPackage[] = [];

  // lockfileVersion 2 and 3 use "packages" key
  if (lock.packages) {
    for (const [key, val] of Object.entries(lock.packages as Record<string, any>)) {
      if (key === '') continue; // skip root entry
      if (val.dev) continue;   // skip devDependencies

      // key is like "node_modules/chalk" or "node_modules/a/node_modules/b"
      const name = key.replace(/^.*node_modules\//, '');
      const version = val.version;

      if (name && version) {
        results.push({ name, version });
      }
    }
    return dedupe(results);
  }

  // lockfileVersion 1 uses "dependencies" key
  if (lock.dependencies) {
    return dedupe(flattenDeps(lock.dependencies));
  }

  return [];
}

function flattenDeps(
  deps: Record<string, any>,
  results: ResolvedPackage[] = []
): ResolvedPackage[] {
  for (const [name, val] of Object.entries(deps)) {
    if (val.dev) continue;
    results.push({ name, version: val.version });
    if (val.dependencies) {
      flattenDeps(val.dependencies, results);
    }
  }
  return results;
}

function fromPackageJson(pkgPath: string): ResolvedPackage[] {
  const raw = fs.readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(raw);
  const deps = pkg.dependencies ?? {};

  return Object.entries(deps as Record<string, string>).map(([name, version]) => ({
    name,
    version: version.replace(/[\^~>=<]/, ''),
  }));
}

function dedupe(packages: ResolvedPackage[]): ResolvedPackage[] {
  const seen = new Set<string>();
  return packages.filter(p => {
    const key = `${p.name}@${p.version}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}