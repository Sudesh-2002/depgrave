import { CVEEntry } from './osv';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: {
    commitScore : number;
    cveScore    : number;
    busScore    : number;
    popularityScore: number;
  };
}

// ── commit age score (0–25pts) ───────────────────────────────────
function scoreCommitAge(daysSinceCommit: number | null): number {
  if (daysSinceCommit === null) return 15;
  if (daysSinceCommit <= 180)  return 0;
  if (daysSinceCommit <= 365)  return 10;
  if (daysSinceCommit <= 730)  return 18;
  return 25;
}

// ── CVSS-based CVE score (0–40pts) ──────────────────────────────
// Uses real CVSS v3 base score (0.0–10.0) where available,
// falls back to severity label weighting
const SEVERITY_FALLBACK: Record<string, number> = {
  critical : 9.5,
  high     : 7.5,
  medium   : 5.0,
  low      : 2.5,
  unknown  : 4.0,
};

function scoreCVEs(cves: CVEEntry[], maxCvssScore: number | null): number {
  if (cves.length === 0) return 0;

  // use real CVSS score if we have it, else estimate from severity labels
  const effectiveScore = maxCvssScore
    ?? Math.max(...cves.map(c => SEVERITY_FALLBACK[c.severity] ?? 4.0));

  // CVSS 0–10 → 0–35pts, then add volume bonus
  const cvssPoints  = (effectiveScore / 10) * 35;
  const volumeBonus = Math.min(5, (cves.length - 1) * 2);

  return Math.min(40, Math.round(cvssPoints + volumeBonus));
}

// ── bus factor score (0–20pts) ───────────────────────────────────
function scoreBusFactor(busFactor: number): number {
  if (busFactor >= 5) return 0;
  if (busFactor >= 3) return 5;
  if (busFactor === 2) return 10;
  return 20;
}

// ── popularity score (0–15pts) ───────────────────────────────────
// High download count = more community eyes = lower risk
// Low download count = obscure package = higher risk
function scorePopularity(weeklyDownloads: number | null): number {
  if (weeklyDownloads === null) return 8; // unknown = neutral penalty
  if (weeklyDownloads >= 1_000_000) return 0;
  if (weeklyDownloads >= 100_000)   return 3;
  if (weeklyDownloads >= 10_000)    return 6;
  if (weeklyDownloads >= 1_000)     return 10;
  return 15;
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
  daysSinceCommit  : number | null,
  cves             : CVEEntry[],
  maxCvssScore     : number | null,
  busFactor        : number,
  weeklyDownloads  : number | null
): RiskResult {
  const commitScore      = scoreCommitAge(daysSinceCommit);
  const cveScore         = scoreCVEs(cves, maxCvssScore);
  const busScore         = scoreBusFactor(busFactor);
  const popularityScore  = scorePopularity(weeklyDownloads);

  const riskScore = Math.min(100, commitScore + cveScore + busScore + popularityScore);
  const riskLevel = toRiskLevel(riskScore);

  return {
    riskScore,
    riskLevel,
    breakdown: { commitScore, cveScore, busScore, popularityScore },
  };
}