# Agent Blog Publishing Contract

> **Atualizado 2026-06-25:** posts são **Markdown** (`.md`, não `.mdx`), renderizados com `marked`. Bucket **privado**; capas servidas via proxy `/api/blog/cover/...`. Sem ISR/deploy — a propagação é ~60s pelo Content Gateway. Workflow canônico: `~/docs/rbx-content-publish-workflow.md`.

This document is the strict workflow for agents that create or publish blog posts in this repository.

## Scope

Apply this workflow whenever the user asks to:

- create a new blog post
- publish a blog post
- translate a blog post
- update an existing blog post
- add or update a blog cover

## Required Outcome For New Posts

Every new post published agentically must produce:

- one public slug
- one `pt-BR` Markdown variant
- one `en` Markdown variant
- one shared cover image
- one entry in `blog-covers-src/covers.json` and its generated SVG source
- one git commit containing the post and cover sources

For a slug `YYYY-MM-DD-slug`, the expected files are:

- `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
- `blog-posts/YYYY-MM-DD-slug.en.md`

The fallback base file `blog-posts/YYYY-MM-DD-slug.md` is optional and should not be the default choice for new bilingual posts.

## Input Contract

The user may send:

- the article text in `pt-BR`
- the article text in `en`
- the cover path in the same prompt, commonly under `/tmp`

If the user sends only one language, the agent must generate the missing locale variant automatically before publishing.

If the user sends a cover path in the same prompt, validate it against the cover
contract below. A standalone bitmap is not a deterministic source and therefore
requires an explicit operator exception; a supplied SVG may be integrated into
the catalogued renderer if it satisfies the contract.

## Locale Behavior

The site behavior is:

- `rbx.ia.br` defaults to `pt-BR`
- `rbxsystems.ch` defaults to `en`
- the header locale toggle may override either default via the `rbx-locale-override` cookie

The canonical storage slug stays the same across locales (S3 keys, covers,
git filenames):

- `rbx.ia.br/blog/YYYY-MM-DD-slug`
- `rbxsystems.ch/blog/YYYY-MM-DD-slug`

### Per-locale public slug (`slugAlias`)

A locale variant may declare an optional `slugAlias` frontmatter field with a
localized public URL slug (lowercase letters, digits, hyphens only):

```yaml
slugAlias: 'YYYY-MM-DD-localized-slug'
```

When present, that locale's public URL becomes `/blog/YYYY-MM-DD-localized-slug`
on its host. The storage slug (canonical filename), the S3 keys, and the cover
key do not change. The site 301-redirects the storage slug, and any other
locale's alias, to the active locale's public slug, and emits hreflang
alternates linking both hosts. Typical use: a Portuguese storage slug with an
English `slugAlias` in the `.en.md` variant so `rbxsystems.ch` gets an English
URL.

## Authoring Rules

- Preserve the same meaning across both locale variants
- Reuse the same `date`, `tags`, `author`, `authorRole`, and `cover`
- Keep the same storage slug across locales; localize the public URL only via
  `slugAlias`
- Follow the writing rules in `docs/WRITING-STYLE.md`
- For `pt-BR`, write natural Portuguese with UTF-8 accents and cedilha
- Never transliterate `pt-BR` prose to ASCII forms such as `nao`, `producao`, or `configuracao`
- Do not include sensitive security details

## Cover Generation Contract

The canonical cover is deterministic SVG-as-code, rasterized to exactly
1200 × 630 as JPEG or PNG. It must be dark, abstract, brand-consistent,
focused on the post's argument, and contain no letters, words, logos rendered
as text, photographs, or generated-image assets. The same raster is used in
the article and as `og:image`, including link previews in WhatsApp.

Do not create a full renderer script per post. Add one declarative entry to
`blog-covers-src/covers.json`; `scripts/generate-cover.py` is the shared
renderer. A post-specific script is allowed only when a genuinely unique
algorithmic composition cannot be expressed by the shared renderer.

For a new cover:

1. Choose or add a content-specific motif in the shared renderer.
2. Add the slug, published extension, title, motif, palette and visual alt
   description to `blog-covers-src/covers.json`. Start a new asset at
   `revision: 1`; increment the revision whenever published pixels change.
3. Generate the source and raster:

   ```bash
   python3 scripts/generate-cover.py --slug YYYY-MM-DD-slug \
     --raster-dir /tmp/rbx-journal-covers
   ```

4. Review the raster visually, then upload it with
   `./scripts/blog-cover-upload.sh`.
5. Commit `covers.json`, `blog-covers-src/{slug}.svg`, and any shared renderer
   change. `pnpm test` verifies completeness, dimensions, prohibited SVG
   elements and byte-for-byte source reproducibility.

LLM-generated or photographic covers are not part of the standard workflow.
They require an explicit operator exception and must not silently replace the
deterministic source contract.

Published asset keys are versioned as `{slug}-v{revision}.{ext}` because the
cover proxy uses a one-year immutable browser cache. Always keep an explicit
`cover:` URL in every locale variant; never overwrite an already published key.

## Publishing Steps

### 1. Write both locale files

Create:

- `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
- `blog-posts/YYYY-MM-DD-slug.en.md`

Do not add `cover` until the image exists in S3.

### 2. Upload the post variants

Use:

```bash
./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug
```

This is the canonical publish command for multilingual posts.

### 3. Generate and upload the cover

Use:

```bash
python3 scripts/generate-cover.py --slug YYYY-MM-DD-slug \
  --raster-dir /tmp/rbx-journal-covers
./scripts/blog-cover-upload.sh \
  /tmp/rbx-journal-covers/YYYY-MM-DD-slug-v1.png YYYY-MM-DD-slug
```

The same cover URL must be added to both locale variants.

### 4. Re-publish all variants

After adding `cover:` to both Markdown files, run:

```bash
./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug
```

### 5. Verify objects in S3

Confirm the locale variants and cover exist.

### 6. Commit and push

Commit the source files to git and push to `main` unless the user explicitly requests otherwise.

## Updating Existing Posts

When updating an existing bilingual post:

- update both locale variants when the content meaning changes
- keep the slug unchanged
- re-publish with `./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug`
- commit the updated Markdown files

If only one locale needs correction, the agent may update only that variant, but should verify whether the other locale now diverges materially.

## SEO Validation Checklist

Before finishing, confirm every post has:

- unique title ≤ 60 characters
- unique meta description ≤ 160 characters (use `excerpt:`)
- a single H1 matching the title
- 3–5 internal links to RBX pages
- `date`, `author`, `authorRole`, `tags` and `cover` in frontmatter
- JSON-LD `BlogPosting` schema (the site injects it automatically from frontmatter)
- a CTA in the conclusion
- a LinkedIn-ready short version

Run `pnpm seo-check` before committing.

## Validation Checklist

Before finishing, confirm:

- the two locale files exist locally
- the translated meaning is aligned across locales
- the cover URL matches in both files
- the catalog entry and generated SVG source exist and `pnpm test` accepts them
- the raster is 1200 × 630, abstract, content-focused and contains no text
- the variants were uploaded to S3
- the changes were committed and pushed
- no rebuild/deploy is needed — the gateway cache (~60s TTL) picks up the S3 write
- the `pt-BR` variant was not written in ASCII-transliterated Portuguese
- `pnpm seo-check` passes
