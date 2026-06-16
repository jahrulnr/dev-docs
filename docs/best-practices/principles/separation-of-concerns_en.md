# Separation of Concerns

## Overview

**Separation of Concerns** (SoC) divides a system into distinct sections, each addressing a separate concern. A concern is a cohesive area of functionality or responsibility—authentication, persistence, rendering, billing—not necessarily one class per concern.

SoC reduces entanglement: UI should not embed SQL; domain rules should not depend on HTTP status codes; infrastructure adapters should not dictate business workflows. Well-separated modules change independently, test in isolation, and assign ownership clearly across teams.

SoC appears at every scale: functions within a file, packages within a service, services within a platform, and layers in **hexagonal** or **clean** architectures. Over-separation (nano-services, excessive indirection) is as harmful as a monolithic ball of mud—aim for cohesive boundaries with stable interfaces.

## Key ideas

- One module, one primary reason to change (aligns with Single Responsibility).
- Dependencies point inward: domain does not import frameworks.
- Cross-cutting concerns (logging, metrics) attach via hooks/middleware, not copy-paste.
- Boundaries are contracts (interfaces, events), not folder names alone.

## When to use

- Growing codebases where changes ripple unpredictably.
- Multiple teams contributing to one product.
- Systems requiring independent test doubles for domain vs IO.

## When not to use

- Throwaway prototypes where speed beats structure—refactor when survival is proven.
- Extreme decomposition where network latency and operational cost exceed benefit.
- When boundaries are invented without real change drivers (empty "service" layers).

## Trade-offs

| Clear separation | Cost |
| --- | --- |
| Easier testing and parallel work | More interfaces and mapping |
| Safer refactors within a boundary | Integration tests still needed |
| Clear ownership | Risk of wrong slice lines (by technical layer only) |

## Example

A web handler parses HTTP, calls `OrderService.PlaceOrder(cmd)`, and maps errors to status codes. `OrderService` enforces business rules and calls `OrderRepository` interface. `PostgresOrderRepository` handles SQL—none mixed in the handler.

```go
func (h *Handler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
    cmd, err := decodePlaceOrder(r)
    if err != nil { writeBadRequest(w, err); return }
    id, err := h.orders.Place(cmd)
    if err != nil { writeDomainError(w, err); return }
    writeJSON(w, id)
}
```

## Related

- [SOLID](solid_en.md) — Single Responsibility and Dependency Inversion
- [Law of Demeter](law-of-demeter_en.md) — limit knowledge between modules
- [High Cohesion, Low Coupling](general/high-cohesion-low-coupling_en.md) — companion principle

## References

- Dijkstra — early essays on program structuring by concern
- Clean Architecture / hexagonal architecture literature (ports and adapters)
