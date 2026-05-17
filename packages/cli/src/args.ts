export interface CliArgs {
  projectRoot  : string;
  outputFile   : string | null;
  outputFormat : 'json' | 'csv' | null;
  failOn       : 'critical' | 'high' | 'medium' | null;
  limit        : number | null;
  clearCache   : boolean;
  cacheStats   : boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);

  let projectRoot  : string                               = process.cwd();
  let outputFile   : string | null                        = null;
  let outputFormat : 'json' | 'csv' | null                = null;
  let failOn       : 'critical' | 'high' | 'medium' | null = null;
  let limit        : number | null                        = null;
  let clearCache   : boolean                              = false;
  let cacheStats   : boolean                              = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output' || arg === '-o') {
      const next = args[++i];
      if (next) {
        outputFile   = next;
        outputFormat = next.endsWith('.csv') ? 'csv' : 'json';
      }
      continue;
    }

    if (arg === '--fail-on') {
      const next = args[++i];
      if (next === 'critical' || next === 'high' || next === 'medium') {
        failOn = next;
      }
      continue;
    }

    if (arg === '--limit') {
      const next = args[++i];
      if (next) {
        const parsed = parseInt(next, 10);
        if (!isNaN(parsed)) limit = parsed;
      }
      continue;
    }

    if (arg === '--clear-cache') { clearCache = true; continue; }
    if (arg === '--cache-stats') { cacheStats = true; continue; }

    if (!arg.startsWith('--')) {
      projectRoot = arg;
    }
  }

  return { projectRoot, outputFile, outputFormat, failOn, limit, clearCache, cacheStats };
}