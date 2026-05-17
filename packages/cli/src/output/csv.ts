import * as fs from 'fs';
import * as path from 'path';
import { TableRow } from './table';

function escape(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = value.toString();
  // wrap in quotes if it contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(
  rows       : TableRow[],
  outputPath : string
): void {
  const sorted = [...rows].sort((a, b) => b.riskScore - a.riskScore);

  const headers = [
    'name',
    'version',
    'days_since_commit',
    'cve_count',
    'max_cvss_score',
    'bus_factor',
    'weekly_downloads',
    'risk_score',
    'risk_level',
  ];

  const lines = [
    headers.join(','),
    ...sorted.map(r =>
      [
        escape(r.name),
        escape(r.version),
        escape(r.daysSinceCommit),
        escape(r.cveCount),
        escape(r.maxCvssScore),
        escape(r.busFactor),
        escape(r.weeklyDownloads),
        escape(r.riskScore),
        escape(r.riskLevel),
      ].join(',')
    ),
  ];

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`\n✅ CSV report saved to: ${outputPath}`);
}