---
title: 'Too much rigor is also a bug'
date: '2026-08-08'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, data, robson, quality, agents]
excerpt: 'This morning we published the story of the reviewer that rejected its own text. In the afternoon came the next chapter: an entire data exporter built in one day, proven byte by byte against reference vectors, with more than a hundred green tests. And the most valuable finding of the day came from a second reviewer, a twin of the implementer, which found the defect no test in the suite could catch: the code was too strict for the real world.'
slugAlias: 2026-08-08-too-much-rigor-is-also-a-bug
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-08-rigor-demais-tambem-e-um-bug-v2.png'
---

This morning we published the story of the reviewer that rejected text it had itself dictated. In the afternoon, the process produced the next chapter, and it deserves its own record: we built, in one day, the entire publication path of the cold-data exporter for Robson, our execution and risk engine operating real capital, and the most important discovery of the day was none of the things we built. It was a defect that all of our green tests were structurally incapable of seeing.

## A day of proven construction

The exporter is the piece that copies, once a day, Robson's event history and income ledger into long-retention cold storage. It is the first piece of the bronze pipeline we described in the shrinking-plan article, and it lives in rbx-data, RBX's data domain. The central requirement: the published bytes must be reproducible. The same window of data, exported twice, has to produce exactly the same object, byte for byte, so that re-runs are harmless and any divergence is an alarm.

Every layer was born against a proof. The canonical writer was validated against versioned reference vectors, and an independent reimplementation in another language produces the same bytes, which prevents the test from being an accomplice of the code it tests. The compression has every parameter fixed by contract, and the binary refuses to run if the linked library is not exactly the pinned version. The sealing of each window is protected by a formal fence against late transactions, checked before and after every copy. By the end of the day: more than a hundred green tests, including crash scenarios at every point of the protocol, and a live battery against a real, ephemeral database.

## The twin reviewer

With everything green, we applied the economical model we described this morning: a single dense critical pass. The implementer was Anthropic's Claude Fable 5, working inside Claude Code; the reviewer was a second instance of the same Fable 5, with no shared context, pinned references, and an explicit mandate: believe nothing, re-verify everything.

The reviewer took the mandate literally. It ran the quality gates on its own. It compared, hash by hash, the copied reference vectors against their original source. It reproduced a compressed frame using the system's command-line tool, an implementation that shares not a single line of code with ours, and confirmed the bytes matched. And then it did the one thing none of our tests did: it read the code of the data producer, on the other side of the boundary.

## The defect the green tests were hiding

The rule in question looked untouchable. Certain event fields carry machine codes that must be validated against closed lists before leaving; a field that cannot be validated is a field that cannot be exported; therefore, if the path to the field does not exist in the data, abort. Maximum rigor, safe direction. Every test confirmed it: malformed data, aborted run, nothing wrong published.

What the reviewer found by reading the producer: Robson's serializer omits empty lists entirely. When there is nothing to report, which is the most common case in the real world, the key simply does not exist in the document. To our validator, an absent key was a path impossible to validate, and a path impossible to validate meant abort. Translation: the first real window containing the system's most ordinary event would have halted the pipeline forever. No wrong byte published, no data corrupted, and still a complete failure, because an exporter that never seals exports nothing.

The defect was not in what the code did. It was in what the world does. More than a hundred tests measured the code against the specification; none measured the specification against the living producer. The implementer treated the other side as a well-documented black box. The reviewer opened the box.

## Rigor is a dial, not a virtue

The fix was small and surgical: the absence of an entire collection now counts as an empty collection, because zero values to validate are zero values to export, and nothing can be smuggled through a field that does not exist. Everything else stayed strict: an absent scalar field is still drift, a present collection with the wrong type is still drift, a value outside the list is still fatal.

The lesson is uncomfortable for anyone fond of absolute rules: excessive rigor is a failure mode as real as permissiveness. Failing closed protects the data, but it does not protect the goal; a system that refuses to operate on the most common case is as broken as one that accepts anything, it just breaks with more dignity. The right position of the dial is not found by staring at your own code. It is found by looking at your neighbor's.

## What else the pass paid for

The same report brought two resilience improvements we accepted on the spot. A restart after a crash at the worst possible moment now finds the previous publication and verifies it in full instead of redoing the work, which eliminates a future scenario where redoing it would be impossible. And the database clock reading is now persisted on every check, not only the successful ones, closing a narrow gap where a stepped-back clock could slip between two runs unnoticed.

Everything applied, proven again, and integrated the same day. As always: nothing runs against production until the operator's window, and the last word remains human. Two instances of the same Claude Fable 5, in opposing roles, found together what neither would have found alone. Not because one is smarter than the other, but because only one of them had the obligation to doubt.
