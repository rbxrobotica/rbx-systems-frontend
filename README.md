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

## SEO / Content

- Metadata, Open Graph and JSON-LD are managed via `src/lib/design/components/Seo.svelte`.
- `static/robots.txt` and `static/sitemap.xml` must be kept up to date.
- See `docs/seo/` for the full SEO strategy, editorial plan and publishing checklist.

## Publishing a blog post

See `docs/AGENT-BLOG-PUBLISHING.md` and `docs/BLOG.md`.

---

© RBX Systems. All rights reserved.
