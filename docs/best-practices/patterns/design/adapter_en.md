# Adapter

## Overview

The **Adapter** pattern converts the interface of a class or module into another interface clients expect. It lets incompatible components work together without changing their source code—wrapping a third-party SDK, legacy API, or foreign data model behind a port your application already understands.

Adapters are structural glue. **Object adapter** composes the adaptee and translates calls; **class adapter** (less common in Go) uses embedding/inheritance. Adapters often appear at **hexagonal architecture** boundaries: `PostgresUserRepo` adapts SQL driver rows to domain `User`; `StripePaymentAdapter` maps provider webhooks to internal events.

Do not confuse Adapter with Facade (simplify many calls into one) or Decorator (same interface, added behavior). Adapter's job is **interface reconciliation**.

## How it works

1. Identify the **Target** interface your client code expects.
2. Wrap the **Adaptee** (existing incompatible API) in an **Adapter** type implementing Target.
3. Translate method calls: map types, error codes, pagination models, and naming.
4. Inject the adapter where the Target is required.

Keep translation logic thin; domain rules stay outside the adapter. Test adapters with recorded fixtures from the real adaptee when possible.

## When to use

- Integrating third-party or legacy libraries whose API does not match your ports.
- Gradual migration: old and new implementations share one Target interface.
- Testing: provide in-memory adapters implementing the same port.

## When not to use

- You control both sides and can change the API directly—fix the source instead of permanent glue.
- The mismatch is behavioral, not interface—may need a richer domain service, not a thin adapter.
- Multiple orthogonal concerns (cache + translate + auth)—split into decorator chain + adapter.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Reuse without modifying adaptee | Translation layer can lag behind SDK updates |
| Clean ports for application core | Risk of leaking adaptee concepts through Target |
| Enables incremental migration | Extra indirection and mapping bugs |

## Example

A legacy `LegacyPrinter` exposes `PrintText(s string)`. Your app expects `DocumentRenderer.Render(doc Document)`. `PrinterAdapter` implements `DocumentRenderer` and calls `PrintText(doc.PlainText())`.

```go
type DocumentRenderer interface {
    Render(doc Document) error
}

type PrinterAdapter struct {
    legacy *LegacyPrinter
}

func (a PrinterAdapter) Render(doc Document) error {
    return a.legacy.PrintText(doc.PlainText())
}
```

## Related

- [Facade](../design/facade_en.md) — simplifies subsystem; Adapter translates interfaces
- [Decorator](../design/decorator_en.md) — same interface, extra behavior
- [Ports and adapters (hexagonal)](https://alistair.cockburn.us/hexagonal-architecture/) — architectural context

## References

- Gamma et al. — *Design Patterns*, Adapter chapter
- Anti-corruption layer in domain-driven design
