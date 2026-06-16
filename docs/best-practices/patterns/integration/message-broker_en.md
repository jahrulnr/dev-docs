# Message Broker

## Overview

A **message broker** is middleware that receives messages from producers, stores or buffers them, and delivers them to consumers according to routing rules and delivery guarantees. Brokers decouple senders from receivers in time and space: producers do not need consumers online at publish time, and multiple consumers can process the same stream independently.

Brokers underpin **event-driven architecture**, **publish/subscribe**, **saga** choreography, and async job pipelines. Popular implementations include Apache Kafka (durable log, high throughput), RabbitMQ (flexible routing, AMQP), NATS, and cloud-managed services (Amazon SQS/SNS, Google Pub/Sub, Azure Service Bus). The broker is not the architecture—it is infrastructure that makes reliable async integration possible.

Choosing a broker involves trade-offs among durability, ordering, latency, operational cost, and protocol ergonomics. Teams often pair a broker with an **API gateway** for synchronous edge traffic while async domain integration flows through topics and consumer groups.

## How it works

Core responsibilities:

1. **Ingress** — producers connect via client libraries or HTTP bridges; messages carry payload, headers, and routing keys.
2. **Persistence / buffering** — messages may be written to disk (Kafka log, RabbitMQ queues) or held in memory with TTL.
3. **Routing** — exchanges, topics, partitions, and bindings determine which consumers receive which messages.
4. **Delivery** — push or pull models; acknowledgments (`ack`/`nack`) control retry and dead-letter behavior.
5. **Consumer groups** — partition assignment for horizontal scale while preserving per-key ordering where configured.

```
Producers                    Broker                         Consumers
+--------+                  +------------------+            +----------+
| Orders | -- publish -----> | topics / queues  | -- pull -->| Billing  |
| Inventory|                 | + retention      |            | Analytics|
+--------+                  | + DLQ            |            +----------+
                            +------------------+
```

Operational concerns: cluster sizing, monitoring lag, schema registry for Avro/Protobuf, and **dead-letter queues** (DLQ) for poison messages.

## When to use

- Services must communicate **asynchronously** with buffering during outages or traffic spikes.
- You need **fan-out** to many consumers or **competing consumers** for horizontal scale.
- **Event notification**, **event carried state transfer**, or **CQRS** projections require a durable pipe.
- Integrating heterogeneous systems that do not share a database or synchronous API contract.

## When not to use

- Simple request-response with low latency — direct HTTP or gRPC is clearer.
- Exactly-once end-to-end semantics across business operations without careful design — brokers typically offer at-least-once; idempotency belongs in consumers.
- Two services in one deployable unit with no scale independence — an in-process queue may suffice.
- Team lacks capacity to operate Kafka/RabbitMQ — consider managed cloud messaging first.

## Trade-offs

| Broker style | Pros | Cons |
| --- | --- | --- |
| Log-based (Kafka) | High throughput; replay; stream processing | Ops complexity; topic design learning curve |
| Queue-based (RabbitMQ) | Flexible routing; mature AMQP patterns | Throughput ceiling vs Kafka for huge streams |
| Managed cloud (SQS, Pub/Sub) | Less ops; pay per use | Vendor lock-in; feature limits |
| In-memory (Redis streams, NATS core) | Low latency | Durability and retention trade-offs |

## Example

Orders service publishes `OrderCreated` to topic `orders.events` (Kafka). Billing and fulfillment run separate consumer groups—each receives every message and commits offsets after successful processing.

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

If processing fails repeatedly, route to DLQ `orders.events.dlq` for manual inspection—never block the whole partition indefinitely on poison payloads.

## Related

- [Publish / Subscribe](./publish-subscribe_en.md)
- [Event Notification](./event-notification_en.md)
- [Saga](../transaction/saga_en.md)
- [Kafka](../../../technologies/infrastructure/kafka_en.md)

## References

- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns*
- Apache Kafka documentation, [Introduction](https://kafka.apache.org/documentation/)
- RabbitMQ documentation, [Publishers and Consumers](https://www.rabbitmq.com/docs/publishers)
