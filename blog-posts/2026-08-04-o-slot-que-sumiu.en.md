---
title: 'The missing slot'
slugAlias: '2026-08-04-the-missing-slot'
date: '2026-08-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, risk, adr, robson, reliability]
excerpt: 'A month with zero governed losses, and the dashboard showed 3 slots out of 4. The number was right and the rule was wrong. How one operator question became the formal supersession of an ADR, why the obvious fix was unsafe, and what a second model found in our own text before approval.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-04-o-slot-que-sumiu-v2.png'
---

Robson, our governed futures executor, opens every month with four slots. Each slot is one unit of risk: no entry may plan a loss larger than 1% of the capital base, and the month as a whole has a 4% ceiling. Free slots are the first thing the dashboard shows, because it answers the first question an operator asks: how much room for error does this month still have?

In August, the dashboard showed 3 of 4. The month had two closed positions, zero governed losses, and no open positions. Realized loss for the month was zero. The operator asked the right question: where did the fourth slot go?

## The number was right

The first suspect in a case like this is a display bug. It was not one. The backend computed exactly what the standing decision told it to compute.

The standing decision was a July ADR that anchored the monthly budget to the month's equity peak, a high-water mark: every new peak re-armed the 4% cushion, and any retreat from the peak consumed budget. The important detail is that the peak included open, unrealized results. A position that showed a positive number on screen for a few minutes registered a peak; when its trailing stop gave part of that back before closing, the difference counted as consumed monthly budget.

That is what ate the slot: 0.4% of recorded consumption in a month where no operation ended in a loss. The dashboard faithfully reflected a rule that the operator, seeing its effect on a real account for the first time, decided was the wrong rule.

## Redefine before rewriting

The fix started with a sentence, not with code. The operator stated the invariant the monthly budget must protect, and only it: the month's governed loss, measured against the capital base at the start of the month, never exceeds 4%. More than four operations in a month? Allowed, as long as the invariant holds. Give-back of unrealized results inside one operation? That belongs to the position's own trailing stop, which exists for exactly this, and to its 1% cap. The monthly budget stopped protecting peaks.

And a second sentence, which became a named principle in the new ADR: every open position is always assumed to be walking toward defeat. Its maximum loss, priced with execution costs, is reserved against the budget the moment the position exists. If it wins, the reservation is released. If it loses, the loss was already budgeted and can never push the month past the ceiling.

## The obvious fix was unsafe

The first proposal looked natural: anchor consumption on the month's net result since the start, unrealized included. Positive month, zero consumption, four slots. Simple.

We submitted the proposal to an adversarial review by a second model, with explicit instructions to break the design. It broke it. The scenario: one position closed at a 1% loss, and one open position with a positive unrealized result and its stop at the entry price. A stop at entry means zero latent risk. The positive open result, added to the month's net, masked the already-realized loss: apparent consumption returned to zero and the system would admit new risk as if the month were clean. If the open position then gave everything back to its stop and the new entries lost, the month would close beyond the ceiling.

The lesson fits in one line: unrealized results are protected by no reservation, so they cannot enter the budget anchor. The final model's safety proof needs no unrealized term at all, and that is precisely why unrealized stays out.

## What was decided

The approved model anchors consumption on the governed realized result since the start of the month, settlement-complete: fees and funding are included, unrealized results and out-of-band account changes are not. Realized gains offset earlier realized losses down to zero consumption, and nothing expands the budget above 4%. The latent risk of every open position, under the pessimistic assumption, subtracts from available capacity. Entry admission, slot counting, the status API and the monthly halt now consume one canonical snapshot, because the review found code paths computing latent risk over different sets of positions.

August under the new model: zero consumption, four slots.

## The process is the product

The change became an ADR that formally supersedes the previous one, recording why the July decision, correct for the problem it attacked, protected the wrong thing. The text went through two full adversarial review cycles by the second model, and the second cycle caught the part we most want to tell: two false claims in our own consequences section. We had written that the monthly halt could never again fire while the month was positive. False: latent reservation alone can exhaust the budget with realized results at zero or above, and the final text documents that as an accepted consequence instead of denying it. A risk document that overstates its own guarantee is exactly the kind of debt we refuse to version.

The final package includes a decision matrix comparing the five alternatives, a closed-form proof of the 4% floor, a failure-mode table, a two-phase rollout plan with activation gates, and backlinks in the three earlier ADRs marking, clause by clause, what was partially superseded. Documentation only: not one line of risk code changes before the decision is written, reviewed and merged. Implementation comes in slices, each one against the approved text.

## The rule we keep

A number on a risk dashboard is a contract, and a contract binds both sides: the system computes what is written, and what is written must be what the operator understands they are getting. When the dashboard surprises the person operating it, either the arithmetic is wrong or the contract is. Contracts get fixed in writing, versioned, with an adversary, and before anything touches production.
