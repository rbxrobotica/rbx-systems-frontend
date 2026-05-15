# CONTACT — Bidirectional Contact System — Analysis & Execution Plan

**Date**: 2026-05-15
**Author**: Claude Opus 4.7 (planner) — execution open to handoff
**Status**: Draft
**Parent**: [`contact-system.md`](contact-system.md) — Contact System program index. Read it first.
**Phase**: Phase 1 of the contact-system program
**Related**: [ADR-0001](../adr/ADR-0001-contact-form-via-nextjs-api-route.md) (contact form via Next.js API route)

> This guide covers Phase 1 (Bidirectional) of the contact-system program. For program-wide context, status of other phases, decision log, and operational commands, see the [program index](contact-system.md).

---

## Executive Summary

**Problem Statement**: The contact form shipped on 2026-05-15 (commit `7ca2868`) is outbound-only and unprotected. Before any public announcement, it needs anti-abuse hardening. Beyond that, the WhatsApp channel is half-duplex (we send template acknowledgments but never receive replies), and every submission is ephemeral (it lives in the operator's inbox, not in any structured store). This guide closes those gaps in four ordered slices.

**Key Findings**:
- The `/api/contact` route has zero rate limiting, no CAPTCHA, and no honeypot. Public exposure without protection will trigger abuse within hours of any social-media announcement and may lock Postmark/D360 quotas.
- The D360 webhook URL is already provisioned (`pass show rbx/d360/webhook-url`) but no handler exists. Leads who reply to the acknowledgment template have their messages dropped.
- No persistence layer exists. If `contact@rbxsystems.ch` mailbox is misconfigured or full, submissions vanish.
- No metrics or alerts cover the contact flow. Postmark or D360 outages would be invisible until a customer complaint.

**Recommended Action**: Execute the entry points in order: `EP-001` (anti-abuse) → `EP-002` (inbound webhook) → `EP-003` (persistence) → `EP-004` (observability). EP-001 is a hard prerequisite for any public-facing rollout.

**Estimated Effort**: 7–10 working days for a single Next.js + Postgres developer. Slices can partially parallelize: persistence schema design (EP-003) can start while webhook handler (EP-002) is in review.

---

## Current State

### System Overview
- **Frontend**: Next.js 14 App Router, deployed via ArgoCD GitOps from `rbx-infra` to k3s namespaces `rbx-ia-br` and `rbxsystems-ch`. Image at `ghcr.io/rbxrobotica/rbx-ia-br:sha-<sha>`.
- **Contact route**: `app/api/contact/route.ts` — single POST handler doing Postmark email + D360 template (fire-and-forget).
- **Email path**: Postmark relay → `contact@rbxsystems.ch` (Mailcow inbox at `mail.rbxsystems.ch`).
- **WhatsApp path**: D360 cloud → template `contact_form_acknowledgment` (pending approval).
- **Secrets**: `rbx-contact-secrets` in `rbx-ia-br`, replicated to `rbxsystems-ch` via ExternalSecret.

### Observed Behavior
- Form submissions reach `contact@rbxsystems.ch` mailbox successfully (verified locally).
- WhatsApp acknowledgment is not yet sent end-to-end because the D360 template is awaiting approval (24–48h after submission).
- No mechanism captures inbound replies — they hit D360 webhook, which returns 404 from the current rbx site (no handler registered).
- No metrics. No structured logs beyond stdout from the API route.

### Expected Behavior
- Form is protected against bots and high-frequency abuse before public rollout.
- Inbound WhatsApp replies are received, persisted, and surfaced to the operator (initially via email forward; eventually via a small inbox UI).
- Every submission and reply is stored in Postgres with full audit fields (timestamps, source IP, user agent, D360 message IDs).
- Operator can see real-time metrics: submissions/min, success rate, Postmark/D360 error counts, with alerts on anomalies.

### Root Cause Analysis
The original delivery (ADR-0001) intentionally scoped down to "outbound-only MVP" to ship value within one session. The current state is the agreed MVP — these slices complete the channel.

---

## Gaps

### Documentation Gaps

| Priority | File/Location | Issue | Impact |
|----------|---------------|-------|--------|
| P0 | This guide | Does not exist before this commit | HIGH |
| P1 | `docs/adr/ADR-0002-contact-persistence-schema.md` | Needed once EP-003 schema is decided | MED |
| P1 | `docs/runbooks/contact-incident.md` | No on-call playbook for Postmark/D360 outages | MED |
| P2 | `docs/implementation/contact-rbx-comms-extraction.md` | Future guide for when volume justifies extraction (see ADR-0001 evolution path) | LOW |

### Code Gaps

| Priority | Component | Issue | Blocker For |
|----------|-----------|-------|-------------|
| P0 | `app/api/contact/route.ts` | No rate limit, no CAPTCHA, no honeypot | Public rollout |
| P0 | `app/page/views/contact/contact-form.tsx` | No Turnstile widget rendered, no honeypot input | EP-001 |
| P0 | `app/api/whatsapp/webhook/route.ts` | Does not exist | EP-002 |
| P0 | `lib/contact/repo.ts` (or equivalent) | No persistence layer exists | EP-003 |
| P1 | `app/api/contact/route.ts` | No metrics emitted (request count, errors, latency) | EP-004 |
| P1 | `lib/contact/d360-client.ts` | D360 client logic is inline in the route; should be factored out before adding inbound | EP-002 |

### Infrastructure Gaps

| Priority | Resource | Issue | Impact |
|----------|----------|-------|--------|
| P0 | Cloudflare Turnstile site keys | Not provisioned | EP-001 blocker |
| P0 | Postgres database for contact data | No DB provisioned (memory: Postgres always external) | EP-003 blocker |
| P0 | D360 webhook URL registered | URL stored in pass but not yet registered with D360 hub | EP-002 blocker |
| P1 | Grafana dashboard for contact metrics | Does not exist | EP-004 |
| P1 | Alertmanager rules for Postmark/D360 failures | Do not exist | EP-004 |

---

## Priority Tracks

### Track 1: CONTACT-P1 — Anti-abuse hardening
**Effort**: 1–2 days
**Dependencies**: Cloudflare Turnstile keys provisioned (sitekey + secret)
**Deliverables**:
- Cloudflare Turnstile widget rendered in the form
- Server-side Turnstile token verification in `/api/contact`
- Honeypot field (`website` or similar) — instant reject if filled
- Simple in-memory IP rate limit (e.g., 5 submissions per IP per hour) — acceptable for low traffic; replace with Redis when scaling

**Tasks**:
1. Provision Turnstile in Cloudflare dashboard for `rbx.ia.br` and `rbxsystems.ch`
2. Store secret in `pass` at `rbx/turnstile/secret-key`
3. Add Turnstile sitekey as public env var; add secret to `rbx-contact-secrets`
4. Add Turnstile React widget to `contact-form.tsx`
5. Add token verification call to `/api/contact` (Cloudflare `siteverify` endpoint)
6. Add honeypot input field (CSS-hidden, validated server-side)
7. Add IP-based rate limit middleware (Next.js middleware or in-route check)

### Track 2: CONTACT-P2 — Inbound WhatsApp webhook handler
**Effort**: 2–3 days
**Dependencies**: CONTACT-P3 schema decided (or skipped with a TODO), D360 webhook URL registered, signature secret in `pass`
**Deliverables**:
- `app/api/whatsapp/webhook/route.ts` — POST handler accepting D360 webhook payloads
- Signature verification (HMAC) before any processing
- Forwarder that emails inbound messages to `contact@rbxsystems.ch` (interim, before persistence is live)
- Idempotency guard keyed on D360 `message_id` to handle webhook retries

**Tasks**:
1. Extract D360 client into `lib/contact/d360-client.ts` (refactor existing outbound path)
2. Read D360 webhook docs and confirm signature header + algorithm
3. Implement signature verification (use `crypto.timingSafeEqual`)
4. Implement webhook handler skeleton (parse, verify, route by message type)
5. For inbound text messages: forward to `contact@rbxsystems.ch` via Postmark with subject `[WhatsApp] {sender}`
6. Implement in-memory idempotency cache (24h TTL) on `message_id`
7. Register webhook URL in 360dialog hub: `https://rbx.ia.br/api/whatsapp/webhook`

### Track 3: CONTACT-P3 — Lead persistence schema
**Effort**: 2–3 days
**Dependencies**: Postgres VPS allocated, decision on DB scope (see Open Questions)
**Deliverables**:
- `contact` schema in Postgres with tables: `submissions`, `whatsapp_messages`, `whatsapp_threads`
- `lib/contact/repo.ts` — typed repository (likely Drizzle or Kysely, matching existing Next.js patterns)
- `/api/contact` writes submission row before sending email/WhatsApp; non-blocking
- `/api/whatsapp/webhook` writes message row, updates thread
- One-time migration SQL in `migrations/` committed to the repo

**Tasks**:
1. Decide Postgres location (PDNS VPS shared, new dedicated VPS, or Mailcow MySQL alternative) — see Open Questions
2. Provision DB user `rbx_contact` with grants on `contact` schema
3. Store connection URL in `pass` at `rbx/contact-db/dsn`
4. Add `DATABASE_URL` to `rbx-contact-secrets`
5. Choose DB library (recommend Drizzle for type safety + minimal weight)
6. Write migration: schema + tables + indexes
7. Implement repo functions: `insertSubmission`, `insertInboundMessage`, `markDelivered`
8. Wire repo into `/api/contact` and `/api/whatsapp/webhook`

### Track 4: CONTACT-P4 — Observability
**Effort**: 1–2 days
**Dependencies**: CONTACT-P1, CONTACT-P2, CONTACT-P3 in place; Prometheus stack confirmed reachable from `rbx-ia-br` namespace
**Deliverables**:
- Prometheus metrics endpoint `/api/metrics` (or sidecar-scraped) exposing: submission count, success/failure by reason, Postmark/D360 latency, webhook event count
- Grafana dashboard for the contact channel
- Alertmanager rules: Postmark 5xx > 1% over 5min, D360 5xx > 1% over 5min, no submissions in 24h (early canary for breakage)

**Tasks**:
1. Add `prom-client` (or equivalent Next.js-compatible Prometheus library)
2. Define counters: `contact_submissions_total{result}`, `contact_postmark_errors_total`, `contact_d360_errors_total`, `whatsapp_inbound_total`
3. Define histograms: `contact_postmark_duration_seconds`, `contact_d360_duration_seconds`
4. Add `/api/metrics` route guarded by network policy (internal scrape only)
5. Add ServiceMonitor or pod annotations in `rbx-infra` for Prometheus scrape
6. Create Grafana dashboard JSON in `rbx-infra/platform/monitoring/dashboards/`
7. Add Alertmanager rules in `rbx-infra/platform/monitoring/alerts/`

---

## Execution Selector

Choose the correct entrypoint based on objective:

| Objective                              | Entry Point | Effort    |
|----------------------------------------|-------------|-----------|
| Block bots before public announcement  | EP-001      | 1–2 days  |
| Enable two-way WhatsApp conversation   | EP-002      | 2–3 days  |
| Persist all contact data structurally  | EP-003      | 2–3 days  |
| Add metrics, dashboards, alerts        | EP-004      | 1–2 days  |

### Default Execution Order (if unsure)

1. **EP-001** — anti-abuse must land before any public rollout
2. **EP-003** — persistence before inbound so webhook has a place to write
3. **EP-002** — inbound webhook (now writes to persistence cleanly)
4. **EP-004** — observability after the surface area is stable

> **Alternate order**: if persistence is blocked on Postgres provisioning, swap EP-002 and EP-003. The webhook can ship with an "email-forwarder only" mode and persistence added later.

---

## Entry Points

### EP-001: CONTACT-P1 — Anti-abuse hardening

**Objective**: Make `/api/contact` safe to expose publicly. Block bots, throttle abuse, refuse missing-CAPTCHA submissions.

**Preconditions**:
```bash
# Turnstile sitekey + secret in pass
pass show rbx/turnstile/sitekey | wc -c | awk '$1 > 10 {exit 0} {exit 1}'
pass show rbx/turnstile/secret-key | wc -c | awk '$1 > 10 {exit 0} {exit 1}'

# Form is currently live and unprotected (confirmation)
curl -X POST https://rbx.ia.br/api/contact -H 'content-type: application/json' \
  -d '{"name":"test","email":"a@b.c","message":"x"}' | grep -q '"success":true'
```

**Inputs** (explicit):
- `TURNSTILE_SITEKEY`: public, exposed via `NEXT_PUBLIC_TURNSTILE_SITEKEY`
- `TURNSTILE_SECRET_KEY`: private, in `rbx-contact-secrets`

**Steps**:
```bash
# Add Turnstile React component
yarn add @marsidev/react-turnstile

# Update contact-form.tsx to render widget, capture token
# Update /api/contact/route.ts to verify token before accepting

# Add honeypot field (hidden via CSS)
# Add in-memory rate limiter (5/IP/hour using Map<string, number[]>)

# Apply secrets via kubectl (operator action)
kubectl create secret generic rbx-contact-secrets -n rbx-ia-br \
  --from-literal=POSTMARK_SERVER_TOKEN="$(pass show rbx/postmark/rbx-institutional-server-token)" \
  --from-literal=D360_API_KEY="$(pass show rbx/d360/api-key)" \
  --from-literal=TURNSTILE_SECRET_KEY="$(pass show rbx/turnstile/secret-key)" \
  --dry-run=client -o yaml | kubectl apply -f -

# Add NEXT_PUBLIC_TURNSTILE_SITEKEY to rbx-infra deploy.yml
# Bump image tag, push, ArgoCD applies
```

**Expected Outcome**:
```bash
# Submission without token returns 403
curl -X POST https://rbx.ia.br/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"test","email":"a@b.c","message":"x"}' \
  -w '%{http_code}\n' | tail -1 | grep -q '^403$'

# Honeypot field filled = silent reject
curl -X POST https://rbx.ia.br/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"t","email":"a@b.c","message":"x","website":"http://spam"}' \
  -w '%{http_code}\n' | tail -1 | grep -q '^200$'  # appears success, server-side dropped

# 6th submission from same IP within an hour returns 429
for i in {1..6}; do
  curl -X POST https://rbx.ia.br/api/contact -H 'content-type: application/json' \
    -d "{\"name\":\"t$i\",\"email\":\"a@b.c\",\"message\":\"x\",\"turnstileToken\":\"<valid>\"}" \
    -w '%{http_code}\n' -o /dev/null
done | tail -1 | grep -q '^429$'
```

**Failure Detection**:
```bash
# FAIL if 5xx on any of the verification steps
# FAIL if Turnstile siteverify returns error-codes containing "invalid-input-secret"
# FAIL if honeypot reject logs reveal the field name to clients
```

**Rollback**:
```bash
git restore app/api/contact/route.ts app/page/views/contact/contact-form.tsx
# Revert image tag in rbx-infra/apps/prod/{rbx-ia-br,rbxsystems-ch}/kustomization.yml
git -C ../rbx-infra commit -am "revert: rollback contact anti-abuse"
git -C ../rbx-infra push origin main
```

---

### EP-002: CONTACT-P2 — Inbound WhatsApp webhook handler

**Objective**: Receive D360 webhooks, verify signatures, forward inbound messages to the operator mailbox (and to persistence once EP-003 is live).

**Preconditions**:
```bash
# Webhook URL is provisioned (operator already stored it in pass)
pass show rbx/d360/webhook-url | grep -q '^https://'

# Outbound D360 path is working (template approved + sending OK)
# Verify by submitting a test form with phone + optIn and confirming receipt on the phone
```

**Inputs** (explicit):
- `D360_WEBHOOK_SECRET`: HMAC signing secret from D360 hub (configure when registering URL)
- `WEBHOOK_FORWARD_EMAIL`: `contact@rbxsystems.ch` (interim sink before EP-003)

**Steps**:
```bash
# 1. Refactor d360 calls out of /api/contact/route.ts into lib/contact/d360-client.ts
# 2. Implement signature verification (D360 docs: X-Hub-Signature-256)
# 3. Create app/api/whatsapp/webhook/route.ts with POST handler
# 4. Parse payload, classify by message type (text, image, status, etc.)
# 5. For text: forward via Postmark to WEBHOOK_FORWARD_EMAIL
# 6. Implement in-memory idempotency Map keyed on message_id
# 7. Register webhook URL in 360dialog hub via their API or dashboard
```

**Expected Outcome**:
```bash
# Webhook URL is registered
curl -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  https://waba.360dialog.io/v1/configs/webhook | jq -r .url | \
  grep -q 'rbx.ia.br/api/whatsapp/webhook'

# Test inbound message flow:
# Send a WhatsApp reply from a test phone to the D360 number
# Verify the email arrives at contact@rbxsystems.ch within 30s

# Replay protection works: same message_id replayed = 200 but no duplicate email
```

**Failure Detection**:
```bash
# FAIL if webhook returns 5xx on valid signed payload
# FAIL if invalid signature returns anything other than 401
# FAIL if duplicate message_id triggers duplicate forward
```

**Rollback**:
```bash
# Unregister webhook URL in 360dialog hub
curl -X PATCH -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  -H "content-type: application/json" \
  -d '{"url":""}' \
  https://waba.360dialog.io/v1/configs/webhook

git restore app/api/whatsapp lib/contact
```

---

### EP-003: CONTACT-P3 — Lead persistence schema

**Objective**: Move from "submissions are emails" to "submissions are rows". Every form post and every inbound message becomes a queryable record.

**Preconditions**:
```bash
# Postgres VPS reachable from k3s cluster (see Open Questions for which one)
pg_isready -h <host> -p 5432

# DB user and database created
psql "$PG_ADMIN_DSN" -c "\du rbx_contact" | grep -q rbx_contact
psql "$PG_ADMIN_DSN" -c "\l rbx_contact_prod" | grep -q rbx_contact_prod
```

**Inputs** (explicit):
- `DATABASE_URL`: full DSN, stored in `rbx-contact-secrets`
- `MIGRATION_DIR`: `migrations/` in repo root

**Steps**:
```bash
# 1. Choose Postgres location (see Open Questions)
# 2. Provision: CREATE USER rbx_contact ...; CREATE DATABASE rbx_contact_prod OWNER rbx_contact;
# 3. Add Drizzle to package.json: yarn add drizzle-orm postgres
# 4. yarn add -D drizzle-kit
# 5. Define schema in lib/db/schema.ts (submissions, whatsapp_messages, whatsapp_threads)
# 6. Run drizzle-kit generate to produce migration SQL
# 7. Apply migration: yarn drizzle-kit migrate (or via init container)
# 8. Implement lib/contact/repo.ts with typed functions
# 9. Wire writes into /api/contact and /api/whatsapp/webhook
```

**Schema sketch** (subject to ADR-0002):
```sql
CREATE SCHEMA contact;

CREATE TABLE contact.submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone_e164    TEXT,
  message       TEXT NOT NULL,
  source_ip     INET,
  user_agent    TEXT,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  postmark_id   TEXT,
  d360_message_id TEXT,
  email_status  TEXT NOT NULL DEFAULT 'pending',  -- pending|sent|failed
  whatsapp_status TEXT NOT NULL DEFAULT 'na'      -- na|pending|sent|failed
);

CREATE TABLE contact.whatsapp_threads (
  phone_e164    TEXT PRIMARY KEY,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  submission_id UUID REFERENCES contact.submissions(id)
);

CREATE TABLE contact.whatsapp_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  d360_message_id TEXT UNIQUE NOT NULL,           -- idempotency key
  thread_phone    TEXT NOT NULL REFERENCES contact.whatsapp_threads(phone_e164),
  direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  body            TEXT,
  media_url       TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload     JSONB NOT NULL
);
```

**Expected Outcome**:
```bash
# A submission appears in the table
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM contact.submissions WHERE created_at > now() - interval '5 minutes';" | grep -E '^\s+[1-9]'

# Inbound WhatsApp lands in messages with direction='inbound'
psql "$DATABASE_URL" -c "SELECT direction, COUNT(*) FROM contact.whatsapp_messages GROUP BY direction;"

# Duplicate webhook deliveries do not create duplicate rows
# (UNIQUE constraint on d360_message_id enforces it)
```

**Failure Detection**:
```bash
# FAIL if route returns 200 but no row is inserted (silent DB failure)
# FAIL if migrations regress on re-run (idempotency)
# FAIL if DATABASE_URL is leaked into logs
```

**Rollback**:
```bash
# Drop schema (destroys data — only do this in pre-prod)
psql "$DATABASE_URL" -c "DROP SCHEMA contact CASCADE;"

# Or: revert app to email-only path
git restore app/api/contact app/api/whatsapp lib/contact lib/db
```

---

### EP-004: CONTACT-P4 — Observability

**Objective**: Light up the contact channel in Prometheus + Grafana. Operator must be able to detect a Postmark or D360 outage within minutes, not after a customer complaint.

**Preconditions**:
```bash
# Prometheus operator and ServiceMonitor CRD installed in cluster
kubectl get crd servicemonitors.monitoring.coreos.com

# Grafana reachable
curl -s https://grafana.rbxsystems.ch/api/health | jq -r .database | grep -q ok

# Alertmanager configured
kubectl get configmap -n monitoring alertmanager-config
```

**Inputs** (explicit):
- `METRICS_BEARER`: optional token guarding `/api/metrics`
- Slack channel webhook for alerts: `pass show rbx/slack/oncall-webhook`

**Steps**:
```bash
# 1. yarn add prom-client
# 2. Define metrics in lib/contact/metrics.ts
# 3. Instrument /api/contact and /api/whatsapp/webhook
# 4. Add /api/metrics route returning prom-client.register.metrics()
# 5. Add NetworkPolicy or auth guard so only internal scraping reaches /api/metrics
# 6. Add ServiceMonitor in rbx-infra/apps/prod/{rbx-ia-br,rbxsystems-ch}/
# 7. Author Grafana dashboard JSON, commit to rbx-infra/platform/monitoring/dashboards/
# 8. Author Alertmanager rules, commit to rbx-infra/platform/monitoring/alerts/
```

**Expected Outcome**:
```bash
# Metrics endpoint scrapes
curl -s -H "Authorization: Bearer $METRICS_BEARER" https://rbx.ia.br/api/metrics | \
  grep -q '^contact_submissions_total'

# Dashboard exists
curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" \
  https://grafana.rbxsystems.ch/api/dashboards/uid/contact-channel | jq -r .dashboard.title | \
  grep -q 'Contact Channel'

# Alert fires when Postmark returns 5xx
# (simulate by temporarily breaking POSTMARK_SERVER_TOKEN; alert fires within 5min)
```

**Failure Detection**:
```bash
# FAIL if metrics endpoint is publicly accessible without auth
# FAIL if scrape interval misses bursts (>30s)
# FAIL if alert routes to wrong Slack channel
```

**Rollback**:
```bash
# Remove ServiceMonitor and alert rules
kubectl -n rbx-ia-br delete servicemonitor contact-channel
git -C ../rbx-infra restore platform/monitoring/alerts/contact-channel.yml
```

---

## Verification Commands Reference

**Check Postmark deliverability**:
```bash
curl -s -H "X-Postmark-Server-Token: $(pass show rbx/postmark/rbx-institutional-server-token)" \
  https://api.postmarkapp.com/server | jq -r .Name | grep -q "RBX Institutional"
```

**Check D360 outbound capacity**:
```bash
curl -s -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  https://waba.360dialog.io/v1/configs/templates | jq '.waba_templates[] | select(.name=="contact_form_acknowledgment") | .status'
# Expected: "approved"
```

**Check ExternalSecret sync status**:
```bash
kubectl get externalsecret rbx-contact-secrets -n rbxsystems-ch -o jsonpath='{.status.conditions[*].type}'
# Expected: includes "Ready"
```

**Check form is rate-limited**:
```bash
for i in {1..10}; do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST https://rbx.ia.br/api/contact \
    -H 'content-type: application/json' -d '{"name":"x","email":"a@b.c","message":"x"}'
done | sort | uniq -c
# Expected: mix of 200/403/429 — no plain 200 for all 10
```

**Check inbound webhook handles signature**:
```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://rbx.ia.br/api/whatsapp/webhook \
  -H 'content-type: application/json' -d '{"messages":[{"id":"x"}]}'
# Expected: 401 (missing/invalid signature)
```

---

## Rollback Notes

### Rollback Pattern 1: Application code
```bash
# Revert specific files
git restore app/api/contact/route.ts \
            app/api/whatsapp/webhook/route.ts \
            app/page/views/contact/contact-form.tsx \
            lib/contact/

# Re-build and re-deploy via image tag bump in rbx-infra
```

### Rollback Pattern 2: Database migration
```bash
# Drop the entire schema (data loss — pre-prod only)
psql "$DATABASE_URL" -c "DROP SCHEMA contact CASCADE;"

# Or: revert specific migration
yarn drizzle-kit drop --tag <migration-name>
```

### Rollback Pattern 3: Secrets
```bash
# Re-apply previous secret revision
kubectl create secret generic rbx-contact-secrets -n rbx-ia-br \
  --from-literal=POSTMARK_SERVER_TOKEN="$(pass show rbx/postmark/rbx-institutional-server-token)" \
  --from-literal=D360_API_KEY="$(pass show rbx/d360/api-key)" \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Rollback Pattern 4: D360 webhook
```bash
# Unregister webhook URL
curl -X PATCH -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  -H "content-type: application/json" \
  -d '{"url":""}' \
  https://waba.360dialog.io/v1/configs/webhook
```

---

## Open Questions

These decisions are deferred to before EP-003 starts. Each blocks a downstream slice if left unanswered.

| # | Question | Affects | Proposal |
|---|----------|---------|----------|
| Q1 | Where does the contact Postgres live? | EP-003 | Use the existing PDNS Postgres VPS (`161.97.147.76:5432`) as a host but a separate database (`rbx_contact_prod`) with its own user. Avoids a new VPS for low volume; revisit when DB shows load. |
| Q2 | Should we adopt Drizzle, Kysely, or raw SQL? | EP-003 | Drizzle — best TypeScript ergonomics, supports migrations natively, ~ widely adopted in Next.js community. |
| Q3 | Do we want a tiny operator inbox UI, or stay email-forward only? | Beyond EP-004 | Stay email-forward for v0.1. Build inbox UI only when volume justifies — gate at >20 inbound msgs/day. |
| Q4 | Are we storing IP addresses? Any LGPD/GDPR compliance work needed? | EP-003 | Store IPs but mask after 30 days (cron job). Add a privacy notice next to the form. Defer formal LGPD doc to a separate task. |
| Q5 | Rate limit backend: in-memory per-pod vs Redis? | EP-001 | Start in-memory (acceptable for ≤2 pods). Migrate to Redis when scaling horizontally. |

---

## Non-goals

Out of scope for this guide — declared explicitly so reviewers can hold the line:

- **Full CRM** — no segmentation, no nurture flows, no campaign engine. ADR-0001 says these belong in Odoo or a dedicated marketing tool.
- **Multi-channel** — no SMS, Telegram, Discord, Instagram DM. WhatsApp + email only.
- **Multi-tenant** — single WABA, single phone number. (Mirrors Strategos ADR-0005.)
- **rbx-comms extraction** — kept inside the FE API route until volume justifies extraction. Future guide: `docs/implementation/contact-rbx-comms-extraction.md`.
- **English D360 template** — `contact_form_acknowledgment_en` is a tiny side-quest, not a slice. Add when there is real English submission volume.

---

## Appendices

### Appendix A: Reference Materials

- ADR-0001 — Contact form via Next.js API route (`docs/adr/ADR-0001-contact-form-via-nextjs-api-route.md`)
- Strategos ADR-0005 — WhatsApp channel via 360dialog (in `strategos-core` repo, for cross-reference only — not consumed here)
- 360dialog webhook docs — <https://docs.360dialog.com/whatsapp-api/whatsapp-api/webhooks>
- Cloudflare Turnstile docs — <https://developers.cloudflare.com/turnstile/>
- Postmark API — <https://postmarkapp.com/developer/api/email-api>

### Appendix B: Decision Log

- **2026-05-15** — Decided to keep contact persistence in the FE repo rather than create `rbx-comms` immediately. Threshold for extraction: >100 msgs/day OR need for CRM features. Rationale: premature service-extraction overhead vs. trivial Next.js API route.
- **2026-05-15** — Decided to share the PDNS Postgres VPS rather than provision dedicated. Tradeoff: blast radius if DB outage hits both contact + DNS, but DNS Postgres is read-mostly for `pdns` user and the load profile is low. Revisit after first 30 days of production data.
- **2026-05-15** — Decided to ship Turnstile rather than hCaptcha. RBX already uses Cloudflare for DNS at the apex; integration is one less vendor relationship.

### Appendix C: Evolution Path

This guide ends when EP-004 lands. Beyond that, two evolution branches:

1. **Volume-triggered extraction** — when daily message volume crosses ~100 inbound + outbound, extract `rbx-comms` as documented in ADR-0001. New guide: `contact-rbx-comms-extraction.md`.
2. **Strategos integration** — if/when the Strategos product needs visibility into customer conversations (e.g., to feed a sales-decision agent), publish a read-only event stream from `contact.*` schema to Strategos via the Thalamus ingestion layer. New ADR required: `ADR-0003-contact-strategos-bridge.md`.

---

## Changelog

| Date       | Change                                | Author |
|------------|---------------------------------------|--------|
| 2026-05-15 | Initial draft — 4 entry points + open questions | Claude Opus 4.7 |
