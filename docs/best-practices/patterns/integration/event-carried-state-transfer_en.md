# Event Carried State Transfer

## Overview

**Event Carried State Transfer** (ECST) is an integration pattern where events carry enough data for consumers to update their local state without calling back to the producer or a shared database. Instead of publishing a thin notification ("order 42 changed"), the event embeds the fields subscribers need ("order 42: items, totals, shipping address").

ECST sits between **event notification** (minimal payload) and synchronous API queries. It trades payload size and some duplication for lower coupling, fewer round trips, and simpler consumer logic—especially when building read models in CQRS or maintaining denormalized caches across services.

The pattern appears naturally in event-driven microservices, data pipelines, and cache invalidation flows. It aligns with **event-driven architecture** but imposes stricter contract discipline: event schemas become integration contracts, and producers must decide which fields are safe to broadcast and how to handle partial updates.

## How it works

1. **Producer emits a rich event** after a state change—often a domain event serialized with a versioned schema.
2. **Broker** routes the event to one or more subscribers (see [Publish / Subscribe](./publish-subscribe_en.md)).
3. **Consumer applies the payload** to its local store (projection table, search index, cache) idempotently.
4. **No callback** — the consumer does not need `GET /orders/42` unless the event explicitly signals missing data or a compaction strategy.

```
Producer                Broker                 Consumer (read model)
+--------+   OrderCreated   +-------+   subscribe   +----------------+
| Orders | ---------------->| Kafka | ------------>| order_projections|
| service|  {id, lines,     |       |               | (local DB)       |
|        |   total, ...}    |       |               +----------------+
+--------+                  +-------+
```

Key practices: **schema versioning**, **idempotent handlers** (same event twice must not double-apply), and clear rules for **deletes** and **tombstones** when state is removed.

## When to use

- Consumers build **read models** or search indexes and must stay eventually consistent without chatty APIs.
- Network partitions or load make synchronous lookups on every event expensive or fragile.
- Multiple downstream services need the **same snapshot** of entity state at the time of the change.
- You already use **CQRS** or **event sourcing** and want projections fed directly from the event stream.

## When not to use

- Payloads would be huge (full document blobs, media) — prefer notification plus object storage or a dedicated fetch API.
- Data is highly sensitive and cannot be replicated to every subscriber — use minimal events and authorized lookups.
- Producers cannot guarantee **stable, versioned schemas** — ECST amplifies breaking-change pain.
- Strong consistency is required across services in the same request — ECST is asynchronous by nature.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| ECST (fat events) | Fewer API calls; simpler consumers; good for projections | Larger messages; duplicated data; schema governance |
| Event notification (thin) | Small payloads; less PII spread | Consumers must fetch; coupling to producer APIs |
| Shared database (anti-pattern) | Immediate consistency | Violates service boundaries; scaling bottleneck |
| Change Data Capture (CDC) | Accurate row-level replication | Infrastructure complexity; not domain-shaped events |

## Example

An `OrderCreated` integration event carries everything the billing and fulfillment services need:

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

The fulfillment projection upserts by `orderId`; billing records revenue without calling the orders API. Handlers use `schemaVersion` to branch mapping logic during rollout.

## Related

- [Event Notification](./event-notification_en.md)
- [CQRS](./cqrs_en.md)
- [Event Sourcing](./event-sourcing_en.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_en.md)

## References

- Martin Fowler, [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html) — fat vs notification events
- Ben Stopford, *Designing Event-Driven Systems* — state transfer in Kafka-centric designs
- Microsoft Azure Architecture Center, [Event-driven architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven)
