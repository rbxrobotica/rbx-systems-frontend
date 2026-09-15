---
title: 'The reviewer who rejected itself'
date: '2026-08-08'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, data, adr, robson, quality]
excerpt: 'Two days ago we told the story of a data plan that shrank until only the essential remained. What came next was more interesting: building what survived under continuous adversarial review, with two models in opposing roles. A contract went through three verdicts, a wrongly numbered migration nearly broke the live database, an SDK was hiding the winner of a write race, and in the middle of it all the reviewer found a defect in text it had itself demanded. A story about how certainty is bought by the pass, and about knowing when to stop buying.'
slugAlias: 2026-08-08-the-reviewer-who-rejected-itself
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-08-o-revisor-que-rejeitou-a-si-mesmo-v2.png'
---

Two days ago we told the story of the plan that shrank: an entire data platform for Robson, our execution and risk engine operating real capital, reduced through adversarial review to two tables copied with discipline. What we did not tell is what happened when we started building what survived. Shrinking the scope was the easy part. The hard part was discovering how many times a technically correct text can still be wrong.

## The method

Every artifact of this phase, the data contract, the event registry, the canonical byte profile, the migrations, the runbook, the conformance tool, was written by one model and attacked by another, in fixed roles: Anthropic's Claude Fable 5 implements; OpenAI's Codex, running GPT-5.6 Sol at maximum reasoning effort, tries to break. Nothing reaches the operator without an explicit ready verdict. And the verdict is never an opinion: it is a numbered list of defects, each with severity and evidence pointing at file and line, independently re-verified before any fix.

## What the passes paid for

A new migration arrived numbered over a number that already existed in the repository. It sounds like a naming detail; it is not. The migration runner identifies each one exclusively by its number, and the collision would have failed against the live database, with the system operating real capital, on the first sync after merge. The reviewer caught it by reading, not by deploying. Cost of the finding: one pass. Cost of not finding it: an incident.

A storage client performed silent automatic retries. Under normal conditions, a courtesy; in a race test between four concurrent writers, poison: a first attempt applied but with a lost response would be retried, the retry would receive the precondition rejection, and the true winner of the race would appear as a loser. The test would pass while lying. The fix was disabling retries and observing every response exactly once.

The database clock marked the start of the transaction, not the commit. A transaction opened at 23:59:50 and committed after midnight inserts a row inside a window the exporter had already sealed as immutable. No fixed grace period solves this; it became a formal fence against old transactions, checked before and after every snapshot.

And the finest of them all: a cleanup procedure selected indexes for removal by comparing columns. The reviewer asked what would happen to an exclusion constraint built over the same columns, which disguises itself as an ordinary index in the catalogs. The honest answer was: it would be removed. We planted four decoy indexes in a test database, one exact equivalent and three impostors, and only accepted the procedure when it picked exactly one.

## The verdict against its own verdict

On the second pass over the contract, the reviewer rejected the text again. Among the new defects, one stood out: a rule about empty windows that had no valid representation at all, because two of its requirements contradicted each other. The author of that passage was not the implementer. It was the reviewer itself, which had dictated it, word for word, one pass earlier. It flagged the defect with the same coldness it applied to everyone else's.

That moment is worth more than all the bugs combined, because it destroys the fantasy of an oracle. There is no infallible reviewer, human or model. There is a process that treats every verdict as a falsifiable hypothesis: pinned refs, evidence per claim, independent re-verification, and the willingness to apply the method to the method itself.

## When to stop buying certainty

Cycles of four to seven passes bought a great deal of certainty, at a real cost in time and compute. Once the artifacts stabilized, we changed the economics: a single dense critical pass, performed by a second, independent instance of Claude Fable 5, with a rigid output contract, a line budget, severities, mandatory evidence, and the instruction to declare what requires an operator window instead of speculating. The single pass kept paying: it found a reload command that might be too harmless, silently without effect, and broad legacy access rules that would quietly nullify the narrow isolation we had just built.

And when two reviewers disagreed about the reload behavior, the arbitration was not rhetorical: we asked the server. Both were half right, each looking at half of the configuration. The machine that runs the code is the only reviewer without an opinion.

## The criterion that stays

Everything from this phase is merged, and the schema changes crossed the normal pipeline into the live database the same day, without a second of downtime. Nothing runs until the operator's window; the last word remains human. What the process bought was not perfection, it was traceability of error: we know who claimed what, on what evidence, and what brought each claim down. Certainty is bought by the pass. Wisdom is knowing at which pass to stop, and humility is accepting that, sometimes, the most important defect of the round lives in the sentence the reviewer itself wrote.
