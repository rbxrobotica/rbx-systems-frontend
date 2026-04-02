# RBX Editorial Edge Plan

## Purpose

This document proposes a minimal internal editorial UI for RBX, starting with blog publishing for `rbx-robotica-frontend` and evolving toward a broader internal edge plane for RBX operations, content workflows, and selected product integrations.

The immediate use case is article publishing for the RBX public sites. The longer-term goal is to position this capability close to Strategos, but outside the core product domain, using Odoo Community as an operational shell rather than as the public content runtime.

This is a plan only. It is not an implementation document.

## Executive Summary

The recommendation is to build an internal editorial control plane in two layers:

1. **Odoo Community as the internal workbench**
   - staff-facing UI
   - roles, approvals, drafts, attachments, audit trail, publish jobs
   - future adjacency to broader RBX operational workflows

2. **A dedicated publishing edge service**
   - transforms editorial records into the exact artifacts expected by `rbx-robotica-frontend`
   - publishes localized MDX to S3
   - uploads covers
   - commits source files to git
   - emits operational events for future integrations

The public site remains what it is today:

- `rbx-robotica-frontend` as the delivery surface
- localized MDX stored in S3
- public rendering handled by Next.js

The internal UI should not become the public runtime. Odoo should remain an operational edge plane, not the content-serving system of record for the public website.

## Why This Direction

This plan tries to satisfy four constraints at the same time:

- keep the current blog publishing model working
- support bilingual publishing in `pt-BR` and `en`
- allow multiple trusted RBX users to operate the workflow safely
- avoid coupling a CMS directly into Strategos core

The right position is "near Strategos, but not inside Strategos". The editorial plane should be operational infrastructure that can later integrate with Strategos and Thalamus, without forcing either of them to absorb CMS responsibilities.

## Current State

Today, blog publishing for `rbx-robotica-frontend` works as follows:

- articles are MDX files
- they are published to Contabo Object Storage under `blog/posts/`
- cover images are published under `blog/covers/`
- the frontend resolves localized variants by locale:
  - `YYYY-MM-DD-slug.pt-BR.mdx`
  - `YYYY-MM-DD-slug.en.mdx`
- `rbx.ia.br` defaults to `pt-BR`
- `rbxsystems.ch` defaults to `en`
- the same public slug is used for both domains
- current publishing is primarily agentic

This is a good delivery model. The missing piece is an internal operator surface for a team, with approvals, safe publishing, and better workflow control.

## Strategic Positioning

The proposed editorial system should be treated as part of an RBX internal edge layer:

- not part of the public frontend runtime
- not part of Strategos core domain logic
- not part of Thalamus core routing logic
- close enough to both that it can integrate with them cleanly

Conceptually:

- **Strategos** remains the strategic operating system
- **Thalamus** remains the event and signal routing layer
- **Odoo** becomes the internal operational shell for humans
- **Editorial Edge** becomes a bounded capability exposed inside Odoo and backed by a dedicated publishing service

## Core Recommendation

### Phase 1 target

Build a minimal internal UI for article publishing, implemented as an Odoo Community module, backed by a publishing service that integrates with the current `rbx-robotica-frontend` delivery model.

### What Odoo should do

Odoo should own:

- user access
- team roles
- article drafts
- assignment and approval state
- cover upload intake
- editorial metadata
- publish commands
- job history
- audit trail

### What Odoo should not do

Odoo should not:

- serve public blog pages
- render the public frontend
- hold broad infrastructure secrets in browser-facing code
- become the sole source of truth for delivery artifacts
- directly expose arbitrary MDX execution to users

### What the publishing edge service should do

The publishing edge service should:

- receive a normalized article record from Odoo
- produce the localized MDX artifacts required by the frontend
- validate frontmatter, slug, cover, locale completeness, and markdown subset
- upload the generated files to S3
- commit source files to the git repository
- optionally open a PR or publish directly depending on workflow mode
- emit publish events for future consumers

## Boundary With Strategos

The editorial system should be adjacent to Strategos, not embedded in it.

Recommended boundary:

- Strategos may reference campaigns, strategic initiatives, releases, and publication requests
- the editorial plane may consume that context
- article authoring, translation workflow, cover management, and publication remain outside Strategos core

Good future integrations with Strategos:

- link article records to strategic initiatives
- editorial calendar attached to campaigns or launches
- release notes generated from Strategos milestones
- content backlog imported from Strategos planning objects

Bad future integrations:

- storing article editor state inside Strategos core domain models
- making Strategos responsible for S3 publishing, git commits, or cover assets
- mixing internal planning state with public publishing state in the same bounded context

## Boundary With Thalamus

Thalamus should be treated as a future event and signal integration layer.

Good future integrations with Thalamus:

- publish event emission
- content status changes
- audit event fan-out
- analytics ingestion
- notification routing

Bad future integrations:

- using Thalamus as the primary authoring store
- making article publishing synchronous on Thalamus availability

## Proposed Architecture

### Logical components

1. **Odoo Community**
   - custom module: `rbx_editorial`
   - internal users only
   - article UI, workflow, jobs, audit

2. **Editorial Publisher Service**
   - internal API or worker
   - no public exposure
   - converts article records to localized MDX
   - uploads to S3
   - commits to git

3. **Artifact Storage**
   - S3-compatible bucket for live post content and covers
   - git repository as source backup

4. **Public Delivery**
   - `rbx-robotica-frontend`
   - reads localized post content from S3
   - serves the public pages

5. **Optional Event Layer Later**
   - Thalamus or another internal bus for publish events and downstream automation

### Suggested request flow

1. User enters article text and cover in Odoo
2. User selects source language: `pt-BR` or `en`
3. Odoo stores draft and metadata
4. System generates the missing locale variant
5. Reviewer approves
6. Odoo calls the internal publisher
7. Publisher writes:
   - `blog-posts/YYYY-MM-DD-slug.pt-BR.mdx`
   - `blog-posts/YYYY-MM-DD-slug.en.mdx`
8. Publisher uploads all variants and cover
9. Publisher commits to git
10. Frontend serves the content without changing public URL structure

## Minimum Viable Internal UI

The minimal UI should not try to be a full CMS.

It should support exactly:

- create article
- edit article
- attach cover
- choose source language
- view generated translation
- edit generated translation if needed
- preview `pt-BR`
- preview `en`
- submit for review
- approve
- publish
- see job result and artifact links

### Minimal navigation

- `Articles`
- `Assets`
- `Publish Jobs`
- `Settings`

### Minimal article screen

- title
- slug
- date
- tags
- author
- author role
- source language
- source text
- generated locale text
- excerpt per locale
- cover upload
- preview per locale
- validation panel
- approval and publish actions

## Editorial Data Model

Initial proposed models inside Odoo:

### `rbx.article`

- `slug`
- `publish_date`
- `status`
- `source_locale`
- `cover_asset_id`
- `author_user_id`
- `reviewer_user_id`
- `publisher_user_id`
- `frontend_repo`
- `target_sites`
- `last_publish_job_id`

### `rbx.article.locale`

- `article_id`
- `locale` (`pt-BR`, `en`)
- `title`
- `excerpt`
- `body_markdown`
- `translation_state`
- `is_source`

### `rbx.asset`

- `type`
- `filename`
- `mime_type`
- `checksum`
- `storage_location`
- `validation_state`

### `rbx.publish.job`

- `article_id`
- `requested_by`
- `approved_by`
- `published_by`
- `status`
- `started_at`
- `finished_at`
- `s3_objects`
- `git_commit_sha`
- `error_log`

## Source Of Truth Strategy

Recommended split:

- **Operational source of truth**: Odoo records for workflow and approvals
- **Delivery source of truth**: S3 objects currently live for the site
- **Backup and traceability source of truth**: git commits in `rbx-robotica-frontend`

This keeps the workflow manageable without pretending one system should own every concern.

## Publishing Modes

Two publish modes should be planned from the start.

### Mode A: Direct publish

- intended for trusted publisher role
- uploads to S3 immediately
- commits directly to main
- lowest friction

### Mode B: Controlled publish

- intended for stricter review or later growth
- writes artifacts to a branch
- opens PR
- publishes to S3 only after approval or merge

Recommendation:

- start with Mode A for the first internal version
- design job model so Mode B can be added without redesigning the UI

## Integration With `rbx-robotica-frontend`

The plan should preserve these existing conventions:

- same public slug on both domains
- locale-specific MDX variants in S3
- same cover image across locales
- existing cover URL shape
- existing Next.js resolution logic

The publisher should generate artifacts exactly in the current expected format:

- `blog-posts/YYYY-MM-DD-slug.pt-BR.mdx`
- `blog-posts/YYYY-MM-DD-slug.en.mdx`

And should use the same S3 naming convention:

- `blog/posts/YYYY-MM-DD-slug.pt-BR.mdx`
- `blog/posts/YYYY-MM-DD-slug.en.mdx`
- `blog/covers/YYYY-MM-DD-slug.<ext>`

## Odoo Integration Strategy

### Recommended posture

Use Odoo Community as the human operator shell, not as the rendering engine and not as the artifact generator itself.

### Why

This keeps:

- public delivery concerns out of Odoo
- translation and publish logic in a controlled service boundary
- future RBX operational modules close to each other inside Odoo

### First Odoo module

Suggested module name:

- `rbx_editorial`

Suggested capabilities:

- backoffice form views for articles and locales
- list views and kanban for workflow state
- publisher action button
- attachment support for covers
- permissions by role
- activity log

## Security Model

This is the most important section if this becomes team-facing.

### Access model

- internal-only access
- no public exposure without zero-trust
- SSO through organization identity provider
- no local user/password as the primary path

Recommended access options:

- private network access such as Tailscale
- or identity-aware access such as Cloudflare Access or Google IAP

### Role model

- `author`
- `editor`
- `publisher`
- `admin`

Default recommendation:

- author can create and edit drafts
- editor can approve and request changes
- publisher can execute publish jobs
- admin manages config, roles, and integrations

### Secret handling

- no S3 credentials in browser code
- no git credentials in browser code
- no broad secrets inside Odoo forms
- publisher service gets credentials server-side only
- prefer Kubernetes service identity, External Secrets, or a vault-backed model

### Content safety

Because the public site uses MDX-like artifacts, the UI must not expose arbitrary MDX execution to staff.

Recommended rule:

- authors edit plain Markdown or a restricted markdown subset
- no arbitrary JSX
- no arbitrary HTML blocks by default
- transformation to final MDX is done server-side by trusted code

### Upload safety

- accept only expected image formats
- validate MIME type and extension
- compute checksum
- optionally scan uploads before publish

### Session and request protections

- HttpOnly secure session cookies
- SameSite protection
- CSRF protection for write actions
- full server-side authorization checks
- audit logs for all publish actions

### Auditability

Log every:

- article creation
- article change
- translation generation
- approval
- publish trigger
- S3 upload
- git commit and SHA

## Deployment Model

### Recommended topology

- Odoo Community in internal RBX infra
- Editorial Publisher Service in internal RBX infra
- public frontend remains separate

### Recommended separation

- public website namespace or app remains isolated
- internal editorial services run in separate internal namespace
- no direct browser path from the internal UI to the public frontend runtime internals

## Operational Model

### Phase 1 team workflow

1. Author creates article in source language
2. System generates translated variant
3. Editor reviews both locales
4. Publisher uploads and publishes
5. System records artifact URLs and commit SHA

### Fallback workflow

If translation quality is not good enough:

- editor manually adjusts the target locale
- system still publishes both variants

## Roadmap

### Phase 0 — Current baseline

- agentic publishing
- bilingual artifacts
- public frontend already locale-aware

### Phase 1 — Minimal editorial edge for blog

- Odoo `rbx_editorial`
- article + locale + asset + job models
- internal publisher service
- direct publish mode
- RBAC and audit

### Phase 2 — Cross-channel editorial operations

- release notes
- changelog generation
- product launch content
- campaign linking
- scheduling
- approvals by business unit

### Phase 3 — Strategos adjacency

- Strategos initiative linkage
- editorial calendar tied to plans and launches
- strategic narratives to publishing pipeline
- request objects created from Strategos but executed by editorial plane

### Phase 4 — Thalamus adjacency

- publish events to Thalamus
- analytics and operational signals
- downstream integrations for notifications, summaries, and reporting

## Alternatives Considered

### 1. Keep agentic only forever

Pros:

- lowest implementation cost
- highest flexibility

Cons:

- weak for multi-user workflow
- no structured approvals
- no internal audit UI
- poor discoverability for non-technical operators

### 2. Build a custom CMS directly in `rbx-robotica-frontend`

Pros:

- one stack
- full control

Cons:

- mixes public runtime and internal control plane
- grows a second product inside the public frontend
- weak alignment with the broader RBX operational ecosystem

### 3. Use Odoo as public CMS runtime

Pros:

- fast backoffice

Cons:

- wrong architectural boundary
- public delivery would be tied to ERP concerns
- poor fit for the current frontend artifact model

Recommendation:

- use Odoo as internal workbench only
- keep public delivery in the frontend

## Main Risks

### Risk 1: Odoo scope creep

The internal module may expand too fast into a pseudo-CMS/ERP hybrid.

Mitigation:

- keep Phase 1 narrow
- blog first
- publishing artifacts owned by the publisher service

### Risk 2: Unsafe content model

Allowing arbitrary MDX or HTML can create attack surface.

Mitigation:

- markdown subset only
- server-side transformation
- strict validation

### Risk 3: Secret sprawl

Publishing flows can leak S3 or git privileges.

Mitigation:

- secrets only in backend workloads
- least privilege
- isolated publisher service account

### Risk 4: Wrong coupling to Strategos

Editorial workflows could pollute Strategos domain boundaries.

Mitigation:

- treat Strategos as upstream planning context, not CMS host

## Open Questions For Review

- Should direct publish to `main` remain acceptable for trusted publishers, or should Phase 1 already prefer PR-based publication?
- Should Odoo store the full article bodies, or should it store editorial state and hand the source text off to a dedicated content store?
- Should translation generation be done synchronously in the UI or asynchronously in a background job?
- Should publish approval be single-step or require dual approval for institutional posts?
- Should the first version cover only blog posts, or also release notes and changelog entries?
- Is Odoo already planned as the RBX internal shell for non-editorial workflows, or is that still an open platform choice?

## Recommendation For Tomorrow's Review

Approve the following decision path:

1. Use Odoo Community as the internal editorial workbench
2. Build blog publishing as the first bounded capability
3. Keep publishing execution in a dedicated edge service
4. Preserve the current `rbx-robotica-frontend` delivery model
5. Treat Strategos and Thalamus as future integrations, not initial hosts

If this path is approved, the next document should be a Phase 1 implementation design with:

- service boundaries
- Odoo model schema
- API contracts
- role matrix
- deployment topology
- publish job sequence diagram
