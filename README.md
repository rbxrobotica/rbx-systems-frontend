# RBX Systems — Public Website

Public-facing institutional website for **RBX Systems** (`rbx.ia.br` / `rbxsystems.ch`).
Built with **SvelteKit 5**, **TypeScript** and `@sveltejs/adapter-node` (SSR).

Content (site pages and blog posts) is stored in a private S3-compatible bucket
(`rbx-content`) and read server-side through the Content Gateway. No build-time
prerender is required.

## Domains

- `rbx.ia.br` — Brazilian Portuguese (pt-BR)
- `rbxsystems.ch` — English (en)

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Checks

```bash
pnpm check
pnpm lint
```

## Public-assistant RAG shadow

The chat BFF can duplicate only the latest user question to the governed Thalamus
`POST /rbx/v1/rag/shadow/retrieve` route. It is disabled by default and never uses
retrieved hits to construct or modify the public answer. Enable it only with
`THALAMUS_RAG_SHADOW_ENABLED=true`, `THALAMUS_URL`, and a
`THALAMUS_RAG_TOKEN` service credential limited to `thalamus:rag:retrieve`.

When enabled, each chat operation adds exactly one bounded HTTP request, started in
parallel with the existing completion. It has a 1500 ms default timeout, no retry,
a 256 KiB response cap, and validates the fixed public package and visibility.
Logs contain only status/reason, or validated trace/audit IDs on success; query
text, context, and tokens are never logged. A slow Thalamus can add at most the configured timeout to
the request, while an unavailable or malformed shadow dependency never changes the
live chat result. This latency trade-off is accepted only for shadow measurement.

## SEO / Content

- Metadata, Open Graph and JSON-LD are managed via `src/lib/design/components/Seo.svelte`.
- `static/robots.txt` and `static/sitemap.xml` must be kept up to date.
- See `docs/seo/` for the full SEO strategy, editorial plan and publishing checklist.

## Publishing a blog post

See `docs/AGENT-BLOG-PUBLISHING.md` and `docs/BLOG.md`.

---

© RBX Systems. All rights reserved.
