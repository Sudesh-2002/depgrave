import { CVEEntry } from './osv';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: {
    commitScore: number;
    cveScore: number;
    busScore: number;
  };
}

// ── commit age score (0–40) ──────────────────────────────────────
function scoreCommitAge(daysSinceCommit: number | null): number {
  if (daysSinceCommit === null) return 20; // unknown = assume stale

  if (daysSinceCommit <= 180) return 0;
  if (daysSinceCommit <= 365) return 20;
  if (daysSinceCommit <= 730) return 30;
  return 40;
}

// ── CVE score (0–40) ─────────────────────────────────────────────
const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical : 1.5,
  high     : 1.2,
  medium   : 1.0,
  low      : 0.7,
  unknown  : 0.8,
};

function scoreCVEs(cves: CVEEntry[]): number {
  if (cves.length === 0) return 0;

  // base score by count
  let base = 0;
  if (cves.length === 1) base = 15;
  else if (cves.length === 2) base = 25;
  else base = 40;

  // multiply by worst severity found
  const worstMultiplier = Math.max(
    ...cves.map(c => SEVERITY_MULTIPLIER[c.severity] ?? 0.8)
  );

  return Math.min(40, Math.round(base * worstMultiplier));
}

// ── bus factor score (0–20) ──────────────────────────────────────
function scoreBusFactor(busFactor: number): number {
  if (busFactor >= 5) return 0;
  if (busFactor >= 3) return 5;
  if (busFactor === 2) return 10;
  if (busFactor === 1) return 20;
  return 20; // 0 contributors = treat as 1
}

// ── risk level from score ────────────────────────────────────────
function toRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

// ── main export ──────────────────────────────────────────────────
export function calculateRisk(
  daysSinceCommit: number | null,
  cves: CVEEntry[],
  busFactor: number
): RiskResult {
  const commitScore = scoreCommitAge(daysSinceCommit);
  const cveScore    = scoreCVEs(cves);
  const busScore    = scoreBusFactor(busFactor);

  const riskScore = Math.min(100, commitScore + cveScore + busScore);
  const riskLevel = toRiskLevel(riskScore);

  return {
    riskScore,
    riskLevel,
    breakdown: { commitScore, cveScore, busScore },
  };
}