---
title: 'An IRC conversation needs boundaries'
date: '2026-10-12'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [agents, governance, distributed-systems, engineering]
excerpt: 'A human-agent pilot informed bounded IRC query sessions, with identity, correlation and explicit handling of uncertain outcomes.'
---

On October 11, an RBX operator sent an IRC question about the difference between approving an Action and executing a Mission in Flight Deck. A Codex subagent consulted the project documentation, prepared an answer and returned it to the coordinator. The coordinator published three parts in the channel. A subsequent Halloy screenshot confirmed their display.

That result demonstrated one complete round of supervised consultation. The Flight Deck backend did not participate. The interlocutor was a subagent given documentary context about the product, created for that trial. When the session window closed, it did not remain listening to the channel.

The [pilot record](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/docs/HUMAN-FLIGHTDECK-PILOT.md) preserves this distinction. It determines what the system can claim about an answer's origin and the authority of whoever provides it.

## From message to query

The trial protocol required the human to paste an identifier and timestamp alongside the question. The answer appeared in fragments, with transport data in the text. The experience worked, but assigned the operator details that belong in the adapter.

The increment merged on October 12 adds a readable entry point through a mention of an agent role. The adapter generates the correlation and includes a short reference in the answer. That reference provides access to the session, documentation revision, declared model and delivery state. A model name recorded by the coordinator remains declared metadata, without proving which inference occurred.

The implementation is disabled by default and has not been installed. Opening a session requires an explicit local action. A channel message does not start a model or create a session on its own. This scope keeps separate the responsibilities discussed in [Evidence Is Not Authority](/blog/2026-08-07-evidence-authority-boundaries).

## Identity and time before inference

Access depends on the server-authenticated account, the permitted channel and an active session. The visible nickname grants no access. History, private messages and conversation without an explicit address to the agent remain outside admission. The adapter requires a server-provided identifier and timestamp to check duplication and freshness.

A session admits up to three questions within 600 seconds. Only one consumer claims the work, with one query in progress at a time. Completion requires a valid claim and a fencing token that prevents an old consumer from publishing after it loses ownership.

The session authorizes only the previously bounded consultation; admitting a message does not expand that authority. IRC text grants no permission to execute commands, change code or start missions. Documentary consultation remains separate from the product's approval and execution contracts, including when those contracts are the subject of the conversation.

## Persist before publishing

The answer is recorded before transmission. Each part receives at most one automatic attempt. If the process fails at a point where delivery or an external call may have occurred, the state requires reconciliation. The session does not automatically repeat the work to discover the outcome.

There is an operational consequence: uncertainty reduces availability until the responsible party verifies what happened. This choice prevents a reconnection from turning into a second unaccounted call or repeated answers. The same principle informs [loop engineering](/blog/2026-08-31-loop-engineering): each advance needs a verifiable state.

Transport evidence also has limits. Writing to a socket does not prove that a client rendered a message, and presence in history does not measure window updates. The pilot confirmed display through a screenshot, without measuring visual latency or resolving the reported Halloy instability during prolonged use.

## Subscriptions also need measurement

In a trial separate from IRC, a local query used the existing ChatGPT authentication in Codex CLI. The execution requested `gpt-6.1-sol`; telemetry did not report the exact identifier of the model actually served. The validated answer took 9.653 seconds in the CLI.

The recorded usage was 8,161 input tokens, including 6,912 cached tokens, and 178 output tokens: 8,339 in total. Cache is part of the input. The explicit prompt contained 2,191 bytes, but total usage included the executor's native context. Reducing the supplied text is therefore insufficient to establish total consumption.

The earlier pilot did not measure tokens. This evidence provides no savings comparison. Three earlier attempts failed without usage telemetry; their consumption remains unknown.

In this trial, Thalamus checked the complete CLI job before and after execution, using a synthetic policy and in-memory audit. The experiment did not demonstrate mediation of every internal inference or control of a shared quota. Its [results and limitations](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/pilots/README.md) were preserved alongside the code.

## The next test has its own criteria

Verification of the increment passed 170 communication tests and 37 pilot tests. That does not yet establish the new path through the real server and client. The next step is to prepare backup and rollback, perform a controlled installation and test with a supervised consumer. That trial must verify opening, stopping, expiration, delivery and recovery. Automatic executor integration and shared budget reservation follow later. Client stability during prolonged use remains a separate investigation.

The result is an implemented foundation for bounded queries. Moving to continuous service depends on that evidence, with each component's executor, context and authority kept explicit.

Follow the next engineering records in the [RBX Journal](/journal).

Governance and evidence: [Trust Center](/trust), [PR 361](https://github.com/rbxrobotica/rbx-infra/pull/361) and [PR 362](https://github.com/rbxrobotica/rbx-infra/pull/362). This report describes pilots and merged code; the new service remains undeployed.
