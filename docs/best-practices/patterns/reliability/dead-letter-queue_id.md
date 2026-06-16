# Dead Letter Queue

## Overview

**Dead letter queue (DLQ)** adalah destinasi khusus untuk message yang tidak bisa diproses dengan sukses setelah jumlah percobaan terbatas. Alih-alih loop **retry** tak terbatas yang memblokir main queue atau menjatuhkan poison payload secara diam-diam, message gagal mendarat di DLQ untuk inspeksi, replay, atau discard dengan audit.

DLQ sentral di arsitektur **event-driven** dan asynchronous yang reliable. Webhook pembayaran, worker fulfillment order, dan dispatcher email semua menghadapi payload malformed, schema drift, atau outage downstream. DLQ menyimpan bukti: body asli, alasan kegagalan, jumlah attempt, dan timestamp.

Mengoperasikan DLQ adalah keputusan produk sekaligus teknis. Tim membutuhkan runbook: siapa memonitor depth, bagaimana message di-replay setelah perbaikan, dan kapan **idempotency** membuat replay aman.

## How it works

1. **Consume** — Worker menarik dari primary queue (SQS, RabbitMQ, Kafka consumer group).
2. **Process** — Handler memvalidasi, mentransformasi, dan memanggil sistem downstream dalam **timeout**.
3. **Retry kegagalan transient** — Gangguan jaringan dan respons 503 memicu **retry** dengan backoff; gunakan **circuit breaker** pada dependency panas agar tidak memukul berulang.
4. **Route ke DLQ** — Setelah `maxReceiveCount` atau error non-retryable eksplisit (schema buruk, tenant tidak dikenal), publish ke DLQ dengan metadata (`error_class`, `last_error`, `correlation_id`).
5. **Operate** — Dashboard meng-alert depth DLQ; tool mendukung replay ke primary queue atau staging topic setelah perbaikan kode/schema.

```text
Primary queue ──> worker ──> success ──> ack
                    │
                    ├── retry (transient)
                    └── max retries ──> DLQ ──> human / replay tool
```

**Poison message**—buruk permanen—harus fail fast ke DLQ tanpa membuang retry. Consumer **idempotent** membuat replay aman; tanpa **idempotency**, replay bisa double-charge atau menduplikasi side effect.

## When to use

- Pipeline async di mana kehilangan message tidak dapat diterima tetapi beberapa kegagalan diharapkan.
- Integrasi dengan partner eksternal yang mengirim kualitas payload tidak merata.
- Sistem yang sudah memakai **retry** dan membutuhkan terminal state di luar “menyerah diam-diam”.
- Domain regulated yang membutuhkan catatan auditable pekerjaan yang tidak terproses.

## When not to use

- HTTP API synchronous—kembalikan error ke client, bukan DLQ.
- Telemetri fire-and-forget di mana kehilangan dapat diterima (metrics, log sampled).
- Ketika tidak ada yang memonitor atau menguras DLQ—menjadi kuburan yang menyembunyikan bug sistemik.
- Sebagai pengganti memperbaiki root cause (validasi schema seharusnya sebelum enqueue).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| DLQ native platform (mis. SQS redrive) | Ops sederhana, metrics bawaan | Semantik spesifik vendor |
| Topik DLQ terpisah per domain | Kepemilikan jelas | Lebih banyak infrastruktur |
| Auto-replay saat deploy | Recovery cepat | Risiko tanpa guard idempotency |
| DLQ saja, tanpa retry | Tanpa retry storm | Fault transient terlalu sering ke DLQ |

## Example

Setelah tiga percobaan pemrosesan gagal, event order pindah ke `orders-dlq`:

```json
{
  "original_queue": "orders",
  "attempts": 3,
  "last_error": "validation: missing sku",
  "correlation_id": "req-9f2a",
  "payload": { "order_id": "o-1001", "lines": [] }
}
```

Operator memperbaiki validasi, deploy, dan replay via CLI yang republish ke `orders` dengan key `order_id` sama untuk deduplikasi.

## Related

- [Retry](retry_id.md)
- [Fallback](fallback_id.md)
- [Idempotency](../../principles/distributed/idempotency_id.md)
- [Event-driven architecture](../../architecture/styles/event-driven-architecture_id.md)

## References

- [AWS SQS: dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [Apache Kafka: handling failures](https://kafka.apache.org/documentation/#design) — pola penanganan error consumer.
