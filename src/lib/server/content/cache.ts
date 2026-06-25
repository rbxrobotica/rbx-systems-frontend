/**
 * In-memory TTL + stale-while-revalidate cache. Generic, no coupling to Object
 * Storage. Per-replica (Phase 0); distributed cache arrives in Phase 2 (ADR-0002).
 */
interface Entry<T> {
  value: T;
  fetchedAt: number;
}

export class SwrCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly staleMs: number,
    private readonly onRefreshError?: (key: string, err: unknown) => void
  ) {}

  /**
   * Return the cached value if fresh; serve stale and trigger a background
   * refresh if within the stale window; otherwise load synchronously.
   * `load` is expected to handle its own errors and return a safe fallback
   * (null/empty) so callers never receive a throw from a cached miss.
   */
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (entry) {
      const age = now - entry.fetchedAt;
      if (age < this.ttlMs) return entry.value;
      if (age < this.ttlMs + this.staleMs) {
        this.refresh(key, load);
        return entry.value;
      }
    }
    const value = await load();
    this.store.set(key, { value, fetchedAt: Date.now() });
    return value;
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

  private refresh(key: string, load: () => Promise<T>): void {
    load()
      .then((value) => {
        this.store.set(key, { value, fetchedAt: Date.now() });
      })
      .catch((err) => {
        // Keep serving stale; surface to caller if it wants to log.
        this.onRefreshError?.(key, err);
      });
  }
}
