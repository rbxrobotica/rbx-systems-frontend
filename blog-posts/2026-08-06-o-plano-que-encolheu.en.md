---
title: 'The plan that shrank'
date: '2026-08-06'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, data, adr, robson, observability]
excerpt: 'We wrote a data platform plan for Robson: sixteen metrics, eight analytical tables, a warehouse, dashboards. We handed it to a second model with a one-line instruction: protect production. The verdict was NO-GO, and every cut it proposed survived verification against the code. What remained fits in five invariants, a two-table contract, and a rehearsal with numbers. The story of how a good plan gets better by shrinking.'
slugAlias: 2026-08-06-the-plan-that-shrank
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-06-o-plano-que-encolheu-v2.png'
---

A trading system running in production generates a specific kind of temptation. Every event is precious, every decision is auditable, and the conclusion seems obvious: this deserves a data platform. Bronze, silver, catalog, warehouse, dashboards. We wrote that plan, authored by Anthropic's Claude Fable 5. Sixteen detailed metrics, eight analytical marts, an exporter, transformations, derived alerts. Technically correct, strategically justified, and wrong in the way that is hardest to see from the inside.

There is context that makes the question legitimate. Earlier this month we wrote here about the decision that Robson's event log is audit, and telemetry is something else: the runtime deliberately erases its own operational history. Retention prunes auxiliary tables, logs expire, and what remains is the auditable essential. It is the right decision for a lean production database, and it creates a real debt: retrospective questions about risk and execution can only be answered today by querying the database that sustains real capital. Some durable memory outside of it is necessary. The question was never whether; it was how much.

## The reviewer who said less

Before writing any code, we handed the plan to a second frontier model in an adversarial role, OpenAI's Codex running GPT-5.6 Sol at maximum reasoning effort, with the operator's priorities in four lines: organization, cleanup of what is legacy, focus on what is necessary, and nothing that touches production. The verdict opened with two words: NO-GO.

The central argument was not that the questions were wrong. It was that the answer had too much surface. A new role on the shared database, a scheduled job reading production, analytical writes on the same physical server that serves the runtime, eight derived tables, dashboards. For a stable system operating real money, each of those items is a purchased risk; the plan had to prove that each one changed some operational decision. Most changed little.

And the specific findings hurt in exactly the right way, because each one was re-verified against the code before being accepted. The market data health metrics the plan proposed to build already existed, exported and with not a single alert rule using them. The comparison between the two monthly budget models, which the plan wanted to recompute in the analytical layer, already ran natively in the daemon, in shadow; reimplementing it would create two truths. The provisioning path the plan intended to reuse could restart the shared production database as a side effect of editing one configuration line. And the image deployed in production was not the branch the plan had analyzed, which downgrades any claim about live behavior to hypothesis.

## The cut

The rewritten plan separated three things the first version mixed. Real-time alerting stays where it already lives, in the existing metrics and rules, because batch is never a protection mechanism: a safety invariant checked once an hour is not an invariant, it is a report. Cold memory became the minimum that fulfills the purpose: two tables, the two that are the system's financial audit, copied immutably to external storage that survives the loss of any server. And the entire analytical layer, the sixteen metrics, the eight marts, the dashboards, left the authorization: it returns when some recurring question proves that alerts and forensic queries are not enough.

The boundaries became a written decision, with the lines that are never crossed: nothing derived from the data ever writes back into the runtime; and the pipeline measures whether Robson did what it promised, never whether it should have entered. Opportunity analysis is not execution analysis, and a risk management system does not become an autotrader by accumulation of dashboards.

## The rehearsal before the request

One honest question remained: are the exporter's queries harmless? Instead of answering with adjectives, we built a fully offline rehearsal. An ephemeral local database, Robson's real schema applied migration by migration, and a synthetic dataset reproducing the worst known case: the pathological one point four gigabyte partition from the era when the event log still stored telemetry. The candidate queries ran under the contract's limits, a five second timeout, tight memory, one connection. The worst case cost two hundred and sixteen milliseconds. The realistic case, seven. The sealed window proved determinism with identical hashes across repeated runs, and a forty kilobyte index was documented as an optional optimization if it is ever needed. The go for the next phase, when it comes, will be a decision with numbers on the table.

## What one day yielded

From the verdict to the end of the day: the boundary decision formalized, the two-table contract published in Robson's repository, the remains of a previous era's data lake prototype removed from GitOps after confirming nothing referenced them, three new alert rules over the metrics that existed uncovered, and two issues naming exactly what cannot be alerted on yet. Not one line of the runtime changed. No new connection touches the database.

## The criterion that stays

A data plan for a critical system is not judged by what it can measure; it is judged by what each measurement changes and what each access costs. The adversarial review did not weaken the plan, it distilled it: what survived fits on a page and every item justifies its own existence. The cheapest data platform is the one you have not built yet, and the second cheapest is the one that shrank until only what a real decision demands remained.
