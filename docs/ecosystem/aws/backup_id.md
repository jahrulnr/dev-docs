# Backup & Recovery (AWS)

## Overview

**AWS Backup** adalah managed service yang memusatkan backup policy di banyak resource AWS (EBS, RDS, DynamoDB, EFS, FSx, dan lainnya). Alih-alih script snapshot per service, Anda mendefinisikan **backup plan**, **vault**, dan **retention** sekali lalu menerapkannya konsisten—penting untuk compliance dan disaster recovery (DR).

Backup bukan pengganti export level aplikasi atau strategi DR cross-cloud; ini control plane AWS-native untuk scheduled snapshot dan restore.

## How it works

- **Backup vault** — container storage terenkripsi untuk recovery point.
- **Backup plan** — schedule, retention, dan lifecycle (mis. pindah ke cold storage, expire).
- **Resource assignment** — tag-based atau direct assignment menghubungkan resource ke plan.
- **Restore** — API restore per service; uji restore secara berkala.

Cross-Region copy dan AWS Backup Audit Manager mendukung governance untuk workload regulated.

## When to use

- Butuh kebijakan backup seragam di RDS, EBS, dan service terdukung lainnya.
- Compliance membutuhkan retention, encryption, dan audit trail.
- Ops ingin automation tanpa custom Lambda snapshot orchestration per service.

## When not to use

- Aplikasi hanya butuh logical export point-in-time (mis. SQL dump ke S3) tanpa integrasi AWS Backup.
- Workload non-AWS—pakai backup agent-based atau pihak ketiga.
- RTO/RPO butuh active-active multi-region—backup saja tidak cukup.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Policy terpusat, kurang custom scripting | Biaya stored recovery point |
| Integrasi AWS Organizations | Restore drill tetap wajib |
| Encryption dan access control via KMS/IAM | Tidak semua resource type sama-sama didukung |

## Example

Backup plan menjalankan daily snapshot RDS bertag, retain 35 hari, copy weekly recovery point ke vault Region sekunder untuk DR.

## Related

- [AWS Storage](./storage_id.md)
- [AWS Database](./database_id.md)
- [Infrastructure as Code](../../best-practices/practices/infrastructure/infrastructure-as-code_id.md)

## References

- [AWS Backup documentation](https://docs.aws.amazon.com/aws-backup/)
