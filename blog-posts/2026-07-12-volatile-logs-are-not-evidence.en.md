---
title: 'Volatile logs are not evidence'
date: '2026-07-12'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engineering, reliability, governance, recovery]
excerpt: 'Recovery in critical systems must emit an auditable event, metric, or state. Logs help diagnostics, but they are not enough as proof.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-12-volatile-logs-are-not-evidence.png'
---

# Volatile logs are not evidence

Critical systems cannot depend on volatile logs as their only proof of recovery.

This lesson came from a concrete Robson case. After a healthy deploy, the system was operational, but a simple retrospective question had no durable answer: did startup run the `insurance-stop heal`? The expected behavior may have happened correctly. The problem was different. The available logs no longer covered the beginning of the pod.

In practice, the evidence had evaporated.

For an ordinary system, that might feel acceptable. For an execution and risk system, it is not. Robson exists to turn operational decisions into verifiable guarantees, as we have covered in earlier posts on [stops that survive failures](/blog/2026-07-03-stops-that-survive-failures), [fallback in production](/blog/2026-07-06-fallback-debuts-in-production), and [the stop gain that audited the system](/blog/2026-07-05-stop-gain-that-audited-the-system). If protection depends on a startup check, the check must leave a durable trace.

## The institutional mistake

Logs are good for immediate debugging. They tell the story while the process is still close, while retention covers the right window, and while someone knows exactly what to search for.

But logs are not the ledger of recovery.

When the question is “did recovery run?”, “what did it check?”, or “why did it change nothing?”, the answer has to survive pod restarts, log rotation, short retention, and time. An organization does not govern critical systems with terminal memory.

The important point is that the absence of change is also an operational result. If recovery checked the state and concluded that nothing needed to change, that must appear as an auditable fact. Otherwise, the healthy path is indistinguishable from a path that never executed.

## The rule that came out of the incident

The case first became an agent-agnostic guardrail in `rbx-agent-layer` PR #11. The rule is simple: recovery, reconciliation, and auto-heal routines must produce durable evidence, including the path where nothing was corrected.

Then the rule became implementation in Robson PR #129, with the durable event `startup_recovery_insurance_stop_checked`.

That name matters. It does not only say that something was fixed. It says that the check happened. The event exists to prove the full cycle: startup executed the verification, evaluated the insurance-stop state, and recorded the result.

That is the difference between useful observability and operational governance. A metric can show frequency and trend. An event can preserve the fact. Persisted state can expose the last known conclusion. The exact mechanism depends on the system. The principle does not.

## Recovery must prove the healthy path

Many systems only record when something goes wrong or when a correction was applied. That creates a gap in the most common and most dangerous case for audit: “checked, no action needed”.

That path must be visible.

In critical systems, recovery is not only a function that tries to fix something. Recovery is an institutional contract. It should answer, after the fact:

- which check ran
- when it ran
- what scope it covered
- what conclusion it reached
- if there was a change, what changed
- if there was no change, why that was acceptable

Without that, the team relies on inference. The deploy was healthy. The pod is ready. The position is protected. Therefore, the heal must have run. That chain may be true, but it is not evidence.

## The RBX principle

The standard we want to keep for the [Journal](/journal) and for [RBX Systems products](/produtos) is direct:

> Critical systems must not require retrospective faith in ephemeral logs. Recovery must emit an auditable event, metric, or state, including when nothing needed to change.

This applies to startup recovery, financial reconciliation, projection cleanup, stop validation, state rehydration, and any routine whose purpose is to restore operational safety. If the routine carries critical responsibility, it must leave evidence that matches that responsibility.

Logs remain useful. They help investigate, debug, and understand context. But they should not be the only proof of an institutional guarantee.

The practical result is simple: when a critical system self-heals, it records that fact. When it checks and does not need to heal, it records that too. The operator is not trapped inside a retention window to prove that the system did what it promised.

That is the bar we want to maintain in [Trust](/trust): critical behavior should be auditable later, not only observable now.

## LinkedIn short version

Engineering lesson from Robson: volatile logs are not enough evidence for recovery in critical systems.

After a healthy deploy, we could not retroactively prove that startup had run the `insurance-stop heal`, because the available logs no longer covered the beginning of the pod. The system may have been correct, but the evidence had evaporated.

This first became a guardrail in `rbx-agent-layer` PR #11 and then implementation in Robson PR #129, with the durable event `startup_recovery_insurance_stop_checked`.

Principle: recovery and auto-heal must emit an auditable event, metric, or state, including when nothing needed to change.
