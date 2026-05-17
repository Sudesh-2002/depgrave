export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CVEEntry {
  id: string;
  severity: string;
  summary: string;
  url: string;
}

export interface PackageResult {
  name: string;
  version: string;
  lastCommit: string | null;
  daysSinceCommit: number | null;
  openCVEs: CVEEntry[];
  busFactor: number;
  riskScore: number;
  riskLevel: RiskLevel;
}