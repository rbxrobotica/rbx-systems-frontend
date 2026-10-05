# Products portfolio

The `/produtos` and `/products` listing routes share `ProductsPage.svelte` and a
typed PT-BR/EN catalog in `src/lib/content/products.ts`. Product detail routes,
checkout, authentication and other CMS pages retain their existing behavior.

## Rendering decision

The listing is curated in the frontend so the five requested highlights, their
stage and ownership, the platform diagram and metadata stay consistent. This
replaces the old CMS listing that described every product as open source and
ready for critical deployments. Only Robson retains the open-source label.

Trade-off: listing edits now need a frontend release instead of an S3 content
update. The existing `site/{locale}/products/index.md` objects are not modified
and no longer supply these two listing routes. Detail pages remain CMS-backed.

The listing performs zero content/API requests. A CMS outage does not prevent
this portfolio from rendering. External product sites are ordinary navigation
links, not rendering dependencies. There are no new dependencies, mutations,
background tasks or subscriptions. Rollback restores the previous routes and
their existing CMS objects.

## Content evidence

Reviewed on 2026-10-05. Source inspection establishes implementation scope,
not availability guarantees or financial performance.

| Area        | Source                                                                                                                                 | Boundary in the copy                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Robson      | Public `ldamasio/robson` repository; RBX growth claims register section 4                                                              | Execution, risk controls and event audit. No prediction, signals or return claim.                                                                         |
| Strategos   | `strategos-site/src/app/page.tsx`; public `https://strategos.gr`                                                                       | Situation room, evidence and memory. Early access remains explicit.                                                                                       |
| Verentir    | `verentir/src/api.rs`, `src/console.rs`, `docs/rag-shadow-evaluator.md`; claims register section 1                                     | Evaluation and human review. In development; no public console link or release promise.                                                                   |
| Satwake     | `rbx-contexts/projects/satwake.md`; `rbx-briefing-btc/src/lib/server/editions.ts` and artifact route guards; claims register section 6 | Available editions and plan-based access. No delivery time, continuous archive or analytical accuracy promise. Uses existing Briefing BTC detail routes.  |
| Kulinaryos  | Public `https://kulinaryos.com`; `rbx-agent-layer/rbx-external-ecosystem-boundaries.md`                                                | Food Process owns and operates the product. The operator expressly requested this named highlight. No claim of RBX ownership, hosting or client contract. |
| Portal      | `rbx-portal/README.md`, domain model and server authorization                                                                          | Project-specific access, modules, risks, roadmap and evidence. No customer data or screenshots.                                                           |
| Member area | `rbx-briefing-btc` session, edition and artifact route guards                                                                          | The implemented `/briefing-btc` member area is the reference. The planned cross-product Hub root is not presented as delivered.                           |
| Platform    | Claims register section 1: sovereign infrastructure, OIDC identity, payment stack, CMS/S3/SSR publishing and product engineering       | Capabilities for a tailored implementation. Export, retention and recovery are project scope, not claims that every listed product already provides them. |

The canonical claims register is
`rbx-growth/marketing/2026-h2-growth/research/claims-register.md`. It uses section
and claim text rather than entry IDs. The broader sovereignty and Strategos
descriptions have source evidence but no dedicated permitted register entries.
They remain editorial review items before publication. No register is changed
or marketing approval asserted by this frontend change.

Public reads confirmed the Strategos and Kulinaryos websites, the institutional
Briefing BTC detail page, and the authenticated Portal/member-area entry points.
`satwake.com` timed out during inspection; no link to it is introduced. The Hub
root returned 404; it is not linked.

## Voice and publication review

Destination: R1 institutional, R3 labels, R6 agent overlay. RBX Voice System v0.1.
One project-contact CTA; product and authenticated-area links are navigation.
No invented metrics, customer diagnoses, returns, urgency or blanket maturity
claims. The Satwake disclosure is copied verbatim in both locales from the
canonical briefing disclaimer.

This is a portfolio implementation for review, not financial-copy publication
approval. The Robson card states its nature and loss risk; the canonical full
Robson disclaimer remains a legal draft, so it is not presented as approved.
The existing claims/compliance review and separate production release decision
still apply. The nominal Kulinaryos request does not change Food Process ownership.

## Verification

Use pnpm 9, matching CI, and the committed lockfile. Run `pnpm check`, `pnpm test`,
`pnpm seo-check`, `pnpm build`, formatting and ESLint on changed files, and a
secret scan of the patch. Inspect desktop and mobile layouts, locale-specific
metadata, the five CollectionPage entries and navigation targets. No package or
lockfile changes are needed.
