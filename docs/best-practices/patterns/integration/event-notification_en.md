# Event Notification

## Overview

**Event notification** is the simplest event-driven integration style: a producer announces that something happened, usually with a small payload containing identifiers and metadata, and consumers react asynchronously. The event answers "what occurred?" more than "what is the full current state?"

This pattern decouples publishers from subscribers. The orders service does not know whether email, analytics, or inventory listens—it emits `OrderShipped` and moves on. Subscribers that need more detail fetch it via API, read from a local projection fed by **event carried state transfer**, or call an **anti-corruption layer** in front of a legacy system.

Event notification is the default starting point in **event-driven architecture** because it keeps messages small, limits PII replication, and avoids tight schema coupling. The cost is extra lookups, eventual consistency, and the need for idempotent, retry-safe consumers when combined with a **message broker**.

## How it works

1. **Domain action completes** — e.g. shipment is marked dispatched in the orders aggregate.
2. **Producer publishes a notification event** — typically `{ eventType, entityId, occurredAt, correlationId }` plus optional hints.
3. **Broker** delivers to interested subscribers (topic, queue, or fan-out exchange).
4. **Consumers handle side effects** — send email, update metrics, trigger a **saga** step—often fetching supplemental data if the payload is thin.

```
Orders service          Broker              Email service
+-----------+  OrderShipped  +--------+  subscribe  +-------------+
| mark      | -------------->| topic  | ----------->| send email  |
| shipped   |  {orderId,     |        |             | (+ fetch    |
+-----------+   trackingId}  +--------+             |  template)  |
                                                     +-------------+
```

Design for **at-least-once delivery**: consumers must tolerate duplicates using idempotency keys or natural keys on writes.

## When to use

- You need **loose coupling** between teams and services with independent release cycles.
- Side effects are **asynchronous** and do not block the user-facing transaction (email, webhooks, analytics).
- Payloads should stay small for cost, privacy, or broker limits.
- Multiple unrelated consumers react to the same lifecycle event.

## When not to use

- Consumers need a full entity snapshot on every change — prefer **event carried state transfer** or CDC.
- The workflow requires guaranteed ordering across unrelated event types without careful partitioning — design topics and keys explicitly or use orchestration.
- Synchronous read-your-writes semantics are mandatory in the same user session — notification is eventually consistent.
- A single RPC call with a clear request-response contract is simpler and sufficient.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Event notification | Small messages; low coupling; easy to add subscribers | Consumers may need extra API calls |
| Event carried state transfer | Self-contained updates | Larger payloads; schema coupling |
| Direct HTTP webhook to each consumer | No broker ops | N integrations per producer; no buffer on outage |
| Polling | Simple mental model | Wasteful; higher latency |

## Example

After payment succeeds, the payments service publishes:

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

The notification service subscribes, loads the order summary via an internal API (through an ACL if the orders API is legacy-shaped), and sends the receipt email. Analytics increments a counter using only `amountCents`—no fetch required.

## Related

- [Event Carried State Transfer](./event-carried-state-transfer_en.md)
- [Publish / Subscribe](./publish-subscribe_en.md)
- [Message Broker](./message-broker_en.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_en.md)

## References

- Martin Fowler, [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html)
- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* — Event Notification pattern
- AWS, [Event-driven architecture on AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/event-driven-architecture.html)
