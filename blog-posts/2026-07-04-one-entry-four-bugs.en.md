---
title: 'One entry, four bugs: a night of production debugging on Robson'
date: '2026-07-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execution, risk, debugging, trading]
excerpt: 'We shipped a new protective layer for the stop engine and used live entries to validate it. The first order was rejected by our own risk gate, by a margin of 0.0000000000000000000002. Three more bugs were hiding behind that one.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-04-one-entry-four-bugs.jpg'
---

Yesterday we shipped the invalidation guard, a new protective layer for Robson's stop engine. To validate it, the operator placed a sequence of real entries in production while an agent monitored logs, events, and the exchange in real time. The first order never reached Binance. The second reached Binance and was rejected. So was the third. The fourth activated cleanly.

Each rejection was a distinct bug. Each bug was invisible until the previous one was fixed. This article documents the chain, because the pattern is more interesting than any single fix.

## The feature: stops need to clear the last extreme

Robson derives its stop from chart structure: the second confirmed swing level on the 15-minute chart. A real BTCUSDT short exposed a blind spot in that rule. The analyzer chose a technical stop at 62,214.70 while a recent high sat at 62,386.70, above the stop. A simple retest of that high would have closed a still-valid trade.

The executable-stop buffer we already had could not fix this. The buffer offsets execution from whichever level was chosen. The problem was which level was chosen. Widening the analyzer's swing index would change the chart model globally, which is worse.

The invalidation guard is a separate post-analysis layer. When enabled, it samples the recent adverse extreme, the highest high for shorts or the lowest low for longs over the last twenty 15-minute candles including the forming one, and clamps the effective stop beyond it. Position sizing pays for the wider distance, so the 1% loss cap holds. If the guard widens the stop past the policy maximum, the entry is rejected instead. The technical rule itself stays untouched, and the guard releases on the first trailing advance.

Three agents implemented it from a reviewed plan, in parallel where the files allowed it. The full workspace test suite, a local end-to-end smoke against a real Postgres, and a code review gated the merge. The smoke alone caught three integration gaps before the code ever reached a cluster.

## Act one: the gate rejected its own sizing

The first production entry was cancelled by Robson's own risk gate: insufficient margin. The numbers in the log were suspicious. The computed initial margin exceeded available capital by 2e-22.

The cause was a Decimal round trip. When a tight stop makes the risk-sized quantity larger than the account can carry at 1x leverage, sizing caps the quantity at capital divided by entry price. The division rounds at 28 significant digits. The risk gate then recomputes margin as quantity times entry price, and that product can land a hair above the capital the division started from. The gate compared strictly and rejected the exact quantity sizing had chosen.

Every margin-capped entry was silently impossible. Nobody had noticed because earlier validations ran with small synthetic capital and wide stops, where the risk-sized quantity never touched the cap. The first real-capital entry with a tight stop found it in minutes.

The fix truncates the margin cap at eight decimal places, finer than any exchange quantity step. With the quantity truncated, the product is exact in Decimal arithmetic and provably within capital. The regression test uses the exact figures from the rejected entry.

## Act two: one hundred percent of the wallet is not executable

With the gate satisfied, the next entry reached Binance and came back with error -2019, margin is insufficient. This time the exchange was the one saying no.

Sizing had capped the position at one hundred percent of the wallet. On a real exchange that order cannot execute. The taker fee is charged against available balance, and initial margin is computed at the mark price with a worst-price cushion, not at the last candle close the daemon used as its sizing reference. Any divergence, and there is always some, pushes the order cost past the wallet.

The margin cap now reserves a configurable headroom, one percent by default, so the exchange's fee and its price cushion fit inside the balance. Only margin-capped entries change. Risk-sized entries were never affected.

## Act three: the ledger is not the wallet

The third entry was rejected with the same -2019, which was the most informative failure of the night. The headroom was working. The numbers were not.

Robson anchors its risk budget to a monthly capital base, a snapshot taken at the start of the month. This is deliberate: governed losses during the month are tracked but do not shrink the 1% per-trade budget. The sizing code, however, was using that same ledger figure as the basis for the physical margin cap. The live wallet was smaller than the ledger by exactly the month's realized loss, about 1.55%. The one percent headroom could not absorb a 1.55% gap, and no fixed headroom ever could.

Two concepts had been conflated. Policy capital answers how much we are allowed to risk. The wallet answers how much the exchange will physically let us hold. The fix separates them: risk sizing keeps the policy capital, and the margin cap now takes the live available balance from the exchange, bounded above by policy capital, fetched at decision time with a safe fallback if the call fails. The fourth entry activated: gate approved, order filled, insurance stop resting on the exchange.

## Act four: the buffer meets the real exchange

With the pipeline proven, we enabled the guard and the ten basis point buffer in production configuration. The restart re-derived the live position's executable stop and immediately found two more bugs, this time in the exchange adapter.

First, the cancel step of the stop replacement failed while parsing Binance's response. The API returns the field code as the string "200" where the client expected an integer. The parse error surfaced after the exchange had already cancelled the old stop, so the replacement aborted between the cancel and the placement. The position was left without its exchange-side protection, with only the software monitor watching it.

Second, once the tolerant path retried the placement, Binance rejected the new stop with error -1111, precision over the maximum. A buffered stop price is a basis-point offset and lands on values like 62,873.86105. BTCUSDT futures accept two decimals.

We told the operator immediately and let them decide about the exposed position rather than deciding for them. The fixes are small and precise. Stop trigger prices are now normalized to the symbol's price precision, rounding away from the position so normalization can never tighten a stop. The response parser accepts both encodings of the code field. On the next rollout, the startup heal re-placed the insurance stop on the exchange, and this time Binance accepted it.

## What the chain teaches

Four production bugs, none of them in the feature we were shipping. All four lived in the margin-capped sizing path and the stop-replacement path, code that had passed every synthetic validation for months. Three lessons survived the night.

Layered failures hide behind each other. There was no test run that could have surfaced bug three while bug one was still rejecting every order before it reached the exchange. Sequential live probing, one fix per failure, each fix merged with a regression test carrying the exact production figures, was the fastest honest path.

Physical bounds and policy ledgers are different objects. Any number that gates a real-world action must come from the real world at decision time. The ledger is for policy. The wallet is for physics.

An exchange response is a contract you should parse defensively. A field that arrives as a string where an integer was promised should degrade gracefully, especially when the code that parses it runs between cancelling a protection and replacing it. The most dangerous parse error is the one that fires after the side effect.

The invalidation guard is now live in production, watching the extremes the chart rule cannot see. It took one evening and four rejected orders to earn that sentence.
