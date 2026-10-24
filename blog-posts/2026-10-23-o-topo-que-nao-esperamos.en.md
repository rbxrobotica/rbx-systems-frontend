---
title: 'The Top We Did Not Wait For: a week of stops, one lesson and the v2.5 roadmap'
date: '2026-10-23'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, risk, entry, product, roadmap, engineering]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-23-o-topo-que-nao-esperamos-v1.png'
excerpt: 'We got the direction right, got the timing wrong four times, and Robson shut the door before the fifth. The reversal came with nobody in the book. What that teaches about entries, about the monthly budget, and about what changes, and what does not, in v2.5.'
slugAlias: '2026-10-23-the-top-we-did-not-wait-for'
---

# The Top We Did Not Wait For

Last week we wrote about reviewing Robson with a position open. This week the story is different: the operator got the thesis right and lost four times in a row, the system shut the door before the fifth attempt, and the reversal he had predicted happened with the book empty. October is still positive. It was still a pity, and worth telling.

## The thesis was right

Between the 18th and the 21st bitcoin climbed from 81 to 84.9 thousand. The operator read, correctly, that the rally was local and would reverse. He sold four times: inside the range that preceded the move, in the middle of the leg up, and one percent below the top with the price still rising. All four stops were hit, three of them ATR fallbacks, with distances between 0.3 and 0.6 percent. Gross loss: 26 dollars. Nothing dramatic; each loss stayed under half a percent of capital.

On Wednesday afternoon the top formed, the 25-hour average was lost on volume, and the price fell 3.4 percent into Thursday. The two arms the operator tried the night before, already near the top, did not fill: the month's budget no longer fit a whole operation.

The natural reaction is to call that bad luck. It was not. When the direction is right and the outcome is four stops, the error is timing and structure, and that is fixable. Looking at the one-hour chart afterwards, none of the four sales had a formed top behind it: there was an extreme, but no lower high and no break of the last swing low. In all four the stop sat above a half-hour high, not above structure. The market needed another four hundred points and a few hours to confirm the top, and took the four positions on the way.

## What the budget did, and what it promises

Robson promises one thing: the month's governed loss never exceeds four percent of the capital base. October peaked at plus 146 dollars. By that promise, the whole budget was available.

What stopped the operator was a different rule, the give-back from the month's equity peak, the high-water-mark model we designed in July. It turns the loss limit into a trailing stop on the month: after a 146 peak, giving back 56 across four trades consumed 82 percent of the cushion and the fifth arm did not fit. The rule did what it was designed to do, it interrupted a streak of identical mistakes. But it did so in the name of a guarantee nobody had promised, and the system's own author was puzzled by the number twice in one week. A central gauge that surprises the person who wrote it has a legibility problem.

The decision, taken in August and now scheduled, is to separate the two. The monthly budget becomes net-from-start: the promise, and only the promise. The streak discipline the high-water mark delivered as a side effect becomes a named, visible mechanism that asks for confirmation after a few consecutive stops instead of removing budget. The model switch happens at the November boundary, not mid-October: changing the ruler after four losses to unlock budget would be changing the measurement in the middle of measuring.

## What the week exposed in the software

Two small product findings came out of the week. First: an immediate arm denied for budget told the operator nothing. It stayed armed, and the daemon retried at growing intervals, up to fifteen minutes, indefinitely. The order would fire the first moment the stop got short enough for the risk to fit, that is, at the worst moment, unsupervised, with the month's last budget. The fix is to deny at the click, with the message on screen: "risk 14.8 does not fit the remaining 12.5". Nothing stays armed, nothing retries later.

The second finding is the counterpart of the first. In the early hours of Thursday the operator opened a long that fit: technical stop under the previous day's one-hour low, the lowest low of thirty hours, 0.3 percent away, nine dollars of risk. Same stop size as the week's sales, with one difference that is the whole lesson: this stop has a place to be. If the market loses the day's low, the local-bottom thesis is wrong and the stop firing is correct. In the four sales, the stop firing said nothing about the thesis.

## Patience is an algorithm

The operator asked the right question: is this solved in software or is it human skill? The split is sharper than it looks. The directional thesis is human, and will stay human. Patience, "wait for the lower high and the break of the last swing low", is a rule about candles, objective, that does not need to become a personality trait: describe it once and let the machine wait. What remains psychological is small and real: accepting a worse price for confirmation. Entering at 83.7 after seeing 84.9 hurts, because it feels like losing one percent. That one percent is what buys a real stop.

## The roadmap, and why it is surgical

Robson v2.5 is consolidated in production with real capital. The stated goal is not to break what works: admission, risk, the two-layer stop and execution do not change. What goes in are read-side and edge changes, in this order:

1. **Switch to net-from-start on November 1st.** The gauge and the card are already model-aware; activation is one row in the database, no restart, with a written runbook, preconditions and rollback.
2. **Denial at the click.** An immediate arm that does not fit the budget gets an error with the reason and leaves no residual position. Below half an operation of budget, the month banner says "budget closed, back on the 1st".
3. **An Analytics screen** next to Treasury: the chart with extremes marked and the structure state in words, where Robson would place the stop right now for each side, with method, confidence and distance, the ATR band, and the month's arms overlaid, denied ones included. This week would show four red dots on the way up, two grey ones at the top, and the whole move after them with nobody inside.
4. **A confirmation checklist in the arm modal**, the three-line version of the screen at the moment of the click: extreme, lower extreme, break, with a mark for each. The human decides the same way, seeing what is missing.
5. **The month's attempt history**: arms, denials with reason, stops, method, distance, outcome. Seeing "fallback, 0.4 percent, minus eight" four times in a row in a list teaches faster than any rule.

All of it is read-only. One analysis endpoint, no new state, no migration, nothing on the execution path.

## What stays for v3: entry

The real decisions about entry stay for v3, and are open on purpose. Robson once had four entry policies: immediate, confirmed trend, confirmed reversal and confirmed key level. Immediate is what is left, and the trend one is a moving-average cross. The policy this week asked for, a formed top or bottom, is confirmed reversal with a precise definition: an extreme, a lower extreme, a break of the swing low between the two, entry on the break or the retest, stop above the second top, expiry if the formation never comes.

The road to it goes through a "watch mode": the operator records the thesis, the detector observes and notifies when the formation confirms, and the arm remains a human click with the preview filled in. Only after observation has said "top formed" at the right hours for a few weeks does the rule become a policy that executes. The fallback ladder, looking for the level on the one-hour chart before falling back to ATR, and the streak brake sit on the same list. Full autonomy exists as a horizon, not as an intention; the product is a human operator with guardrails they understand.

October closes with a profit. The predicted reversal was missed. Both are true at once, and the second is November's work.
