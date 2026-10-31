import Redis from 'ioredis';

const PREFIX = process.env.CACHE_PREFIX || 'bnhs:';
const g = globalThis as unknown as { redis?: Redis | null };

function client(): Redis | null {
  if (g.redis !== undefined) return g.redis;
  if (!process.env.REDIS_URL) return (g.redis = null);
  const r = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
  });
  r.on('error', () => {});
  return (g.redis = r);
}

// Cache-aside helper. Falls back to the loader when Redis is unavailable.
export async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const r = client();
  if (r) {
    try {
      const hit = await r.get(PREFIX + key);
      if (hit) return JSON.parse(hit) as T;
    } catch {}
  }
  const value = await load();
  if (r) {
    try {
      await r.set(PREFIX + key, JSON.stringify(value), 'EX', ttl);
    } catch {}
  }
  return value;
}

export async function invalidateCache() {
  const r = client();
  if (!r) return;
  try {
    const keys = await r.keys(PREFIX + 'c:*');
    if (keys.length) await r.del(...keys);
  } catch {}
}

// Fixed-window rate limiter; allows the request if Redis is down.
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const r = client();
  if (!r) return true;
  try {
    const k = `${PREFIX}rl:${key}`;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSec);
    return n <= max;
  } catch {
    return true;
  }
}
