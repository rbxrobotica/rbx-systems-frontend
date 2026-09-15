---
title: 'One ruler'
slugAlias: '2026-08-04-one-ruler'
date: '2026-08-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, risk, adr, robson, reliability]
excerpt: 'The operator looked at a screen and asked a one-line question: why is the stop three times farther than the first target? The answer exposed two rulers living in the same system, an environment variable that turned one binary into two products, and ended in the largest engineering effort on Robson since the Rust rewrite. Including the day the fix was nearly worse than the defect.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-04-uma-regua-so-v2.png'
---

In the morning, we told the story of the missing slot: a dashboard number that was right by the wrong rule. In the afternoon, the same operator, looking at a real position, asked the day's second one-line question: why is the stop distance three times the distance to the first target?

The question sounds cosmetic. It is not. In a risk system, distances are the policy itself.

## Two rulers

Robson is built around a concept called the span: the technical stop distance at entry. It is the unit of everything. The trailing stop does not slide continuously behind price; it moves in discrete steps of one span. Every target on the dashboard is the trigger for the next step. The first step locks the exit near the entry price. One unit of risk, movement, and decision.

The investigation showed there were two units. The step ladder moved on the raw technical level's ruler. The executable stop, the one that actually fires on the exchange, was composed on top: a deeper structural level when the analysis called for it, plus an entry-time guard, plus the buffer. On the position that motivated the question, that composition added up to almost three spans. On the next position, same day, barely more than one. Geometry varied arm by arm, and the money at risk was measured with one ruler while the steps moved by another.

## The buffer is not a distance policy

The operator's philosophy for the buffer is precise: it exists only to avoid the stop-hunt pattern, orders resting exactly on the technical point where everyone placed the same order. A small nudge past the level, nothing more. The buffer must not alter distance policy; and if the position's real risk includes the buffer, then the ruler for everything has to include the buffer.

That sentence became the versioned decision: the span is now the distance from entry to the executable stop, computed once at entry admission, written to the event log, and immutable for the life of the position. A process restart, a configuration change, an exchange metadata refresh: nothing re-derives the number. Replay reads what was written. Ladder, targets, reserved risk, and sizing now share that single measurement.

## One Robson

Along the way, a second decision. Stop derivation was selectable by environment variable, a rollout mechanism that was never actually used. The operator vetoed the concept: deployment configuration must not define which product is running. The variable was removed, the never-used value was deleted, and before deleting it we proved, with queries against the event log of every environment, that the value had never been persisted anywhere: zero occurrences, evidence versioned alongside the decision. From here on, risk-behavior changes happen only through a written, reviewed decision. Old positions keep the stamp of the policy that created them, forever, and are managed by it until they close.

## The review that earned its day

The implementation went through three cycles of adversarial review, with two frontier models in opposing roles: one implementing, one attacking. The reviewer rejected the first version with a fine-grained finding: naively swapping the ruler could not work, because the ladder rebuilt the technical stop and the resolver applied the buffer again on top. The exact mechanics had to be specified step by step, with the rule that the buffer is applied exactly once, by a single resolver, on every surface.

The second cycle caught what we most want to tell. The fix for one finding created a defect worse than the original: if the system could not price the risk of a position, because of a transient network failure on a metadata call, the new logic latched the monthly halt and market-closed the entire book. The reviewer caught it in the closure pass, before any merge. The rule that got written down: when the system cannot price risk, it stops accepting new risk; it never destroys the protection that already exists on the exchange. Blocking entries is prudence; liquidating out of uncertainty would be software turning a doubt into a loss.

The same cycle produced the other defenses: the new binary refuses to start against an old schema, instead of coming up blind with an invisible book; a real fill is never left without a protective stop, even if the persisted evidence is corrupt; and reading status writes nothing anywhere.

## What changed, measured

Five commits, dozens of files across domain, engine, daemon, database, and interface, eight hundred and seventy-nine tests green including the real-database ones, and a live position that crossed the deploy untouched, managed by the policy it was born under. The first arm under the new ruler will show on the dashboard what the philosophy always demanded: stop one span from entry, first target one span from entry, the same span.

## The rule we keep

Yesterday we wrote that a number on a risk dashboard is a contract. Today, the complement: a contract is measured with one ruler. When the price on the screen, the reserved risk, the ladder step, and the order on the exchange are the same measurement, the whole system can be audited with one question: what is the span? If the answer needs two rulers, there is still work to do.
