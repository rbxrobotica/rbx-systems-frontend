---
title: 'The retest that did not stop us: live-fire validation of the stop buffer'
date: '2026-07-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execution, risk, stops, trading]
excerpt: 'Two shorts on the same symbol, hours apart. One exited above the recent high exactly as designed. The other watched price tag 63,450 — past the level that used to be the stop — and stayed alive. Between them we found a number that lied and a risk rule nobody had ever adopted.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-04-the-retest-that-did-not-stop-us.jpg'
---

Yesterday we shipped the invalidation guard and spent a night pulling four bugs out of the sizing and stop-replacement paths. This is the follow-up: today the layered stop met the market twice, and both encounters went exactly the way the design says they should. Getting there required fixing a number that lied on the dashboard, deleting a risk rule that no policy document had ever adopted, and killing our second hot loop in two days.

## The number on the card was not the stop

The first short of the day activated with the card reading `stop 62,984.17`, visibly below the recent high of 63,069.60. For a short, a stop below the level that invalidates the trade is exactly the failure the guard was built to prevent. Had it silently regressed on its first day?

It had not. The repeating decimal gave the real story away: 62,984.1666... is an arithmetic mean. The technical analyzer clusters nearby swing highs within half a percent — about 314 dollars on BTC at these prices — and represents the cluster by its average, which by construction sits inside the resistance zone, below its top. That mean is the conceptual reference the trailing ladder anchors to. It was never the executable stop.

The executable stop lived where it should: the guard had sampled the recent extreme at 63,069.60, the ten-basis-point buffer pushed execution to 63,132.67, and the insurance order was resting on the exchange at exactly that price. When the market broke the high for real, the position exited at about 63,162 — above the peak, a legitimate invalidation, not a retest scalp.

The defect was presentation. The card rendered the conceptual number and hid the executable one, so a correctly protected position looked broken. The fix ships the executable stop to the card, with the guard level as context while it binds: `stop 63,132.67 (guard 63,069.60)`. An operator acts on what the screen says. The screen must say the number that fires.

## The rule nobody wrote

Re-arming after that stop-out produced silence. No entry, no error on the card, just an Armed position that never activated. The logs were less quiet: the risk gate was denying the entry once per second.

The reason: a daily loss limit of 1% of capital. Our policy has no such rule — it never did. The written policy is one percent worst-case loss per operation and a four percent monthly drawdown budget, and the canonical document says in so many words: there is no daily loss limit. The check existed in code anyway, documented months ago as structurally inactive because its inputs were zeroed. Then someone wired real daily PnL into the risk context, and the dormant rule woke up. One budget-sized stop-out and the system refused to trade until midnight UTC.

There is a name for this failure: spec-versus-code drift. A rule nobody adopted is still a rule if it is in the code path, and it will enforce itself on the first day that matters. We removed the check, its plumbing, and its test fixtures, and left a regression test asserting that a 1.2% same-day loss is approved while the monthly budget has room.

The one-per-second part was its own bug, the second hot loop this week. A governed denial re-armed the detector; in immediate mode the fresh detector fires proactively at once; the denial was persistent. Eighty-four denials in ninety-two seconds, each fetching a hundred candles and writing lifecycle events. Governed re-arms now back off exponentially, five seconds doubling to a fifteen-minute cap, reset the moment a signal clears the gate. While diagnosing the treasury screens we found the same pattern a third time: a funding saga whose five-second resume loop had appended four thousand duplicate events during a stalled transfer in June. Same fix, same lesson — a retry without backoff, or a retry that writes on every pass, is a denial-of-service you run against yourself.

## The retest

With the phantom rule gone, the operator re-armed. The entry cleared the gate on the first attempt: short from 63,145.20. This time the analyzer's technical stop landed exactly on the recent high at 63,420.00 — the guard did not even need to clamp — and the buffer placed execution at 63,483.42, ten basis points beyond the level every chart reader can see.

Then the market did the thing this entire design anticipates. Price ran to 63,450: thirty dollars past the high, thirty-three dollars short of our stop. The old system — the one from two days ago, stop parked on the obvious level — gets taken out on that wick. Ours watched it happen and kept the position.

That is the whole thesis of the layered stop in one candle. The technical level is where the trade is invalidated conceptually. The obvious level is where resting liquidity gets swept. Execution belongs a measured offset beyond the second, priced into position sizing so the one-percent cap still holds, enforced both in software and by a reduce-only order resting on the exchange.

## What today adds to yesterday

Yesterday's lesson was that four bugs can hide behind one feature. Today's is quieter and worth stating plainly.

Show the number that fires. Any gap between what the system does and what the operator sees will eventually be paid for in either panic or misplaced trust. Ours cost an hour of investigation to prove the system right and the screen wrong.

Delete rules you did not adopt. Documentation that says a check is inactive is a promise that someone will one day activate it by accident. If the policy says the rule does not exist, the code must agree.

And validation is not a green test suite. It is the market touching 63,450 while your stop sits at 63,483.42, and the position still being there when the candle closes.
