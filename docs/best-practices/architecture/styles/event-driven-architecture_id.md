# Event-Driven Architecture

## Overview

**Event-Driven Architecture** (EDA) adalah gaya arsitektur di mana komponen berkolaborasi dengan memproduksi dan mengonsumsi **event**—notifikasi *immutable* bahwa sesuatu terjadi (`OrderPlaced`, `FileUploaded`, `SensorReading`). *Producer* tidak mengalamatkan *consumer* tertentu; **event broker** atau *bus* merutekan pesan ke *subscriber* yang tertarik.

EDA memisahkan *service* dalam waktu dan ruang: *publisher* tetap tersedia saat *subscriber* down (dengan antrian tahan lama), dan *consumer* baru bisa menempel tanpa mengubah *producer*. Cocok untuk alur reaktif, jejak audit, integrasi antar *bounded context*, dan sistem yang harus menskalakan ingest terpisah dari pemrosesan.

Trade-off-nya operasional dan logis: *eventual consistency*, *consumer* idempoten, jaminan urutan, penanganan *poison message*, dan *distributed tracing* lintas lompatan async butuh desain eksplisit. EDA bukan pengganti query sinkron saat pengguna butuh respons *read-your-writes* segera.

## Key characteristics

- **Asynchronous messaging** — Kafka, RabbitMQ, NATS, *cloud pub/sub*, atau *bus* dalam proses.
- **Loose coupling** — kontrak skema (Avro, JSON Schema, protobuf) menggantikan coupling API langsung.
- **Event notification vs event-carried state** — *event* tipis vs payload berisi data; pilih sesuai latensi dan konsistensi.
- **Pola pelengkap** — *event sourcing*, CQRS, *saga* untuk transaksi terdistribusi berjalan lama.

## When to use

- Mengintegrasikan banyak *service* tanpa jaring HTTP titik-ke-titik.
- Penyangga beban puncak, notifikasi *fan-out*, atau *pipeline stream processing*.
- Audit, analitik, dan *replay* dari *event log*.

## When not to use

- CRUD sederhana dengan konsistensi kuat segera pada satu database.
- Tim belum matang dalam operasi pesan (memantau *lag*, DLQ, *replay*).
- Debugging rantai panggilan sinkron sudah sulit—async melipatgandakan kebutuhan observability.

## Trade-offs

| Manfaat | Tantangan |
| --- | --- |
| Skalabilitas dan *deploy* independen | *Eventual consistency* dan pengiriman duplikat |
| Ekstensibilitas (*consumer* baru) | Evolusi skema dan *contract testing* |
| Ketahanan dengan antrian tahan lama | *Debugging* end-to-end lebih sulit tanpa *tracing* |

## Example

`OrderService` mempublikasikan `OrderPlaced` ke topik. `InventoryService` mereservasi stok; `EmailService` mengirim konfirmasi; `AnalyticsService` memperbarui dasbor—semua berlangganan tanpa API pesanan mengetahui *endpoint* mereka.

```text
OrderService --(OrderPlaced)--> Event Bus --> InventoryService
                              \-> EmailService
                              \-> AnalyticsService
```

Gunakan **outbox pattern** untuk secara atomik mempersist *domain state* dan *event* keluar.

## Related

- [Microservices Architecture](microservices-architecture_id.md) — sering dikombinasikan dengan EDA
- [Serverless Architecture](serverless-architecture_id.md) — fungsi dipicu *event*
- [Kafka](../../technologies/infrastructure/kafka_id.md) — tulang punggung *event* umum

## References

- Martin Fowler — artikel *event-driven architecture*
- Enterprise Integration Patterns (Hohpe & Woolf) — landasan *messaging*
