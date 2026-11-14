/**
 * In-memory stale-while-revalidate (SWR) TTL cache with a size bound. Generic,
 * no coupling to Object Storage. Per-replica (Phase 0); distributed cache
 * arrives in Phase 2 (ADR-0002).
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
 *
 * Size bound (RBX engineering guardrail 1.3): the cache never holds more than
 * `maxEntries`. Only a successful miss load adds an entry; when the cache is
 * full it first evicts the least recently read entry (LRU) and reports it
 * through `onEvict`. A revalidation only updates an entry that is still
 * cached: it never adds one and never evicts.
 *
 * Eviction is held while the origin fails. A miss load that was in flight when
 * a load of the same origin failed was answered before that failure: it says
 * nothing about the origin now, and what it would evict might be impossible to
 * load again. If the cache is full, its value goes to the caller without being
 * cached, which is reported through `onNotCached`.
 *
 * Consequence for an origin outage: a failed load adds nothing, and once a
 * load has failed, a load can only succeed if it was sent before the outage,
 * which means in flight during a failure. So while every load fails the set of
 * cached keys cannot shrink, and entries have no maximum stale age: whatever
 * could be served when the first load failed keeps being served, stale, until
 * the origin answers again.
 */
interface Entry<T> {
  value: T;
  fetchedAt: number;
}

/**
 * Failure count of an origin. Caches that load from the same origin share one,
 * so that a failure seen through any of them holds evictions in all of them.
 */
export interface OriginFailures {
  count: number;
}

export interface SwrCacheOptions {
  /** Upper bound on cached entries. Positive integer. */
  maxEntries: number;
  /** Failure count of the origin. Defaults to one that only this cache uses. */
  origin?: OriginFailures;
  /**
   * Whether a rejected load means that the origin failed. Defaults to always.
   * Needed when a load also rejects for an answer the origin did give, such
   * as "not found".
   */
  isOriginFailure?: (err: unknown) => boolean;
  /** Called when a background revalidation fails. The stale entry is kept. */
  onRefreshError?: (key: string, err: unknown) => void;
  /** Called when an entry is evicted to make room for a new one. */
  onEvict?: (key: string) => void;
  /** Called when a loaded value is not cached because eviction is held. */
  onNotCached?: (key: string) => void;
}

export class SwrCache<T> {
  // Insertion order is recency order: the first key is the least recently read.
  private store = new Map<string, Entry<T>>();
  private inflight = new Map<string, Promise<T>>();
  private readonly origin: OriginFailures;

  constructor(
    private readonly ttlMs: number,
    private readonly options: SwrCacheOptions
  ) {
    if (!Number.isInteger(options.maxEntries) || options.maxEntries < 1) {
      throw new RangeError('SwrCache maxEntries must be a positive integer');
    }
    this.origin = options.origin ?? { count: 0 };
  }

  /** Number of cached entries. Never above `maxEntries`. */
  get size(): number {
    return this.store.size;
  }

  /**
   * Return the cached value, serving stale while revalidating in the
   * background. Only a genuine miss blocks on `load`.
   */
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = this.store.get(key);
    if (entry) {
      // Mark as most recently read.
      this.store.delete(key);
      this.store.set(key, entry);
      if (Date.now() - entry.fetchedAt < this.ttlMs) return entry.value;
      this.refresh(key, load); // stale: revalidate in the background
      return entry.value; // ...but serve the stale value now
    }
    return this.load(key, load); // miss: must block on load
  }

  /**
   * The cached value, fresh or stale, or undefined when the key is not
   * cached. Loads nothing, revalidates nothing and does not count as a read:
   * for a caller that must never wait on the origin.
   */
  peek(key: string): T | undefined {
    return this.store.get(key)?.value;
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
    const failuresAtStart = this.origin.count;
    const p = load()
      .then(
        (value) => {
          this.insert(key, value, failuresAtStart);
          return value;
        },
        (err) => {
          this.countFailure(err);
          throw err;
        }
      )
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
        // Update in place, keeping the entry's recency. An entry evicted or
        // invalidated while this ran stays gone.
        if (this.store.has(key)) this.store.set(key, { value, fetchedAt: Date.now() });
        return value;
      })
      .catch((err) => {
        this.countFailure(err);
        this.options.onRefreshError?.(key, err);
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

  private countFailure(err: unknown): void {
    if (this.options.isOriginFailure?.(err) ?? true) this.origin.count += 1;
  }

  /**
   * Add the entry of a successful miss load, evicting the LRU entry if full.
   * A full cache does not take the entry of a load that saw the origin fail.
   */
  private insert(key: string, value: T, failuresAtStart: number): void {
    if (!this.store.has(key) && this.store.size >= this.options.maxEntries) {
      if (this.origin.count !== failuresAtStart) {
        this.options.onNotCached?.(key);
        return;
      }
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
        this.options.onEvict?.(oldest);
      }
    }
    this.store.delete(key);
    this.store.set(key, { value, fetchedAt: Date.now() });
  }
}
