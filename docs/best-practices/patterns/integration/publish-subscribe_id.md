# Publish / Subscribe

## Overview

**Publish/subscribe** (pub/sub) adalah pola messaging di mana publisher mengirim message ke channel logis tanpa mengalamatkan penerima spesifik. Subscriber mendaftarkan minat pada topic atau routing key; **message broker** mengirim setiap message ke semua subscriber yang cocok. Producer dan consumer tidak perlu tahu identitas satu sama lain maupun skala masing-masing.

Pub/sub adalah tulang punggung struktural **event-driven architecture**. Pola ini memungkinkan skenario broadcast—satu event `UserRegistered` bisa memicu email sambutan, sinkronisasi CRM, dan analytics—serta mendukung scale independen armada consumer via consumer group (di broker berbasis log) atau competing subscriber (di broker berbasis queue).

Pola ini berbeda dari point-to-point queue: queue biasanya mengirim setiap message ke satu worker, sedangkan pub/sub melakukan fan-out ke semua subscriber. Broker hybrid (Kafka, RabbitMQ topic exchange) mendukung kedua model; pilih secara sengaja per use case.

## How it works

1. **Topic atau channel** — stream bernama (`orders.events`, `user.lifecycle`) yang didefinisikan konvensi atau schema registry.
2. **Publish** — producer mengirim message dengan key opsional (untuk partition affinity) dan header (trace ID, schema version).
3. **Subscription** — consumer terikat dengan filter (nama topic, pola routing key, SQL subscription di beberapa cloud).
4. **Delivery** — broker push atau consumer poll; tiap subscriber memproses dengan kecepatan sendiri dan cursor/offset terpisah.
5. **Filtering** — filter berbasis konten atau header mengurangi noise saat subscriber hanya butuh subset.

```
                    +---> Subscriber A (email)
Publisher --------->| topic |
                    +---> Subscriber B (inventory)
                    +---> Subscriber C (analytics)
```

Gabungkan pub/sub dengan **event notification** (event tipis) atau **event carried state transfer** (event gemuk) sesuai kebutuhan data consumer. Pakai orchestration **saga** saat beberapa subscriber harus mengoordinasikan transaksi terdistribusi.

## When to use

- Banyak service perlu bereaksi pada **business event yang sama** secara independen.
- Anda ingin menambah consumer baru **tanpa mengubah producer** (open for extension).
- Workload secara alami **broadcast** atau berorientasi stream (metrics, audit, replikasi).
- Memisahkan release cycle—subscriber bisa deploy, scale, atau gagal tanpa memblokir publisher.

## When not to use

- Tepat satu worker harus memproses setiap task — gunakan **work queue** (competing consumer pada satu queue), bukan fan-out pub/sub.
- Korelasi request-response dalam satu panggilan sinkron — HTTP/gRPC lebih sederhana.
- Jaminan ordering global untuk semua tipe event — ordering pub/sub per topic/partition butuh desain key yang hati-hati.
- Volume message sangat rendah di mana cron poll atau webhook langsung sudah cukup.

## Trade-offs

| Model | Pros | Cons |
| --- | --- | --- |
| Pub/sub fan-out | Loose coupling; mudah tambah subscriber | Setiap subscriber melihat setiap message—biaya di scale besar |
| Work queue (point-to-point) | Load balancing; satu handler per message | Tidak ada broadcast tanpa publish tambahan |
| Topic + consumer group (Kafka) | Replay; scale per consumer group | Disiplin desain topic/partition |
| Cloud event bus (EventBridge) | Routing rule managed | Semantik khusus vendor |

## Example

Setelah pembuatan site di control plane hosting, `site.after_create` dipublikasikan ke topic `controlplane.events`:

```json
{
  "eventType": "SiteCreated",
  "siteId": "site_abc123",
  "domain": "app.example.com",
  "plan": "pro",
  "occurredAt": "2026-06-16T09:00:00Z"
}
```

Subscriber bereaksi independen: generator config nginx membuat vhost, billing menambah usage, observability memberi tag tenant, dan webhook dispatcher memberi tahu **extensibility hooks** eksternal. Tidak ada service tersebut di kode publisher—hanya kontrak topic yang mengikat mereka.

## Related

- [Message Broker](./message-broker_id.md)
- [Event Notification](./event-notification_id.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_id.md)
- [Extensibility Hooks](./extensibility-hooks_id.md)

## References

- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* — Publish-Subscribe Channel
- Martin Fowler, [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- Google Cloud, [Pub/Sub documentation](https://cloud.google.com/pubsub/docs)
