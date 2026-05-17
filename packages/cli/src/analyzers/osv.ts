import fetch from 'node-fetch';

const OSV_URL = 'https://api.osv.dev/v1/query';

export interface CVEEntry {
  id: string;
  severity: string;
  summary: string;
  url: string;
}

export interface OSVResult {
  openCVEs: CVEEntry[];
  cveCount: number;
}

function extractSeverity(vuln: any): string {
  // Try database_specific severity first
  const dbSeverity = vuln?.database_specific?.severity;
  if (dbSeverity) return dbSeverity.toLowerCase();

  // Try severity array
  const severities: any[] = vuln?.severity ?? [];
  if (severities.length > 0) {
    const score = severities[0]?.score ?? '';
    if (score.startsWith('CVSS:') ) {
      // extract base score from CVSS string
      const parts = score.split('/');
      const av = parts.find((p: string) => p.startsWith('AV:'));
      if (av) return 'medium'; // fallback if we can't parse
    }
    return severities[0]?.type?.toLowerCase() ?? 'unknown';
  }

  return 'unknown';
}

export async function analyzeOSV(
  packageName: string,
  version: string
): Promise<OSVResult> {
  try {
    const body = {
      version,
      package: {
        name: packageName,
        ecosystem: 'npm',
      },
    };

    const res = await fetch(OSV_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { openCVEs: [], cveCount: 0 };
    }

    const data = await res.json() as any;
    const vulns: any[] = data?.vulns ?? [];

    const openCVEs: CVEEntry[] = vulns.map(v => ({
      id:       v.id ?? 'UNKNOWN',
      severity: extractSeverity(v),
      summary:  v.summary ?? 'No summary available',
      url:      `https://osv.dev/vulnerability/${v.id}`,
    }));

    return {
      openCVEs,
      cveCount: openCVEs.length,
    };
  } catch {
    return { openCVEs: [], cveCount: 0 };
  }
}