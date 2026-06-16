# Anti-Corruption Layer (ACL)

## Overview

An **anti-corruption layer** (ACL) is a boundary component that translates between an external system's model, protocol, or data format and your application's internal domain model. The name comes from Domain-Driven Design (DDD): without translation, foreign concepts leak into your bounded context and gradually corrupt your ubiquitous language and invariants.

ACL is not merely an adapter at the network edge. It is a deliberate **semantic firewall**—mapping legacy status codes to domain enums, reshaping third-party payloads into aggregates, and hiding versioning quirks of SaaS APIs from the rest of the codebase. The host application speaks only its own types; the ACL owns all knowledge of the outsider.

Teams most often introduce an ACL when integrating ERP, payment gateways, CRM, or decades-old mainframe exports. The alternative—letting `PaymentProviderResponse` structs appear in domain services—couples business rules to vendor field names and makes every upstream schema change a domain-wide refactor.

## How it works

1. **Facade** — a narrow interface your domain calls (e.g. `BillingPort`, `LegacyInventoryClient`).
2. **Translator** — maps external DTOs ↔ domain objects; validates and rejects invalid foreign data at the boundary.
3. **Adapter** — handles wire protocol (REST, SOAP, file drop, message queue).
4. **Anti-corruption in both directions** — outbound commands and inbound events both pass through translation so neither side's model crosses the line.

```
  Domain layer          ACL                    External system
  +-----------+    +------------------+    +------------------+
  | Order     |--->| Translator       |--->| Legacy SOAP API  |
  | Service   |<---| + Adapter        |<---| (alien schema)   |
  +-----------+    +------------------+    +------------------+
```

The ACL may be a dedicated package, microservice, or sidecar. Keep it **stateless** where possible; cache foreign lookups behind the facade, not in domain entities.

## When to use

- Integrating **legacy or third-party systems** whose data model does not align with your domain.
- A **bounded context** must stay pure while another team or vendor owns the upstream schema.
- External APIs change frequently and you want a single place to absorb versioning.
- You are strangling a monolith and need a stable seam between old and new stacks.

## When not to use

- The external API already matches your domain one-to-one — a thin HTTP client may suffice.
- You control both sides and can evolve a **shared contract** (internal gRPC, OpenAPI owned jointly).
- The integration is a one-off script with no business logic — over-abstracting adds cost without benefit.
- Latency-sensitive paths where an extra mapping hop is unacceptable without caching (measure first).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Dedicated ACL service | Isolates foreign model completely; team can deploy independently | Network hop, operational overhead |
| In-process ACL package | Low latency, simple testing | Foreign types can still tempt imports if discipline slips |
| Direct domain mapping (no ACL) | Less code initially | Domain polluted; refactors spread everywhere |
| API gateway only | Central auth, routing | Gateway should not own business translation — wrong layer |

## Example

A shipping service exposes `ShipmentStatus` as single-letter codes (`P`, `D`, `X`). Your domain uses `ShipmentLifecycle` with explicit states and business rules.

```go
// acl/shipping/facade.go — domain sees only this
type ShipmentPort interface {
    Track(ctx context.Context, id ShipmentID) (domain.Shipment, error)
}

// acl/shipping/translator.go — foreign knowledge quarantined here
func toDomain(raw legacy.TrackResponse) (domain.Shipment, error) {
    status, ok := statusMap[raw.Code] // P -> InTransit, etc.
    if !ok {
        return domain.Shipment{}, fmt.Errorf("unknown legacy code: %s", raw.Code)
    }
    return domain.Shipment{ID: raw.Ref, Status: status, ...}, nil
}
```

Domain services depend on `ShipmentPort`, never on `legacy.TrackResponse`.

## Related

- [Domain-Driven Design (DDD)](../../architecture/patterns/ddd_en.md)
- [API Gateway](./api-gateway_en.md)
- [Event Notification](./event-notification_en.md)
- [CQRS](./cqrs_en.md)

## References

- Eric Evans, *Domain-Driven Design* — integrating bounded contexts and translation layers
- Vaughn Vernon, *Implementing Domain-Driven Design* — anti-corruption layer patterns in practice
- Martin Fowler, [Anti-Corruption Layer](https://martinfowler.com/bliki/AntiCorruptionLayer.html)
