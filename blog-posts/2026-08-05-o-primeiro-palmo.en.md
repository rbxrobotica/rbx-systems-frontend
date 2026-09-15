---
title: 'The first span'
slugAlias: '2026-08-05-the-first-span'
date: '2026-08-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, risk, adr, robson, reliability]
excerpt: 'Yesterday we told the decision: one ruler for all of risk. Today it debuted in production, on a real position. This post checks the geometry number by number, walks the two seconds of events between the signal and the protective stop, and explains why the position size went down when the span went up.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-05-o-primeiro-palmo-v2.png'
---

Yesterday we published the decision: a position's span is now the distance from the entry reference to the executable stop, computed once, written down before any order, immutable for the life of the position. Trailing ladder, targets, reserved risk, and sizing, all on the same measurement.

Today the ruler debuted. The first position armed under the new policy is live in production, and its dashboard is the demonstration the philosophy demanded.

## The geometry, number by number

The signal's entry reference was 64,633.50. The persisted span: 850.40. And so:

- Executable stop: 63,783.10. The reference minus the span. One span below.
- First target: 65,483.90. The reference plus the span. One span above.
- Stop after the first step: 64,633.50. The reference itself.

Complete symmetry. The stop sits at the same distance as the first target, and the first full span in favor locks the conceptual stop exactly at the starting point. Anyone with a calculator can audit the entire dashboard with one subtraction. There is no hidden ruler anymore: the question "what is the span?" has one answer, and it explains every number on the screen.

## Two seconds, eight events

Between the signal trigger and the protective stop resting on the exchange, about two seconds passed. The event trail, visible on the dashboard itself, tells the sequence: position armed, entry policy resolved, technical stop analyzed, admission evidence written, order requested, accepted, filled, protective stop placed.

The order of those lines is the serious part. The admission evidence, carrying the span and the resolved stop, is durably written **before** the order touches the exchange. If the process dies between any two lines, recovery finds a known state: either there is no order and nothing was lost, or there is an order whose complete plan is already in the log. Numbers first, side effects second. It is the difference between a system that explains itself and one that apologizes.

## The size went down, and that is the contract

Previous positions traded 0.024 of contract; this one opened with 0.015. Not situational caution: this entry's span was wider, and admission prices the full worst case, trigger distance plus execution costs, under the same ceiling as always. Wider span, smaller size, constant planned risk. Position size is an output of policy, never an opinion.

## Two eras, one trail

Hours before the debut, the last position of the previous era closed at its own stop, and the month recorded the loss in the governed ledger, in plain sight on the dashboard. It was born under the old derivation and was managed by it to the end, because a position carries the stamp of the policy that created it, forever. The new one was born under the new policy. The two eras coexist in the same event log, each auditable by its own rules, with no retroaction.

And with the first new arm, we crossed a boundary the decision had already drawn: from that moment, the release is forward-only. The system records the moment its history changed, and does not pretend it can undo it.

## The rule we keep

The test of a ruler is being able to ask one question and receive one number. Yesterday we wrote that if the answer needs two rulers, there is still work to do. Today the answer took one: 850.40. The rest of the dashboard is consequence.
