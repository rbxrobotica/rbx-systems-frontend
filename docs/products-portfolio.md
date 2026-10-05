# Products portfolio

The `/produtos` and `/products` routes share `ProductsPage.svelte` and the typed
PT-BR/EN catalog in `src/lib/content/products.ts`.

## Scope and rendering

The page retains all ten entries from the previous public listing: Robson,
Strategos, Verentir, Briefing BTC (now labeled Satwake / Briefing BTC), Ledger,
Yield, Maestro, Argos Radar, Thalamus and TruthMetal. Four appear as featured
RBX products and six as secondary products/components with explicit stage or
scope labels. The requested Kulinaryos highlight is a separate external
reference to Food Process. It is absent from the RBX catalog, meta description
and CollectionPage ItemList. No personal working relationship or private case
information is published.

The listing is curated in the frontend so copy, availability labels and metadata
stay consistent. Only Robson carries an open-source label. The prior blanket
claims of public source and readiness for critical deployment are removed,
along with the unused `products.*` translations.

Trade-off: listing edits require a frontend release instead of an S3 content
update. Existing `site/{locale}/products/index.md` objects remain untouched and
no longer supply these two listing routes. The listing makes zero content/API
requests, so a CMS outage does not prevent it from rendering. Public evidence
links are navigation, not render dependencies. There are no new dependencies,
mutations, listeners or background jobs in this change.

The two Robson loaders use `loadPageOrNull`: a missing CMS object renders the
existing localized fallback, while a CMS outage still propagates as an error.
Each detail load retains its existing bounded content lookup. Other detail
pages, checkout and authentication keep their existing behavior. Rollback
restores the previous frontend routes and their existing CMS objects.

## Evidence and boundaries

Sources reviewed on 2026-10-05. Implementation evidence does not establish
commercial availability, availability guarantees or financial performance.

| Area                   | Source                                                                                                                  | Boundary                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Robson                 | Public `ldamasio/robson`; growth claims register section 4                                                              | Execution and risk, deterministic processing and audit events. Loss risk and absence of signals/prediction are explicit. Source link added.                                                                                   |
| Strategos              | Public `strategos.gr`; `strategos-site/src/app/page.tsx`                                                                | Situation room and strategic memory, with the public early-access label. No general availability claim.                                                                                                                       |
| Verentir               | `verentir/src/api.rs`, `src/console.rs`, `docs/rag-shadow-evaluator.md`; claims register section 1                      | Evaluation and human review. In development; no public console or release promise.                                                                                                                                            |
| Satwake / Briefing BTC | Operator's requested public name; `rbx-contexts/projects/satwake.md`; edition and artifact guards in `rbx-briefing-btc` | Both names are visible so existing Briefing BTC destinations are recognizable. No route, domain, checkout or public branding migration. No delivery deadline, continuous archive or analytical accuracy claim.                |
| Kulinaryos             | Public `kulinaryos.com`; `rbx-agent-layer/rbx-external-ecosystem-boundaries.md`                                         | The operator explicitly requested this named public reference. Food Process ownership and operation are explicit. This is not authorization to publish the private client case, and that case is not used.                    |
| Ledger / Yield         | `rbx-ledger/README.md`; Journal `2026-08-07-evidence-authority-boundaries`                                              | Ledger is in development; Yield is a proposed capability. No ready-to-buy service claim.                                                                                                                                      |
| Maestro                | `rbx-maestro/docs/architecture.md`                                                                                      | Mission and agent coordination, execution states and controls.                                                                                                                                                                |
| Argos Radar            | `rbx-catalog-registry/catalog/products/argos-radar.yaml`                                                                | Experimental sustainable-funding monitoring. No activated commercial offering.                                                                                                                                                |
| Thalamus / TruthMetal  | `thalamus-core/README.md`, `truthmetal/PLATFORM.md`; Journal `2026-07-29-governed-public-rag`                           | AI control and evaluation responsibilities. No accuracy guarantees.                                                                                                                                                           |
| Portal                 | `rbx-portal` domain model and authorization                                                                             | Public description of project-specific access and readiness tracking. No customer data, private screenshots or login link presented as public evidence.                                                                       |
| Content architecture   | Claims register section 1; Journal `2026-08-02-rbx-journal-rss`                                                         | Publishing, OIDC identity, payments and sovereign infrastructure are implementation capabilities. User data sovereignty, export and recovery are requirements to agree and implement, not blanket features already delivered. |

The canonical register is
`rbx-growth/marketing/2026-h2-growth/research/claims-register.md`; it identifies
claims by section and text, not IDs. The CTA and commercial scope follow
`rbx-growth/marketing/2026-h2-growth/strategy/offers.md`: an ongoing Engineering
Partnership with agreed roadmap and responsibilities. No new ICP, standalone
project offer, public pricing or financial outcome is introduced. Content
subscriptions and the engineering partnership remain separate engagements.

## B2B evolution requested by the operator

The operator explicitly requested blockchain, metaverse and AI as development
paths for paid content platforms connected to RBX’s B2B strategy. The page
presents them as scope options within the Engineering Partnership roadmap, not
as shipped features of the listed products or a separate commercial offer.

Blockchain is framed as a mechanism for verifiable provenance/integrity records.
Private content and personal data stay off-chain in the proposed architecture.
Sovereignty also requires storage, key management, access control and portability;
a ledger alone is not described as a guarantee of ownership or privacy.
Metaverse means virtual spaces/3D experiences; AI means contextual assistance,
content discovery and text/voice interaction, with consent and quality review.
No blockchain network, token sale, investment proposition or infrastructure
migration is selected by this copy change.

Technical references: [Ethereum storage documentation](https://ethereum.org/developers/docs/storage/)
and [IPFS privacy and encryption](https://docs.ipfs.tech/concepts/privacy-and-encryption/).
These support the separation of chain records and content storage, not a claim
that RBX has already deployed this combined experience. Any register updates or
operational implementation remain separate from this requested frontend scope.

## Navigation review

Live reads confirmed the public Strategos and Kulinaryos sites, the Robson
source repository, both Briefing BTC detail routes, both Maestro detail routes,
and the three Journal article destinations in both locales. The Robson detail
routes returned 404 before this fix; that result motivated the fallback tests.
The revised route is verified locally, not claimed to be deployed.

Yield and Argos Radar CMS detail pages currently describe different, older
scopes; Thalamus and TruthMetal detail paths return 404. The portfolio does not
add links to those stale or missing pages. It instead uses relevant public
Journal evidence where available. The older public listing already used plain
text for those names, so this PR did not remove incoming links to those detail
pages. Their CMS content remains a separate editorial concern.

`satwake.com` timed out and the Hub root returned 404 during inspection. Neither
is linked. The implemented member area informs the architecture, while the
visitor receives public product and engineering references. `llms.txt` and the
assistant identify the Satwake / Briefing BTC alias; the assistant’s unsupported
delivery deadline, Free-window and complete-archive statements are also corrected.
Existing sitemap paths are retained because no public route changed.

## Disclosure source and voice

The initial EN disclosure matched the marketing Markdown at
`rbx-growth/marketing/2026-h2-growth/content/briefing-btc/disclaimer.md`.
That file differs by two commas from the product validator. The revised copy
uses the exact PT-BR/EN `REQUIRED_DISCLAIMER` strings from
`rbx-market-briefing/src/utils/validator.ts`, also present in
`tests/llm-structure.test.ts`. `scripts/products-catalog.test.mjs` pins this
contract without requiring another repository in CI. The upstream marketing
source discrepancy is recorded rather than silently described as agreement.

Destination: R1 institutional, R3 labels, R6 overlay; RBX Voice System v0.1.
One partnership CTA. Product/source/article links are navigation. No financial
promises, invented metrics, private diagnostics or unsupported maturity claims.
Existing editorial and production authorization rules remain applicable; this
change does not approve financial copy, the draft Robson legal text or a release.

## Review findings addressed

- Separate external reference and remove private relationship wording.
- Restore the original catalog and distinguish stages.
- Align the offer with Engineering Partnership and narrow sovereignty wording.
- Repair missing Robson CMS content without hiding genuine service failures.
- Pin the exact runtime disclosure and document the two upstream versions.
- Preserve both Satwake and Briefing BTC names, with auditable-artifact wording.
- Remove unused listing translations and align assistant/LLM discovery naming.
- Use an explicit products heading and public product/Journal evidence links.
- Add catalog contracts and route regression coverage.

Dependency scanning is tracked separately in PR #103, which updates
`brace-expansion` to 5.0.12. This PR does not alter the lockfile and its dependency
check can remain red until that prerequisite is merged and incorporated. The
initial independent review missed actionable issues; its earlier clean finding
is superseded by this documented review and correction pass.

## Validation

Use pnpm 9 and the committed lockfile. Run `pnpm check`, `pnpm test`,
`pnpm seo-check`, `pnpm build`, Prettier, ESLint and a secret scan of changed
files. Inspect responsive desktop/mobile layout, PT-BR/EN metadata, ten
CollectionPage items (excluding the external reference), and navigation.

On 2026-10-05, Svelte check returned zero errors/warnings; all 59 tests, SEO,
ESLint, Prettier and the production build passed. Desktop and 390 px mobile
inspection included the blockchain, metaverse and AI section without horizontal
overflow. A built-app smoke check with a local S3 stub confirmed localized
Robson fallback rendering for missing content, propagation of CMS failures,
and both catalog routes rendering correct canonicals and ten structured items
without CMS requests. The final independent content/markup review found no
actionable issue in the added B2B evolution section.
