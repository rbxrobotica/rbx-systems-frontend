# Institutional partnership measurement

Status: frontend instrumentation and local tests. Production collection, dashboard
goals and real delivery of a qualification request require deployment and a separate
operational verification. This change does not establish a CRM integration, automatic
pricing, a sales acceptance decision or revenue attribution.

The institutional journey remains portfolio, offer and asynchronous qualification.
The purpose of measurement is to see which evidence visitors explore, where they
choose to continue, and whether the qualification flow succeeds. Aggregate analytics
does not identify a specific person who received a link.

## Contract

Use `trackPartnershipEvent` from `src/lib/analytics/partnership.ts`. It shares the
existing Plausible provider and runtime configuration. Every accepted event carries
`offer=engineering-partnership` and `offer_version=2026-10-05`. Update this version
alongside an actual change to the public commercial terms; keep it stable for a copy
edit. Do not mix these events with Briefing or generic contact-form metrics.

| Event                | Trigger                                                      | Interpretation                                                |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `offer_view`         | Offer section becomes visible, once per mounted section      | An opportunity to see the offer; not proof it was read        |
| `cta_click`          | Visitor follows a relevant CTA                               | Intent to continue, segmented by destination                  |
| `evidence_view`      | Product evidence becomes visible, once per product per mount | Portfolio material exposed to a visitor                       |
| `evidence_code_open` | Visitor opens a code excerpt                                 | Deliberate exploration of implementation evidence             |
| `form_start`         | First deliberate interaction with qualification fields       | Form started; not merely displayed                            |
| `form_submit`        | A valid, protected request begins                            | One submission attempt, not a lead yet                        |
| `form_success`       | The contact endpoint confirms acceptance                     | Request accepted by the service; not a qualified lead or sale |
| `form_error`         | Submission cannot proceed or request fails                   | A bounded error category, never exception text                |

Allowed dimensions are fixed vocabularies, validated at runtime as well as typed:

- `locale`: `pt-BR`, `en`.
- `surface`: `products`, `partnership`.
- `entry`: `hero`, `footer`, `offer`, `form`, `gallery`, `chat`.
- `destination`, optional: `partnership`, `qualification`, `portfolio`, `product`,
  `source`, `capture`. It records the type of destination, not a destination URL.
- `product`, optional: `robson`, `strategos`, `verentir`, `thalamus`, `robson-code`,
  `satwake`, `kulinaryos`.
- `error`, optional: `validation`, `challenge`, `network`, `http`, `timeout`,
  `unavailable`.

Extra properties and values outside these lists are discarded. Invalid required
dimensions cause the whole event to be discarded. Passive offer/evidence impressions
are sent with `interactive=false`, so they do not themselves mark a bounce as engagement.

The public assistant's dedicated partnership button records `cta_click` with
`entry=chat` and `destination=qualification`. Its `surface=partnership` identifies
the commercial journey, even when the chat was opened on another site page. No
message contents or conversation identifiers are included. The button links to the
localized qualification form and closes the chat; generic contact and Briefing
subscription buttons keep their separate destinations.

## Data boundaries and attribution

The helper sends canonical page URLs without query strings or hashes. The shared
provider additionally reduces automatic referrers to their origin for these
partnership events. It does not change the existing global pageview configuration.
Do not place personal details, secret tokens or client identifiers in any public URL.

Names, email addresses, phone numbers, project descriptions and other form answers
are commercial request data. They go only through the existing contact submission
flow with its stated purpose; they are never event properties. There are no new
tracking cookies, visitor IDs, fingerprinting, session replay or persistent event
queues in this implementation.

Existing first/last-touch UTM capture remains unchanged. The new
`getPartnershipAttribution()` reads that storage and revalidates values before they
can accompany a commercial request. It writes no storage and includes no free-text
`utm_term`, arbitrary campaign name, raw query, referrer URL or per-person label.

Allowed campaigns:

- `2026h2_b2b_networking_001`
- `2026h2_b2b_partnership_001`

Allowed content labels:

- `b2b_portfolio_partnership_001`
- `b2b_institutional_partnership_001`

Sources and media use the existing fixed Growth vocabularies. Returned keys are
prefixed `first_touch_utm_` or `last_touch_utm_`. Missing, blocked or invalid storage
produces no attribution, without blocking the form. This is optional context for
the commercial request, not a means of joining identified leads to anonymous events.

Example shared networking link, without an individual's name:

```text
https://rbx.ia.br/produtos?utm_source=partner&utm_medium=referral&utm_campaign=2026h2_b2b_networking_001&utm_content=b2b_portfolio_partnership_001
```

Normal Plausible pageview attribution can report campaign/source traffic according
to the current instance configuration. These event properties do not carry a copy
of arbitrary UTMs. Additional campaigns must be explicitly added to the allowlist
and the Growth taxonomy before using them in commercial request attribution.

## Dashboard setup and interpretation

Create exact-name custom-event goals in each applicable Plausible site for the eight
events above, then filter by `offer=engineering-partnership` and `offer_version`.
The code alone does not create goals or prove that the dashboard receives events.
Use custom properties and funnels where the deployed instance supports them. See
[Plausible custom event goals](https://plausible.io/docs/custom-event-goals).

Suggested views:

1. Portfolio exploration: `evidence_view`, `evidence_code_open` and gallery
   `cta_click`, broken down by `product` and `destination`.
2. Products to partnership: products `cta_click` with `destination=partnership`,
   followed by a partnership `offer_view`.
3. Offer to request: partnership `offer_view`, `cta_click` with
   `destination=qualification`, `form_start`, `form_submit`, `form_success`.
4. Form reliability: `form_error` broken down by `error` and locale, alongside
   submissions and successes. Distinguish preflight challenge/validation failures
   from failures after a request starts.

Use the same period, locale and offer version for comparisons. Prefer unique-visitor
funnels for progression when supported. Ratios of total event counts are directional
indicators: retries, direct form entry and repeated visits mean they are not exact
person-by-person conversion rates. Do not subtract unmatched event totals and call
the result an abandonment count.

Start with observations over comparable periods, then investigate the weakest step.
A missing event can reflect a blocker, opt-out, JavaScript failure or a disconnected
analytics provider, rather than lack of interest. Read accepted submissions in the
commercial system separately to assess fit and capacity. Closing rate, revenue,
response time, delivery time and founder minutes per opportunity need explicit
commercial records; this frontend does not yet measure them.

## Request budget, trade-offs and failure modes

No API call is made to calculate a price or qualify a visitor. Each accepted custom
event invokes the existing tracker once; the helper has no retry, timer, listener,
background fetch or persistent buffer. Page components must bound passive impressions
to once per section/product mount and release IntersectionObservers on destruction.
Explicit clicks and separate legitimate submissions may generate further events.

The design trades individual journey reconstruction for small, understandable,
aggregate dimensions and a low operational burden. No new analytics service,
dependency or identity store is introduced.

| Failure                                        | Visitor behavior                                                              | Operational evidence/recovery                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Plausible configuration absent                 | Pages and forms continue; events are no-ops                                   | Inspect runtime layout config and existing analytics runbook                         |
| Script blocked, unavailable or provider throws | Navigation and submissions continue                                           | Compare browser requests and dashboard health; the helper never fabricates success   |
| Localhost or loopback preview                  | Helper emits no events                                                        | Run mocked tests rather than polluting production metrics                            |
| Existing `plausible_ignore=true` opt-out       | Helper emits no events                                                        | Respect the exclusion; do not bypass it for QA                                       |
| Storage unavailable                            | Analytics remains usable without storage; commercial attribution may be empty | No form failure or local persistence workaround                                      |
| Contact API unavailable or times out           | Form shows an error and releases its pending state                            | `form_error` is best-effort; service logs are the authoritative operational evidence |
| Site unavailable                               | No client analytics can be emitted                                            | Existing availability monitoring must detect it                                      |

Analytics is not availability monitoring. Follow `docs/ANALYTICS.md` for the current
instance and deployment diagnostics. A transport response alone is insufficient to
prove a record is present in the dashboard. Production verification should use an
explicit QA context and never send a fabricated commercial lead to the live contact
service.

## Local verification

`node --test scripts/partnership-analytics.test.mjs` executes the actual TypeScript
helper and provider with browser/provider mocks. It covers property minimization,
canonical URLs, locale routes, opt-out, loopback, SSR, provider/storage failure,
untrusted stored attribution, referrer minimization and existing caller compatibility.
It makes no network request and uses no real lead data. The normal test, Svelte check,
lint and build commands still apply to the complete frontend change.
