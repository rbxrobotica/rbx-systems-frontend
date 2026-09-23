# Codex review round 1: Briefing BTC subscription modal

- Date: 2026-09-12
- Branch: `feat/briefing-btc-subscribe-modal` (commits 4cce802, b56b632)
- Reviewer: `gpt-5.3-codex-spark`, `model_reasoning_effort=medium`, `codex exec --ephemeral -s read-only`
- Note: the read-only sandbox blocked `svelte-kit sync` for the reviewer. `bun run check` (svelte-check, 0 errors, 0 warnings), `bun test` (24 pass) and `bun scripts/seo-check.js` were run outside the sandbox on the same commit.

## Verdict

REQUEST_CHANGES (4 findings; 1 to 3 resolved in df48e96, 4 accepted as a known gap)

## Findings and resolution

1. medium, validator skipped name and email. Resolved: `validate()` requires a name of at least 2 characters and a syntactically valid email, focus moves to the first invalid field, `aria-invalid` set.
2. medium, closing kept a solved Altcha token and the step. Resolved: closing returns to step 1, clears the problem and resets the token; typed details are kept.
3. low, team billing note built by string replace. Resolved: `team.billedAnnually` and `team.billedMonthly` keys in both locales.
4. low, no component tests for the modal. Accepted gap: the repository has no component test runner (Playwright is only used by `scripts/test-freeze.mjs`); the catalog, chat prompt and i18n parity are covered by `scripts/briefing-catalog.test.mjs`, SSR deep links were verified with `curl -H 'Host: ...'` for both locales, and the flows were exercised in the browser.

## Reviewer output

`git diff origin/main...HEAD --stat` was run and the branch changes span 22 files (including new `BriefingSubscribeModal.svelte` and updated briefing catalog/chat routes/i18n/tests).

`~/.bun/bin/bun run check` result: **failed in this environment** (read-only filesystem prevents SvelteKit sync from writing `.svelte-kit/tsconfig.json`, plus a transient esbuild “service stopped” message).  
`~/.bun/bin/bun test scripts/briefing-catalog.test.mjs scripts/chat-prompt.test.mjs scripts/rag-shadow.test.mjs` result: **24 pass, 0 fail**.

1. [medium] [`src/lib/design/components/BriefingSubscribeModal.svelte:304-311`](file:///home/psyctl/rbx/rbx-systems-frontend/src/lib/design/components/BriefingSubscribeModal.svelte:304)  
   What is wrong: the validator only checks doc/phone/anti-abuse and never validates `name`/`email` values, even though they are required fields (`required` attrs are present but `novalidate` disables browser enforcement).  
   Why it matters: users can submit blank or malformed names/emails and only get a late server error path (`invalid-fields`), creating avoidable loops and bad lead/checkout payloads.  
   Concrete fix: extend `validate()` to require trimmed non-empty `name` and syntactically valid `email` (and optionally `doc` for paid and `phone` format already present), then gate submit until these pass.

2. [medium] [`src/lib/design/components/BriefingSubscribeModal.svelte:183-188`](file:///home/psyctl/rbx/rbx-systems-frontend/src/lib/design/components/BriefingSubscribeModal.svelte:183)  
   What is wrong: `close()` only calls `reset()` (which clears form/validation state) when `status === 'done'`; when the modal is closed from any other terminal state, form values, `step`, and `altchaPayload` can persist across reopen.  
   Why it matters: users can reopen into step 2 with stale data and a previously solved challenge/token, which is confusing UX and weakens expected anti-abuse freshness (same anti-bot proof can be reused).  
   Concrete fix: reset dialog state and call `resetAntiAbuse()` whenever the modal closes (or when `open` flips false), then optionally only keep optional draft data if explicitly required.

3. [low] [`src/lib/design/components/BriefingSubscribeModal.svelte:720`](file:///home/psyctl/rbx/rbx-systems-frontend/src/lib/design/components/BriefingSubscribeModal.svelte:720)  
   What is wrong: `tr('pro.billedAnnually').replace('{total} ', '')` relies on a hard-coded ASCII-space placeholder pattern in translation content.  
   Why it matters: minor locale copy changes (e.g., NBSP, reordered placeholder usage, punctuation) can leak odd text in UI and silently break the team annual billing line.  
   Concrete fix: add a dedicated translation key for team annual billing (e.g., `team.billedAnnually`) instead of string replacement hacks.

4. [low] Test coverage gap (new modal/state surface)  
   What is wrong: current suite additions cover catalog/chat/shadow contracts but do not exercise `BriefingSubscribeModal` runes/state machine, deep-link open on SSR, accessibility behaviors (Escape/focus trap), anti-abuse reset on reopen, and paid vs free submission branches end-to-end.  
   Why it matters: high-risk behavior is untested and easy to regress, especially around `busy`, `page.show` bfcache, and Altcha lifecycle.  
   Concrete fix: add focused component/integration tests for modal open-source from `?subscribe=1`, close/reopen reset semantics, audience/billing preselect, duplicate submit prevention, Altcha token reset, and route-level deep-link prefill on both `/briefing-btc` and `/products/briefing-btc` (plus `/produtos/briefing-btc`).

No additional correctness issues were identified in:

- catalog/server contract drift checks (unit assertions cover id/amount/list/method),
- analytics event typing usage,
- i18n key parity (structural parity test included in `scripts/briefing-catalog.test.mjs`).

VERDICT: REQUEST_CHANGES
