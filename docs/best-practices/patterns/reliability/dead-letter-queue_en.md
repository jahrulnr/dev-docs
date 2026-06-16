# Dead Letter Queue

## Overview

A **dead letter queue (DLQ)** is a dedicated destination for messages that cannot be processed successfully after a bounded number of attempts. Instead of infinite **retry** loops blocking the main queue or silently dropping poison payloads, failed messages land in the DLQ for inspection, replay, or discard with audit.

DLQs are central to reliable **event-driven** and asynchronous architectures. Payment webhooks, order fulfillment workers, and email dispatchers all encounter malformed payloads, schema drift, or downstream outages. The DLQ preserves evidence: original body, failure reason, attempt count, and timestamps.

Operating a DLQ is a product decision as much as a technical one. Teams need runbooks: who monitors depth, how messages are replayed after fixes, and when **idempotency** makes replay safe.

## How it works

1. **Consume** — Worker pulls from the primary queue (SQS, RabbitMQ, Kafka consumer group).
2. **Process** — Handler validates, transforms, and calls downstream systems within a **timeout**.
3. **Retry transient failures** — Network blips and 503 responses trigger **retry** with backoff; use **circuit breaker** on hot dependencies to avoid hammering them.
4. **Route to DLQ** — After `maxReceiveCount` or explicit non-retryable error (bad schema, unknown tenant), publish to DLQ with metadata (`error_class`, `last_error`, `correlation_id`).
5. **Operate** — Dashboards alert on DLQ depth; tools support replay to primary queue or a staging topic after code/schema fixes.

```text
Primary queue ──> worker ──> success ──> ack
                    │
                    ├── retry (transient)
                    └── max retries ──> DLQ ──> human / replay tool
```

**Poison messages**—permanently bad—should fail fast to DLQ without wasting retries. **Idempotent** consumers make replay safe; without **idempotency**, replay can double-charge or duplicate side effects.

## When to use

- Any async pipeline where message loss is unacceptable but some failures are expected.
- Integrations with external partners sending uneven payload quality.
- Systems already using **retry** and needing a terminal state beyond “give up silently.”
- Regulated domains requiring an auditable record of unprocessed work.

## When not to use

- Synchronous HTTP APIs—return errors to the client instead of a DLQ.
- Fire-and-forget telemetry where loss is acceptable (metrics, sampled logs).
- When no one will monitor or drain the DLQ—it becomes a graveyard masking systemic bugs.
- As a substitute for fixing root causes (schema validation belongs before enqueue).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Platform-native DLQ (e.g. SQS redrive) | Simple ops, built-in metrics | Vendor-specific semantics |
| Separate DLQ topic per domain | Clear ownership | More infrastructure |
| Auto-replay on deploy | Fast recovery | Risk without idempotency guards |
| DLQ only, no retries | No retry storms | Transient faults land in DLQ too often |

## Example

After three failed processing attempts, an order event moves to `orders-dlq`:

```json
{
  "original_queue": "orders",
  "attempts": 3,
  "last_error": "validation: missing sku",
  "correlation_id": "req-9f2a",
  "payload": { "order_id": "o-1001", "lines": [] }
}
```

Operators fix validation, deploy, and replay via a CLI that republishes to `orders` with the same `order_id` key for deduplication.

## Related

- [Retry](retry_en.md)
- [Fallback](fallback_en.md)
- [Idempotency](../../principles/distributed/idempotency_en.md)
- [Event-driven architecture](../../architecture/styles/event-driven-architecture_en.md)

## References

- [AWS SQS: dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [Apache Kafka: handling failures](https://kafka.apache.org/documentation/#design) — consumer error handling patterns.
