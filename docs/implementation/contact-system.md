# Contact System — Program Index

**Status**: Phase 0 (Outbound MVP) live since 2026-05-15. Phase 1 (Bidirectional) planned.
**Owner**: RBX Frontend
**Last reviewed**: 2026-05-15

> This is the **central guide** for everything related to the RBX contact system. Every contact-system ADR, implementation guide, runbook, and slice points back here. If you are starting work on this surface, read this document first and then drill into the phase or ADR linked below.

---

## Purpose

The contact system is the canonical entry point for inbound communication to RBX Systems via the public sites (`rbx.ia.br`, `rbxsystems.ch`). It owns:

- The contact form on the public sites
- Email delivery via Postmark (`contact@rbxsystems.ch`)
- WhatsApp delivery and receipt via 360dialog
- Persistence of submissions and conversations
- Operator visibility into the channel (metrics, alerts, eventual inbox UI)

It does **not** own (see Non-goals below): CRM, marketing campaigns, multi-tenant inboxes, SMS or other non-WhatsApp channels.

---

## Status Dashboard

| Phase | Scope | Status | Reference |
|-------|-------|--------|-----------|
| **Phase 0** | Outbound MVP — form submits, email + WhatsApp template ack | ✅ LIVE 2026-05-15 (commit `7ca2868`) | ADR-0001 |
| **Phase 1** | Bidirectional — anti-abuse, inbound webhook, persistence, observability | 📋 Planned | `contact-system-bidirectional.md` |
| **Phase 2** | Service extraction — move comms logic to standalone `rbx-comms` service | ⚫ Deferred (gate: >100 msgs/day) | TBD `contact-system-rbx-comms-extraction.md` |
| **Phase 3** | Strategos bridge — read-only stream from `contact.*` schema to Strategos via Thalamus | ⚫ Deferred (gate: Strategos demand) | TBD ADR-0003 |

> Phases are sequential by default but Phase 2 and Phase 3 are conditionally gated — they only start when their triggering conditions are met, not on a fixed timeline.

---

## Architecture (current)

```
                    public sites
                  (rbx.ia.br, rbxsystems.ch)
                          │
                          ▼
              ┌────────────────────────┐
              │  Next.js API route     │
              │  /api/contact          │  ◄── form POST
              │  /api/whatsapp/webhook │  ◄── D360 inbound (Phase 1)
              └────────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      ┌───────────────┐         ┌──────────────┐
      │  Postmark     │         │  360dialog   │
      │  (outbound    │         │  (template + │
      │   email)      │         │   inbound)   │
      └───────┬───────┘         └──────┬───────┘
              │                        │
              ▼                        ▼
      contact@rbxsystems.ch    WhatsApp business
        (Mailcow inbox)               number

              ▲ Phase 1 adds Postgres persistence under here ▲
```

All channel logic is currently colocated in the `rbx-robotica-frontend` Next.js app. Per ADR-0001, this is intentional until volume justifies extraction.

---

## Document Map

### Architecture Decision Records (ADRs)

| ID | Title | Status | Phase |
|----|-------|--------|-------|
| [ADR-0001](../adr/ADR-0001-contact-form-via-nextjs-api-route.md) | Contact form via Next.js API route | Accepted | 0 |
| ADR-0002 (planned) | Contact persistence schema | Draft pending | 1 |
| ADR-0003 (planned) | Contact ↔ Strategos read bridge | Deferred | 3 |

### Implementation Guides

| Doc | Scope | Status |
|-----|-------|--------|
| **`contact-system.md`** | **This document — program index** | Live |
| [`contact-system-bidirectional.md`](contact-system-bidirectional.md) | Phase 1 — anti-abuse, webhook, persistence, observability (4 entry points) | Draft |
| [`../operator-brief.md`](../operator-brief.md) | Fast operational summary — live state, secrets, verification, pending actions | Live |
| `contact-system-rbx-comms-extraction.md` (planned) | Phase 2 — extract to standalone service | Deferred |

### Runbooks

| Doc | Use case | Status |
|-----|----------|--------|
| `docs/runbooks/contact-incident.md` (planned) | Postmark or D360 outage response | Not started |
| `docs/runbooks/contact-template-management.md` (planned) | D360 template lifecycle (submit, approve, version) | Not started |

### Infrastructure Manifests (in `rbx-infra` repo)

| Path | Owns |
|------|------|
| `apps/prod/rbx-ia-br/deploy.yml` | Pod env vars referencing `rbx-contact-secrets` |
| `apps/prod/rbxsystems-ch/deploy.yml` | Same, for second site |
| `apps/prod/rbxsystems-ch/externalsecret-contact.yml` | Cross-namespace secret replication |
| `apps/prod/rbx-ia-br/rbac-external-secrets-reader.yml` | RBAC for the ESO reader SA |

---

## Phase Index (deep dive)

### Phase 0 — Outbound MVP ✅

**Delivered**: 2026-05-15
**Commits**: `rbx-robotica-frontend@7ca2868`, `rbx-infra@af7e8fd` and `rbx-infra@cb55dad`
**Authority**: [ADR-0001](../adr/ADR-0001-contact-form-via-nextjs-api-route.md)

What shipped:
- Contact form with name, email, phone, message, WhatsApp opt-in checkbox
- Server-side validation, Postmark relay to `contact@rbxsystems.ch`
- D360 fire-and-forget template `contact_form_acknowledgment` (pending hub approval)
- Floating WhatsApp button on every page
- Footer updated: email + WhatsApp links visible
- IaC for `rbx-contact-secrets` replicated cross-namespace via ExternalSecret

Pending operator actions to finish Phase 0:
- Bump image tag in `rbx-infra` to `sha-7ca2868` (form goes live on rollout)
- Approve template `contact_form_acknowledgment` in 360dialog hub

### Phase 1 — Bidirectional 📋

**Authority**: [`contact-system-bidirectional.md`](contact-system-bidirectional.md)

Four entry points (execute in order unless noted):

| EP | Slice | Target effort |
|----|-------|---------------|
| EP-001 | CONTACT-P1 — Anti-abuse hardening (Turnstile + honeypot + rate limit) | 1–2 days |
| EP-002 | CONTACT-P2 — Inbound WhatsApp webhook | 2–3 days |
| EP-003 | CONTACT-P3 — Lead persistence schema | 2–3 days |
| EP-004 | CONTACT-P4 — Observability (metrics, dashboards, alerts) | 1–2 days |

EP-001 is a hard prerequisite for any public announcement of the form. The other three may proceed in alternate orders if a dependency blocks.

### Phase 2 — Service extraction ⚫

**Gate**: Daily volume crosses ~100 messages (inbound + outbound) OR a new product (Strategos, marketing tool) needs the same plumbing.

Trigger to start work: a written PR description quoting the gate condition and showing it has been met for at least 7 consecutive days.

When triggered, the new guide `contact-system-rbx-comms-extraction.md` will be created with a structure parallel to the bidirectional guide.

### Phase 3 — Strategos bridge ⚫

**Gate**: Strategos product needs visibility into customer conversations (e.g., to feed a sales-decision agent).

Trigger to start work: a Strategos ADR explicitly requests this data feed. At that point, a new ADR (ADR-0003) is authored to define the contract and a new implementation guide is created.

---

## Decision Log

Compact summary of every load-bearing decision. Full rationale lives in each ADR or implementation guide.

| Date | Decision | Where to find full rationale |
|------|----------|------------------------------|
| 2026-05-15 | Contact logic lives in the Next.js FE app, not a separate service | ADR-0001 §Decision |
| 2026-05-15 | Postmark for email, 360dialog for WhatsApp | ADR-0001 §Decision |
| 2026-05-15 | Email inbox is `contact@rbxsystems.ch`, not `contato@rbx.ia.br` | ADR-0001 §Email infrastructure |
| 2026-05-15 | Secrets follow rbx-infra ESO pattern (manual `kubectl` in `rbx-ia-br` + ExternalSecret in other namespaces) | `rbx-infra@cb55dad` commit message |
| 2026-05-15 | Postgres for Phase 1 will share the PDNS VPS, not new VPS | `contact-system-bidirectional.md` §Open Questions (Q1) |
| 2026-05-15 | Drizzle ORM chosen for Phase 1 persistence | `contact-system-bidirectional.md` §Open Questions (Q2) |
| 2026-05-15 | Turnstile chosen over hCaptcha for anti-abuse | `contact-system-bidirectional.md` §Appendix B |

When a new decision is made, add a row here and link to the document where the rationale lives. Do not duplicate rationale here.

---

## Operational Reference

Quick commands for day-to-day operations. Long-running procedures (incident response, template lifecycle) belong in runbooks once those are authored.

### Verify Phase 0 secret is healthy

```bash
# Confirms both keys are present and non-empty (does not print values)
kubectl get secret rbx-contact-secrets -n rbx-ia-br -o json | \
  jq -r '.data | to_entries[] | "\(.key): \(.value | @base64d | length) chars"'
```

### Verify ExternalSecret replication is healthy

```bash
kubectl get externalsecret rbx-contact-secrets -n rbxsystems-ch \
  -o jsonpath='{.status.conditions[*].type}'
# Expect: includes "Ready"
```

### Confirm Postmark account is reachable

```bash
curl -s -H "X-Postmark-Server-Token: $(pass show rbx/postmark/rbx-institutional-server-token)" \
  https://api.postmarkapp.com/server | jq -r .Name
```

### List approved D360 templates

```bash
curl -s -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  https://waba.360dialog.io/v1/configs/templates | \
  jq -r '.waba_templates[] | "\(.status)\t\(.name)\t\(.language)"'
```

### Tail Next.js logs for the contact route

```bash
kubectl logs -n rbx-ia-br -l app.kubernetes.io/part-of=rbx-ia-br -f --tail=100 | \
  grep -i 'api/contact'
```

---

## Non-goals

These are out of scope for the entire contact-system program (every phase). If a request matches one of these, redirect to the appropriate system — do not absorb into contact-system scope.

- **CRM** — segmentation, nurture flows, campaign automation. Handled by Odoo or a dedicated marketing tool, not by us.
- **Multi-channel** — SMS, Telegram, Discord, Instagram DM are not in scope. WhatsApp and email only.
- **Multi-tenant inboxes** — single WABA, single phone number, single mailbox. (Mirrors Strategos ADR-0005.)
- **Inbound for sales agents** — there is no live-chat agent UI on the roadmap. Inbound replies forward to `contact@rbxsystems.ch` and stop there.
- **Transactional notifications** — order receipts, password resets, etc. belong to the originating product (Strategos, Robson) via `tx.*` domains, not here.

---

## Contributing to this program

If you're starting new contact-system work:

1. **Find the right phase** in the Status Dashboard above.
2. **Read the corresponding implementation guide** (linked in Document Map).
3. **Check the Decision Log** for any prior decision that affects your work.
4. **Open the relevant ADR** if your change creates a new load-bearing decision; otherwise add a row to the Decision Log.
5. **Update this document** in the same PR — at minimum, the Status Dashboard and Decision Log.

If you're proposing a new phase or major scope change, draft an ADR first and link it here before writing code.

---

## Changelog

| Date       | Change                                  | Author |
|------------|-----------------------------------------|--------|
| 2026-05-15 | Initial program index — Phase 0 live, Phase 1 planned | Claude Opus 4.7 |
