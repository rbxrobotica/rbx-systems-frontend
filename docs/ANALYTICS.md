# Analytics

The public sites report to a self-hosted Plausible instance at
`plausible.rbxsystems.ch`. Live since 2026-07-27.

Infrastructure, bring-up and rebuild: `docs/runbooks/PLAUSIBLE-BRINGUP.md` in
`rbx-infra`. This document covers only the site side.

## How it is wired

| File                                 | Role                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `src/routes/+layout.server.ts`       | Reads `VITE_PLAUSIBLE_*` from the pod env and puts them in layout data |
| `src/lib/analytics/Analytics.svelte` | Emits the script tag and starts the tracker                            |
| `src/lib/analytics/index.ts`         | `bootstrapPlausible`, `trackPageview`, `trackEvent`                    |

The `VITE_` prefix is historical. These are **runtime** values read from the
pod's environment through `$env/dynamic/private`; `import.meta.env` is baked at
build time and is always empty in the deployed image. The values live in
`apps/prod/{rbx-ia-br,rbxsystems-ch}/deploy.yml` in `rbx-infra`.

## Two things that will break it silently

### 1. The script is per site

Plausible serves `pa-<id>.js`, which embeds the domain and the event endpoint.
The generic `/js/script.js` embeds neither and reports nothing.
`VITE_PLAUSIBLE_SCRIPT_SRC` therefore differs per deployment:

```
rbx.ia.br      -> https://plausible.rbxsystems.ch/js/pa-RWUjVLP5jqiYl69hgg1FN.js
rbxsystems.ch  -> https://plausible.rbxsystems.ch/js/pa-YLjAxMQF6_-IvBjbWjVcf.js
```

The id changes only if the site is deleted and recreated in Plausible.

### 2. The script does nothing until `init()` is called

This version stays inert on load. The `data-domain` attribute used by the older
snippet is not a bootstrap: the script loads, defines `window.plausible`, and
sends nothing. `bootstrapPlausible()` installs the queue stub from Plausible's
install snippet and calls `plausible.init()`.

Do not "simplify" `Analytics.svelte` by dropping that call. The failure is
invisible: the page looks correctly instrumented, the network tab shows the
script loading with 200, and the dashboard reports no traffic. That is exactly
how the site recorded zero pageviews for a day.

SPA navigation needs no extra work: the script hooks `pushState` and `popstate`
itself, so client-side route changes are counted.

## Verifying a change

`202 ok` from `/api/event` proves nothing: Plausible answers 202 for events it
accepts and for events it discards. The ground truth is the row count in
ClickHouse, from `rbx-infra`:

```bash
kubectl exec -n plausible plausible-clickhouse-0 -- \
  clickhouse-client -q "select count() from plausible_events.events_v2"
```

Count, generate traffic, count again.

If you drive a browser to generate that traffic, two guards will drop it and the
count will not move even though the code is correct:

- **Client:** the tracker skips the event when `navigator.webdriver` is set,
  unless `window.__plausible` is truthy. In Playwright:
  `await page.addInitScript(() => { window.__plausible = true })`.
- **Server:** a `HeadlessChrome` User-Agent is classified as a bot and dropped
  after the 202. Override the User-Agent with a normal Chrome string.

Locally you cannot verify at all: Plausible ignores `localhost` by design and
logs `Ignoring Event: localhost`. Seeing that warning is itself useful, since it
proves the tracker initialised and reached the send decision.

## Custom events

`trackEvent(name, props)` takes a name from the `EventName` union in
`src/lib/analytics/index.ts`. What is instrumented today:

| Event                                       | Where                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `chat_open`                                 | `ContactMenu`, Robson entry                                                                       |
| `whatsapp_click`                            | `ContactMenu` (Ouvidoria) and `ContactSection` (in-page card), told apart by the `entry` property |
| `cta_click`                                 | `LandingOffer`                                                                                    |
| `form_submit`, `form_success`, `form_error` | `CheckoutForm`, `LeadForm`                                                                        |

`form_start` exists as a constant with no call site. The canonical taxonomy,
shared with rbx-commerce, is `marketing/2026-h2-growth/analytics/event-taxonomy.yaml`
in `rbx-growth`, which carries a `status` per event. Calls made before the async script lands are
queued and replayed, so ordering is not a concern. Events for a domain that is
not registered in Plausible are accepted with 202 and dropped.
