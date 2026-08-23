/**
 * In-memory stale-while-revalidate (SWR) TTL cache. Generic, no coupling to
 * Object Storage. Per-replica (Phase 0); distributed cache arrives in Phase 2
 * (ADR-0002).
 *
 * Semantics:
 * - fresh hit (age < ttl): return the cached value, no load.
 * - stale hit (age >= ttl): return the stale value *immediately* and revalidate
 *   in the background. A failed revalidation keeps the stale entry and is
 *   reported through `onRefreshError` (never throws on the background path).
 * - miss (no entry): load synchronously and cache the result. Misses are not
 *   masked — `load` may throw and the error propagates to the caller.
 *
 * Both the blocking miss load and the background revalidation are single-flight
 * per key: concurrent callers share one in-flight `load()` instead of each
 * firing their own (no cache stampede).
 */
interface Entry<T> {
  value: T;
  fetchedAt: number;
}

export class SwrCache<T> {
  private store = new Map<string, Entry<T>>();
  private inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly onRefreshError?: (key: string, err: unknown) => void
  ) {}

  /**
   * Return the cached value, serving stale while revalidating in the
   * background. Only a genuine miss blocks on `load`.
   */
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = this.store.get(key);
    if (entry) {
      if (Date.now() - entry.fetchedAt < this.ttlMs) return entry.value;
      this.refresh(key, load); // stale: revalidate in the background
      return entry.value; // ...but serve the stale value now
    }
    return this.load(key, load); // miss: must block on load
  }

  /** Invalidate a single key or all keys whose key starts with `prefix`. */
  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  /** Single-flight blocking load for cache misses. Errors propagate. */
  private load(key: string, load: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing;
    const p = load()
      .then((value) => {
        this.store.set(key, { value, fetchedAt: Date.now() });
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, p);
    return p;
  }

  /**
   * Single-flight background revalidation for a stale entry. Fire-and-forget:
   * the returned promise never rejects — on failure the stale entry is kept and
   * `onRefreshError` is notified — so it can be reused by a concurrent caller
   * without risking an unhandled rejection.
   */
  private refresh(key: string, load: () => Promise<T>): void {
    if (this.inflight.has(key)) return; // a load/refresh is already running
    const p = load()
      .then((value) => {
        this.store.set(key, { value, fetchedAt: Date.now() });
        return value;
      })
      .catch((err) => {
        this.onRefreshError?.(key, err);
        const stale = this.store.get(key);
        if (stale) return stale.value; // keep serving the last good value
        throw err;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    // Swallow any residual rejection (stale entry gone mid-refresh): the
    // blocking `load` path owns surfacing misses, never this background one.
    void p.catch(() => {});
    this.inflight.set(key, p);
  }
}
