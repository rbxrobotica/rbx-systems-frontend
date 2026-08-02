---
title: 'Governed autonomy is a distributed systems problem'
date: '2026-08-01'
author: 'Leandro Damasio'
authorRole: 'Founder & CEO, RBX Systems'
tags: [agents, governance, distributed-systems, observability, engineering]
excerpt: 'Why idempotency, provenance, unknown outcomes and vendor-neutral observability belong at the center of agentic architecture, not at the margins of the prompt.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-01-governed-autonomy-distributed-systems.png'
---

There is a moment, in every organization that takes AI agents seriously, when the question changes. It stops being "what can the model do?" and becomes "what did this system just do, and who authorized it?". That moment arrives earlier than most teams expect: one agent with access to real tools is enough for an effect to be produced in the world before anyone can reconstruct why it happened.

The market's dominant answer to that discomfort has been better prompting: more careful instructions, better examples, textual guardrails. All of it helps, and none of it settles the matter. A prompt improves the formation of intent. It does not govern the effect. Between the agent's intent and the consequence in the world lies an entire chain of authorization, execution, partial failure and evidence, and that chain is, with technical precision, a distributed systems problem.

This is the thesis that guides RBX engineering: agentic autonomy in production is a problem of distributed systems, governance and evidence, not just of prompting.

## The leap from prototype to system

The whole industry is crossing that leap right now. The report [The Pulse of Agentic AI in 2026](https://www.dynatrace.com/info/reports/the-pulse-of-agentic-ai-in-2026/), published by Dynatrace from a survey of 919 senior leaders at large enterprises, describes the state of the transition: 50% of surveyed organizations have agents in production for limited use cases, 69% of agent-made decisions are still verified by humans, and 44% still manually review communication flows among agents. Among the main blockers to scale are precisely visibility, governance and monitoring.

The qualification matters: this is an executive-perception survey, commissioned by an observability vendor, not a direct measurement of systems. Even so, the pattern it captures is recognizable to any team that has operated real agents. Human verification of 69% of decisions is not conservatism. It is the symptom of an architecture that does not yet offer the organization a trustworthy alternative to manual supervision: without structured evidence, without enforceable limits, without a decision trail, the human in the loop is the only control mechanism available.

The way to reduce that dependency is not to trust the model more. It is to build the system around it.

## Autonomy is the production of effects

An agent that only generates text is a draft generator. An agent that calls tools is something else: a distributed systems client, with everything that implies. Calls cross network boundaries. Timeouts happen. Confirmations get lost. Retries duplicate. Partial effects are left orphaned. None of this is news to anyone who builds transactional systems; what is new is that the component deciding to initiate those calls is probabilistic, and commercial pressure keeps pushing to give it more reach.

Once autonomy is understood as the production of effects, architectural priorities change. The central questions stop being about answer quality and become the classic questions of critical systems: what happens when this operation is repeated? What do we know when it does not respond? What record survives to prove what was done and under which authorization? Four decades of distributed systems engineering have already addressed these questions. The work now is to apply them to the agentic loop, where they gain an extra dimension: governance.

## Idempotency as governance

The literature treats idempotency as a defensive property of APIs: repeating the request does not duplicate the effect. Correct, and insufficient. In agentic systems, idempotency protects something more valuable than state: it protects the relationship between intent, authorization, decision, execution, effect and evidence.

Consider a human approval. An operator authorizes a risky action. The network flickers, the client resubmits the request, and the system records two approvals. From the point of view of state, perhaps harmless. From the point of view of governance, serious: the record now claims the human authorized twice something they authorized once. The audit trail has started to lie. The same holds for executing a tool with an external effect: if the retry triggers a second execution, the system produced an effect that no decision covered.

That is why, at RBX, idempotency is treated as a governance requirement, not an optimization. In our control plane, governance operations such as approvals and tool decisions are idempotent by contract: resubmitting the same operation returns the original record instead of creating a second one. Every external effect carries a stable identity linking it to the decision that authorized it. The design question stops being "what if the network retries?" and becomes "how do we guarantee that every produced effect corresponds to exactly one decision?".

## The problem of unknown outcomes

Every distributed system lives with an uncomfortable truth: a timeout does not prove the operation failed. The request may have executed while the confirmation was lost on the way back. For an autonomous agent this is the most dangerous scenario there is, because the naive reaction, trying again, is exactly the one that duplicates effects.

In the agentic engineering runtime RBX is building for Robson, our trading system, this scenario has its own name and treatment: unknown outcome. When a connection drops in the middle of an inference or an execution, the engine does not fabricate a local verdict. It does not record failure, does not record cancellation, neither discards nor uses partial content, and above all does not repeat the operation. It records that the outcome is unknown and starts a reconciliation: it consults the authoritative record on the other side of the boundary, discovers what actually happened, and only then decides the next step. Automatic repetition is forbidden by construction; tests guarantee exactly one reconciliation and no spontaneous re-execution.

This design connects layers that are usually discussed separately. For the distributed system, it is correctness. For the operator, it is the difference between trusting and watching: a system that admits "I do not know what happened, so I went and checked" is more trustworthy than one that hides uncertainty behind a retry. For audit, it is the guarantee that the record reflects what occurred, not what the client presumed. And for governance, it is the minimum condition for authorizing higher-risk effects: autonomy is only delegated to systems that can recognize their own uncertainty.

## Provenance before generic explainability

When something goes wrong in an agentic system, the forensic question is always the same: what exactly did the model receive, under which rules, and what did it return? Conventional logs rarely answer it, because they capture loose fragments: a piece of prompt here, a response there, without version, without hash, without the boundary between what was instruction and what was context.

RBX's architectural answer is to record provenance as a first-class artifact. In Robson's agentic runtime, every prompt compilation produces a manifest: which instructions went in, from which source, with which authority and which content hash. Every model step produces its own manifest, binding prompt, model, provider, available tools and applied policies to that specific inference. Together they form a verifiable chain between what was authorized and what was executed.

The most important detail of this design is not the record itself, but the authority hierarchy it makes explicit. An instruction is an instruction: it comes from authorized sources and carries normative force. Context is evidence: it informs, it does not command. Memory is context, not a source of orders. Tool output is data to be interpreted. And code retrieved from a repository does not gain instruction authority just because it entered the model's window. Without that recorded separation, any content that touches the prompt becomes, in practice, a potential order, and from that confusion come both security incidents and the impossibility of explaining decisions afterwards.

## Determinism around the probabilistic

Models are probabilistic, and they should be: that is where the capability comes from. The architectural mistake is letting the policy boundary be probabilistic too. Asking a model to "always confirm before executing" is a hope, not a control.

The pattern we adopt is to surround the probabilistic core with deterministic points: hooks that always fire, at fixed positions in the lifecycle, regardless of what the model says. Before accepting a request. Before making a tool available. Before executing. After executing. When a budget is exceeded. On stop, on cancellation, on reconciliation. Every dispatch is recorded, and a block at these points is final: no amount of model argumentation reverses it. In Robson's runtime, these lifecycle points are implemented and tested as part of the protocol, not as convention.

The same reasoning applies to tool decisions. Reducing a tool call to a single log line throws away the structure of the event. Agent intent, schema validation, risk classification, policy authorization, human approval when required, execution, result and downstream effect are distinct events, with distinct authors and distinct consequences. Recording them separately is what makes it possible to answer, months later, not only "what happened", but "who decided, based on what, and what would have happened under a different policy".

## Evidence, limits and decision

There is a market temptation today to solve all of this by buying an observability platform and declaring the problem closed. The distinction we draw is more demanding:

Observability provides evidence. Governance defines the limits. The control plane enforces and records the decisions.

These are three different responsibilities, and none substitutes for the others. A dashboard is not a policy. A trace is not an authorization. An observability platform, however good, informs the decision; it has no institutional authority to make it.

At the evidence layer, RBX's formula is deliberately twofold: OpenTelemetry for interoperability and correlation; Langfuse for AI semantics, evaluation and analysis. OpenTelemetry is the vendor-neutral standard that ensures a trace crosses services, queues and databases with propagated context, that spans, metrics and logs correlate, and that everything travels over OTLP to wherever the organization decides, with fan-out and portability through the Collector. It is a foundation for interoperability, not a final analytical product. Langfuse is the specialized backend where AI semantics lives: generations, prompt versions, tool calls, tokens, costs, latency, scores, evaluations, datasets and experiments. One answers "what happened across the whole system"; the other answers "what did the model do, what did it cost and how good was it". Confusing the two roles is like using a data warehouse in place of a debugger, or the reverse. At RBX, this separation is a recorded architecture decision, implemented as our own ingestion service with sensitive-data redaction; part of that layer is still being consolidated, and we say so with the same precision we demand from everything else.

Above the evidence sits the decision. RBX develops Thalamus as the institutional control plane for AI traffic: the point that answers, before each call, who may call which model, with which budget, under which policy, with which authorized context, and that validates after the call what may become an action. It is separated, by explicit boundary, from the model, the provider, the gateway and the observability backend, precisely so that authority does not dissolve into infrastructure. Here too, precision matters: Thalamus is a documented contract with an evolving implementation, with parts operating internally and parts still under construction. We publish the principle with conviction and the state with honesty, because a control plane that overstates its own capabilities betrays the very function it exists to serve.

## Measure outcomes, not activity

There remains the question that underwrites all the others: is it working? The usual answer counts tokens, calls, latency and provider cost. Those are activity metrics, and activity is not return. An agent can consume fewer tokens and generate more rework. It can produce more code and less value.

The attribution that matters relates work delivered to quality, time, required human intervention, rework generated, total cost and operational or business effect. On RBX's roadmap, this yield-attribution layer exists as a declared architectural direction, built on the same trail of events and evidence described above; it is planned work, not a production product, and presenting it as anything more would contradict the spirit of this text. The conceptual point, however, already shapes the design: a system that records decisions, effects and evidence end to end is a system where return can be computed rather than estimated.

## A sober conclusion

None of this is an argument against models. It is an argument about where trust lives. Models will keep improving, and every improvement expands what is worth delegating. But safe delegation will never come from the prompt: it will come from the system around it, the one that guarantees that effects correspond to decisions, that uncertainties are reconciled before being repeated, that the provenance of each step outlives the step, and that evidence feeds limits that someone with authority defined.

RBX operates on this terrain as both laboratory and practitioner: the ideas in this text do not come from slides, they come from a trading system that executes with real money, from an agentic runtime that treats unknown outcomes as a first-class state, and from a control plane that learned to make approvals idempotent before needing it in a crisis. We write about what we build, in the state it is in, as we did when showing [why audit is not telemetry](/blog/2026-08-01-auditoria-ou-telemetria) and [how we govern public RAG](/blog/2026-07-29-governed-public-rag). That is the standard we apply to ourselves, recorded on our [Trust](/trust) page: evidence first, confidence second.

If your organization is crossing the leap from prototype to system, our [LLMOps and AI engineering](/services/llmops) practice deals with exactly that crossing. And if you would rather discuss architecture before anything else, [talk to RBX](/contact).
