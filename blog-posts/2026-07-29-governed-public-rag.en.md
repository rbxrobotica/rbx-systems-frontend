---
title: 'Public RAG with control and evidence'
date: '2026-07-29'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [rag, ai-engineering, rust, governance, retrieval]
excerpt: 'How we separated retrieval, control, memory, and evaluation in a public assistant prepared for shadow mode with Rust, Thalamus, and auditable evidence.'
---

# Public RAG with control and evidence

Adding RAG to a public assistant looks simple: turn documents into vectors, retrieve similar passages, and send them to the model. That description works for a demo. In an institutional system, it omits almost every difficult decision.

Who may request retrieval? Which document set may be queried? How do we prevent internal content from appearing in a public answer? Who selects the embedding model? What happens when evidence is stale? How can we prove, after the fact, which policy allowed the call?

At RBX, we treat these questions as part of the product. The resulting implementation is prepared for shadow mode, disabled by default, and has no authorization for public rollout. When enabled in an approved environment, it can validate the path without changing the answer delivered to the visitor.

This article explains two choices at the center of the architecture: why we used Rust for the RAG path backends and why we placed Thalamus in the control plane.

## RAG is not a security boundary

Semantic search answers a statistical question: which passages are closest to this query? It does not answer whether the query is in scope, whether the caller is authorized, whether the document remains valid, or whether the result may be exposed in that context.

The vector index therefore cannot decide what the public assistant is allowed to know.

We also rejected the idea of one unrestricted company-wide corpus. Knowledge is split into explicitly scoped RAG packages. The public assistant package contains only institutional, commercial, and support material approved for public exposure. Other domains remain isolated.

This separation matters as much as the ranking algorithm. A semantically relevant result from the wrong package is an authorization failure.

## The governed path

The shadow flow keeps responsibilities deliberately separate:

1. The site BFF sends the query to a governed RAG route in Thalamus.
2. Thalamus authenticates the caller, resolves policy, and authorizes the public package.
3. Thalamus delegates retrieval to rbx-memory with a fixed scope.
4. rbx-memory requests the query embedding through a separate governed Thalamus route.
5. Thalamus resolves the permitted alias and calls the backend through `EmbeddingPort`.
6. rbx-memory queries the external index with exact package, visibility, and validity filters.
7. The result returns with trace and audit identifiers.
8. The BFF records the shadow execution but does not use the passages to change the public answer.

Step 4 appears to loop back. That is intentional. rbx-memory owns persistence and retrieval, but it receives no provider credentials and never calls LiteLLM directly. Every embedding remains subject to the same policy, alias, redaction, and audit controls.

In other words, [rbx-memory](/products/rbx-memory) knows how to search. Thalamus decides whether that search and embedding may happen in that context.

## Why Rust

RAG does not require Rust. Excellent retrieval systems can be built in Python, Go, Java, or TypeScript. Our choice is not a claim about the quality of those languages. It is a decision about which failures we wanted to make harder.

The path crosses sensitive contracts: tenant, product, workflow, package ID, visibility, permitted model, vector dimensions, trace, audit, and error envelopes. Rust lets us represent these contracts as explicit types, validate them at the boundaries, and propagate them without relying on implicit conventions.

That helped in four areas.

First, failures stay visible. An unavailable embedding backend, a missing policy, and a response with the wrong dimensions are distinct states. The system must refuse each one predictably instead of turning an error into empty context or a silent fallback.

Second, asynchronous concurrency stays bounded. The path uses network and database operations, but it does not need unbounded queues, invisible retries, or detached background work. The implementation can define timeouts, body limits, and call counts per operation.

Third, the binary is operationally straightforward. The control, memory, and evaluation services share tooling, an error model, and consistent local checks.

Fourth, the language reduces drift between a contract and the code that executes it. `EmbeddingPort`, request and response envelopes, and retrieval policies are verifiable interfaces. The LiteLLM adapter remains replaceable.

There is a cost. Rust demands more precision up front, slows exploratory changes, and requires discipline in modeling. We accepted that cost because the problem was not only retrieving text. It was preserving boundaries under failure.

## Why the Thalamus core

Thalamus is not the vector database or the RAG backend. This distinction is central.

rbx-memory owns chunks, embeddings, access to external PostgreSQL, pgvector, lexical ranking, and hybrid retrieval. Thalamus owns the right to decide whether an operation may happen now for a given tenant, product, and workflow.

Placing control in Thalamus gives us one surface for:

- authentication and authorization
- policy resolution by tenant, product, and workflow
- explicit model-alias permission
- redaction before the call
- trace and audit events
- response validation
- refusal when policy or a backend is unavailable

The embedding route delegates only to `EmbeddingPort`. The core does not know a specific provider credential and does not absorb LiteLLM's internal protocol. The adapter translates the governed contract to the permitted backend.

This design avoids a common shortcut: giving every service its own key and letting it call the provider directly. The shortcut removes one network call, but it spreads authority, logs, aliases, and policy. Every consumer must later reconstruct controls that should have been institutional.

[Applied AI engineering](/services/ai-engineering) becomes more reliable when the control point is explicit and the data component cannot route around it.

## The index must enforce isolation too

Upstream control does not replace database safety.

Hybrid retrieval combines pgvector similarity with ParadeDB-compatible lexical search. Exact package ID and visibility filters apply to semantic candidates, lexical candidates, and the final row fetch. Effective and review dates are part of the predicate as well.

This prevents a class of error where the application filters after retrieval. If the candidate set has already mixed packages, isolation happened too late.

The target PostgreSQL service is external. We did not add a production database inside the cluster. The index is a rebuildable projection; approved content keeps its own source of authority.

## Evaluation cannot authorize itself

A governed architecture can still answer badly. Measurement and control must therefore remain separate.

TruthMetal owns canonical cases and accepted thresholds. Verentir is prepared to run asynchronous evaluations, persist verdicts, and rebuild reports from signed evaluation artifacts. Once accepted, that evidence may inform policy; Thalamus will remain responsible for live control.

The report measures six signals: overall pass rate, accuracy, scope adherence, unsupported claims, financial-boundary violations, and stale or unauthorized evidence. Artifacts bind to the exact contract bytes and use Ed25519 signatures. A sequence requires complete history and rejects reused runs, exports, or verdicts.

Even three passing runs do not release production. They make the system eligible for human review. Non-metric requirements and rollout approval remain separate.

The current gate remains closed. The contract requires at least 30 accepted cases and three consecutive shadow runs. The case set is still going through acceptance, and signing trust must be provisioned. That is a safety property, not a delay to hide.

## What becomes harder

The architecture adds components and calls. There are more contracts to maintain, more failure states to observe, and more editorial work to review sources, dates, and scope. Refusals and handoffs will be more common at first because the corpus is deliberately small.

We also accept additional latency in governed retrieval. In shadow mode it does not alter the public answer, but it must be measured before any synchronous integration.

The benefit is clear ownership:

- the curated package defines permitted knowledge
- rbx-memory persists and retrieves
- Thalamus authorizes and audits
- TruthMetal defines correctness
- Verentir measures behavior over time
- humans approve rollout

None of these components can declare the system ready on its own.

## The principle we want to preserve

Useful RAG is not only similar context. It is authorized, current, attributable, and evaluated context.

Rust helped us make contracts explicit and failures difficult to ignore. Thalamus kept embedding and retrieval from becoming a parallel path outside institutional policy. rbx-memory kept search where it belongs. TruthMetal and Verentir prevented runtime, truth, and evaluation from collapsing into one component.

The integration remains prepared for shadow mode and disabled by default because this separation must be proven before any promotion. That is the standard we describe in [Trust](/trust): evidence first, confidence second.

If your organization is turning an AI prototype into a controllable system, explore our approach to [AI engineering](/services/ai-engineering) or [talk to RBX](/contact).

## Short LinkedIn version

Public RAG is not just vectors, ranking, and a prompt.

At RBX, we separated six responsibilities: curated knowledge, retrieval, control, truth, measurement, and human approval.

We use Rust to represent sensitive contracts as explicit types and fail predictably. We use Thalamus as the control plane, not as the vector database. rbx-memory still owns pgvector and retrieval, but every embedding passes through policy, authorization, alias, redaction, trace, and audit.

The integration is prepared for shadow mode and disabled by default. The gate requires accepted cases, three consecutive runs, and human review. A metric does not deploy software.

Principle: reliable RAG needs authorized, current, attributable, and evaluated context.
