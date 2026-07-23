---
title: 'The Node Reached the Tip'
date: '2026-07-23'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [bitcoin, infrastructure, payments, sovereignty, engineering]
excerpt: 'Ten days later, our Bitcoin node validated the last block in the chain. The final sync numbers, what the curve confirmed, and what is still missing before the first real payment.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-23-o-no-chegou-ao-topo.png'
---

On July 13 we explained here why RBX decided to run its own Bitcoin node. At that moment the node was at 34.8% of the sync, validating blocks from January 2020, and the article ended with a promise: when it reached the tip, we would tell the next part.

It did. On July 21, 2026, at 22:57 UTC, the node validated block 959,070 and the progress read, for the first time, 100%.

## What that number carries

From the genesis block, mined in January 2009, to the tip of the chain, about 1.4 billion transactions passed through our infrastructure. Every single one was verified independently: signature by signature, consensus rule by consensus rule, proof of work by proof of work.

No shortcuts. No calls to a third-party service asking "is this history correct?". From now on, when our node says a payment happened, that statement rests on the entire chain, validated by us, from the first block to the last.

## The curve behaved exactly as described

In the first article we explained that syncing a node is not linear: old blocks are light and go by fast, and the real heavy lifting is concentrated in recent years.

The prediction held up in the numbers. When we published, 65.2% of the chain was still ahead of us, precisely the densest six and a half years, from 2020 to today. That final stretch took eight more days of continuous validation. It is the asymmetry we described, seen in full: well over half of the computational effort of the entire chain lives in the most recent years.

## The final cost, checked

We also promised infrastructure numbers without fantasy. With the sync closed, the bill came to:

- Disk: about 60 GB in total, 49 GB of blocks and 11 GB of chainstate, the current state of who owns what. Below the 75 GB we had reserved, because pruned mode discarded, as planned, old blocks already validated.
- CPU and memory: within the ranges we published, with the peak concentrated in the sync phase. Now that the node follows the tip, consumption has dropped to routine levels.

We still have not rented any new server for this. It was capacity that already existed in the cluster, now with a job completed.

## What changes day to day

The initial sync is a marathon that happens once. From here on, the node's job is different: receive a new block every ten minutes on average, validate it, move on. At the time of writing, the node was at block 959,214, right at the tip of the global network.

## What is still missing, said honestly

The node is the foundation, not the product. On top of it, we are still wiring the pieces that turn verification into billing: the wallet indexer, the store in BTCPay Server, and the webhooks that notify our systems when a payment confirms.

That is why this article does not announce "Bitcoin payments live". Saying that today would be getting ahead of a step that has not happened yet, and the standard of this series is to tell things as they are.

When the first real payment crosses our infrastructure end to end, from the customer to the webhook, with no intermediary in the path, we will tell the third part.
