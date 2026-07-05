---
title: 'The stop gain that audited the system'
date: '2026-07-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, risk, reliability, engineering, trading]
excerpt: 'A profitable stop that fired during a deploy exposed two invisible failure modes and changed Robson risk policy. The story and the decisions are here.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-05-stop-gain-that-audited-the-system.jpg'
---

At 07:50 UTC today, a BTCUSDT short closed in profit. The order that closed it did not come from Robson's daemon: it came from the insurance stop resting on the exchange, executing alone while the software was in the middle of a deploy window. The two-layer design born from the [June incident](/blog/2026-07-03-stops-that-survive-failures) worked in the profit direction for the first time. Entry at 63,145.20, exit at 62,935, a small and clean net gain.

A healthy system could have closed the matter there. We audited the win with the same rigor as a loss, and the audit found two problems a loss might never have shown.

## First finding: the feed that goes mute

In the early hours before the close, the price WebSocket entered a peculiar state: the connection opened successfully and delivered zero ticks. The watchdog detected 90 seconds of silence and reconnected, and the new connection was born equally mute. Forty-five cycles, almost two hours, while price crossed the level that should have advanced the trailing stop. The trailing engine is fed by ticks; without ticks it freezes while the daemon looks healthy.

Maximum loss was never at risk: the exchange-side insurance stop does not depend on our feed. But profit protection went blind, and silent blindness is the worst category of failure, because no panel turns red.

The fix became ADR-0044. When the feed goes mute past the watchdog and a position is open, a fallback polls the price over REST and feeds the same data pipeline, with the same trailing math. Source equivalence was not assumed: it was proven with property-based tests that bombard the engine with duplicated and reordered price sequences and require the final stop to be identical. Discrete trailing is a pure function of the favorable extreme, which is why duplicated delivery cannot apply a step twice. The property was always there; now it is written down and checked on every build.

## Second finding: money entering through the wrong door

The stop's profit reached the wallet, but the accounting close of the position stalled waiting for real execution evidence. One minute later, the account drift detector compared expected balance against actual balance, found an unexplained positive difference, and absorbed it into the capital base, labeled as a manual account change.

Every step was locally reasonable. The composition was wrong: a governed outcome of the system itself entered the books through the back door, under the wrong label, and the books balanced. Books that balance remove the pressure to fix the stuck reconciliation, which was the real problem.

It got worse when we asked the next question: what about ten pairs trading at once? The wallet balance is a single number. The causes of a difference are many: an unreconciled fill here, funding there, a fee, a deposit. A scalar residual cannot be decomposed after the fact. It is the wrong aggregation level for accounting.

The decision became ADR-0045. The source of truth for money becomes the exchange's typed income statement, movement by movement, matched item by item against the governed event log. The drift detector was demoted to what it always should have been: a checksum. A nonzero residual is an alarm carrying the list of unmatched items, never an accounting write. An immediate hotfix closed the incident's window: no automatic recalibration while any close is awaiting evidence.

## The reflection that changed the policy: what if the month were a position?

The day's audit ended in a product question. Robson's monthly loss limit was gross: losses consume the 4 percent, gains never give anything back. A winning month ran out of ammunition. The first idea, plain net accounting, had a hidden defect: win 3 percent early and you could give back 7 on the way to the floor. The month's realized profit sat unprotected, exactly what trailing stops prevent inside each position.

The answer was to apply to the month the same concept that protects each operation. ADR-0046 defines the monthly limit as a trailing on the month's equity peak: realized results, unrealized results, and the risk reserved down to the stops of open positions, all in one account. Real gains re-arm operating capacity and raise the floor at the same time. The promise that emerges is the strongest the product has ever made:

You never give back more than 4 percent of the month's peak.

The 1 percent per-operation cap stays untouched as the unit limit. The same idea now holds at three scales: the stop protects the operation, the trailing protects the position's profit, the monthly trailing protects the month's profit.

## What stays

Three lessons came out of this cycle and are already in production, with the decisions recorded in ADRs before the code:

- Silence must be visible. A mute feed, a stream without a heartbeat, a stuck reconciliation: every channel that can speak needs an auditable way to say it stopped speaking. The dashboard now carries a realtime data-freshness indicator, and the metrics count every connection and every silence.
- A residual is a question, not an entry. Money without a typed explanation never enters the books automatically again. Accounting that balances itself hides exactly what should hurt.
- A trustworthy limit holds at every scale. If the trailing concept is good for one position, it must survive the question: what about the whole month? When the answer changes the architecture, the audit was worth it.

Today's entire cycle, from the stop gain to the three decisions, was implemented by engineering agents operating under binding guardrails and line-by-line human review, with the pipeline's security scanners paying for themselves on day one by finding and fixing real dependency vulnerabilities. The system that [earned more room to operate](/blog/2026-07-05-saved-risk-extra-operation) in the morning ended the day with a stronger promise about what it will never give back.
