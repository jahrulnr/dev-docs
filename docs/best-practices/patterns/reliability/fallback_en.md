# Fallback

## Overview

The **fallback** pattern provides an alternative code path when a primary dependency fails or exceeds its **timeout**, allowing the system to degrade gracefully instead of failing the entire user request. Fallbacks trade perfect freshness or feature completeness for continued availability—a cached product catalog, a default configuration, or a queued async response instead of a synchronous error.

Fallbacks appear throughout resilient systems: CDN stale-while-revalidate, read replicas when the primary DB is slow, and static “maintenance” pages when payment APIs are down. They work best alongside **circuit breaker** (stop calling the broken dependency), **retry** (only for transient faults), and clear product rules about what degraded mode means for the customer.

A fallback is not a silent lie. Users and operators should understand when data may be stale or a feature is temporarily unavailable; **structured logging** and **metrics** should tag fallback usage rates.

## How it works

1. **Define primary path** — Normal business logic calls the authoritative service or datastore.
2. **Detect failure** — Errors, **timeout**, or open circuit trigger the fallback branch.
3. **Select alternative** — Cache hit, secondary region, simplified computation, or safe default value.
4. **Return with signal** — HTTP header, response field (`degraded: true`), or metric increment so clients and dashboards know fallback occurred.
5. **Recover automatically** — When the primary heals, traffic returns without manual switch—circuit half-open probes verify recovery.

```text
Request ──> try primary ──> OK ──> response (fresh)
                │
                fail / timeout / circuit open
                v
            fallback (cache / default / async accept)
```

**Chained fallbacks** (primary → cache → hardcoded default) increase resilience but complicate testing—document order and preconditions. **Write paths** need stricter rules than reads; do not “fallback” a failed payment capture into success.

## When to use

- Read-heavy APIs where slightly stale data beats a 503 for users.
- Optional enrichments (recommendations, ratings) that should not block core checkout.
- Regional or dependency outages where a secondary source exists.
- Mobile or flaky networks where fast degraded UI beats long hangs—pair with **timeout**.

## When not to use

- Financial authorization, inventory reservation, or safety-critical commits—fail closed instead.
- When fallback data is misleading (medical dosing, legal balances) without explicit user warning.
- As a permanent crutch for an unreliably primary that should be fixed or isolated with **bulkhead**.
- Replacing **dead letter queue** for async work—queue for later processing is different from inline fallback.

## Trade-offs

| Strategy | Pros | Cons |
| --- | --- | --- |
| Cache fallback | Fast, reduces load on primary | Staleness, invalidation complexity |
| Static default | Predictable | May violate business rules |
| Async accept (“we’ll email you”) | Honest UX | Requires durable queue + DLQ ops |
| Feature toggle off | Simple ops story | Product surface shrinks |

## Example

Product detail service tries live inventory; on failure serves cached stock with a flag:

```go
stock, err := inventoryClient.GetStock(ctx, sku)
if err != nil {
    metrics.FallbackTotal.Inc()
    stock = cache.GetStock(sku) // may be stale
    w.Header().Set("X-Data-Source", "cache")
}
json.NewEncoder(w).Encode(map[string]any{"sku": sku, "stock": stock})
```

Alert if `fallback_total` exceeds 5% for 10 minutes—likely upstream degradation.

## Related

- [Circuit breaker](circuit-breaker_en.md)
- [Retry](retry_en.md)
- [Timeout](timeout_en.md)
- [Metrics collection](../observability/metrics-collection_en.md)

## References

- [Microsoft Azure Architecture Center: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — often combined with fallback.
- [Release It! (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) — stability patterns including graceful degradation.
