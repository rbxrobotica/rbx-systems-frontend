# CLAUDE.md — RBX Robotica Frontend

## Repository Purpose

This is the public-facing website for RBX Systems (`rbx.ia.br` / `rbxsystems.ch`). It is a **SvelteKit (adapter-node) SSR** application. Blog posts are **Markdown** (rendered with `marked`; YAML frontmatter parsed with `js-yaml` 4) stored in Contabo Object Storage (S3-compatible, **private bucket**). Covers and UI assets are served through server-side proxies (`/api/blog/cover/...`, `/api/assets/...`); the bucket is never read from the client.

> **Canonical publishing workflow:** see `~/docs/rbx-content-publish-workflow.md` (agnostic source of truth). Publishing writes one Markdown object to S3; the site reflects it within ~60s via the Content Gateway cache TTL — **no rebuild, no redeploy**.

## Engineering Guardrails (binding)

Before planning architecture, implementing, or reviewing code in this repository, agents must apply the RBX engineering guardrails checklist: `rbx-engineering-guardrails.md` in the `rbxrobotica/rbx-agent-layer` repository (workspace path `.agents/rbx-engineering-guardrails.md`).

- **Performance:** count requests/queries per operation to avoid N+1 patterns, verify race-prone code with property tests such as `fast-check`, and monitor for leaks.
- **Security:** run stack security lints, secret-scan every change, scan dependencies for known exploits in CI, and keep all dependency versions pinned with a committed lockfile.
- **Architecture:** document the explicit trade-offs and failure modes of any non-trivial design, including what happens when external dependencies or this service fail.
- **Frontend:** freeze the screen during mutations (full-screen loading or disabled surface) until the request resolves, preventing double submits.

These guardrails are enforced in CI via `.github/workflows/guardrails.yml`.

---

## Publishing a Blog Post (Agentic Workflow)

This is the canonical workflow for an AI agent to publish a new blog post end-to-end. Follow all steps in order.

### Default rule for future agentic publishing

When a user provides a new blog post in **either** `pt-BR` or `en`, the agent should treat that text as the source version and automatically produce the missing locale variant before publishing.

Required outcome for every new post:

- Same public slug for both languages
- `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
- `blog-posts/YYYY-MM-DD-slug.en.md`
- Same cover image for both variants
- Upload all available variants with `./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug`

If the user sends the cover image path in the same prompt, use it directly. No second round-trip is required unless the file is missing or invalid.

### Step 1 — Write the Markdown file

Create the post in `blog-posts/` with filename `YYYY-MM-DD-slug.md`. Use this frontmatter:

```yaml
---
title: 'Post title'
date: 'YYYY-MM-DD'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [tag1, tag2]
excerpt: 'One sentence describing the post. Shown in listing and at the top of the page.'
---
```

**Do NOT include a `cover` field yet** — it will be added in Step 6 after the image is uploaded.

Use locale-specific variants when needed:

- `YYYY-MM-DD-slug.md` for a single-language or legacy fallback version
- `YYYY-MM-DD-slug.pt-BR.md` for Brazilian Portuguese
- `YYYY-MM-DD-slug.en.md` for English

The public URL slug remains `YYYY-MM-DD-slug`. The site serves the locale-specific variant that matches the current site language and falls back to the base file if needed.

For all **new** agent-published posts, prefer creating both locale files and skip the base fallback file unless there is a specific reason to keep a single-language post.

**Tone:** institutional, clear, and direct — similar to Cursor or Anthropic blog posts. Match the active locale. See `docs/WRITING-STYLE.md` for editorial guidelines (no em-dashes, no arrows, natural prose).

**Do NOT include sensitive infrastructure details** (IPs, credentials, internal hostnames, security incidents).

**Markdown features:** posts are rendered with `marked` (GFM enabled by default). Supported:

- ✅ Tables (standard Markdown table syntax)
- ✅ Strikethrough (`~~text~~`)
- ✅ Task lists
- ✅ Autolinks
- ✅ Code blocks (rendered as `<pre><code>`; no syntax highlighting)

### Step 2 — Upload the Markdown to S3

```bash
./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug
```

This publishes the base file plus any `pt-BR` and `en` variants that exist. For the canonical agentic workflow, the expected publish set is the two locale-specific files.

The scripts auto-load `CONTABO_S3_*` credentials from the repo `.env` via `scripts/_s3-env.sh` (which also forces path-style addressing). In CI / the cluster, set standard `AWS_*` env vars or mount the `contabo-s3-credentials` secret.

The post is now live at:

- `rbx.ia.br/blog/YYYY-MM-DD-slug` with `pt-BR` as the default locale
- `rbxsystems.ch/blog/YYYY-MM-DD-slug` with `en` as the default locale

The header locale toggle may override either default via cookie.

### Step 3 — Output the Nano Banana cover image prompt

After uploading the post, output the following block verbatim for the user to copy into Nano Banana:

```
--- COVER IMAGE PROMPT ---
Dimensions: 1200 × 630 px
Format: JPEG
Style: dark background, minimal, tech-abstract, cinematic lighting, no text
Prompt: [generate a Nano Banana prompt that visually represents the post topic — keep it abstract and brand-consistent with RBX Systems: dark, precise, mechanical, digital]
--- END ---
```

Then tell the user: "Generate the image in Nano Banana and provide the file path. I will upload it to S3 and add it to the post."

### Step 4 — User provides the image file

Wait for the user to provide the local file path of the generated cover image.

### Step 5 — Upload the cover image to S3

```bash
./scripts/blog-cover-upload.sh /path/to/user/image.jpg YYYY-MM-DD-slug
```

### Step 6 — Add the cover field to the Markdown and re-upload

Edit both locale variants to add the same `cover` field to frontmatter. The Content Gateway normalizes this S3 URL to the server-side proxy (`/api/blog/cover/...`), so the bucket stays private:

```yaml
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/YYYY-MM-DD-slug.jpg'
```

For `.jpg` covers you may instead **omit** `cover` — it defaults to `/api/blog/cover/YYYY-MM-DD-slug.jpg` automatically.

Then re-upload:

```bash
./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug
```

### Step 7 — Verify

```bash
# The scripts source _s3-env.sh (path-style). For ad-hoc aws-cli, force path-style:
#   printf '[default]\ns3.addressing_style = path\n' > /tmp/aws.cfg && export AWS_CONFIG_FILE=/tmp/aws.cfg
aws s3 ls s3://rbx-content/blog/posts/ --endpoint-url https://eu2.contabostorage.com
aws s3 ls s3://rbx-content/blog/covers/ --endpoint-url https://eu2.contabostorage.com
```

Confirm the localized post objects and the cover object exist. The post (with cover) is live within **~60s** — the gateway cache TTL; no rebuild or redeploy is needed.

### Step 8 — Commit the Markdown to git

```bash
git add blog-posts/YYYY-MM-DD-slug.pt-BR.md blog-posts/YYYY-MM-DD-slug.en.md
git commit -m "blog: add post YYYY-MM-DD-slug"
# S3 is the live store; git is the backup. Push only with explicit operator authorization.
```

S3 is the live store; the git repo is the backup/source for all blog content.

---

## S3 Bucket Structure

```
s3://rbx-content/                       (PRIVATE — server-side reads only)
  site/
    pt-BR|en/{page}/index.md            ← site pages (home, solutions, products, ...)
  blog/
    posts/
      YYYY-MM-DD-slug.md                ← base / fallback post content
      YYYY-MM-DD-slug.pt-BR.md          ← Brazilian Portuguese variant
      YYYY-MM-DD-slug.en.md             ← English variant
    covers/
      YYYY-MM-DD-slug.jpg               ← cover image (1200×630 JPEG)
  assets/
    ui/
      bitmap.svg, bitmap_bg.svg, polka-dots.svg, diamond-sunset.svg
    team/
      rafael-scharf.jpg, anthony-farias.jpg, leandro-damasio.jpg, magno-ozzyr.jpg, flavia-ribeiro.jpg
    about/
      rbx-about.jpeg
```

All assets are served via `/api/assets/[...path]` which proxies from S3 with
`Cache-Control: public, max-age=31536000, immutable`. Covers are served via
`/api/blog/cover/[...path]`. Both proxies read server-side; the bucket stays private.

To upload UI assets (SVGs + root-level JPEGs from public/):

```bash
./scripts/assets-upload.sh --bulk-ui
```

To upload a single asset:

```bash
./scripts/assets-upload.sh /path/to/file.jpg team/nome-pessoa.jpg
```

---

## Cover Image Specifications

| Property     | Value                                                               |
|--------------|---------------------------------------------------------------------|
| Dimensions   | 1200 × 630 px                                                       |
| Format       | JPEG (or PNG)                                                       |
| Aspect ratio | 16:9                                                                |
| S3 key       | `blog/covers/{slug}.jpg`                                            |
| Served via   | `/api/blog/cover/{slug}.jpg` (server-side proxy; bucket is private) |

---

## Important Rules

- **Match the current locale** for localized blog content
- **No sensitive security details** (IPs, credentials, internal topology)
- **No cover field without an uploaded image** — omit it if the image isn't uploaded yet
- **Commit Markdown files to git** after publishing — S3 is live storage, git is the backup
- **Never `git push` (or any remote write) without explicit per-operation operator authorization**
