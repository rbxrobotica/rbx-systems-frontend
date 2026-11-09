/**
 * Failure visibility for the content caches (RBX engineering guardrail 1.3).
 *
 * Counts failed background revalidations, evictions and values left out of a
 * full cache, per cache, and writes them to the pod log. Counting is exact.
 * Logging is throttled per cache and kind of event: the first event is logged
 * at once, later ones are folded into the next line, at most one line per
 * interval. During an origin outage every request for a stale key fails one
 * revalidation, and that must not flood the log.
 */
import type { SwrCacheOptions } from './cache';

const LOG_INTERVAL_MS = 60_000;
const MAX_ERROR_LENGTH = 300;

class Tally {
  total = 0;
  private unreported = 0;
  private lastLineAt = -Infinity;

  /** Count one event. Returns how many events to report now, 0 while throttled. */
  count(): number {
    this.total += 1;
    this.unreported += 1;
    const now = Date.now();
    if (now - this.lastLineAt < LOG_INTERVAL_MS) return 0;
    const reported = this.unreported;
    this.unreported = 0;
    this.lastLineAt = now;
    return reported;
  }
}

/** Options for a `SwrCache` bounded to `maxEntries` whose failures are logged. */
export function monitoredCache(cache: string, maxEntries: number): SwrCacheOptions {
  const failures = new Tally();
  const evictions = new Tally();
  const notCached = new Tally();
  return {
    maxEntries,
    onRefreshError(key, err) {
      const count = failures.count();
      if (count === 0) return;
      console.warn(
        '[content-cache] refresh failed, serving stale',
        JSON.stringify({ cache, key, error: describe(err), failures: count, total: failures.total })
      );
    },
    onEvict(key) {
      const count = evictions.count();
      if (count === 0) return;
      console.warn(
        '[content-cache] entry evicted, cache is full',
        JSON.stringify({ cache, key, maxEntries, evictions: count, total: evictions.total })
      );
    },
    onNotCached(key) {
      const count = notCached.count();
      if (count === 0) return;
      console.warn(
        '[content-cache] entry not cached, cache is full and storage failed',
        JSON.stringify({ cache, key, maxEntries, notCached: count, total: notCached.total })
      );
    }
  };
}

function describe(err: unknown): string {
  let text = String(err);
  if (err instanceof Error) {
    text = `${err.name}: ${err.message}`;
  } else {
    // SvelteKit's HttpError: the gateway turns storage failures into a 503.
    const http = err as { status?: unknown; body?: { message?: unknown } } | null;
    if (typeof http?.status === 'number') text = `${http.status} ${String(http.body?.message)}`;
  }
  return text.slice(0, MAX_ERROR_LENGTH);
}
