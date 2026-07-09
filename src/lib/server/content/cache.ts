/**
 * In-memory TTL cache. Generic, no coupling to Object Storage. Per-replica
 * (Phase 0); distributed cache arrives in Phase 2 (ADR-0002).
 */
interface Entry<T> {
  value: T;
  fetchedAt: number;
}

export class SwrCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly onRefreshError?: (key: string, err: unknown) => void
  ) {}

  /**
   * Return the cached value if fresh; otherwise load synchronously.
   * `load` may throw. Cache misses are not masked.
   */
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (entry && now - entry.fetchedAt < this.ttlMs) return entry.value;
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
        this.onRefreshError?.(key, err);
      });
  }
}
