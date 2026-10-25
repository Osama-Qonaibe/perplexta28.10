type CacheEntry<T> = {
  value: T;
  expiry: number;
};

const MAX_CACHE_SIZE = 5000;
const cache = new Map<string, CacheEntry<any>>();
const inflightPromises = new Map<string, Promise<any>>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  // Check expiry
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // 5 minutes default
) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

export function delCache(key: string) {
  cache.delete(key);
}

export async function connectCache(): Promise<void> {
  console.log('[Cache] Fast in-memory RAM cache initialized (Zero external dependencies)');
}

// Incremental chunked cleanup of expired entries (max 200 items per tick to prevent event loop lag)
setInterval(() => {
  const now = Date.now();
  let processed = 0;
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
    processed++;
    if (processed >= 200) break;
  }
}, 60 * 1000);

class PureMemoryCache {
  get<T>(key: string): T | null {
    return getCache<T>(key);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    setCache(key, value, Math.ceil(ttlMs / 1000));
  }

  delete(key: string): void {
    delCache(key);
  }

  deletePattern(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }

  clear(): void {
    cache.clear();
    inflightPromises.clear();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate in-flight fetches for the same missing key (thundering herd protection)
    if (inflightPromises.has(key)) {
      return inflightPromises.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const fresh = await fetchFn();
        this.set(key, fresh, ttlMs);
        return fresh;
      } finally {
        inflightPromises.delete(key);
      }
    })();

    inflightPromises.set(key, promise);
    return promise;
  }
}

export const memoryCache = new PureMemoryCache();
