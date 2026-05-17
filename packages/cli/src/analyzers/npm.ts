import fetch from 'node-fetch';
import { withCache } from '../cache';

export async function getWeeklyDownloads(packageName: string): Promise<number | null> {
  return withCache(
    `npm:downloads:${packageName}`,
    async () => {
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
    },
    1000 * 60 * 60 * 12 // 12 hour TTL for download counts
  );
}