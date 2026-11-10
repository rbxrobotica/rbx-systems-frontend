# Content Gateway: cache bounds and failure visibility

**Status**: implemented. Not deployed, and not verified against the real
bucket: Contabo Object Storage has been disabled since 2026-10-25.
**Guardrail**: RBX engineering guardrails 1.3 (caches need a size bound; watch
for leaks) and 3 (a failure mode must be visible).
**Last reviewed**: 2026-11-08

## Bounds

Every cache in `src/lib/server/content/gateway.ts` is a `SwrCache` with a
mandatory `maxEntries`.

| Cache | Key                         | Cached today | Bound | TTL   |
| ----- | --------------------------- | ------------ | ----- | ----- |
| page  | `page:{locale}:{path}`      | about 54     | 256   | 60 s  |
| post  | `post:{locale}:{slug}`      | 78           | 1024  | 60 s  |
| list  | `posts:{locale}`            | 2            | 8     | 60 s  |
| asset | `asset:{key}`, found or not | about 50     | 256   | 600 s |

"Cached today" is counted from the repository, because the bucket cannot be
listed: 78 post files in `blog-posts/`, 54 page objects in the cache snapshot
rescued from the pods on 2026-11-07, and for assets an estimate of one cover
per post plus the ten UI, team and about images. The bounds sit several times
above that, so the keys of everything published today fit in the caches
together: published content alone cannot cause an eviction. The asset cache
also holds not-found answers, so lookups of asset paths that do not exist can
fill it and evict published assets while storage answers (see the trade-offs
under "Eviction policy"). At the largest sizes seen (a 16 KB post, a 220 KB
cover) full caches would hold on the order of 150 MB, inside the 512 Mi limit
of the pods. That is an estimate: the live heap was not profiled, and the
bound counts entries, not bytes.

Before this change the caches had no bound. Page, post and list keys only
exist for objects that are in the bucket, but the asset cache also remembers
keys that were not found, so requests for arbitrary asset paths grew it without
limit.

## Eviction policy

Least recently read (LRU).

- Only a successful load of a key that is not cached adds an entry. If the
  cache is full, the least recently read entry is evicted first.
- A background revalidation updates its entry in place. It never adds an entry
  and never evicts one.
- A failed load adds nothing, so it evicts nothing.
- Eviction is held while storage fails. The four caches share one count of
  storage failures. A load that was in flight when any of them saw a failure
  does not evict: if its cache is full, its value goes to the requests waiting
  for it and is not cached. Such a load was answered before the failure, so it
  does not show that storage answers now, and the entry it would push out
  might be impossible to load again.
- The hold ends by itself. A load that starts after the latest failure and
  completes with no other failure in between evicts as usual.
- "Not found" is an answer of storage, not a failure: it holds nothing.

Trade-offs:

- Not-found answers share the asset cache with real assets. While storage is
  up, a flood of bogus asset paths can evict real assets; each is loaded again
  by its next request (one GET). Keeping the two apart would need a second
  cache and was left out.
- A value that is not cached costs one storage request per request for its
  key until it is. That only happens to a full cache during a storage failure.
- The hold covers an outage, not a flapping origin. When some loads fail and
  others succeed, a load that starts and completes between two failures can
  evict an entry whose next load fails. This needs a full cache, which
  published content does not reach today.

## While Object Storage is down

- **Cached content keeps being served.** A stale entry is returned on every
  request. Entries have no maximum stale age.
- **Nothing is evicted.** A failed load adds no entry, and only adding an
  entry evicts. Once a load has failed, a load can only succeed if it was sent
  before the outage, which means it was in flight during a failure, and such a
  load does not evict. From the first failed load on, the set of cached keys
  cannot shrink for as long as every load fails. Nothing else removes entries:
  the caches are never invalidated.
- **Before the first failed load**, the caches cannot tell an outage from
  normal operation. A load sent before the outage and answered in that
  interval evicts as usual, if its cache is full.
- **Uncached content is unavailable**: 503 for pages, posts and listings, 404
  for assets. The failure is not cached, so the content is back with the first
  request after storage answers again.
- **Cached assets now survive.** Before this change the asset loader turned a
  storage failure into "not found", and the first failed revalidation replaced
  a cached cover or image with that answer. The failure now reaches the cache
  and the cached asset stays.
- Each request for a stale key still makes one revalidation attempt. There is
  no backoff.
- A pod that restarts comes back with empty caches and has nothing to serve.
  This change does not alter that.

Not an outage for the cache: storage that answers but has lost its objects. An
empty LIST replaces a cached listing, and a not-found answer replaces a cached
asset. Cached pages and posts stay, because their loaders treat not-found as a
failure.

The deployment sets `CONTENT_CACHE_STALE_SECONDS`; nothing in this repository
reads it. Stale entries have no maximum age, and the behavior above depends on
that.

## Visibility

`src/lib/server/content/cache-monitor.ts` counts failed revalidations,
evictions and values left out of a full cache, per cache, and writes them to
the pod log:

```
[content-cache] refresh failed, serving stale {"cache":"page","key":"page:pt-BR:home","error":"503 Content unavailable: home","failures":12,"total":340}
[content-cache] entry evicted, cache is full {"cache":"asset","key":"asset:assets/x.jpg","maxEntries":256,"evictions":1,"total":1}
[content-cache] entry not cached, cache is full and storage failed {"cache":"asset","key":"asset:assets/y.jpg","maxEntries":256,"notCached":1,"total":1}
```

Counting is exact. Logging is throttled per cache and kind of event: the first
event is logged at once, later ones are folded into the next line, at most one
line per minute. `failures`, `evictions` and `notCached` are the events since
the previous line, `total` since the process started.

Limits:

- For pages, posts and listings the logged error is the 503 the gateway
  raises. The storage error behind it is discarded by the fetchers. Asset lines
  carry the storage error itself.
- A load that fails for a key that is not cached is not logged here. It is
  visible as a 503 response, or as a 404 for an asset.
- An eviction line means a bound was reached: either the published content
  outgrew it, or something is requesting keys that should not exist.
- The lines go to the pod log only. There is no metric or alert route yet.

## Not bounded: loads in flight

`maxEntries` bounds the entries a cache holds, not the loads in flight. A
request for a key that is not cached starts one load (one per key at a time),
and nothing ends a load that storage never answers: `store.ts` sets no request
timeout on the S3 client. If storage hangs instead of failing, requests for
many distinct keys, arbitrary asset paths for example, accumulate as pending
loads and pending responses. Memory then grows until the process is restarted,
and a restart loses the stale entries too.

Proposed, not built: a deadline on every storage command, and a cap on
concurrent loads that answers 503 beyond it. Both change what the site answers
when storage is slow, so they need the latency of the real bucket, which
cannot be measured while it is disabled, and an operator decision.
