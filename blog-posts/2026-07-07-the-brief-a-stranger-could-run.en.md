---
title: 'Engineering update: the brief a stranger could run'
date: '2026-07-07'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engineering, reliability, agents, trading]
excerpt: 'A reconciliation fix led to a second bug nobody asked to find, and the next chapter shipped as a brief written for an agent with zero memory of the day. It ran anyway.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-07-the-brief-a-stranger-could-run.jpg'
---

Sunday's post [closed with a promise](/blog/2026-07-06-fallback-debuts-in-production): the typed income ledger, completing the rule that money without an explanation never enters the books on its own again. This is the update on how that promise shipped, and it starts somewhere else entirely.

## A second bug found by auditing the first

The day opened with a stuck reconciliation: a position closed for real on the exchange, but the software never learned about it, because the evidence-lookup window kept re-anchoring to "now" on every retry and could never look far enough back to find the real closing trade. The fix was small, a few lines removed from a cleanup path that was clearing state it should have left alone. Tests passed, the fix shipped, the position resolved.

Nobody asked for what happened next. After the deploy, a routine sanity check on the freshly restarted position turned up a quantity that did not match the exchange. Not a display bug: the stored value itself had drifted, larger than what the exchange actually held. The trail led to a second, unrelated defect: the handler that records a fill updates price and stop, but had never been taught to overwrite the _requested_ size with the _real, exchange-confirmed_ one. Whenever the exchange trimmed an order to its minimum step, which it does routinely, the difference stuck around forever, silent until a restart reloaded it. Also fixed, also tested against a real database before merge, red before the fix and green after.

Two bugs in one morning, and the second only surfaced because the first fix got audited instead of trusted.

## Verifying instead of assuming

Later, a sharp price swing raised an obvious question: did the trailing stop react correctly? The honest answer required pulling the real candles and running them through the actual formula, a discrete-step model that only advances in full increments anchored to the entry price, never to the latest peak. The swing never completed a single step. No action was the only correct action, and the model said so before anyone had to guess.

A smaller moment from the same hour is worth keeping. A log search for the position monitor's activity came back empty, which looked exactly like an outage. It was not: the monitor writes to the event log under a name that never appears verbatim in the process logs. The event log itself told the real story, ticking every few seconds the whole time. The lesson generalizes past this one search: when a quick check and a system's source of truth disagree, trust the source of truth, and say so plainly when your first read was wrong.

## Writing for a stranger

With the incidents closed, the income ledger was next, and it was deliberately not written in the moment. It became a mission brief instead: a self-contained document assuming the reader remembers nothing about today.

That constraint changes what a brief has to contain. Not the design decision alone, but the current, verified shape of the code around it: which file already carries too much weight for another addition, which existing module shares a name with the new concept but means something unrelated, which linkage field the exchange's real records use, confirmed by reading one live response instead of trusting a template of what the documentation said it should look like.

## The stranger turned out to be five minutes away

The brief was written for anyone. It got handed to a fork of the very conversation that had spent the morning on reconciliation and quantity bugs, branched off to carry the heavy, iterative part of the work in isolation: compiling, testing, fixing, testing again. The parent conversation stayed clean and available for the next question while that happened in the background.

The self-containment discipline paid off either way. Its value was never about saving a re-explanation. It is about forcing every assumption into writing where it can be checked before code gets written on top of it.

## Step zero paid for itself immediately

The brief's first instruction was not "write the types." It was: read one real response from the exchange's income endpoint before writing a single one. That single read surfaced something no amount of design discussion would have: the open position had already paid funding charges, small ones, with zero attribution anywhere in the system. Not a hidden cost by policy. A blind spot nobody had looked at, made visible by the one action every plan for this feature should have started with.

## What shipped

A ledger that reconciles item by item against the exchange's typed income records instead of comparing wallet totals. Funding charges get recognized for the first time. Transfers remain the only category allowed to adjust the books automatically, and only when they explain the entire difference. Everything else becomes a named, visible alarm, never a guess absorbed quietly into the numbers. Nine tests, one for each documented failure mode, checked against a real database before merge. Shipped, deployed, and confirmed live within the hour.

## What stays

One morning, two bugs found by refusing to trust a green test suite, one live incident closed by reading a source of truth instead of a search result, and one feature shipped from a brief that assumed nothing and got run by whoever showed up first. The pattern holds regardless of who executes: state what you verified, name what you did not, and let the next reader, human or not, check your work instead of your word.
