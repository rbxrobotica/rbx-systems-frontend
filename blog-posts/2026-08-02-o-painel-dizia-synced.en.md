---
title: 'The dashboard said Synced'
date: '2026-08-02'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, gitops, kubernetes, argocd, deploy, reliability]
excerpt: 'Our deploy pipeline died and stayed dead for four days while every dashboard said Synced and Healthy. The anatomy of a silent failure, what was stuck without anyone knowing, and the criterion we now demand of any automation: when it breaks, what turns red?'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-02-o-painel-dizia-synced.png'
---

For four days, ten applications in our fleet received no deploys. Merges happened, images were built and published to the registry, and nothing reached the cluster. No alert fired. No job failed. Every ArgoCD dashboard said the same thing: Synced, Healthy.

Both were technically correct. That was exactly the problem.

## How we found out

It was not an alert. It was verification discipline: after merging a fix, we independently checked that it had reached production. The new image existed in the registry. The cluster was running the image from four days earlier. Somewhere between the two, a link in the chain had simply ceased to exist.

The link was ArgoCD Image Updater, the component that watched the registry and promoted new images into our GitOps repository. A version upgrade had replaced it with the tool's new variant, which abandons annotation-based configuration and requires dedicated resources instead. Our ten applications were configured the old way. The new controller started, looked around, logged a single line saying there was nothing to process, and went quiet forever.

## Why no dashboard caught it

Here lives the lesson. ArgoCD answers one precise question: does the cluster match what Git describes? It did. Git said "run the image from four days ago" and the cluster ran the image from four days ago. Synced, and rightly so.

What no dashboard asked was: **is the process that should be changing Git still alive?** The promotion automation had no healthcheck that mattered, no heartbeat, no observable effect when it stopped. Its failure mode was the absence of events, and the absence of events is indistinguishable from "nothing to do". Silence, either way.

When we measured the damage, the silence had a price: a sandbox environment was seven weeks and dozens of commits behind main. A production site owed two fixes. As a bonus, the investigation surfaced three internal services pointing at the floating latest tag, which means the running version was simply unknowable. None of this showed up anywhere.

## The trade we made

We could have fixed the controller: create the new resources, migrate the configuration, move on. We chose the opposite: retire the entire category of silent automation.

In the pattern we adopted, the repository that builds an image is the one that promotes it. At the end of the build, CI itself opens the GitOps repository, updates the image reference to the exact tag it just published, and commits as a bot. ArgoCD keeps doing what it does well: converging the cluster to whatever Git says.

What we bought with that trade:

- **Loud failure.** If promotion breaks, the CI job on the merge turns red, in the right repository, on the right commit, with the error log. The "broken and green" state no longer exists.
- **An audit trail.** Every deploy is a commit in the infrastructure repository, with author, time, and the merge that triggered it. "What is in production and why" is answered by a git log.
- **Structural coherence.** Promotion happens in the same job that published the image, so the promoted tag exists by construction. An entire error class, promoting an image that does not exist, became impossible.
- **One pattern.** The whole fleet, twelve repositories, promotes the same way. Less surface to diverge, fewer mechanisms to die quietly.

On the new pattern's first day, six automatic promotions landed without a human touch. The seven-week environment caught up in one step. The floating tags were pinned to exact versions.

## The criterion that remains

The question we now ask of any automation before trusting it: **if this dies right now, what turns red?**

If the answer is "nothing", you do not have monitored automation, you have a scheduled hope. A green dashboard only covers what it measures, and it almost never measures the health of whatever feeds it.

Yesterday we wrote here that an audit trail is not a telemetry sink, about the data a system keeps. This is the same lesson one layer up, about the machinery that moves that data: silence is not health. In data and in automation, health is what survives an independent check.
