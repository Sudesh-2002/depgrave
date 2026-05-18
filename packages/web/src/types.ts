export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CVEEntry {
  id          : string;
  severity    : string;
  cvssScore   : number | null;
  summary     : string;
  url         : string;
}

export interface PackageRow {
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

export interface Report {
  scannedAt   : string;
  projectRoot : string;
  total       : number;
  summary: {
    low      : number;
    medium   : number;
    high     : number;
    critical : number;
  };
  packages: PackageRow[];
}