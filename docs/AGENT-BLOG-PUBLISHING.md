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
- one git commit containing the post sources

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

If the user sends a valid cover path in the same prompt, the agent should use it directly. Do not require an extra round-trip unless the file is missing, unreadable, or invalid.

## Locale Behavior

The site behavior is:

- `rbx.ia.br` defaults to `pt-BR`
- `rbxsystems.ch` defaults to `en`
- the header locale toggle may override either default via the `rbx-locale-override` cookie

The public URL must stay the same across locales:

- `rbx.ia.br/blog/YYYY-MM-DD-slug`
- `rbxsystems.ch/blog/YYYY-MM-DD-slug`

## Authoring Rules

- Preserve the same meaning across both locale variants
- Reuse the same `date`, `tags`, `author`, `authorRole`, and `cover`
- Keep the same slug across locales
- Follow the writing rules in `docs/WRITING-STYLE.md`
- For `pt-BR`, write natural Portuguese with UTF-8 accents and cedilha
- Never transliterate `pt-BR` prose to ASCII forms such as `nao`, `producao`, or `configuracao`
- Do not include sensitive security details

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

### 3. Upload the cover

Use:

```bash
./scripts/blog-cover-upload.sh /path/to/cover.png YYYY-MM-DD-slug
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

## Validation Checklist

Before finishing, confirm:

- the two locale files exist locally
- the translated meaning is aligned across locales
- the cover URL matches in both files
- the variants were uploaded to S3
- the changes were committed and pushed
- no rebuild/deploy is needed — the gateway cache (~60s TTL) picks up the S3 write
- the `pt-BR` variant was not written in ASCII-transliterated Portuguese
