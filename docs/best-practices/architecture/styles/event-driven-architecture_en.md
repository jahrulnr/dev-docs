# Event-Driven Architecture

## Overview

**Event-Driven Architecture** (EDA) is an architectural style where components collaborate by producing and consuming **events**—immutable notifications that something happened (`OrderPlaced`, `FileUploaded`, `SensorReading`). Producers do not address specific consumers; an **event broker** or bus routes messages to interested subscribers.

EDA decouples services in time and space: publishers remain available when subscribers are down (with durable queues), and new consumers can attach without changing producers. It suits reactive workflows, audit trails, integration across bounded contexts, and systems that must scale ingestion independently from processing.

The trade-offs are operational and logical: eventual consistency, idempotent consumers, ordering guarantees, poison-message handling, and distributed tracing across async hops require explicit design. EDA is not a substitute for synchronous queries when users need an immediate read-your-writes response.

## Key characteristics

- **Asynchronous messaging** — Kafka, RabbitMQ, NATS, cloud pub/sub, or in-process buses.
- **Loose coupling** — schema contracts (Avro, JSON Schema, protobuf) replace direct API coupling.
- **Event notification vs event-carried state** — thin events vs payloads with data; choose per latency and consistency needs.
- **Complementary patterns** — event sourcing, CQRS, sagas for long-running distributed transactions.

## When to use

- Integrate many services without point-to-point HTTP meshes.
- Peak load buffering, fan-out notifications, or stream processing pipelines.
- Audit, analytics, and replay from an event log.

## When not to use

- Simple CRUD with strong immediate consistency on a single database.
- Teams lack maturity in message ops (monitoring lag, DLQ, replay).
- Debugging synchronous call chains is already hard—async multiplies observability needs.

## Trade-offs

| Benefits | Challenges |
| --- | --- |
| Scalability and independent deployment | Eventual consistency and duplicate delivery |
| Extensibility (new consumers) | Schema evolution and contract testing |
| Resilience with durable queues | Harder end-to-end debugging without tracing |

## Example

An `OrderService` publishes `OrderPlaced` to a topic. `InventoryService` reserves stock; `EmailService` sends confirmation; `AnalyticsService` updates dashboards—all subscribe without the order API knowing their endpoints.

```text
OrderService --(OrderPlaced)--> Event Bus --> InventoryService
                              \-> EmailService
                              \-> AnalyticsService
```

Use **outbox pattern** to atomically persist domain state and outbound events.

## Related

- [Microservices Architecture](microservices-architecture_en.md) — often combined with EDA
- [Serverless Architecture](serverless-architecture_en.md) — functions triggered by events
- [Kafka](../../technologies/infrastructure/kafka_en.md) — common event backbone

## References

- Martin Fowler — event-driven architecture articles
- Enterprise Integration Patterns (Hohpe & Woolf) — messaging foundations
