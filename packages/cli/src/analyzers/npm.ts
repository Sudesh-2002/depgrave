import fetch from 'node-fetch';

export async function getWeeklyDownloads(packageName: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${packageName}`
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    return typeof data.downloads === 'number' ? data.downloads : null;
  } catch {
    return null;
  }
}