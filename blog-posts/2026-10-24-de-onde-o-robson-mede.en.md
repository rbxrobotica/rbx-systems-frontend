---
title: 'Where Robson Measures From: the first rung is not what it looks like'
date: '2026-10-24'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, stop, execution, product, engineering]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-24-de-onde-o-robson-mede-v1.png'
excerpt: 'The first rung of the trailing stop moved up and the trade was still 111 points under water. It was not a bug: three different prices were playing three different roles, and the dashboard showed only two of them.'
slugAlias: '2026-10-24-where-robson-measures-from'
---

# Where Robson Measures From

On Thursday the Robson operator opened a bitcoin long, watched the first rung of the trailing stop move up two minutes later, and asked: "I thought one rung already made the trade free; why is the stop still below my entry?" It is a good question because the answer was not on the screen. It was in the code and in an ADR, and it involves three prices that look like one.

## The three prices

**The low.** It is a price of the chart, not of the operator. When a position is armed, the stop analyzer fetches a hundred fifteen-minute candles, finds the local lows and picks the n-th one below the entry, walking deeper if the chosen one falls outside the allowed distance band. The technical stop is placed exactly on that level, no discount. That Thursday the low was 80,888.90, the lowest of the previous thirty hours. It is where the thesis dies: if the market loses that low, the long was wrong.

**The reference.** It is the price Robson uses to run the analysis: the close of the last completed fifteen-minute candle at arm time, 81,070.20. From there to the low is 181.30 points, and that is the technical distance. The low cannot be its own reference: the distance would be zero and there would be no way to size the position or price the risk. Some other end has to exist, and Robson uses the one it already knows before sending any order.

**The fill.** It is what the operator paid: 81,135.50, sixty-five points above the reference, because between the candle close and the market order the price had already moved.

## The ladder is drawn on the reference

From the technical distance Robson builds the rung, the span: 181.30 plus the exchange buffer, which would be ten basis points of price but is capped at a quarter of the technical distance, 45.40. Span of 226.70. Triggers sit at reference plus one, two, three spans: 81,296.90, 81,523.60, 81,750.30. And each rung's stop is its trigger minus one span, that is, reference plus zero, one, two spans.

Hence the surprise. On crossing the first trigger, the stop went to 81,070.20, the reference. For someone filled at the reference that is the exact breakeven, and the ADR that defines the ladder says so in plain words: the first span "moves the technical stop to the entry reference". But the operator was filled sixty-five points higher, and the exchange still applies the 45-point buffer below. Result: a real stop at 81,024.80, 111 points under his money. Breakeven against his wallet only came at the second rung, with the stop at 81,296.90, 161 points above the entry. The same ADR already warned: this is a technical breakeven, "not a guarantee of executable or economic breakeven after buffer, gap and fees". What was missing was for that to be visible to the person operating.

## Why not anchor on the fill

The obvious objection: anchor the ladder on the price paid, and the first rung becomes a real breakeven. There are three reasons not to do that today, and they are the same ones holding up the rest of the system.

Size and risk are decided before the order exists. Robson sizes the position from the technical distance, checks that the planned risk fits the month's budget, and only then sends the order. If the distance depended on the fill, the size would depend on something that has not happened yet.

The insurance stop is placed on the exchange at the instant of the fill, with the span already fixed. It is the first layer of protection, the one that fires even if the daemon dies. It needs a ready number, not one to be recomputed after the position already exists.

The preview and the arm give the same answer. The operator can see, before clicking, the stop, the span, the size and the risk exactly as they will be. That is only possible because nothing in the calculation depends on the execution price.

The cost of this choice is that slippage stays outside the ladder. On wide spans it vanishes: sixty-five points on a six-hundred-point span is a tenth. On narrow spans it weighs: that Thursday it was almost a third of the first rung. An acceptable cost, as long as it is visible, and it was not.

## What the trade showed

The ladder did the rest of the work. The second rung made the trade free; the third, twenty minutes after entry, locked 343 points of profit with the stop at 81,478.20. A dip came down to 81,500, twenty-two points above the stop, and the ladder did not react, because it reacts to rungs, not to scares. An hour later the price fell again, the insurance stop filled at 81,475.00, and the trade closed with 6.79 dollars of profit. It was the second of the day with the same shape, an entry near a real level and a stop underneath it, and the second to end in profit after a week in which four anticipated sales had ended at the stop.

## What changes

Nothing in the ladder. What changes is the reading: the dashboard will show the reference next to the entry, with the slippage in points, and the profit the current stop already guarantees in dollars, so that "stop at minus two" is read rather than deduced. The operations documentation gets the three-prices section that so far lived only in the ADR. And the design question, anchor on the fill or on the reference, is recorded for the next version with the costs of both sides written down. Until then the rule the operator learned on Thursday holds: the first rung breaks even with the signal; the second breaks even with you.
