---
title: 'Evidence Is Not Authority'
date: '2026-08-07'
author: 'Leandro Damasio'
authorRole: 'CEO, RBX Systems'
tags: [architecture, ai-governance, agentic-systems, distributed-systems, roi]
excerpt: 'How to separate evaluation, authorization, effects, financial facts, and value attribution in autonomous agentic systems.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-07-evidence-authority-boundaries.png'
---

The more capable an AI system becomes, the less useful it is to ask only whether its answer looks good. The decisive question becomes different: which component has the authority to state that an action was permitted, that an effect actually occurred, that it produced a financial fact, and that this fact can be attributed to the system?

Those statements may look like parts of the same story, but they are not the same record. When an architecture compresses them into a single event, dashboard, or database, it creates a dangerous illusion of certainty. A recommendation starts to look like authorization. An attempt starts to look like an outcome. An observability signal starts to look like durable proof. A correlation starts to look like financial return.

At RBX, we are adopting a simple rule to prevent that collapse:

> Evidence informs a decision. Evidence does not inherit the authority of the decision it informs.

This rule guides the boundaries among Verentir, Thalamus, effect-producing domains, RBX Ledger, the proposed RBX Yield capability, and Strategos. It also determines how we think about agentic outboxes, specialized models, loops, and graphs.

## One chain, several facts

Consider an economic model that recommends reducing an exposure, an agent that proposes renegotiating a contract, or a language model that requests a tool execution. In all these cases, the complete path must preserve distinct records:

| Record                 | Question answered                                                        | Responsible authority                                            |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Recommendation         | What did the model or agent propose?                                     | Producing model or agent domain                                  |
| Authorization decision | What was permitted, under which policy and approval?                     | Thalamus for AI-mediated actions, or the domain control boundary |
| Execution attempt      | What was attempted and under which idempotent identity?                  | Responsible executor                                             |
| Reconciled effect      | What does the authoritative system confirm happened?                     | Domain that owns the external or business effect                 |
| Financial fact         | What financial value was recognized, in which currency and state?        | RBX Ledger                                                       |
| Attribution result     | How much of the outcome can be attributed to AI use, under which method? | RBX Yield, as a proposed analytical capability                   |

The sequence matters, but it does not transfer ownership. The fact that a recommendation starts the chain does not authorize the model to confirm the effect. The fact that Ledger receives a reference to the effect does not make it the owner of operational execution. The fact that Yield consumes financial facts does not allow it to rewrite them.

This separation is the foundation for scaling from an isolated model to a portfolio of economic, econometric, language, and specialized models. The type of model may change. The discipline of the chain should not.

## Verentir measures and judges, but does not govern execution

Verentir occupies the measurement and judgment plane. Its role is to run evaluations, apply scorers, compare results, detect regression or drift, attribute likely causes, and produce verdicts that can be tracked over time.

This makes it possible to answer questions such as:

- does this model remain fit for its defined purpose?
- does the result meet the criteria in the evaluation specification?
- is a new version better than the previous one on the relevant dimensions?
- is the attribution calculated by Yield stable, reproducible, and sensitive to the right assumptions?

The limit is as important as the capability. Verentir may recommend promotion, rejection, or investigation. It cannot approve its own verdict, authorize a tool, execute compensation, unilaterally declare that an effect happened, or write a fact to Ledger.

This protects the independence of evaluation. An evaluator that also authorizes, executes, and accounts for outcomes stops being an evaluator and becomes a concentration of authority that is difficult to audit.

## Thalamus applies the decision on the AI path

Thalamus remains the institutional control plane for AI-mediated actions. It applies policies, limits, budgets, guardrails, approvals, and tool controls before and after the relevant calls. When a recommendation reaches the point where it may produce an effect, this deterministic boundary decides what is authorized.

Thalamus does not replace the domain that owns the effect. It may authorize an intent with scope and constraints, but it should not invent the final confirmation that an external system executed it. Likewise, an agent gateway or provider may transport the call, but it does not gain institutional authority over it.

This distinction already appeared in our reflection on [governed autonomy as a distributed systems problem](/blog/2026-08-01-governed-autonomy-distributed-systems). The model proposes. Policy limits. The control plane enforces. The effect owner confirms.

## The outbox belongs to the effect producer

Agentic systems need reliable event delivery, but that does not justify creating a central service that starts to own every effect in the ecosystem. The safer pattern is a producer-owned transactional outbox:

1. the domain that changes its state writes the change and its outbox event in the same transaction;
2. the event carries stable identities for the recommendation, authorization, attempt, and effect;
3. each consumer maintains its own inbox or equivalent deduplication mechanism;
4. retries preserve the authorized intent instead of creating a new intent;
5. the consumer does not promote event delivery into proof that the originating effect occurred beyond what the producer confirmed.

Libraries, schemas, and envelopes may be shared. Transactional ownership should not be centralized. A generic outbox separated from the database that contains the state change recreates the problem the pattern is meant to solve: the event and the fact can diverge.

There is another state that must be explicit: `UnknownOutcome`. A timeout does not prove failure. If a mutating operation may have produced an effect, the system must reconcile with the authoritative source before repeating it. Re-executing first and asking later violates reliability and governance because it may produce a second effect without a second authorization.

## Ledger records facts; Yield produces attributions

RBX Ledger and RBX Yield meet in economic analysis, but they live on different sides of a critical boundary.

Ledger records accepted financial facts: transactions, decimal amounts, currency, state, settlement, references, and evidence under the rules of the finance function. It answers what has been financially recognized. It should not accept a raw model estimate or an observability span as a definitive fact.

Yield is the proposed analytical capability for relating AI use, productivity, cost, and outcome. It answers what can be attributed, under a given method, to the use of a model, agent, or workflow. To do that, it consumes references to domain facts, including Ledger financial facts, without replacing them.

This is also why we treat KPI and ROI as a hierarchy rather than a competition. KPI is the broad class of indicators used to track quality, time, cost, risk, rework, and human intervention. ROI is a derived financial indicator with additional requirements.

A defensible ROI must state, at minimum:

- numerator and denominator;
- period and currency;
- baseline or counterfactual;
- classification of included costs;
- effects confirmed by the responsible domains;
- financial facts accepted by Ledger;
- calculation method and version;
- causal limits, confidence, and data vintage;
- finance review when the number supports a material decision.

Without these elements, we have an estimate that may be useful for exploration, not a realized return. For that reason, Yield should distinguish estimated, attributed, and realized results with reconciliation. The architecture does not forbid estimates. It forbids the interface from erasing the difference among them.

## Observability provides evidence, not accounting

OpenTelemetry, logs, metrics, traces, and AI analysis platforms are essential for reconstructing system behavior. They help Verentir evaluate and help operators investigate. That does not make them the financial or institutional audit trail.

Telemetry may be sampled, redacted, transformed, retained for a limited period, lost during export, or unavailable with its backend. A trace may show that a call left one service and still fail to prove the final effect in the destination system. An observation may retain tokens, latency, and a score and still fail to prove that an expense was recognized.

In [An audit trail is not a telemetry sink](/blog/2026-08-01-auditoria-ou-telemetria), we showed why mixing those roles makes both worse. The formulation we carry into the broader architecture is direct:

> Observability provides evidence. Governance defines the limits. The control plane enforces and records decisions. Each authoritative domain preserves its durable facts.

## Models, loops, and graphs do not change authority

A model portfolio increases the need for these boundaries. Economic models depend on vintage, method, and scenario. Econometric models depend on assumptions, population, window, and review. Specialized models depend on domain contracts. Language models also depend on prompt, context, tools, provider, and parameters.

All of them require provenance. Model version, artifact hash, data version, evaluation specification, and promotion decision must outlive the endpoint that served an inference. If a model is offered through an API in the future, the external contract should preserve the same identities and limits instead of creating a second truth chain.

Loop engineering does not change the rule either. A loop repeats work until a stopping criterion is met, but every repetition remains subject to budget, idempotency, and authorization. MultiLoops coordinate different cadences, but they cannot conceal a change in responsibility between cycles. Graph engineering organizes nodes, edges, and shared state, but shared state does not become a universal source of truth. Each node must know which kind of record it receives, which record it may produce, and which authority it does not hold.

Even the meta-loop, which reviews whether the loop architecture remains appropriate, must stop at the correct boundary. It may produce evidence and recommend a change. An institutional change still requires a governed decision and a canonical record.

## An adoption sequence that avoids shortcuts

The architecture can be adopted incrementally:

1. stabilize identities, model provenance, and correlation contracts;
2. connect evaluation and observability without duplicating authority or records;
3. implement a durable audit trail, producer-owned outboxes, consumer-owned inboxes, and reconciliation for unknown outcomes;
4. only then consolidate Yield over reliable effects and costs, using a financial taxonomy agreed with the CFO;
5. project the results through Strategos for executive judgment without turning the cockpit into a primary database.

This order is not bureaucracy. It prevents a sophisticated dashboard from being built over ambiguous events and then influencing decisions as if the ambiguity had disappeared.

Today, RBX records these boundaries as institutional architecture. Some capabilities have contracts and evolving implementations; RBX Yield remains a proposed direction, dependent on its own decision before becoming a repository, service, or product. That transparency of state is part of the architecture.

## The design we want to preserve

In the resulting design, Verentir evaluates. Thalamus governs the AI path. The producing domain publishes its effect transactionally. The responsible domain reconciles reality. Ledger records the financial fact. Yield calculates attribution under an explicit method. Strategos projects the situation for human judgment.

None of these components needs to be weak for another to be strong. The ecosystem becomes more trustworthy precisely because each can excel at a bounded responsibility.

This is the standard of confidence we also describe on [Trust](/trust): never ask an organization to believe a conclusion larger than the evidence allows. If your company is structuring agents, specialized models, or return measurement under these same tensions, our [LLMOps and AI engineering](/services/llmops) practice can help. To discuss the design before implementation, [talk to RBX](/contact).

## Short LinkedIn version

In agentic systems, a recommendation is not an authorization. An attempt is not a confirmed effect. A trace is not an audit trail. A correlation is not ROI.

In the architecture we are recording at RBX, Verentir measures and evaluates. Thalamus governs the AI path. The producer publishes its effect through a transactional outbox. The responsible domain reconciles what happened. RBX Ledger records the financial fact. The proposed RBX Yield capability calculates attribution under an explicit method. Strategos projects the situation for human judgment.

The same boundary applies to loops and graphs: shared state coordinates work, but it does not create a universal source of truth. When an `UnknownOutcome` occurs, the system reconciles before repeating a mutating operation.

ROI is a derived financial KPI. To be defensible, it requires a baseline, period, classified costs, Ledger facts, reconciled effects, a versioned method, and explicit causal limits.

Principle: evidence informs decisions, but it does not inherit the authority of the decisions it informs.
