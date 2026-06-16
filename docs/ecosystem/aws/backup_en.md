# Backup & Recovery (AWS)

## Overview

**AWS Backup** is a managed service that centralizes backup policies across many AWS resources (EBS, RDS, DynamoDB, EFS, FSx, and more). Instead of scripting per-service snapshots, you define **backup plans**, **vaults**, and **retention** once and apply them consistently—important for compliance and disaster recovery (DR).

Backup is not a replacement for application-level export or cross-cloud DR strategy; it is the AWS-native control plane for scheduled snapshots and restores.

## How it works

- **Backup vault** — encrypted storage container for recovery points.
- **Backup plan** — schedule, retention, and lifecycle (e.g. move to cold storage, expire).
- **Resource assignment** — tag-based or direct assignment links resources to plans.
- **Restore** — service-specific restore APIs; test restores regularly.

Cross-Region copy and AWS Backup Audit Manager support governance for regulated workloads.

## When to use

- You need uniform backup policy across RDS, EBS, and other supported services.
- Compliance requires retention, encryption, and audit trails.
- Ops wants automation without custom Lambda snapshot orchestration for every service.

## When not to use

- Application needs point-in-time logical export only (e.g. SQL dump to S3) without AWS Backup integration.
- Non-AWS workloads—use agent-based or third-party backup.
- RTO/RPO requirements that need active-active multi-region app design—backup alone is insufficient.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Central policy, less custom scripting | Cost of stored recovery points |
| Integrates with AWS Organizations | Restore drills still required |
| Encryption and access control via KMS/IAM | Not all resource types supported equally |

## Example

A backup plan runs daily snapshots of tagged RDS instances, retains 35 days, copies weekly recovery points to a secondary Region vault for DR.

## Related

- [AWS Storage](./storage_en.md)
- [AWS Database](./database_en.md)
- [Infrastructure as Code](../../best-practices/practices/infrastructure/infrastructure-as-code_en.md)

## References

- [AWS Backup documentation](https://docs.aws.amazon.com/aws-backup/)
- AWS Well-Architected — Reliability pillar (backup and DR)
