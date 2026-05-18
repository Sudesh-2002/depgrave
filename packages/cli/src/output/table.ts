import Table from 'cli-table3';
import chalk from 'chalk';
import { RiskLevel } from '../analyzers/scorer';

export interface TableRow {
  name            : string;
  version         : string;
  daysSinceCommit : number | null;
  cveCount        : number;
  maxCvssScore    : number | null;
  busFactor       : number;
  weeklyDownloads : number | null;
  riskScore       : number;
  riskLevel       : RiskLevel;
}

const LEVEL_COLOR: Record<RiskLevel, (s: string) => string> = {
  low      : (s) => chalk.green(s),
  medium   : (s) => chalk.yellow(s),
  high     : (s) => chalk.hex('#FFA500')(s),
  critical : (s) => chalk.red.bold(s),
};

const LEVEL_ICON: Record<RiskLevel, string> = {
  low      : '🟢',
  medium   : '🟡',
  high     : '🟠',
  critical : '🔴',
};

function colorLevel(level: RiskLevel): string {
  return LEVEL_COLOR[level](`${LEVEL_ICON[level]} ${level.toUpperCase()}`);
}

function colorScore(score: number, level: RiskLevel): string {
  return LEVEL_COLOR[level](score.toString());
}

function formatDays(days: number | null): string {
  if (days === null) return chalk.gray('unknown');
  if (days <= 180)  return chalk.green(`${days}d`);
  if (days <= 365)  return chalk.yellow(`${days}d`);
  if (days <= 730)  return chalk.hex('#FFA500')(`${days}d`);
  return chalk.red(`${days}d`);
}

function formatCVEs(count: number, maxCvss: number | null): string {
  if (count === 0) return chalk.green('0');
  const cvss = maxCvss ? ` (${maxCvss})` : '';
  if (count >= 3)  return chalk.red(`${count}${cvss}`);
  return chalk.yellow(`${count}${cvss}`);
}

function formatBus(factor: number): string {
  if (factor >= 5) return chalk.green(factor.toString());
  if (factor >= 3) return chalk.yellow(factor.toString());
  if (factor === 2) return chalk.hex('#FFA500')(factor.toString());
  return chalk.red(factor.toString());
}

function formatDownloads(n: number | null): string {
  if (n === null) return chalk.gray('—');
  if (n >= 1_000_000) return chalk.green(`${(n / 1_000_000).toFixed(1)}M`);
  if (n >= 1_000)     return chalk.yellow(`${(n / 1_000).toFixed(1)}K`);
  return chalk.red(n.toString());
}

// summary banner
function printSummary(rows: TableRow[]): void {
  const counts: Record<RiskLevel, number> = {
    low: 0, medium: 0, high: 0, critical: 0
  };
  rows.forEach(r => counts[r.riskLevel]++);

  console.log('\n' + chalk.bold('📊 Summary'));
  console.log(chalk.green(`  🟢 Low      : ${counts.low}`));
  console.log(chalk.yellow(`  🟡 Medium   : ${counts.medium}`));
  console.log(chalk.hex('#FFA500')(`  🟠 High     : ${counts.high}`));
  console.log(chalk.red(`  🔴 Critical : ${counts.critical}`));
  console.log(chalk.gray(`  Total      : ${rows.length} packages\n`));
}

// main render 
export function renderTable(rows: TableRow[]): void {

  const sorted = [...rows].sort((a, b) => b.riskScore - a.riskScore);

  const table = new Table({
    head: [
      chalk.bold('Package'),
      chalk.bold('Version'),
      chalk.bold('Last Commit'),
      chalk.bold('CVEs'),
      chalk.bold('Bus Factor'),
      chalk.bold('Downloads/wk'),
      chalk.bold('Score'),
      chalk.bold('Risk'),
    ],
    colWidths: [35, 12, 13, 12, 12, 14, 8, 16],
    style: { head: [], border: ['gray'] },
    wordWrap: true,
  });

  for (const row of sorted) {
    table.push([
      row.name.length > 33
        ? row.name.slice(0, 30) + '...'
        : row.name,
      chalk.gray(row.version),
      formatDays(row.daysSinceCommit),
      formatCVEs(row.cveCount, row.maxCvssScore),
      formatBus(row.busFactor),
      formatDownloads(row.weeklyDownloads),
      colorScore(row.riskScore, row.riskLevel),
      colorLevel(row.riskLevel),
    ]);
  }

  console.log(table.toString());
  printSummary(sorted);
}