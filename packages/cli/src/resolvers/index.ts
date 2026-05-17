import { resolveNpm, ResolvedPackage } from './npm';
import * as fs from 'fs';
import * as path from 'path';

export type { ResolvedPackage };

export function resolve(projectRoot: string): ResolvedPackage[] {
  const hasNpm  = fs.existsSync(path.join(projectRoot, 'package-lock.json'))
               || fs.existsSync(path.join(projectRoot, 'package.json'));

  if (hasNpm) return resolveNpm(projectRoot);

  throw new Error(
    'Could not detect package manager. ' +
    'Make sure you run depgrave from a project root with package-lock.json or package.json.'
  );
}