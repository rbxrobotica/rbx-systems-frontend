# Contact System — Operator Brief

**Last updated**: 2026-05-16
**Status**: Phase 0 LIVE in production on both domains. Phase 1 planned, not started.

> Git-tracked operator brief. Evolves with the code in the same PRs. For the full program index, phase plans, and decision log, see `docs/implementation/contact-system.md`. This brief is the fast operational summary.

---

## What is live (Phase 0)

LIVE in k3s production since 2026-05-15.

| Aspect          | Value                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Image           | `ghcr.io/rbxrobotica/rbx-ia-br:sha-<latest>` (CI-bumped automatically)                                 |
| Namespaces      | `rbx-ia-br` (rbx.ia.br), `rbxsystems-ch` (rbxsystems.ch)                                               |
| Replicas        | 2/2 per namespace                                                                                      |
| Routes          | Form posts to `rbx-comms` (`api.comms.{domain}/api/contact`), floating WhatsApp button, updated footer |
| Email path      | Postmark → `contact@rbxsystems.ch` (Mailcow inbox)                                                     |
| WhatsApp path   | 360dialog template `contact_form_acknowledgment` (pt_BR)                                               |
| WhatsApp number | `+55 11 913734954` (`wa.me/5511913734954`)                                                             |

---

## Secrets (operator-managed, not in git)

Sources of truth live in `pass`. Per rbx-infra "No secrets in Git" rule.

| Pass path                                     | Used as                 | Notes                               |
| --------------------------------------------- | ----------------------- | ----------------------------------- |
| `rbx/postmark/rbx-institutional-server-token` | `POSTMARK_SERVER_TOKEN` | RBX Institutional Postmark server   |
| `rbx/d360/api-key`                            | `D360_API_KEY`          | 360dialog WABA API key              |
| `rbx/d360/webhook-url`                        | Phase 1 only            | Registered with 360dialog in EP-002 |

k8s Secret `rbx-contact-secrets` lives in `rbx-ia-br`, replicated to `rbxsystems-ch` via ExternalSecret (15min refresh).

Inspect without printing values:

```bash
kubectl get secret rbx-contact-secrets -n rbx-ia-br -o json | \
  jq -r '.data | to_entries[] | "\(.key): \(.value | @base64d | length) chars"'
```

To (re)apply the secret from pass:

```bash
kubectl create secret generic rbx-contact-secrets -n rbx-ia-br \
  --from-literal=POSTMARK_SERVER_TOKEN="$(pass show rbx/postmark/rbx-institutional-server-token)" \
  --from-literal=D360_API_KEY="$(pass show rbx/d360/api-key)" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## Pending operator actions before public announcement

1. **Approve template** `contact_form_acknowledgment` in the 360dialog hub (24–48h SLA). Until approved, the WhatsApp acknowledgment call fails silently (fire-and-forget). Email still works.
2. **Execute EP-001 (anti-abuse)** — Altcha anti-abuse + honeypot + rate limit. Hard prerequisite for any public announcement. Plan: `docs/implementation/contact-system-bidirectional.md` §EP-001.

Image tag bumps are handled automatically by `.github/workflows/ci.yml` (builds, pushes to GHCR, commits the new tag to `rbx-infra`). **Do not manually bump the image tag.**

---

## Verification commands

Confirm pods are healthy:

```bash
kubectl get pods -n rbx-ia-br -o wide
kubectl get pods -n rbxsystems-ch -o wide
```

Confirm ExternalSecret replication:

```bash
kubectl get externalsecret rbx-contact-secrets -n rbxsystems-ch \
  -o jsonpath='{.status.conditions[*].type}'   # expect: includes "Ready"
```

Confirm Postmark account reachable:

```bash
curl -s -H "X-Postmark-Server-Token: $(pass show rbx/postmark/rbx-institutional-server-token)" \
  https://api.postmarkapp.com/server | jq -r .Name
```

List D360 template status:

```bash
curl -s -H "D360-API-KEY: $(pass show rbx/d360/api-key)" \
  https://waba.360dialog.io/v1/configs/templates | \
  jq -r '.waba_templates[] | "\(.status)\t\(.name)\t\(.language)"'
```

Tail contact route logs:

```bash
kubectl logs -n rbx-ia-br -l app.kubernetes.io/part-of=rbx-ia-br -f --tail=100 | grep -i 'api/contact'
```

---

## Next priorities (Phase 1)

Four entry points, default order. Full execution detail in `docs/implementation/contact-system-bidirectional.md`.

| Order | Entry point | Slice                | Effort   | Hard prereq for next?             |
| ----- | ----------- | -------------------- | -------- | --------------------------------- |
| 1     | EP-001      | Anti-abuse           | 1–2 days | Yes (public rollout gate)         |
| 2     | EP-003      | Postgres persistence | 2–3 days | Yes (EP-002 writes need a schema) |
| 3     | EP-002      | Inbound webhook      | 2–3 days | No                                |
| 4     | EP-004      | Observability        | 1–2 days | No (caps the phase)               |

Alternate order (1→3→2→4) is acceptable if Postgres provisioning is blocked.

Phase 2 (rbx-comms extraction) and Phase 3 (Strategos bridge) are gated — do not start without documented gate evidence. See `docs/implementation/contact-system.md` for gate conditions.

---

## Hard rules

1. **No secrets in git.** Use `pass` + ExternalSecret.
2. **No `kubectl apply` outside GitOps.** Deploy changes go through `rbx-infra` PRs. Exception: the one-time `kubectl create secret` for `rbx-contact-secrets` (out-of-band by design).
3. **No `git push` without explicit per-operation operator authorization.**
4. **Never print secret values** to terminal, chat, or logs. Use `wc -c` / length checks.
5. **Postgres is always external** to k3s. Phase 1 persistence shares the PDNS VPS, not a new in-cluster pod.
6. **English in all repo files.**

---

## Document map

| Document                                                 | Role                                 |
| -------------------------------------------------------- | ------------------------------------ |
| `docs/implementation/contact-system.md`                  | Program index — read first           |
| `docs/implementation/contact-system-bidirectional.md`    | Phase 1 execution plan (4 EPs)       |
| `docs/adr/ADR-0001-contact-form-via-nextjs-api-route.md` | Foundational decision                |
| `docs/operator-brief.md`                                 | This file — fast operational summary |

---

## Changelog

| Date       | Change                                                         |
| ---------- | -------------------------------------------------------------- |
| 2026-05-15 | Initial operator brief — Phase 0 LIVE, Phase 1 planned         |
| 2026-05-16 | Updated EP-001 description from Turnstile to Altcha anti-abuse |
