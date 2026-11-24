---
title: 'Object Storage: policy, retention and recovery'
slugAlias: '2026-11-15-object-storage-policy-retention-recovery'
date: '2026-11-15'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, resilience, governance, storage]
excerpt: 'How to turn criticality and retention into automated copies, deletion protection and recovery across providers.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-11-15-object-storage-politica-retencao-recuperacao-v1.png'
---

A company needs to recover its data when a provider, account or machine becomes unavailable. It also needs to control the cost of preserving that information. Keeping every file and every version forever consumes resources without distinguishing operational assets from material that has served its purpose.

The architecture we are qualifying at RBX starts with a policy for each dataset. It describes what to preserve, for how long, at which destinations and how to demonstrate recovery. It continues our discussion of [recovering, changing and proving it](/journal/2026-08-26-recover-change-prove), with a focus on object storage. This is an engineering proposal under qualification, without claiming that every dataset is already covered.

## Criticality and retention answer different questions

Criticality expresses the impact of loss. It guides priority, the acceptable interval without a recent copy and the time available to recover the function. We can work with three levels: critical, important and supporting. A dependency required to recover a critical service needs corresponding protection.

Retention expresses how long data or a recovery point must remain available. Critical operational state may need frequent copies with three months of history. A strategic document may rarely change and require permanent preservation.

| Dataset | Original-data policy | Backup policy |
| --- | --- | --- |
| Ephemeral debugging output | A short, explicit lifetime | Short retention or a justified backup exclusion |
| Operational state and uploads | Preservation while required by the function | Recovery history within a defined window |
| Selected strategic records | No automatic expiration | Independent copies and preservation of relevant versions |
| Audit and incident evidence | A dedicated period based on evidential value | Explicit history and preservation exceptions |

These examples do not authorize a universal deletion rule. A folder name does not determine value. A log associated with an incident may need preservation while another becomes irrelevant within days. As discussed in [volatile logs and evidence](/journal/2026-07-12-volatile-logs-are-not-evidence), diagnostics and operational proof have different roles.

## How policy reaches storage

A provider does not interpret the concept of strategic data on its own. Policy needs to become verifiable configuration and procedures.

A versioned catalog could contain an entry like this. Names and values are illustrative; this is not active configuration:

```yaml
dataset: operational_documents
criticality: 1
source_ref: approved_origin
source_policy:
  automatic_expiration: false
backup_policy:
  capture: daily
  history_days: 90
  independent_provider_required: true
  deletion_enabled: false
```

Credentials remain in a dedicated secret-management mechanism, outside the catalog. The application uses a dataset identity and a permitted destination. Classification comes from trusted service configuration; a client does not gain authority to reduce protection by sending an arbitrary parameter.

An adapter translates policy into mechanisms compatible with each destination. Some settings become infrastructure configuration, such as permissions, versioning or immutable retention. Others configure the executor, including frequency, version selection, encryption and verification. Another part belongs to the restoration procedure and application checks.

A label or tag can identify data, but does not prove enforcement. The controller must compare expected and observed configuration and record differences. Destructive changes require their own review and activation step.

## Which component calls which

The proposal separates operational writes from preservation:

1. The application writes objects to the declared source for its dataset.
2. An independent scheduler starts the backup executor under the approved policy.
3. The executor queries the source, captures a consistent dataset and produces a coverage and integrity manifest.
4. It sends protected material to the destinations and verifies each result separately.
5. An external monitor tracks the age of the latest usable copy, failures and recovery exercises.

The executor receives only the access required for its task. The routine producer should not be able to erase every historical copy or shorten its retention. Recovery uses its own identity and procedure. The key required to open the backup must also exist outside the provider whose loss the design must survive.

Events can trigger an earlier capture, but periodic reconciliation remains important for detecting missed events and forgotten datasets. A paginated object listing is not an application-consistent snapshot. Databases, objects and references between them need an appropriate capture contract.

## How far the flow is bidirectional

Data originating at provider A can have a backup at B, while other data originating at B has a backup outside it. Each dataset keeps an authoritative source and a known capture direction.

Restoration travels back, or to a third destination, as an explicit operation. It does not automatically promote the historical archive into a new production source.

Bidirectional replication can support an application that genuinely needs writes in multiple locations. Conflicts, deletions, event ordering and source failover then require their own rules. This availability capability should coexist with recoverable history that survives an unwanted change.

The goal is automated preservation without allowing a source deletion to immediately destroy the versions needed to reverse it.

## Backup format determines safe retention

Closed exports, incremental repositories and databases need different treatment.

An encrypted export can receive bounded immutable retention after testing the destination's permissions and behavior. A repository such as Restic shares blocks across snapshots. Deleting a block simply because it is old can break a recent snapshot that still references it. Retention must therefore be applied by software that understands those references.

Versioning and Object Lock also serve different purposes. Versioning preserves versions while they remain retained. Object Lock can prevent deletion of protected versions for a period, depending on mode and permissions. Both require qualification with the actual tool. Neither replaces an accessible copy outside that provider.

## Finite resources are part of the design

We size storage using current volume, required versions, observed growth, retention and operating and recovery headroom. Compression and deduplication enter the estimate after measurement. A full daily copy retained for ninety days can cost much more than incremental history.

For critical data, we target the source and two recovery copies under independent failures. One can be encrypted, rotated, disconnected media held at another location. If volume or frequency makes that impractical, another protected online destination can complement an essential offline kit. Each copy's scope and age must remain explicit.

| Failure | Expected behavior |
| --- | --- |
| Source unavailable | Preserve existing copies and alert on the delay |
| One destination unavailable | Record incomplete coverage and retry without declaring global success |
| Executor stopped | The external monitor detects the missing expected execution |
| Policy or access drift | Suspend the incompatible action and record the difference |
| Restoration fails | Keep the gap visible and repair the path before claiming recoverability |

Permanent preservation also needs maintenance: checking integrity, testing tools and formats, recovering keys and replacing media. The commitment is to keep strategic material usable over time.

## How to demonstrate recovery

Qualification begins with a bounded, known dataset. We exercise overwrite and deletion on disposable data, verify version protection and restore into an isolated environment without the lost source's credentials. We check bytes, required metadata and application reads.

We then measure the update gap and actual recovery time. We repeat the exercise for the loss of each relevant provider. Coverage grows from that evidence, with costs and exceptions recorded per dataset.

To develop this policy for an existing operation, [talk to RBX](/contact). The first task is to identify what must survive, locate its dependencies and demonstrate a recovery path.

Technical references: [AWS recovery verification](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_periodic_recovery_testing_data.html), [Backblaze B2 Object Lock](https://www.backblaze.com/docs/cloud-storage-object-lock) and [copying between Restic repositories](https://restic.readthedocs.io/en/stable/045_working_with_repos.html).
