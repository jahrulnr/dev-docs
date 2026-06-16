# Publish / Subscribe

## Overview

**Publish/subscribe** (pub/sub) is a messaging pattern where publishers send messages to a logical channel without addressing specific receivers. Subscribers register interest in topics or routing keys; the **message broker** delivers each message to every matching subscriber. Producers and consumers remain unaware of each other's identity and scale.

Pub/sub is the structural backbone of **event-driven architecture**. It enables broadcast scenarios—one `UserRegistered` event can trigger welcome email, CRM sync, and analytics—and supports independent scaling of consumer fleets via consumer groups (in log-based brokers) or competing subscribers (in queue-based brokers).

The pattern differs from point-to-point queues: a queue typically delivers each message to one worker, while pub/sub fan-out copies to all subscribers. Hybrid brokers (Kafka, RabbitMQ topic exchanges) support both models; choose deliberately per use case.

## How it works

1. **Topic or channel** — a named stream (`orders.events`, `user.lifecycle`) defined by convention or schema registry.
2. **Publish** — producer sends a message with optional key (for partition affinity) and headers (trace ID, schema version).
3. **Subscription** — consumers bind with filters (topic name, routing key pattern, SQL subscription in some clouds).
4. **Delivery** — broker pushes or consumers poll; each subscriber processes at its own pace with separate cursor/offset.
5. **Filtering** — content-based or header-based filters reduce noise when subscribers need only a subset.

```
                    +---> Subscriber A (email)
Publisher --------->| topic |
                    +---> Subscriber B (inventory)
                    +---> Subscriber C (analytics)
```

Combine pub/sub with **event notification** (thin events) or **event carried state transfer** (fat events) depending on consumer data needs. Use **saga** orchestration when multiple subscribers must coordinate a distributed transaction.

## When to use

- Many services need to react to the **same business event** independently.
- You want to add new consumers **without changing producers** (open for extension).
- Workloads are naturally **broadcast** or stream-oriented (metrics, audit, replication).
- Decoupling release cycles—subscribers can deploy, scale, or fail without blocking publishers.

## When not to use

- Exactly one worker must process each task — use a **work queue** (competing consumers on a single queue), not fan-out pub/sub.
- Request-response correlation in one synchronous call — HTTP/gRPC is simpler.
- Ordering guarantees across all event types globally — pub/sub per topic/partition ordering requires careful key design.
- Very low message volume where a cron poll or direct webhook suffices.

## Trade-offs

| Model | Pros | Cons |
| --- | --- | --- |
| Pub/sub fan-out | Loose coupling; easy new subscribers | Every subscriber sees every message—cost at scale |
| Work queue (point-to-point) | Load balancing; one handler per message | No broadcast without extra publish |
| Topic + consumer groups (Kafka) | Replay; scale per consumer group | Topic/partition design discipline |
| Cloud event buses (EventBridge) | Managed routing rules | Vendor-specific semantics |

## Example

After site creation in a hosting control plane, `site.after_create` is published to topic `controlplane.events`:

```json
{
  "eventType": "SiteCreated",
  "siteId": "site_abc123",
  "domain": "app.example.com",
  "plan": "pro",
  "occurredAt": "2026-06-16T09:00:00Z"
}
```

Subscribers react independently: nginx config generator provisions vhost, billing increments usage, observability tags the tenant, and a webhook dispatcher notifies external **extensibility hooks**. None of these services appear in the publisher's code—only the topic contract binds them.

## Related

- [Message Broker](./message-broker_en.md)
- [Event Notification](./event-notification_en.md)
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_en.md)
- [Extensibility Hooks](./extensibility-hooks_en.md)

## References

- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* — Publish-Subscribe Channel
- Martin Fowler, [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- Google Cloud, [Pub/Sub documentation](https://cloud.google.com/pubsub/docs)
