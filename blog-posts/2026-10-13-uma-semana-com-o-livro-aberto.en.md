---
title: 'A Week With the Book Open: What Reviewing Robson Taught Us'
date: '2026-10-13'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, risk, observability, event-sourcing, operations, engineering]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-13-uma-semana-com-o-livro-aberto-v1.png'
excerpt: 'We reviewed Robson with a real position open, fixed six defects in three days and shipped seven deploys without touching the trade. What we found says more about evidence than about code.'
slugAlias: '2026-10-13-a-week-with-the-book-open'
---

# A Week With the Book Open

The month turned. Robson's operator had run a handful of operations in October, one of them still open, and asked for a review. Not a code audit in a lab: a review of the system as it stood, with real money in a position and the daemon running.

That condition changes the method. The first source of truth was not the repository but the daemon's own public read endpoints: position state, monthly budget, metrics. The code came second, to explain what the numbers showed. Where the two disagreed, the number won the argument and the code got an issue.

Three days later there were six fixes, seven deploys and fourteen backlog items. No deploy touched the open trade. This post is about what the review found, and what it teaches anyone who runs systems that cannot stop to be repaired.

## A memory leak hiding in an audit event

The daemon had been killed for running out of memory in August. The incident was on record, cause open: the process grew from 50 to 512 MiB in about 55 hours, and only while a position was active.

The cause was an audit event. Every trade received from the exchange produced a tick record, dozens per second in busy moments. That record went to the event log, as designed, and also into an in-memory vector that nothing in the runtime ever read. When the WebSocket feed went live months earlier, the tick rate rose roughly a hundredfold, and the documented assumption of "seventy thousand rows a month" became seventy thousand an hour.

The fix has three parts: the vector no longer retains that event type, emission is limited to one tick per position every twenty seconds without dropping any tick that accompanies an exit or a stop advance, and the dashboard feed no longer shows ticks. The lesson is easy to state and easy to forget: audit telemetry is not free, and a change of transport can invalidate a volume assumption without anyone revisiting it.

## A budget that only saw the past

Robson caps monthly loss at 4% of the capital base, measured as give-back from the month's equity peak. The peak includes unrealized profit on open positions. The implementation, however, valued the open position at the price recorded on the last stop advance, not at the market price.

While the daemon keeps running the effect is subtle: the peak rises in steps and intra-trade give-back never shows. On a restart, the recorded price falls back to the entry, the month's equity collapses to the realized figure, and the dashboard shows a give-back that never happened. During the review this reached 83% of the budget with zero free slots while the open position was at its best. Twelve dollars more at the peak and a restart would have halted the month on a profit that was on screen.

The fix marks the open position at the last price received from the market. After the deploy, give-back fell from 83% to 10% ten seconds after the process came up. The lesson: a number derived from a snapshot taken at the wrong moment is not stale, it is wrong, and the difference only shows when the system restarts.

## The stop that did not follow

When the stop advances, the daemon places the new order on the exchange and then cancels the old one, in that order, so it is never unprotected. If placement fails, the old order stays live and the failure is recorded. So far, correct.

The problem was an idempotency key. The stop advance was recorded as emitted even when the exchange leg failed, so the engine never tried again. The exchange order could sit a full rung behind the software stop until the next advance or a restart. With the daemon up, no loss; with the daemon down, one span of exposure.

The fix remembers the position and repeats the placement with a minimum thirty-second interval until the exchange accepts it. The lesson: idempotency protects against repetition, but it also hides failure, and the key has to represent the outcome that matters, not the intent.

## What the dashboard did not say

Three findings were visibility only, and none was small.

The connection badge opened on "STALE, reconnecting" on every page load, because the client only told the interface about reconnections, never the first connection. Four exchange income items with no matching position were silently blocking the automatic capital-base recalibration; the counter existed in the API and nobody rendered it. And two consecutive arms received ATR fallback stops, at 0.15% and 0.26% of price, on a quiet Saturday. The first was stopped out by noise 25 seconds after the fill. The system did exactly what the policy says; the operator had no way to see which policy was in use.

Today the card shows the technical stop's method and confidence and a rung line for the trailing ruler, and the dashboard surfaces pending income items. None of this changes a decision the engine makes. All of it changes the decision the operator makes before confirming an arm.

## Merge is deploy, and the path has to be verified

In Robson, merging to the main branch publishes the image and restarts the daemon. That is deliberate and documented. Two process stumbles showed that the path has to be verified before it is used.

The image promotion step edited a file that had become a placeholder weeks earlier. The next backend merge would have deployed nothing, and nothing would have said so. It became the first PR of the sequence. And a PR stacked on another was merged into its base branch instead of main, because the base was not deleted after merge and the platform did not retarget it. That cost an hour and a replacement PR.

The rule that stuck: delete the branch on merge, avoid stacks, and treat backend deploys as restarts with an open position, which are safe because the protective order lives on the exchange, but are restarts.

## What stayed open

Part of what the review found is policy, not defect, and should not be fixed in code: whether a fallback stop should require human confirmation; whether orphaned commission items should veto recalibration from a confirmed transfer; whether the read endpoints should stay public. Those became issues with the evidence attached, to be decided without hurry.

The review also left a simple measure of maturity. Before it, the hypothesis that the daemon leaked memory was a guess in a commit message. After it, it is a named mechanism with a cause, a fix and a production checklist. The difference between the two is not the model that wrote the code. It is having looked at the system with the book open.
