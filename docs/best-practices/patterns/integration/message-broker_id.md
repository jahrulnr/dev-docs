# Message Broker

## Overview

**Message broker** adalah middleware yang menerima message dari producer, menyimpan atau mem-buffer-nya, lalu mengirim ke consumer sesuai routing rule dan delivery guarantee. Broker memisahkan pengirim dari penerima dalam waktu dan ruang: producer tidak perlu consumer online saat publish, dan beberapa consumer bisa memproses stream yang sama secara independen.

Broker menjadi fondasi **event-driven architecture**, **publish/subscribe**, koreografi **saga**, dan pipeline job async. Implementasi populer termasuk Apache Kafka (durable log, throughput tinggi), RabbitMQ (routing fleksibel, AMQP), NATS, dan layanan managed cloud (Amazon SQS/SNS, Google Pub/Sub, Azure Service Bus). Broker bukan arsitektur—ini infrastruktur yang memungkinkan integrasi async yang andal.

Memilih broker melibatkan trade-off durability, ordering, latency, biaya operasional, dan ergonomi protokol. Tim sering memasangkan broker dengan **API gateway** untuk traffic edge sinkron sementara integrasi domain async mengalir lewat topic dan consumer group.

## How it works

Tanggung jawab inti:

1. **Ingress** — producer terhubung via client library atau HTTP bridge; message membawa payload, header, dan routing key.
2. **Persistence / buffering** — message bisa ditulis ke disk (Kafka log, RabbitMQ queue) atau di memory dengan TTL.
3. **Routing** — exchange, topic, partition, dan binding menentukan consumer mana yang menerima message mana.
4. **Delivery** — model push atau pull; acknowledgment (`ack`/`nack`) mengontrol retry dan perilaku dead-letter.
5. **Consumer group** — penugasan partition untuk scale horizontal sambil mempertahankan ordering per-key jika dikonfigurasi.

```
Producers                    Broker                         Consumers
+--------+                  +------------------+            +----------+
| Orders | -- publish -----> | topics / queues  | -- pull -->| Billing  |
| Inventory|                 | + retention      |            | Analytics|
+--------+                  | + DLQ            |            +----------+
                            +------------------+
```

Kepedulian operasional: sizing cluster, monitoring lag, schema registry untuk Avro/Protobuf, dan **dead-letter queue** (DLQ) untuk poison message.

## When to use

- Service harus berkomunikasi **asynchronous** dengan buffering saat outage atau lonjakan traffic.
- Anda butuh **fan-out** ke banyak consumer atau **competing consumer** untuk scale horizontal.
- **Event notification**, **event carried state transfer**, atau projection **CQRS** membutuhkan pipa durable.
- Mengintegrasikan sistem heterogen yang tidak berbagi database atau kontrak API sinkron.

## When not to use

- Request-response sederhana dengan latency rendah — HTTP atau gRPC langsung lebih jelas.
- Semantik exactly-once end-to-end antar operasi bisnis tanpa desain hati-hati — broker biasanya at-least-once; idempotency ada di consumer.
- Dua service dalam satu unit deploy tanpa kebutuhan scale independen — in-process queue mungkin cukup.
- Tim tidak punya kapasitas mengoperasikan Kafka/RabbitMQ — pertimbangkan managed cloud messaging dulu.

## Trade-offs

| Broker style | Pros | Cons |
| --- | --- | --- |
| Log-based (Kafka) | Throughput tinggi; replay; stream processing | Kompleksitas ops; kurva belajar desain topic |
| Queue-based (RabbitMQ) | Routing fleksibel; pola AMQP matang | Batas throughput vs Kafka untuk stream besar |
| Managed cloud (SQS, Pub/Sub) | Ops lebih sedikit; bayar per pemakaian | Vendor lock-in; batas fitur |
| In-memory (Redis streams, NATS core) | Latency rendah | Trade-off durability dan retention |

## Example

Service orders memublikasikan `OrderCreated` ke topic `orders.events` (Kafka). Billing dan fulfillment menjalankan consumer group terpisah—masing-masing menerima setiap message dan commit offset setelah pemrosesan berhasil.

```go
// Simplified consumer loop — idempotency required
for msg := range consumer.Messages() {
    var evt OrderCreated
    if err := json.Unmarshal(msg.Value, &evt); err != nil {
        msg.Nack(); continue
    }
    if err := projection.Upsert(ctx, evt); err != nil {
        msg.Nack(); continue // broker redelivers
    }
    msg.Ack()
}
```

Jika pemrosesan gagal berulang, arahkan ke DLQ `orders.events.dlq` untuk inspeksi manual—jangan memblokir partition seluruhnya tanpa batas pada poison payload.

## Related

- [Publish / Subscribe](./publish-subscribe_id.md)
- [Event Notification](./event-notification_id.md)
- [Saga](../transaction/saga_id.md)
- [Kafka](../../../technologies/infrastructure/kafka_id.md)

## References

- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns*
- Apache Kafka documentation, [Introduction](https://kafka.apache.org/documentation/)
- RabbitMQ documentation, [Publishers and Consumers](https://www.rabbitmq.com/docs/publishers)
