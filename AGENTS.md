# AGENTS.md — RBX Robotica Frontend

This file is the root index for agent-facing operational instructions in this repository.

## Canonical Artifacts

- General repository workflow and publishing context: [CLAUDE.md](CLAUDE.md)
- Strict Journal publishing workflow for agents: [docs/AGENT-BLOG-PUBLISHING.md](docs/AGENT-BLOG-PUBLISHING.md)
- Editorial and storage reference for the Journal: [docs/BLOG.md](docs/BLOG.md)
- Cross-repository cover contract: `~/docs/rbx-journal-cover-policy.md`

## Mandatory Rules

If the task involves creating, translating, publishing, or updating a Journal
post, read [docs/AGENT-BLOG-PUBLISHING.md](docs/AGENT-BLOG-PUBLISHING.md)
before acting.

For every Journal cover:

- Add a declarative entry to `blog-covers-src/covers.json`; routine posts do not
  get a separate generator script.
- Use `scripts/generate-cover.py` and commit
  `blog-covers-src/{slug}.svg` as the canonical editable source.
- Keep the cover deterministic, abstract, content-focused, text-free, pure
  vector, and exactly 1200×630.
- Publish only a versioned `{slug}-v{revision}.{jpg,png}` raster derivative;
  increment the revision whenever pixels change and never overwrite history.
- Use that same derivative in every locale for the article and its Open
  Graph/WhatsApp preview.
- Run `pnpm cover-check` and the relevant content, test, and build checks before
  publication.

`scripts/generate-og-image.py` is the generic site fallback, not a per-post
cover generator. Photographic or probabilistic covers require an explicit
operator exception.
