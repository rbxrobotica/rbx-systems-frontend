---
title: 'Recover, change and prove it'
date: '2026-08-26'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [resilience, infrastructure, AI, observability, governance]
excerpt: 'Resilience is not uptime. It is the tested ability to recover, change dependencies and produce evidence that critical functions remain within bounds.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-26-recover-change-prove.png'
---

A system can return `HTTP 200` and still be operationally broken. Latency can make checkout unusable. A payment can be duplicated. A queue can grow faster than it is consumed. An agent can keep responding while losing the ability to use tools. A model can remain available while changing the behavior that made the product work.

Uptime measures whether an endpoint responded. Resilience measures whether the organization continues to deliver a critical function within acceptable bounds, and whether it can restore that function when those bounds are breached.

For years, enterprise resilience focused on databases, networks, redundancy and disaster recovery. Those elements remain necessary. The dependency graph, however, has changed. It now includes models the organization does not own, APIs it cannot restore, prices it does not control, external identities, registries, pipelines and behavior that can change without a new application release.

This is the context for a simple RBX thesis:

> **Systems designed to recover, change and prove it.**

The three verbs are deliberately different. Recover means rebuilding operational capability. Change means replacing dependencies without losing control of the system. Prove means producing durable evidence that both capabilities work.

## Uptime is not impact

Binary availability is a poor proxy for operational effect. Healthchecks, infrastructure metrics and technical SLOs remain useful, but they cannot answer the questions that matter during an incident on their own:

- Which business function was degraded?
- How many clients, operations or transactions were affected?
- How long did the effect remain outside tolerance?
- Was data availability, integrity, authenticity or confidentiality affected?
- What was the financial, regulatory and operational impact?

This is where observability stops being only a collection of dashboards and begins to serve as evidence. The metric `payment-api p99 = 4.3 s` describes a symptom. The statement `12.4% of payment attempts exceeded the SLO for 38 minutes, affecting X transactions` describes impact. The second form supports classification, escalation, decisions and explanation.

This does not mean automating the regulatory decision. Telemetry informs a decision; it does not receive legal authority to make one. The system should prepare the facts, preserve the timeline and make materiality calculable. Final classification remains subject to institutional governance.

## Recover means rebuild

Restart is not recovery. Starting a process again solves a narrow class of failure. Restoring a function requires rebuilding runtime, state, access and trust from known sources.

A recoverable architecture needs to answer where to find:

- the authoritative source for code, configuration, policies, prompts and infrastructure;
- data copies and RPO and RTO observed in real restorations;
- identity, secrets and break-glass access when the primary platform no longer exists;
- the immutable, verifiable artifacts needed for a rebuild;
- the operational knowledge that allows another person to perform the procedure;
- the durable record of the last exercise, including what failed and what remains unresolved.

The architectural rule is demanding: nothing needed to rebuild the platform can depend exclusively on the platform already working.

This also separates resilience from redundancy. Two instances, regions or copies can reduce downtime, but they do not prove that the organization can restore capability after losing state, credentials, a provider or human knowledge. Redundancy buys time. Rebuildability buys a path back.

Backups become operational capability only when restoration is exercised. Plans become runbooks only when another person can execute them. An architectural option that has never been tested is not yet a capability.

## Change is part of resilience

Systems change even when the organization would prefer stability. Providers discontinue products, regions become unavailable, contracts end, jurisdictional requirements evolve and prices change the viability of an architecture. Treating every change as an exception creates accumulated dependency.

Portability does not require pretending that all providers are equal. It requires choosing boundaries where substitution is deliberate:

- exportable data in known formats;
- explicit interfaces and contracts;
- declarative infrastructure;
- identities and secrets with transition procedures;
- interoperable observability;
- exit plans with owners, timelines and success criteria.

Perfect portability is fiction, and abstractions also have a cost. They can hide useful provider capabilities, enlarge the test surface and reduce short-term speed. The mature decision is to invest first where failure would be irreversible, concentration is highest and the capability can be reused across systems.

The goal is not to switch providers every week. It is to preserve the freedom to do so when the business requires it. The coherent commercial position for RBX is direct: portable by design, retained by trust.

## AI creates a behavioral dependency

In AI systems, the critical dependency does not end with API availability. A model can be discontinued, change version, receive a different safety policy or produce a response distribution that is incompatible with the product. The same application running against a different model may be a different system in operational terms.

AI resilience therefore requires versioning more than code. The recoverable set includes:

- prompts and instructions;
- model manifests and routing policies;
- tool schemas and authorization limits;
- evaluation datasets, canonical cases and thresholds;
- fallback and rollback policies;
- cost, latency and quality limits;
- enough provenance to reproduce a decision.

A cross-provider fallback that has never passed through the same evaluation harness is not a safeguard. It is an ungoverned behavioral change. A provider-exit drill must prove not only that the second API responds, but that the system preserves quality, safety, cost and action boundaries.

This is the new class of risk: behavioral dependency. Compute can be rebuilt and data restored while the product remains unable to reproduce the behavior its users and controls expect.

## Prove requires durable evidence

Declared resilience appears in diagrams, contracts and presentations. Exercised resilience leaves artifacts.

A recovery exercise should record the scenario, affected functions, observed time, recovery point, integrity validations, decisions made and gaps found. A model-switch exercise should preserve cases, versions, scores, regressions, costs and approvals. A provider-exit test should demonstrate that data, access, integrations and operations crossed the intended boundary.

Logs help with diagnosis, but they should not be the only memory of these capabilities. As we showed in [volatile logs are not evidence](/blog/2026-07-12-volatile-logs-are-not-evidence), a critical routine needs to emit an event, state or artifact that survives the failure itself. And, as we explained in [audit or telemetry](/blog/2026-08-01-auditoria-ou-telemetria), operational evidence and the record of authority serve different functions.

The principle is short:

> Resilience must be exercised, not declared. Observability should produce evidence, not just dashboards.

## Regulation is converging with engineering

The regulatory movement in finance does not create this thesis, but it confirms its direction.

In the European Union, the [Digital Operational Resilience Act, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554), has applied since 17 January 2025. Incident classification considers affected clients and transactions, duration and downtime, geographical spread, data losses, service criticality and economic impact. The [delegated regulation on materiality](https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj/eng) combines critical-service impact with specific thresholds to determine a major incident.

The nuance matters. Forty minutes of degraded latency is not, by itself, a major incident under DORA. The degradation can be part of a major incident when the critical service and applicable criteria cross the defined thresholds. The engineering lesson is not that every degradation must be reported. It is that a green healthcheck does not contain enough information to assess impact.

DORA also requires a comprehensive, risk-based digital operational resilience testing programme, with appropriate testing at least yearly for systems and applications supporting critical or important functions. For critical ICT services delivered by third parties, exit plans must be documented, periodically reviewed and sufficiently tested.

In Switzerland, [FINMA Circular 2023/1](https://www.finma.ch/en/~/media/finma/dokumente/dokumentencenter/myfinma/rundschreiben/finma-rs-2023-01-20221207.pdf) defines operational resilience around restoring critical functions within a tolerance for disruption. It requires an inventory of connections and dependencies, together with regular exercises under severe but plausible scenarios, including external dependencies and the stressed exit of a material provider.

In Brazil, the [current consolidated version of CMN Resolution 4,893](https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=4893&tipo=Resolu%C3%A7%C3%A3o%20CMN) covers cybersecurity policy and the contracting of processing, storage and cloud services for institutions within its scope. As amended by CMN Resolution 5,274/2025, it reinforces traceability, backups, vulnerability management, controls applied to secure development and the adoption of new technologies, metrics, audit trails and documented testing. Continuity must consider provider interruption and substitution, as well as restoration of normal operations.

These rules do not automatically make every technology supplier a directly regulated entity. Scope depends on the service, jurisdiction and contract. Expectations, however, travel through the chain in contractual requirements, audit, third-party management, procurement and incident duties.

## The question that remains

A resilient system should answer, with evidence:

- Which critical function is inside or outside tolerance now?
- Can we quantify impact, not only availability?
- Can we restore state and access from independent sources?
- Can we replace a dependency without an invisible regression?
- When was this capability last exercised?
- Which artifact proves the result?

Building these answers takes time and adds complexity. Overengineering is also a form of fragility. Priority should follow the irreversibility of failure, dependency concentration and the potential to reuse the capability.

Even so, the direction is clear. Resilient infrastructure is not infrastructure that promises never to fail. It preserves a known path to recover, change and demonstrate, after the fact, that important functions remained governed.

This is the standard recorded on our [Trust](/trust) page and applied in our [LLMOps and AI engineering](/services/llmops) practice. If your organization needs to turn architectural options into verifiable operational capability, [talk to RBX](/contact).
