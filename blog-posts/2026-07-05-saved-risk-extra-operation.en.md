---
title: 'Saved risk becomes an extra operation'
date: '2026-07-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, risk, product, policy, trading]
excerpt: 'Robson guaranteed 4 operations per month. Now each entry is charged its actual risk, and leftover budget becomes another chance to trade. Here is the math.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-05-saved-risk-extra-operation.jpg'
---

Since the first version of its risk policy, Robson promised 4 new operations per month. The number was not arbitrary: the monthly loss budget is 4% of the capital base, and every operation carries a 1% maximum-loss cap. Four is one divided by the other.

That arithmetic assumed every operation cost the full cap. It no longer does. ADR-0043, published this weekend, changes the admission rule: each entry is now charged the actual risk it carries, and the budget it saves becomes capacity to trade again. The floor of 4 chances per month remains guaranteed. What changed is that it became a floor, not a ceiling.

## Where the 4 slots came from

Robson sizes positions from a technical stop derived from chart analysis. The distance to the stop, plus execution costs, determines the size: if the stop fills, the loss stays at or below 1% of capital. With a 4% monthly budget and 1% per operation, the month held 4 worst cases.

The risk engine already tracked real budget consumption. An operation stopped out at a 0.6% loss debits 0.6%, not 1%. A trailing stop that advances to breakeven zeroes the position's latent risk and returns budget. But the entry gate stayed pessimistic: to admit a new operation, the system required a full 1% of budget to remain, because at counting time the next trade's stop did not exist yet.

## What the old rule wasted

That pessimism had two concrete costs.

The first was the tail of the budget. On a capital base of 10,000 USDT, the monthly budget is 400 USDT. If the month consumed 320, 80 remain: less than one full risk unit. The old rule denied any new entry, even one whose worst case cost 60.

The second was more aggressive. The monthly halt circuit fired when the remaining budget dropped below one full unit. With 99 USDT of live budget, the system ended the entire month: it closed positions and blocked entries until the calendar turned. Real budget sat on the table protecting no one.

Meanwhile, the entry rules evolved. As we documented in the [previous article](/blog/2026-07-03-stops-that-survive-failures), position sizing started pricing the realizable worst case: stop distance, gap allowance, and round-trip fees, all inside the 1%. In practice, margin limits and exchange filters push the planned risk of many entries below the cap. The system knew each operation's real risk before admitting it and chose to ignore that information.

## The decision: charge the actual risk at entry

ADR-0043 replaces the pessimistic reservation with exact charging:

```
remaining_budget = monthly_budget - realized_losses - latent_risk
admit the entry if remaining_budget >= planned_risk
```

The planned risk is the same number the sizing computes: the per-unit loss on the worst path, multiplied by the order's final quantity. No new estimate enters the system. The gate now uses a value that was always available one step before it.

Two engineering details are worth recording. First, an operation that reaches the gate without a priced risk reserves the full 1% cap, the old behavior. The fallback is conservative by construction. Second, the first test run denied every entry: on the risk-sized path, quantity is the budget divided by the per-unit loss, and decimal rounding of the quotient pushed the multiplication back a hair above the cap. The planned risk is clamped to the cap at the source, because the sizing guarantees the limit by construction and the excess was a rounding artifact, not risk.

## What does not change

The policy invariants stay intact:

- The 1% per-operation cap remains. Planned risk above the cap is never admitted, under any budget.
- The 4% monthly limit remains hard. Since latent risk is charged at admission and already priced with costs, a sequence of stops cannot breach the budget.
- No new limits enter. No cap on entries per day, no cap on operations per month. The budget is the only constraint, by explicit product decision.

The monthly halt gained more honest semantics: it fires when the budget actually reaches zero, not when the remainder drops below a hypothetical worst case. An operation that does not fit what is left gets denied, and the detector re-arms with the standard backoff. The month stays alive for smaller opportunities, or for the budget that stops advancing to breakeven set free.

## The floor is still 4

The minimum promise is arithmetic: 4% divided by 1% guarantees 4 worst cases per month, always. The slot counter on the dashboard now shows exactly that, the guaranteed minimum of full-cap entries that still fit. It is a floor for quick reading, not an operating ceiling.

The product promise now reads: at least 4 chances per month. Saved risk becomes an extra operation. Everything above 4 is earned by entries that risked less than the cap, under the same monthly limit as always.

## What stays

The pessimistic reservation was the right decision while the system did not know the next operation's risk at counting time. Once the pipeline priced the real worst case before the gate, keeping the reservation became waste, not prudence. Charging the worst case twice protects no one twice.

As in the previous cycle, the decision was recorded in an ADR before the code, implemented with agent-assisted engineering, and reviewed line by line before merge. The 4% monthly limit remains the invariant no optimization may touch. Inside it, every saved basis point now has somewhere to go.
