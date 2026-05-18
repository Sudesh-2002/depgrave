import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { withCache } from '../cache';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const BASE_URL = 'https://api.github.com';

const headers: Record<string, string> = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

export interface GitHubResult {
  repoFound: boolean;
  lastCommit: string | null;
  daysSinceCommit: number | null;
  busFactor: number;
}

// npm packages store their repo in the registry
async function getRepoFromNpm(packageName: string): Promise<string | null> {
  try {
    const res  = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!res.ok) return null;
    const data = await res.json() as any;

    let url: string =
      data?.repository?.url ??
      data?.repository ??
      '';

    // normalize git urls to owner/repo
    url = url
      .replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/\.git$/, '');

    const match = url.match(/github\.com[/:]([^/]+\/[^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getLastCommit(repo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/repos/${repo}/commits?per_page=1`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json() as any[];
    return data?.[0]?.commit?.committer?.date ?? null;
  } catch {
    return null;
  }
}

async function getBusFactor(repo: string): Promise<number> {
  try {
    // Get contributors in last 90 days via commit activity
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${BASE_URL}/repos/${repo}/commits?since=${since}&per_page=100`,
      { headers }
    );
    if (!res.ok) return 0;
    const commits = await res.json() as any[];

    // count unique authors
    const authors = new Set<string>();
    for (const c of commits) {
      const login = c?.author?.login ?? c?.commit?.author?.email;
      if (login) authors.add(login);
    }
    return authors.size;
  } catch {
    return 0;
  }
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function analyzeGitHub(packageName: string): Promise<GitHubResult> {
  return withCache(
    `github:${packageName}`,
    async () => {
      const repo = await getRepoFromNpm(packageName);

      if (!repo) {
        return {
          repoFound      : false,
          lastCommit     : null,
          daysSinceCommit: null,
          busFactor      : 0,
        };
      }

      const [lastCommit, busFactor] = await Promise.all([
        getLastCommit(repo),
        getBusFactor(repo),
      ]);

      return {
        repoFound      : true,
        lastCommit,
        daysSinceCommit: lastCommit ? daysSince(lastCommit) : null,
        busFactor,
      };
    },
    1000 * 60 * 60 * 24
  );
}