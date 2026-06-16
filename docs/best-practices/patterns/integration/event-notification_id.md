# Event Notification

## Overview

**Event notification** adalah gaya integrasi event-driven paling sederhana: producer mengumumkan bahwa sesuatu terjadi, biasanya dengan payload kecil berisi identifier dan metadata, lalu consumer bereaksi secara asynchronous. Event menjawab "apa yang terjadi?" lebih daripada "bagaimana state lengkap saat ini?".

Pola ini memisahkan publisher dari subscriber. Service orders tidak perlu tahu apakah email, analytics, atau inventory yang mendengarkan—ia mengirim `OrderShipped` lalu melanjutkan. Subscriber yang butuh detail lebih mem-fetch via API, membaca projection lokal yang diisi **event carried state transfer**, atau memanggil **anti-corruption layer** di depan sistem legacy.

Event notification adalah titik awal default di **event-driven architecture** karena message tetap kecil, replikasi PII terbatas, dan menghindari schema coupling ketat. Biayanya: lookup tambahan, eventual consistency, dan kebutuhan consumer idempotent serta aman retry saat dikombinasikan dengan **message broker**.

## How it works

1. **Aksi domain selesai** — mis. shipment ditandai dispatched di aggregate orders.
2. **Producer memublikasikan notification event** — biasanya `{ eventType, entityId, occurredAt, correlationId }` plus hint opsional.
3. **Broker** mengirim ke subscriber yang tertarik (topic, queue, atau fan-out exchange).
4. **Consumer menangani side effect** — kirim email, update metrics, picu langkah **saga**—sering fetch data tambahan jika payload tipis.

```
Orders service          Broker              Email service
+-----------+  OrderShipped  +--------+  subscribe  +-------------+
| mark      | -------------->| topic  | ----------->| send email  |
| shipped   |  {orderId,     |        |             | (+ fetch    |
+-----------+   trackingId}  +--------+             |  template)  |
                                                     +-------------+
```

Rancang untuk **at-least-once delivery**: consumer harus toleran duplikat memakai idempotency key atau natural key pada write.

## When to use

- Anda butuh **loose coupling** antar tim dan service dengan release cycle independen.
- Side effect bersifat **asynchronous** dan tidak memblokir transaksi yang menghadap user (email, webhook, analytics).
- Payload harus tetap kecil demi biaya, privasi, atau limit broker.
- Beberapa consumer tidak terkait bereaksi pada event lifecycle yang sama.

## When not to use

- Consumer butuh snapshot entity penuh pada setiap perubahan — utamakan **event carried state transfer** atau CDC.
- Workflow membutuhkan ordering terjamin antar tipe event tidak terkait tanpa partisi yang hati-hati — rancang topic dan key eksplisit atau pakai orchestration.
- Read-your-writes sinkron wajib dalam sesi user yang sama — notification bersifat eventually consistent.
- Satu panggilan RPC dengan kontrak request-response jelas lebih sederhana dan cukup.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Event notification | Message kecil; coupling rendah; mudah tambah subscriber | Consumer mungkin butuh API call tambahan |
| Event carried state transfer | Update mandiri | Payload lebih besar; schema coupling |
| Direct HTTP webhook ke tiap consumer | Tanpa ops broker | N integrasi per producer; tidak ada buffer saat outage |
| Polling | Model mental sederhana | Boros; latency lebih tinggi |

## Example

Setelah payment berhasil, service payments memublikasikan:

```json
{
  "eventType": "PaymentCaptured",
  "paymentId": "pay_3k9m",
  "orderId": "ord_7f3a",
  "amountCents": 2998,
  "occurredAt": "2026-06-16T08:05:00Z",
  "correlationId": "req_a1b2c3"
}
```

Service notification berlangganan, memuat ringkasan order via internal API (melalui ACL jika orders API berbentuk legacy), lalu mengirim email receipt. Analytics menambah counter hanya dengan `amountCents`—tanpa fetch.

## Related

- [Event Carried State Transfer](./event-carried-state-transfer_id.md)
- [Publish / Subscribe](./publish-subscribe_id.md)
- [Message Broker](./message-broker_id.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_id.md)

## References

- Martin Fowler, [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html)
- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* — Event Notification pattern
- AWS, [Event-driven architecture on AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/event-driven-architecture.html)
