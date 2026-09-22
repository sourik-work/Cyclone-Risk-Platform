/**
 * LocalStorage caching utility with TTL for stable, non-changing API data.
 * Used for /api/tracks, /api/infrastructure, /api/insurance/contracts (1-hour TTL).
 */

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour

export function getCachedData<T>(key: string, ttlMs: number = ONE_HOUR_MS): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: CacheEnvelope<T> = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < ttlMs) {
      return parsed.data;
    }
  } catch (err) {
    console.warn(`[Cache] Error reading key "${key}":`, err);
  }
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[Cache] Error writing key "${key}":`, err);
  }
}

/**
 * Fetch with 1-hour localStorage caching:
 * - If cached data is present within TTL, returns it immediately.
 * - Refreshes in background to ensure fresh data on subsequent visits.
 * - If not cached, fetches from network and caches the result.
 */
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  options?: RequestInit,
  ttlMs: number = ONE_HOUR_MS
): Promise<T> {
  const cached = getCachedData<T>(cacheKey, ttlMs);
  if (cached) {
    // Refresh in background without blocking caller
    fetch(url, options)
      .then(async (res) => {
        if (res.ok) {
          const fresh: T = await res.json();
          setCachedData(cacheKey, fresh);
        }
      })
      .catch((err) => {
        console.warn(`[Cache] Background refresh failed for "${cacheKey}":`, err);
      });

    return cached;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.statusText} (${res.status})`);
  }
  const data: T = await res.json();
  setCachedData(cacheKey, data);
  return data;
}
