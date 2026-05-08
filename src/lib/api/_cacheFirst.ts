/**
 * Stale-while-revalidate read helper.
 *
 * 1. Return store data immediately if it exists and isn't stale.
 * 2. If stale or missing, fetch from server.
 * 3. On success: update store, return fresh data.
 * 4. On failure: return stale data if available (graceful degradation), else throw.
 */

// In-flight request deduplication — prevents concurrent calls to the same key
const inflight = new Map<string, Promise<any>>();

export async function cacheFirstRead<T>(
  key: string,
  getStoreData: () => T | null,
  getLoadedAt: () => number | null,
  setStoreData: (data: T) => void,
  serverFetcher: () => Promise<T>,
  staleMs: number,
): Promise<T> {
  // Deduplicate concurrent calls for the same key
  const existing = inflight.get(key);
  if (existing) return existing;

  const run = async (): Promise<T> => {
    const cached = getStoreData();
    const loadedAt = getLoadedAt();
    const isFresh = loadedAt !== null && Date.now() - loadedAt < staleMs;

    // Fresh cache — return immediately, no server fetch needed
    if (cached !== null && isFresh) {
      return cached;
    }

    // Stale or missing — fetch from server
    try {
      const fresh = await serverFetcher();
      setStoreData(fresh);
      return fresh;
    } catch (error) {
      // Server fetch failed — return stale data if available
      if (cached !== null) {
        console.warn(`[cacheFirstRead] Server fetch failed for "${key}", using stale data:`, error);
        return cached;
      }
      throw error;
    }
  };

  const promise = run().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/** Stale thresholds in milliseconds. */
export const STALE_MS = {
  items: 5 * 60 * 1000,        // 5 minutes
  categories: 15 * 60 * 1000,  // 15 minutes
  customers: 15 * 60 * 1000,   // 15 minutes
  vendors: 15 * 60 * 1000,     // 15 minutes
  transactions: 5 * 60 * 1000, // 5 minutes
  dashboard: 5 * 60 * 1000,    // 5 minutes
} as const;
