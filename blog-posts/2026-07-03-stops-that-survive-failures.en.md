---
title: 'Stops that survive failures: redesigning the execution layer of Robson'
date: '2026-07-03'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execution, risk, reliability, trading]
excerpt: 'A trade closed 48% above the risk cap while the daemon was down. The investigation produced two ADRs, five production fixes, and a Binance API surprise. Here are the numbers.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-03-stops-that-survive-failures.jpg'
---

In June, a Robson trade closed with a loss of 1.48% of the capital base. The policy cap is 1% per trade, no exceptions. Worse: the analysis showed that this trade should have closed at roughly breakeven.

Investigating that single trade produced two ADRs, five production fixes, and a Binance API surprise we caught live, fourteen seconds after opening the next position. This article documents the architecture decisions and the real numbers.

## The incident: a stop that only existed in a process's memory

Robson is an execution and risk engine for leveraged markets. It does not decide what to trade. It guarantees that once a trade is decided, the loss is bounded: position size derives from the distance to a chart-derived technical stop, calibrated so that a filled stop costs at most 1% of capital.

On June 28, a long BTCUSDT position entered at 59,696.90 with a technical stop at 58,888.00. The size was computed correctly. What happened next was not:

- The daemon crashed with a stack overflow and stayed down for 45.4 hours with the position open.
- During the gap, price completed a full span of profit. The trailing stop had legitimately advanced to breakeven at 59,696.90.
- Price then fell through that level. Nobody was there to act: the stop was enforced by software, and the software was dead.
- On restart, recovery replayed the gap candles, rebuilt the trailing stop correctly, and exited at market at 58,614.50. That is 1,082.40 below the stop a healthy exit would have enforced.

Realized loss for the month: 1.48% of the capital base, fees included. A trade worth zero became the full loss because protection depended on a process being alive.

## Decision 1: availability must never be a precondition for bounded loss

The obvious fix would be hardening the daemon. We did that: larger worker thread stacks, removal of the only async recursion in the codebase, and a fix for the bug that made a restart skip the monthly risk reset. But process reliability has a ceiling. Deploys happen. Nodes fail. Networks partition.

ADR-0039 established the principle that is now a written invariant of the project: daemon availability must never be a precondition for bounded loss. In practice, the stop now has two independent layers:

- The software monitor remains the primary exit path. It is the smart layer: discrete trailing, per-tick audit, coordinated cancellation.
- A reduce-only conditional order now rests on the exchange itself, at the same chart-derived stop price. It is the dumb and indestructible layer: if the daemon dies, the exchange executes on its own.

Whichever fires first wins, and the system cancels and reconciles the other side. Reconciliation closes the loop: insurance stop fills only close positions with real execution evidence, never with estimates. And the orphan-order sweep fails safe: a protective order with no recorded owner, on a symbol where an active position has no linked stop, is kept and flagged, never cancelled. Cancelling a live protection is the worse error.

## Decision 2: 1% is a worst-case cap, not a target

The old sizing solved the wrong equation. It sized the position so that the loss at the exact stop price equaled 1%. Fees and slippage stayed outside the math, which mathematically guaranteed that every filled stop breached the cap.

The new formula prices the worst realizable case:

```
size = (capital × 1%) / (stop_distance + gap_allowance + round_trip_fees)
```

Numbers from the first trade sized this way in production: a 16.43 USDT budget, a stop distance of 695.90, a gap allowance of 62.18 (10 basis points of the stop), and estimated fees of 61.83. Result: 0.020037 BTC, truncated to 0.02 by the lot step. If the stop fills, the total loss lands inside the budget instead of above it.

The position gets slightly smaller. That is the price of turning the 1% from an average into a limit.

## The surprise: the exchange changed its API, and the design absorbed it

Fourteen seconds after opening the first position under the new design, the insurance stop placement failed with Binance error -4120. Since December 2025, conditional orders on USD-M futures have moved to the Algo Order API, and the traditional endpoint now rejects them.

Two things are worth recording. First, the fail-safe worked as designed: the failure became an audit event, the position stayed protected by the software monitor, and nothing blocked the flow. Second, the fix shipped the same day, and the startup healing mechanism placed the missing order automatically on the position that was open, with no manual intervention.

The conceptual detail matters: a conditional order never enters the order book. It is a trigger the exchange watches, creating the real order only when price crosses the level. The final architecture has three watchers of the same price: Robson's monitor, the exchange's conditional engine, and reconciliation auditing both with real evidence.

## Decision 3: optimize fees where waiting is free, never where waiting is ruinous

With fees inside the risk budget, they became an engineering target. Every Robson order is a market order and pays the taker fee on both legs. On the operated account that is 0.10% per fill: the pilot trade paid 1.23 USDT on entry against a 1,229 USDT notional.

The two legs are not symmetric:

| Leg | Cost of not executing | Correct fee |
| --- | --- | --- |
| Entry | Zero. A missed opportunity, never a loss | Maker, worth waiting for |
| Stop | Unbounded. This is the leg that bounds the loss | Taker, non-negotiable |

ADR-0040 proposes maker-first entries: a post-only limit order at the top of the book, repriced on a fixed interval, with a market escape when a time or price-drift budget is exhausted. Stops and exits remain market orders forever. That asymmetry became a written rule: fee optimization is only permitted on legs where non-execution is free.

Sizing does not change: it keeps assuming taker on both legs, because the 1% cap holds on the worst path, which includes the escape. Savings show up as lower realized cost, never as a larger position.

## The numbers at scale

Maker-entry savings are linear in volume. With a 0.10% taker fee and a typical 0.02% maker fee, the entry leg drops by 80%, cutting round-trip cost by 40%:

| Monthly traded volume | Fees today (0.20% round trip) | With maker entry | Annual savings |
| --- | --- | --- | --- |
| 25k USDT | 50 USDT | 30 USDT | 240 USDT |
| 200k USDT | 400 USDT | 240 USDT | 1,920 USDT |
| 1M USDT | 2,000 USDT | 1,200 USDT | 9,600 USDT |

But the value hierarchy is honest: the biggest saving of this cycle is not about fees. The June incident cost 1.48 percentage points of capital in a single event that the new design eliminates by construction. A full year of fee optimization does not pay for one stop that nobody executed.

## What remains

Three principles came out of this cycle and are now written invariants of the project:

- Availability is never a precondition for bounded loss. Protection lives on the exchange; intelligence lives in the software.
- Risk caps are worst-case. If the math does not close with fees and slippage inside, the math is wrong.
- Asymmetry decides where to optimize. Waiting is free on entry and ruinous on exit, and the code treats the two legs accordingly.

The whole cycle, from forensic diagnosis to verified production deploy, was driven by agent-assisted engineering under line-by-line human review, with decisions recorded as ADRs before code. The incident cost 1.48% once. The invariants remain.
