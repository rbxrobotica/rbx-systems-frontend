---
title: 'Why RBX Runs Its Own Bitcoin Node'
date: '2026-07-13'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [bitcoin, infrastructure, payments, sovereignty, engineering]
excerpt: 'Instead of trusting a third-party API, RBX verifies every Bitcoin payment with its own node, running inside its own cluster.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-13-no-bitcoin-proprio.png'
---

Every time a company accepts a Bitcoin payment, there is a question almost nobody asks: who is confirming that the payment actually happened?

In most cases, the answer is a third party. A block explorer API, a payment provider, someone who queried the network on the company's behalf and said it could be trusted, that the payment arrived. It works, but it depends on someone else's word.

At RBX, we chose the more rigorous path: running our own Bitcoin node.

## What that actually means

A Bitcoin node is a computer that participates in the network by downloading and independently validating every block and every transaction since the first one, in 2009. It applies the consensus rules on its own: valid signatures, no double spending, valid proof of work. It does not ask anyone. It verifies.

That is what is running on our infrastructure right now: a full `bitcoind`, alongside NBXplorer, which indexes wallets, and BTCPay Server, which generates invoices and webhooks. All of it inside our own Kubernetes cluster, with no dependency on any third-party cloud to process payment. It is the same piece of infrastructure that will process subscriptions for the [Daily BTC Briefing](/briefing-btc).

## Why it matters

This is our practical definition of technical sovereignty: when BTCPay confirms a Bitcoin payment, RBX is the one that verified it. Nobody else holds veto power or the ability to delay it. There is no external API sitting between a customer's payment and the confirmation of that signature.

The cost of that choice is real, and we do not hide it: keeping a node running takes infrastructure work. But zero transaction fees and zero third-party dependency are worth that cost.

## A detail nobody mentions: syncing is not linear

A quirk that anyone who has synced a node from scratch runs into: the progress bar does not move at the pace it seems to.

Bitcoin's oldest blocks, from 2009 to around 2016, are small, carry few transactions, and fly by quickly. Starting with the SegWit era, blocks get much denser, carrying far more transactions each. Most of the real validation work is concentrated in the more recent years, not spread evenly across time.

In practice, watching progress sit at 20%, 30%, without seeming to move fast, is not a sign of a problem. It is the natural shape of the curve. The blocks that remain are, in general, heavier than the ones already validated.

## The infrastructure cost, no fantasy

We did not provision a new server for this. The node runs on capacity that already existed in our production cluster. In numbers: about 75 GB of disk reserved, since the node is pruned and discards old blocks once validated; between 1 and 4 CPU cores, depending on the phase; between 2 and 5.5 GB of memory.

None of that is a new bill. It is existing capacity being used for a specific purpose: verifying real money, with no intermediary.

## Where we are right now

At the time this was published, our node was at 34.8% sync, validating blocks from January 2020. The densest, most recent part of the chain is still ahead.

Once it reaches the tip and the first real payment clears through our own infrastructure, start to finish, with no intermediary, we will tell the next part.
