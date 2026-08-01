---
title: 'An audit trail is not a telemetry sink'
date: '2026-08-01'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, event-sourcing, postgres, audit, robson]
excerpt: 'Our trading system database weighed 17 GB. The genuine audit trail fit in under 1 MB. How 96% of an event log became noise, how we cleaned it without losing a single line of evidence, and the rule we adopted so it never happens again.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-01-auditoria-ou-telemetria.png'
---

The database behind Robson, our trading system, weighed 17 gigabytes. When we measured what inside it was genuine audit material, every armed position, every executed entry, every stop move, every monthly close, the total fit in under 1 megabyte.

The other 96% was something else. The difference between those two categories is what this article is about.

## How we found it

At the July-to-August turn, we used a window with no open positions to audit the database end to end. The size distribution told the story on its own: a single monthly partition of the event log held 10 GB. Inside it, 6.5 million events of the same type, written in just five days.

The type was `QUERY_STATE_CHANGED`: the state-transition record of the execution engine's governed queries. In our design, every action the system considers goes through a query with an auditable lifecycle: accepted, evaluated by the risk engine, executed or denied. That applies to a position entry, and it also applies to the most mundane routine in the system: the query that every market tick fires for every active position, dozens of times per minute.

And there was the problem. Each of those routine queries produced three or more permanent events in the event log. Per position. Per tick. Indefinitely.

## The event sourcing trap

Event sourcing builds a healthy culture: the event log is sacred, nothing gets deleted, everything can be proven. But that same culture carries a symmetric trap: if the event log is sacred, everything starts to look like it deserves to be an event.

It does not. The test we now apply is simple: **does this record prove a decision, or does it merely describe an instant?** The entry the risk engine denied proves a decision, and it stays forever. The routine query that completed its cycle with nothing to say merely describes an instant, and structured logging exists for exactly that, at near-zero cost, expiring on its own.

The proof that the volume was noise: the real actions those queries govern, moving a stop, exiting a position, already emit their own domain events. The trading audit trail was complete without any of those millions of records. An entire month of live operation, with positions, stops and closes, fit in a few hundred events.

## Deleting without losing evidence

Deleting data from an auditable system demands more discipline than accumulating it. The sequence we executed:

1. **Archive before any delete.** Full dumps of the affected partitions, with integrity verified in three layers: archive catalog, complete decompression, and checksum comparison after upload to cold storage.
2. **Deletes by event type, with exact counts.** The April partition held 6,545,132 rows; after cleanup, 12. The twelve that proved something.
3. **Physical compaction** to return the space to the operating system, and verification that the trading daemon crossed the entire operation without a single error.

Result: 17 GB became 310 MB, with the audit trail intact and the complete archive preserved outside the hot database, checksums published.

## The rule, as code

Cleanup without prevention is just scheduling the next incident. The same day, the rule became code and a recorded architecture decision: routine tick-query transitions no longer enter the event log. Governed outcomes always do: denials, failures and expirations are evidence, not noise. And a weekly retention routine now prunes the auxiliary tables that grew alongside.

Projected database growth dropped from gigabytes per month to megabytes per month, without losing a single bit of proving power.

## The bonus the investigation paid for

Midway through the work, one of our dumps died mid-stream. Investigating, we found that the operating system's automatic package updates had restarted the production database at that exact minute, as they potentially did every day, in the same time window, whenever a library was upgraded.

The system absorbed the restart without damage, which is what it was designed to do. But a financial system's production database does not restart as a side effect of package housekeeping: it restarts when operations decides. We moved those updates to planned windows the same day, also as code.

It is the most repeated pattern in our engineering: the problem you investigate deeply almost always reveals the neighboring problem nobody had seen.

## What remains

Systems that need to last for years accumulate two things: evidence and clutter. The difference between them is not technical, it is a design decision: what does this system need to be able to prove five years from now?

What proves, you keep forever, with verified backups. What merely describes, expires. Confusing the two categories costs 17 gigabytes to find out.
