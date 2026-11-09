# Content Gateway: storage request budget

**Status**: measurement and instrumentation implemented. The reduction design in
"Proposal" is **not built**; it waits for an operator decision.
**Guardrail**: RBX engineering guardrails 1.1 (N+1 detection), default threshold
of 15 requests per operation.
**Last reviewed**: 2026-11-08

## Measured request counts

One storage request is one S3 command sent by `src/lib/server/content/store.ts`:
a `GetObject`, or one page of `ListObjectsV2` (up to 1000 keys per page).

`N` is the number of posts that have a file for the locale. The repository
mirror of the Journal (`blog-posts/`) holds 39 posts in `pt-BR` and 39 in `en`
on 2026-11-08, and that is the cardinality used in the "today" column.

| Operation                                         | Gateway calls                                 | Cold cache             | Today  | Cached |
| ------------------------------------------------- | --------------------------------------------- | ---------------------- | ------ | ------ |
| Site page (`/`, `/sobre`, `/produtos/x`, ...)     | `loadPage`                                    | 1 GET                  | 1      | 0      |
| Site page whose object does not exist             | `loadPageOrNull`                              | 1 GET on every request | 1      | 1      |
| Journal listing, tag, author, RSS                 | `loadAllPosts(locale)`                        | 1 LIST + N GET         | **40** | 0      |
| Sitemap                                           | `loadAllPosts` for both locales               | 2 LIST + 2N GET        | **80** | 0      |
| Article (`/blog/[slug]`)                          | `resolvePostSlug` (both listings), `loadPost` | 3 LIST + (2N + 1) GET  | **82** | 0      |
| Cover or asset (`/api/blog/cover`, `/api/assets`) | `getAsset`                                    | 1 GET                  | 1      | 0      |

Where the numbers come from in the source:

- `fetchPostList` in `gateway.ts` lists the prefix once and then reads one
  object per post inside a `for` loop. That loop is the N+1.
- `resolvePostSlug` needs the listing of both locales to resolve aliases and
  alternates, so a cold article pays the loop twice.
- `fetchPost` lists the prefix again before reading the post, although the key
  it accepts is fully determined by slug and locale.
- `loadPage` does not cache a missing object, so the routes that use
  `loadPageOrNull` send one GET per request while their object is absent.

"Cached" is not the whole steady state. Entries live for
`CONTENT_CACHE_TTL_SECONDS` (60 s; assets 600 s). The first request after that
is answered from the stale entry and starts one background revalidation, which
costs the cold number again: 40 requests per locale listing, per replica.

While revalidations succeed, that happens at most once per TTL window. A
revalidation that fails leaves the entry stale, so the next request for the key
starts another one: one at a time per key, with no backoff and no TTL window in
between. A listing whose revalidation fails at its 18th request costs 18
requests per attempt for as long as requests keep arriving, and every attempt
is an operation over budget.

The counts are asserted by `scripts/content-request-budget.test.mjs`, which
runs the real gateway, cache and store against an in-memory S3 client and also
replays the committed `blog-posts/` directory.

## Instrumentation

`src/lib/server/content/request-budget.ts` counts storage requests per handled
operation and logs a warning when an operation exceeds the budget.

- **Operation**: one HTTP request. The `handle` hook opens it and names it by
  method and route id, for example `GET /blog/[slug]`.
- **Counting**: `store.ts` records every command before sending it. The
  operation is carried by `AsyncLocalStorage`, so concurrent requests never
  share a count.
- **Background work**: a revalidation started by a request is charged to that
  request.
- **Budget**: 15, overridable with `CONTENT_STORAGE_REQUEST_BUDGET` (positive
  integer; anything else falls back to 15).
- **Signal**: two `console.warn` lines per operation over budget, each with
  the requests of each cache load so far. The first is written when the
  operation issues its first request above the budget, before that request is
  sent, so it does not depend on the operation ever finishing. The second
  carries the total, once the handler has returned and every load it started
  has settled:

  ```
  [content-gateway] storage request budget exceeded {"operation":"GET /blog/[slug]","requests":16,"budget":15,"loads":{"posts:pt-BR":16}}
  [content-gateway] storage request total over budget {"operation":"GET /blog/[slug]","requests":82,"budget":15,"loads":{"posts:pt-BR":40,"posts:en":40,"post:pt-BR:2026-11-03-example":2}}
  ```

Expected volume until the listing is fixed: two lines per cold listing or
article, and two per listing revalidation. While revalidations succeed that is
two revalidations per TTL window per replica; while they fail above the budget
it is one per request for the stale listing.

Limits of the instrument:

- It counts commands, not HTTP attempts. The SDK makes up to three attempts per
  command by default, so a degraded bucket can receive more requests than
  reported.
- An operation with a load that never settles logs only the first line: its
  total is never known. `store.ts` configures no request timeout on the S3
  client, so nothing ends such a load.
- The line goes to the pod log only. There is no metric or alert route yet.

## Proposal: cut the listing to a bounded count

Not built. Options considered:

| Option                                                   | Cold listing | Cold article | Listing revalidation | Changes outside the gateway     | New failure modes                |
| -------------------------------------------------------- | ------------ | ------------ | -------------------- | ------------------------------- | -------------------------------- |
| 0. Status quo                                            | 1 + N        | 3 + 2N + 1   | 1 + N                | none                            | none                             |
| A. Gateway only: one shared LIST, reuse posts by ETag    | 1 + N        | 1 + 2N + 1   | 1 + changed          | none                            | none                             |
| B. Index object written at publish time, trusted         | 1            | 2            | 1                    | publish scripts write the index | a wrong index is a wrong site    |
| C. Index object validated against the LIST (recommended) | 2 + drift    | 3 + drift    | 1 + changed          | publish scripts write the index | none that changes what is served |

```
publish:  blog-publish.sh --> PUT post objects --> rebuild and PUT blog/index.json

read:     LIST blog/posts/  ------------------+
                                              +--> for each listed key:
          GET blog/index.json (if any) -------+      ETag found in index -> use index metadata
                                                     otherwise           -> GET the post (drift)
```

**Option C in one paragraph.** The publish scripts write `blog/index.json`: for
every post object, its key, its ETag and the metadata the listing needs. The
gateway keeps the LIST as the source of truth for which posts exist and uses
the index only as a cache keyed by ETag. A key missing from the index, or
listed with a different ETag, is read individually, exactly as today. `loadPost`
reads its key directly instead of listing first. Option A is the same gateway
change without the index object, and can ship first.

**Trade-off.** The index is a second representation of data that already lives
in the post files, so it can be stale. Option C pays one extra request per
listing (the LIST) to make staleness harmless. Option B saves that request and
makes the publish step a correctness dependency.

**What stays on the table.** The listing costs two round trips, not one. The
cache is still per replica. A pod that starts while storage is down still has
nothing to serve: no option here changes that, and it needs its own decision
(a build-time or on-disk snapshot of the content).

Failure modes of option C:

| Failure                                | Behavior                                                                                   | How it becomes visible                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Object Storage down, warm cache        | Unchanged: stale entries keep being served                                                 | Not visible today: refresh failures are not reported |
| Object Storage down, cold cache        | Unchanged: 503                                                                             | 503 responses                                        |
| Index missing, unreadable or malformed | Every post is read individually (today's cost); content stays correct                      | Budget warning on the listing                        |
| Post published, index write failed     | That post is read individually until the next index write                                  | Drift count above zero; budget warning if it grows   |
| Two publishes race on the index        | Last writer wins; entries it lacks are read individually                                   | Same as above                                        |
| Index lists a post that was deleted    | Ignored: only listed keys are served                                                       | None needed                                          |
| Index edited to carry wrong metadata   | Wrong listing metadata. Same trust boundary as the posts: needs write access to the bucket | Not detected                                         |
| This service restarts                  | A cold listing costs 2 requests instead of 40. No persisted state                          | Budget warnings stop                                 |

Unverified, because Contabo Object Storage has been disabled since 2026-10-25:
the live key count under `blog/posts/`, that `ListObjectsV2` returns a stable
ETag per key on Contabo, and the latency of the cold paths. These must be
checked against the real bucket before option C is built.
