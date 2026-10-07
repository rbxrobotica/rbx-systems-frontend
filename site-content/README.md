# Reviewed public page copy

Home and Solutions have one Markdown source for each locale. The Content
Gateway's existing YAML/Markdown contract is unchanged. The publication script
reads these files instead of maintaining a second copy inside its historical
seed.

This revision explains the buyer's problem before the engineering capabilities,
connects the site to the existing monthly partnership and points to the Journal
and product portfolio as evidence. The Leanctx reference informed information
hierarchy only. RBX tokens, type, colours and component boundaries remain intact.

## Validation and offline export

```sh
node scripts/upload-site-content.cjs --only=home --validate-only
node scripts/upload-site-content.cjs --only=solutions --validate-only
node scripts/upload-site-content.cjs --only=home --export-dir=/tmp/rbx-home-review
node scripts/upload-site-content.cjs --only=solutions --export-dir=/tmp/rbx-solutions-review
```

Exports require an exact page scope and a new directory. They contain the two
locale objects and a SHA-256 manifest. Validation and export make no S3 requests.
Never run the historical bulk seed to release this change: unrelated CMS content
may have changed independently of that seed.

## Authority and release

Public copy remains a review candidate until the independent review is recorded.
The commercial conditions stay in `src/lib/content/partnership.ts`, approved on
2026-10-05. No price, hours or availability counter is duplicated here. Service
paths come from `src/lib/services/catalog.ts`; product identities and stages come
from `src/lib/content/products.ts`. Sources were assessed at main revision
`bf424b70caa7f091c4abaaaab41ada58546145ac`.

S3 remains the live store. Merging these Markdown files does not publish their
objects. Frontend merging publishes an image, whose production promotion is a
separate infrastructure operation. Before changing live content, capture the
exact four prior objects with their hashes, preserve a remote rollback checkpoint,
verify restoration, and release only the reviewed object pair for each page.
Verify both hosts after the Content Gateway cache window.

The home renderer places the partnership and product paths after the hero,
localizes their URLs and takes SEO metadata from the same content source.
Contact prompts ask for product, problem and priority; they introduce no new
contact fields or data flow.
