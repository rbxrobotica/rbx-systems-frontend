---
title: 'Loop Engineering'
date: '2026-08-31'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, processo, agentes, flightdeck]
excerpt: '58 rounds of adversarial review between two models, with a human on triage, took a runtime migration plan from 12 findings to zero.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-31-engenharia-de-loop.png'
slugAlias: '2026-08-31-loop-engineering'
---

# Loop Engineering

On Saturday, the runtime migration plan for our FlightDeck entered review with 12 findings in the first round. By Sunday night, after 58 rounds, the reviewer's verdict arrived like this, verbatim:

```
No material findings.

Checkpoint A passes: 0 critical, 0 high, 0 medium, 0 low
```

This article documents the process we call Loop Engineering: what it is, what it found along the way, and the counterintuitive lesson it left us with. The loop's value is not only in the rigor it adds. It is in what it forces you to remove.

## The loop

The process comes from one of our internal ADRs and has three fixed roles. One agent writes and amends the architecture plan. A second model, from a different vendor, reviews it in a read-only sandbox at maximum reasoning effort, unable to edit anything, and ends every round with a standardized verdict line and a list of findings, each with a severity and a concrete fix. A human does the triage: no finding is accepted automatically, and no amendment goes unrecorded.

Every round is the same cycle: review, documented triage, same-day amendment, commit, next round. The detail that holds it all together is that the next round's prompt requires verifying that previous resolutions were actually reflected in the documents. The reviewer rereads everything and audits resolution by resolution. A fix promised in triage but absent from the text becomes a new finding. The plan cannot pretend.

This design is a close cousin of what we described in [governed agentic autonomy](/blog/2026-08-01-governed-autonomy-distributed-systems): autonomy with human gates at the points that matter.

## The numbers

It took 58 rounds across 3 calendar days, 257 findings triaged one by one, and zero critical findings in every single round. The curve did not descend in a straight line. The first round brought 12 findings; by round twenty the plan hovered between 2 and 5; between rounds 29 and 34 the count climbed again, peaking at 7 and 8, exactly over the machinery we later decided to extract or withdraw; from round 45 onward the series ran 3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 3, 2, and then zero.

For context: this was the second mission through the loop. The first, the external-execution-states plan for the same product, passed in 25 rounds. The whole program adds up to 83 rounds of adversarial review in one week, all of it on architecture documents, before a single line of implementation.

## What a tireless reviewer finds

The obvious objection is that 58 rounds must be pedantry. The answer lies in the quality of what surfaced after round 20, when a human reviewer would long since have approved out of fatigue:

- SvelteKit only calls `handleError` for unexpected errors, so our telemetry emission point would have missed an expected `error(503)`. The reviewer cited the framework's source code.
- The bunfig option `run.bun = true` recursively aliases `node` to Bun, which would have run the Playwright CLI, our one declared Node exception, under the wrong runtime. And omitting the flag is not enough: Bun shallow-merges the machine's global configuration.
- An OCI image digest is not a single identity. Build provenance produces an index whose digest differs from the deployable manifest, and Kubernetes `imageID` adds a third layer. Our required equalities were comparing unlike objects.
- ExternalSecret v1 conditions do not expose `observedGeneration`. The freshness predicate we wrote would have blocked forever, or been quietly weakened during implementation. Again, a citation of the official API.
- The log collector we were about to make a permanent privacy boundary reached end of life in March. We swapped in the supported successor before writing a line.
- In a compare-and-set generation arithmetic, we counted plus 11 where two two-phase transitions add up to plus 13. The reviewer redid the math.

None of those six would have survived a production smoke test. All of them would have survived a typical human code review.

## The lesson: the loop teaches you to remove

The most valuable pattern across 58 rounds was this: whenever a subsystem entered a spiral, each fix opening two new problems for three straight rounds, the right answer was never the ninth layer of fixes. It was withdrawal. We did it eight times, and every withdrawal is recorded in the plan itself with its full rationale.

| Round | What went out | What replaced it |
| --- | --- | --- |
| 19 | In-cluster evidence collector with cross-namespace RBAC | The operator with a pinned script: the removed automation was ceremony, not control |
| 20 | A new events table in the database | Frozen schema; evidence from pod identity and log sweeps |
| 21 | An active session probe in production | CI compatibility vectors as the proof; production as typed passive evidence |
| 30 | Database-restore recovery mode | Forbidden: a rewind erases an append-only ledger; recovery goes forward only |
| 31 | The entire incompatible-release machinery | Compatibility as a publish requirement; the rest deferred to a future ADR |
| 34 | A steady-state release contract that had grown inside the plan | Extracted to a companion ADR with its own checkpoint and a fail-closed gate |
| 40 | Immutable Secret generations, drained cutovers, verifiers | Metadata detection plus operator discipline: prevention was fighting the platform |
| 45 | An HMAC fingerprint job | A controller-native proof: the key lifecycle was its own attack surface |

Notice what those eight rows have in common. In every one, the withdrawn version looked more impressive on paper. The loop forced the question plans rarely answer: who executes this, with which credential, in what order, and what happens when it fails halfway? Whenever the honest answer was a house of cards, the house came down. It is the same evidence discipline we argued for in [audit or telemetry](/blog/2026-08-01-auditoria-ou-telemetria): what cannot stand as an executable record does not count.

## The playbook that remains

- A literal verdict, always. Every round ends with a standardized line and counts. No "looks good": it passes or it does not, with numbers.
- The next prompt audits the previous one. A claimed but unreflected resolution is a finding. That turns triage into a contract.
- Zero criticals is the health signal. Across 83 rounds of the program, not one critical finding: the base architecture held; the loop polished executability.
- A three-round spiral calls for withdrawal, not another fix. If the same subsystem produces new findings for three rounds, the design is wrong, not incomplete.
- Declared honesty beats pretended guarantees. The reviewer repeatedly accepted "this residual exists, it is bounded by X and stated in full", and rejected every guarantee the mechanism could not back.
- Scope is a convergence tool. Extracting the steady-state contract into its own ADR returned the checkpoint to the size of the mission and unlocked the final stretch.

## What comes next

With the architecture checkpoint closed, the mission moves into implementation under the same process: one checkpoint at the vertical slice, another at the end, and only then the infrastructure change, the production canary, a full weekly soak cycle, and the retirement of the old runtime.

Two models set against each other, a human on triage, and the rule that nothing passes until it becomes executable text. The rest is cheap repetition. That is Loop Engineering.

If this kind of process sounds useful for your systems, [talk to RBX](/contact). And to follow the next field notes, the [Journal](/journal) has RSS.
