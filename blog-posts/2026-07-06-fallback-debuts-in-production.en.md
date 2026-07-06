---
title: 'Engineering update: the fallback debuts in production'
date: '2026-07-06'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engineering, reliability, risk, trading]
excerpt: 'Less than 24 hours after merge, the market-data fallback protected a real entry. And the root-cause hunt ended somewhere unexpected. The full update.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-06-fallback-debuts-in-production.jpg'
---

On Saturday we published [the story of the stop gain that audited the system](/blog/2026-07-05-stop-gain-that-audited-the-system). This is the Sunday update, and it opens with a debut none of us scheduled this early.

## An entire entry on the degraded path

At 03:44 UTC the operator armed a long position in BTCUSDT. The full cycle took 3.4 seconds: signal, risk gate, order filled at 63,171.60, insurance stop resting on the exchange at 62,533.85, position active. Nothing special, except one detail: the exchange's price WebSocket had been mute for twelve hours, and what fed the entry price, the risk math, and the trailing stop was the REST fallback shipped the day before.

The fallback has a budget rule: it spends no requests while there is nothing to protect. It watched the silence for twelve hours without acting and engaged the instant the position existed. The new monthly limit math debuted on the same entry: the remaining budget dropped by exactly the risk reserved down to the stop, cent for cent.

## The root-cause hunt ended away from home

Three mute-feed episodes in three days deserved more than reconnects. With the position protected by the fallback, the live specimen could be debugged without hurry. The funnel: DNS, TCP, and TLS to the exchange's data host, all healthy. The WebSocket handshake answered 101 Switching Protocols. And after the 101, zero data frames, on both the raw and the combined endpoints, tested from two different networks. The control that closed the case: the spot market WebSocket, with the same reader, delivered eleven kilobytes in eight seconds.

Conclusion: the exchange's futures feed accepts connections and, for windows of time, sends nothing. The problem lives on their side. That rewrites the story of the earlier incidents, where daemon restarts seemed to heal the feed: the healing was a timing coincidence with their service returning. The architecture lesson was already paid for on Saturday, and now it has production proof: a critical consumer must never have a single data path.

Two debugging traps are now on record for whoever hunts something similar: curl does not relay frames after a 101, which manufactures false negatives, and Upgrade headers over HTTP/2 are silently ignored. Raw sockets and a spot market as control group settled what four misleading tests could not.

## The dashboard now shows the month's trailing

The new monthly limit, decided on Saturday, is live: the main gauge stopped summing gross losses and now shows the give-back from the month's equity peak. Realized gains re-arm operating capacity and raise the floor at the same time. The promise is the same in every scenario: never give back more than 4 percent of the month's peak, with the 1 percent per-operation cap intact as the unit protection.

## The badge that caught its own bug

On Friday a freshness indicator was born on the dashboard: LIVE while the event stream breathes, STALE when it goes quiet. On Sunday it claimed STALE on a perfectly healthy stream. Verification walked the entire path, from inside the server and through the public proxy, and every heartbeat was there. The bug was in the meter: it counted parsed events, and the 15-second heartbeats are protocol comments that never become events. Any quiet period flipped STALE.

The fix shipped the same day: freshness is now byte activity, heartbeats included, and STALE only appears when the 45-second watchdog actually trips. There is something satisfying about the tool that exists to make silence visible reporting, as its first case, the silence of its own measuring instrument.

## The decision not to change

With all of that on the table came the product question: can the communication be simplified, moved to RPC, or onto the cluster's internal network? The study compared five options with failure-mode tables and cost at one and at one hundred users. The answer, recorded as an ADR: keep the current topology, which had just been verified end to end. A consolidated proxy would introduce a new silent-failure class and give every frontend deploy a blast radius over live streams. Browser-facing RPC requires an extra proxy, the opposite of simplifying. The conditions that would change the answer are written down: multi-tenant, more than twenty concurrent operators, or a real client-to-server streaming need.

The study also left a process lesson: it recommended a security hardening that was already implemented in the code, because it worked from documentation, and documentation drifts. The rule that entered the guardrails applies to every decision: recommendations verify against current source, and an ADR caught stale gets corrected in the same cycle.

## What stays

Four days, four new invariants in production, and a repeating pattern: every incident became a recorded decision before it became code, every change went through line-by-line review, and the protections built one day were tested by the real world the next. The next chapter already has a name: the typed income ledger, completing the promise that money without an explanation never enters the books on its own again.
