# ADR-0002: RBX Sovereign Content Delivery Layer

**Status**: Accepted

**Date**: 2026-06-25

**Program**: RBX Institutional Site / rbx-robotica-frontend

## Context

The institutional site was migrated from Next.js (App Router) to SvelteKit with
`@sveltejs/adapter-static` served by nginx. In the static model, content stored
in Contabo Object Storage (`rbx-content`) is read **once at build time** and
baked into static HTML. This produced three problems:

1. Updating content in Object Storage does **not** update the live site without a
   rebuild + redeploy.
2. The blog index (`/journal`) was empty because posts were stored as `.mdx`
   while the loader only reads `.md`.
3. Blog detail pages (`/blog/[slug]`, `prerender = false`) could never load: the
   bucket is private, there is no server-side proxy route, and no credentials are
   available in the browser bundle.

The goal is a content model where a publication made in the CMS lands in Object
Storage and is reflected on the site **without** a frontend rebuild/redeploy,
while keeping the bucket private and credentials server-side.

### Why NOT the alternatives

- **AWS S3 / Amazon CloudFront** — proprietary hyperscaler dependency.
  Incompatible with RBX's data and infrastructure sovereignty principles.
- **Cloudflare (CDN / R2 / Workers / Pages / Tunnel / DNS proxy)** — abandoned
  org-wide. Never assume Cloudflare services in new designs.
- **Public bucket + browser reads S3 directly** — exposes all bucket objects
  publicly and leaks key listings; credentials would have to ship to the browser.
- **Rebuild-on-publish** — every content change requires a CI rebuild and
  redeploy; contradicts the CMS publish → live requirement.

> Framing: the RBX is **not rejecting CDN**. It is rejecting **proprietary CDN
> dependency**. The decision below is to build a sovereign content delivery
> layer, owned by RBX, evolved progressively.

## Decision

Adopt a **Sovereign Content Delivery Layer**: the institutional site runs as
**SSR with `@sveltejs/adapter-node`** in the RBX k3s cluster, reading the
**private** Contabo Object Storage as an **origin** through an internal
**Content Gateway** that applies cache and normalization.

Traffic model (target):

```
browser → RBX HTTP/cache/edge layer → SSR / Content Gateway → Contabo Object Storage (private origin)
```

In Phase 0 the RBX HTTP layer is the existing Traefik ingress; the Content
Gateway is an in-process server-only module. The Object Storage is **never** a
mandatory per-page-view hot path: public content is cacheable.

### Phase 0 (implemented now)

- SvelteKit SSR (`adapter-node`), stateless, 2 replicas in k3s.
- Content Gateway under `src/lib/server/content` (`store` → `cache` → `gateway`).
  The store is the **only** module aware of the S3-compatible API. The UI
  consumes the gateway abstraction and never touches Object Storage.
- In-memory cache with short TTL, per-replica.
- Missing content or upstream error surfaces as an explicit 404 or 503; no silent stale fallback.
- Server-side asset proxy routes (`/api/blog/cover/[...path]`, `/api/assets/[...path]`).
- HTML and assets emitted with `Cache-Control` + `ETag` to prepare for a future
  RBX proxy/edge with no application change.
- Bucket stays private; credentials only in Kubernetes, read server-side.

### Principles

- Stateless SSR (horizontal scale, secrets in k8s, no mandatory local state).
- Object Storage is an origin, not a public hot path; content is cacheable.
- Secrets server-side only; no client-side Object Storage access.
- UI consumes a content abstraction, never S3 directly.
- Invalidation-friendly (TTL now; events later).
- Observable (cache hit/miss, per-layer latency, origin errors, render time).

## Environment Variables

| Variable | Purpose | Scope |
| --- | --- | --- |
| `PORT` | Node listen port (`8080`) | per deployment |
| `ORIGIN` | Canonical host for adapter-node host validation | per deployment (apex host) |
| `PROTOCOL_HEADER` | `x-forwarded-proto` (Traefik) | per deployment |
| `HOST_HEADER` | `x-forwarded-host` (Traefik) | per deployment |
| `CONTENT_CACHE_TTL_SECONDS` | Content/list freshness TTL (default `60`) | optional |
| `CONTABO_S3_ENDPOINT` | S3-compatible endpoint | existing |
| `CONTABO_S3_CONTENT_BUCKET` | `rbx-content` | existing |
| `CONTABO_S3_PUBLIC_URL` | Public base URL (server use only) | existing |
| `CONTABO_S3_ACCESS_KEY` / `CONTABO_S3_SECRET_KEY` | Credentials (k8s Secret) | existing |

## Consequences

### Positive

- CMS publish → site live within the TTL window, with **no** frontend rebuild.
- Blog index and detail work; institutional pages render PT/EN from Object Storage.
- No AWS, no Cloudflare; bucket private; no secrets in the browser.
- Clean seam (`ContentGateway`) for future extraction into a dedicated service.
- HTTP cache headers already in place for a future sovereign proxy/edge.

### Negative

- SSR pods cost more memory/CPU than the previous nginx static container
  (mitigated by requests/limits + replicas; validated post-deploy).
- Per-replica in-memory cache can diverge briefly across replicas (acceptable
  within the short TTL; resolved in Phase 2 with a distributed cache).
- Operational care needed for `ORIGIN` / forwarded-header validation behind Traefik.

## Evolution Path

This ADR records the full direction. Only Phase 0 is implemented now.

- **Phase 0 — SSR + private origin + internal gateway + in-memory cache + TTL.**
- **Phase 1 — Richer internal cache + CMS-driven invalidation (webhook/event for specific paths).**
- **Phase 2 — Distributed cache (Redis/Valkey) + NATS/pub-sub invalidation.**
- **Phase 3 — Content Gateway as a dedicated service in k3s (stable contract already defined).**
- **Phase 4 — Dedicated reverse proxy/cache (Caddy / Varnish / OpenResty / NGINX).**
- **Phase 5 — RBX-owned edge nodes on controlled VPS.**
- **Phase 6 — Sovereign multi-region operation with full observability, health checks, failover, distributed cache.**

Each phase adds content-delivery capacity that **belongs** to RBX, rather than
renting it from a proprietary CDN.
