import * as fs from 'fs';
import * as path from 'path';
import { TableRow } from './table';

export interface JsonReport {
  scannedAt   : string;
  projectRoot : string;
  total       : number;
  summary: {
    low      : number;
    medium   : number;
    high     : number;
    critical : number;
  };
  packages: TableRow[];
}

export function exportJson(
  rows        : TableRow[],
  projectRoot : string,
  outputPath  : string
): void {
  const sorted = [...rows].sort((a, b) => b.riskScore - a.riskScore);

  const summary = { low: 0, medium: 0, high: 0, critical: 0 };
  sorted.forEach(r => summary[r.riskLevel]++);

  const report: JsonReport = {
    scannedAt   : new Date().toISOString(),
    projectRoot,
    total       : sorted.length,
    summary,
    packages    : sorted,
  };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✅ JSON report saved to: ${outputPath}`);
}