import fetch from 'node-fetch';
import { withCache } from '../cache';

const OSV_URL = 'https://api.osv.dev/v1/query';

export interface CVEEntry {
  id: string;
  severity: string;
  cvssScore: number | null;
  summary: string;
  url: string;
}

export interface OSVResult {
  openCVEs: CVEEntry[];
  cveCount: number;
  maxCvssScore: number | null;
}

// parse CVSS base score out of the vector string
function parseCvssScore(vuln: any): number | null {
  const severities: any[] = vuln?.severity ?? [];

  for (const s of severities) {
    if (typeof s.score === 'number') return s.score;

    // some have CVSS vector string — extract score from database_specific
    if (s.type === 'CVSS_V3' || s.type === 'CVSS_V2') {
      const dbScore = vuln?.database_specific?.cvss_v3?.score
                   ?? vuln?.database_specific?.cvss?.score;
      if (typeof dbScore === 'number') return dbScore;
    }
  }

  // fallback: check database_specific directly
  const direct = vuln?.database_specific?.cvss_v3?.score
              ?? vuln?.database_specific?.cvss?.score
              ?? vuln?.database_specific?.severity_score;

  return typeof direct === 'number' ? direct : null;
}

function cvssToSeverityLabel(score: number | null): string {
  if (score === null) return 'unknown';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
}

export async function analyzeOSV(
  packageName: string,
  version    : string
): Promise<OSVResult> {
  return withCache(
    `osv:${packageName}@${version}`,
    async () => {
      try {
        const body = {
          version,
          package: { name: packageName, ecosystem: 'npm' },
        };

        const res = await fetch(OSV_URL, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(body),
        });

        if (!res.ok) return { openCVEs: [], cveCount: 0, maxCvssScore: null };

        const data  = await res.json() as any;
        const vulns : any[] = data?.vulns ?? [];

        const openCVEs: CVEEntry[] = vulns.map(v => {
          const cvssScore = parseCvssScore(v);
          return {
            id       : v.id ?? 'UNKNOWN',
            severity : cvssToSeverityLabel(cvssScore),
            cvssScore,
            summary  : v.summary ?? 'No summary available',
            url      : `https://osv.dev/vulnerability/${v.id}`,
          };
        });

        const scores = openCVEs
          .map(c => c.cvssScore)
          .filter((s): s is number => s !== null);

        const maxCvssScore = scores.length > 0 ? Math.max(...scores) : null;

        return { openCVEs, cveCount: openCVEs.length, maxCvssScore };
      } catch {
        return { openCVEs: [], cveCount: 0, maxCvssScore: null };
      }
    },
    1000 * 60 * 60 * 6
  );
}