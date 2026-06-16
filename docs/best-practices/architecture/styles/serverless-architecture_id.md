# Serverless Architecture

## Overview

**Serverless Architecture** adalah model eksekusi cloud di mana provider menjalankan kode sebagai respons terhadap *event* dan mengelola server, skala, serta sebagian besar *lifecycle runtime*. Anda *deploy* **fungsi** (FaaS) atau *managed service* (API Gateway, antrian, database) dan membayar terutama berdasarkan konsumsi alih-alalu kapasitas yang direservasi.

Namanya menyesatkan: server tetap ada—hanya diabstraksikan. Pengembang fokus pada *handler* (`onUpload`, `onHTTPRequest`, `onSchedule`) dan infrastruktur sebagai konfigurasi (IAM, *trigger*, variabel lingkungan). Platform umum: AWS Lambda, Google Cloud Functions, Azure Functions, dan Knative di Kubernetes.

Serverless cocok untuk beban berbentuk *event* dan tidak stabil. Kurang cocok untuk pekerjaan CPU-bound lama, *state* in-memory besar, latensi rendah ketat tanpa *cold start*, dan desain multi-cloud portabel tanpa disiplin.

## Key characteristics

- **Event triggers** — HTTP, *object storage*, antrian pesan, *cron*, *change stream* database.
- **Automatic scaling** — konkurensi menskala dengan beban dalam batas akun.
- **Stateless functions** — *state* tahan lama di *store* eksternal (DynamoDB, S3, Redis).
- **Operational model** — patching dan perencanaan kapasitas bergeser ke provider; observability dan batas tetap tanggung jawab Anda.

## When to use

- Traffic variabel atau tidak terduga (*webhook*, *thumbnail* gambar, ledakan ETL).
- Logika *glue* antar *managed service* cloud.
- Prototipe cepat dan alat internal dengan *headcount* ops minimal.

## When not to use

- Throughput tinggi berkelanjutan lebih murah di VM atau kontainer reservasi—modelkan biaya.
- *Worker* berjalan lama melebihi batas *timeout* fungsi.
- Jalur *hot path* sensitif latensi di mana variansi *cold start* tidak dapat diterima tanpa *provisioned concurrency*.

## Trade-offs

| Manfaat | Tantangan |
| --- | --- |
| Operasi server berkurang | *Vendor lock-in* dan batas regional |
| *Pay-per-use* granular | *Cold start*, *timeout*, langit-langit memori |
| Skala horizontal cepat | *Debugging* terdistribusi dan paritas dev lokal |

## Example

Unggahan gambar ke *object storage* memicu Lambda `ResizeThumbnail`, yang menulis turunan kembali ke *storage* dan mengirim `ThumbnailReady` ke antrian untuk pengindeksan pencarian.

```text
Client upload -> S3 -> Lambda (resize) -> S3 + SQS -> Indexer
```

Pasangkan dengan *pipeline* **CI/CD** yang mengemas fungsi dan memperbarui definisi infrastruktur (SAM, Terraform, Serverless Framework).

## Related

- [Event-Driven Architecture](event-driven-architecture_id.md) — pasangan natural dengan *trigger*
- [Microservices Architecture](microservices-architecture_id.md) — fungsi sebagai *service* halus
- [CI/CD](../../practices/integration/ci-cd_id.md) — otomatisasi *deploy* fungsi

## References

- AWS Well-Architected Serverless Lens
- Martin Fowler — definisi *serverless* dan esai trade-off
