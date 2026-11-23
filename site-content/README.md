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

**Other pages, candidates of 2026-11-23.** Every other page of the site now has a
source here, `site-content/<locale>/<key>/index.md`, 48 files in all. They were
derived from the rescued objects in `site-content-recovery/2026-11-07-cache-rescue/`
with the house renamed: Merovelis Sistemas in Portuguese, Merovelis Systems in
English. Their bodies are the captured HTML, so they are excluded from Prettier.
About and History were rewritten by hand for the product positioning and the
change of name. Legal names `merovelis.com` as the site and records the earlier
name and addresses. `products/maestro` was not carried over: Maestro left the
catalog. Three limits apply before any release:

1. They are candidates. Nobody reviewed them, and the legal page needs the owner's
   reading in particular.
2. The base is the capture of 2026-11-07. A page changed in the live store after
   that date would be overwritten: compare each object with the live one first.
3. `scripts/upload-site-content.cjs` reads only home and solutions from this
   directory. These files are not wired to any publication path.

**Solutions, 2026-11-23.** Only the name of the house changed in the solutions
pair, at the owner's request. Its hashes are pinned like the home pair, with the
same pending independent review.

**Home, revision of 2026-11-23.** The home copy was rewritten for the house under
its new name, Merovelis Sistemas (Merovelis Systems in English), as a product
company: products first, the engineering partnership as the closing section. The
owner approved this copy on 2026-11-23, and on the same day asked for the
section on Olha Escola, the social project in preparation. `scripts/site-content-recovery.mjs` pins
the hashes of the approved pair. The independent review of this revision is not
recorded yet, and `docs/reviews/codex/public-static-content-preflight.json` still
describes the previous pair: record the review and a new preflight before any
release to the live store. The paragraphs below describe the previous revision
where they speak of the home renderer and of the partnership as its main action.

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

The home renderer presents one qualification action after the hero and at the
end, with products as a secondary evidence link. Navigation and footer expose
the partnership in both locales. SEO metadata follows the same content source.
Contact prompts ask for product, problem and priority; they introduce no new
contact fields or data flow.

Editorial refinement after PR 104 incorporates the operator-provided Fable
review. Decisions and limits are recorded in
`docs/reviews/codex/fable-editorial-decisions.md`. Conversion effects remain
hypotheses; prices and capacity are not changed.
