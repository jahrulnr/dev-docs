# Event Carried State Transfer

## Overview

**Event Carried State Transfer** (ECST) adalah pola integrasi di mana event membawa data yang cukup agar consumer bisa memperbarui state lokal tanpa memanggil balik producer atau database bersama. Alih-alih memublikasikan notifikasi tipis ("order 42 berubah"), event menyertakan field yang dibutuhkan subscriber ("order 42: items, total, alamat pengiriman").

ECST berada di antara **event notification** (payload minimal) dan query API sinkron. Pola ini menukar ukuran payload dan sedikit duplikasi demi coupling lebih rendah, round trip lebih sedikit, dan logika consumer lebih sederhana—terutama saat membangun read model di CQRS atau memelihara cache denormalized antar service.

Pola ini muncul alami di microservice event-driven, data pipeline, dan alur cache invalidation. ECST selaras dengan **event-driven architecture** tetapi menuntut disiplin kontrak lebih ketat: event schema menjadi integration contract, dan producer harus memutuskan field mana yang aman di-broadcast serta cara menangani partial update.

## How it works

1. **Producer mengirim event kaya** setelah perubahan state—sering domain event yang diserialisasi dengan schema berversi.
2. **Broker** merutekan event ke satu atau lebih subscriber (lihat [Publish / Subscribe](./publish-subscribe_id.md)).
3. **Consumer menerapkan payload** ke store lokal (tabel projection, search index, cache) secara idempotent.
4. **Tanpa callback** — consumer tidak perlu `GET /orders/42` kecuali event secara eksplisit menandakan data hilang atau strategi compaction.

```
Producer                Broker                 Consumer (read model)
+--------+   OrderCreated   +-------+   subscribe   +----------------+
| Orders | ---------------->| Kafka | ------------>| order_projections|
| service|  {id, lines,     |       |               | (local DB)       |
|        |   total, ...}    |       |               +----------------+
+--------+                  +-------+
```

Praktik utama: **schema versioning**, **idempotent handler** (event yang sama dua kali tidak boleh double-apply), dan aturan jelas untuk **delete** dan **tombstone** saat state dihapus.

## When to use

- Consumer membangun **read model** atau search index dan harus tetap eventually consistent tanpa API yang chatty.
- Partisi jaringan atau beban membuat lookup sinkron pada setiap event mahal atau rapuh.
- Beberapa downstream service membutuhkan **snapshot entity yang sama** pada saat perubahan.
- Anda sudah memakai **CQRS** atau **event sourcing** dan ingin projection diisi langsung dari event stream.

## When not to use

- Payload akan sangat besar (blob dokumen penuh, media) — utamakan notification plus object storage atau fetch API khusus.
- Data sangat sensitif dan tidak boleh direplikasi ke setiap subscriber — gunakan event minimal dan lookup berotorisasi.
- Producer tidak bisa menjamin **schema stabil dan berversi** — ECST memperbesar dampak breaking change.
- Strong consistency dibutuhkan antar service dalam request yang sama — ECST bersifat asynchronous.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| ECST (fat event) | API call lebih sedikit; consumer lebih sederhana; bagus untuk projection | Message lebih besar; data terduplikasi; schema governance |
| Event notification (thin) | Payload kecil; PII lebih sedikit menyebar | Consumer harus fetch; coupling ke API producer |
| Shared database (anti-pattern) | Konsistensi langsung | Melanggar batas service; bottleneck scaling |
| Change Data Capture (CDC) | Replikasi tingkat baris akurat | Kompleksitas infrastruktur; event tidak berbentuk domain |

## Example

Integration event `OrderCreated` membawa semua yang dibutuhkan service billing dan fulfillment:

```json
{
  "eventType": "OrderCreated",
  "schemaVersion": 2,
  "orderId": "ord_7f3a",
  "customerId": "cus_9b2c",
  "lines": [
    { "sku": "WIDGET-01", "qty": 2, "unitPrice": 1499 }
  ],
  "totalCents": 2998,
  "shippingAddress": { "city": "Jakarta", "postalCode": "10110" },
  "occurredAt": "2026-06-16T08:00:00Z"
}
```

Projection fulfillment melakukan upsert berdasarkan `orderId`; billing mencatat revenue tanpa memanggil orders API. Handler memakai `schemaVersion` untuk branching logika mapping saat rollout.

## Related

- [Event Notification](./event-notification_id.md)
- [CQRS](./cqrs_id.md)
- [Event Sourcing](./event-sourcing_id.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_id.md)

## References

- Martin Fowler, [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html) — fat vs notification events
- Ben Stopford, *Designing Event-Driven Systems* — state transfer in Kafka-centric designs
- Microsoft Azure Architecture Center, [Event-driven architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven)
