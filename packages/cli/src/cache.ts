import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CACHE_DIR     = path.join(os.homedir(), '.depgrave');
const CACHE_FILE    = path.join(CACHE_DIR, 'cache.json');
const DEFAULT_TTL   = 1000 * 60 * 60 * 24;

interface CacheEntry<T> {
  value     : T;
  cachedAt  : number;
  ttl       : number;
}

type CacheStore = Record<string, CacheEntry<any>>;

// load & save
function load(): CacheStore {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function save(store: CacheStore): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
  }
}

export function cacheGet<T>(key: string): T | null {
  const store = load();
  const entry = store[key];
  if (!entry) return null;

  const expired = Date.now() - entry.cachedAt > entry.ttl;
  if (expired) return null;

  return entry.value as T;
}

export function cacheSet<T>(
  key  : string,
  value: T,
  ttl  : number = DEFAULT_TTL
): void {
  const store        = load();
  store[key]         = { value, cachedAt: Date.now(), ttl };
  save(store);
}

export function cacheClear(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('✅ Cache cleared.');
    } else {
      console.log('Cache is already empty.');
    }
  } catch {
    console.error('Failed to clear cache.');
  }
}

export function cacheStats(): void {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('No cache found.');
      return;
    }
    const store   = load();
    const keys    = Object.keys(store);
    const expired = keys.filter(k => Date.now() - store[k].cachedAt > store[k].ttl);
    const size    = fs.statSync(CACHE_FILE).size;

    console.log(`📦 Cache location : ${CACHE_FILE}`);
    console.log(`   Total entries  : ${keys.length}`);
    console.log(`   Expired        : ${expired.length}`);
    console.log(`   File size      : ${(size / 1024).toFixed(1)} KB`);
  } catch {
    console.error('Failed to read cache stats.');
  }
}

// cache-aware fetch wrapper 
export async function withCache<T>(
  key     : string,
  fn      : () => Promise<T>,
  ttl     : number = DEFAULT_TTL
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await fn();
  cacheSet(key, value, ttl);
  return value;
}