# ADR-0001: Contact Form via Next.js API Route

**Status**: Accepted

**Date**: 2026-05-15

## Context

The RBX Systems website (rbx.ia.br / rbxsystems.ch) had no contact capabilities beyond a static `mailto:` link in the footer. We need a contact form that:

1. Sends email notifications to the company inbox (`contact@rbxsystems.ch`)
2. Sends WhatsApp template messages via 360dialog when the user provides a phone number and opts in
3. Is i18n-aware (pt-BR and en)
4. Works on mobile and desktop, dark and light themes

The site is a standalone Next.js 14 App Router container with no separate backend. It already has API routes for S3 asset proxy and blog cover images. Postmark is configured for outbound relay. 360dialog is provisioned with a WhatsApp Business API phone number (+55 11 913734954).

### Why NOT in Strategos Core?

Strategos Core is a strategic decision-making platform ("Sala de Situação"). WhatsApp there is a bounded context for strategic communication with audit trails, governance, and opt-in registries. The website contact form is a lead-gen/commercial concern. Mixing them would violate the "WhatsApp is a channel, not the product" boundary defined in ADR-0005 of strategos-core.

### Why NOT in Thalamus?

Thalamus (named after the brain's relay center) is a data ingestion layer for AI systems. It is not a messaging service. D360/WhatsApp integration does not belong there.

## Decision

Implement the contact form as a Next.js API route (`/api/contact`) within the same container. The route:

1. Validates input (name, email, message required; phone optional)
2. Sends email via Postmark API (server-to-server HTTP, no SMTP)
3. Conditionally sends WhatsApp template via 360dialog API (fire-and-forget)

No new repository, no new deployment, no new container.

## Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `POSTMARK_SERVER_TOKEN` | Send email from contact@rbxsystems.ch | Server-side only (secret) |
| `D360_API_KEY` | Send WhatsApp template messages | Server-side only (secret) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | wa.me link in floating button | Client-visible (public) |

Secrets are mounted via Kubernetes `secretKeyRef` in the deployment manifests.

## D360 Template

A WhatsApp template `contact_form_acknowledgment` must be created and approved in the 360dialog hub before the WhatsApp feature works. The template sends a simple acknowledgment to the lead. If the template is not approved, the D360 call fails silently (fire-and-forget) and the email still works.

## Consequences

### Positive

- No additional infrastructure required
- Matches existing API route pattern (`/api/assets`, `/api/blog`)
- Postmark and D360 are HTTP APIs — no SDK dependencies needed
- Email always works regardless of D360 template status
- WhatsApp opt-in is explicit (checkbox), not implied

### Negative

- Contact logic is coupled to the frontend repository
- Rate limiting is per-pod (imperfect with 2 replicas)
- Scaling the contact endpoint means scaling the web frontend
- No retry/queue for failed D360 calls (fire-and-forget)

## Evolution Path

Phase 1 (current): API route in Next.js container. Direct Postmark + D360 API calls. No queue, no retry.

Phase 2 triggers (any one of):
- Contact volume exceeds 100 messages/day consistently
- Need for CRM integration (HubSpot, Odoo)
- Need for async message queue with retry (Postmark webhook, D360 status callbacks)
- Multi-site contact aggregation (if other domains need the same)
- Need for D360 inbound webhook processing (two-way WhatsApp)

Phase 2 target: A standalone `rbx-comms` service (Go) deployed as a separate K8s deployment. It would:
- Own Postmark and D360 integrations
- Expose a `/api/contact` endpoint consumed by any RBX product
- Use Redis or Postgres for rate limiting and message dedup
- Handle D360 webhook callbacks for delivery status
- Be the shared communication platform for all RBX products

## Related

- rbx-infra `apps/prod/rbx-ia-br/deploy.yml` — K8s secrets for POSTMARK_SERVER_TOKEN, D360_API_KEY
- rbx-infra `apps/prod/rbxsystems-ch/deploy.yml` — same secrets for the Swiss domain
- strategos-core `docs/adr/ADR-0005` — WhatsApp channel via 360dialog (Strategos-specific, separate concern)
