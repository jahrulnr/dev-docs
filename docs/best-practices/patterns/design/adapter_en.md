# Adapter Pattern
## Overview

Adapter converts the interface of a class into another interface clients expect, enabling interoperability between incompatible interfaces without modifying existing code. This pattern enables flexible integration with external components.

## When to use
- Integrate legacy systems or third-party libraries with incompatible APIs.
- Provide a stable internal interface while adapting multiple vendor implementations.

## Implementation Guidance
- Implement the target interface and hold a reference to the adaptee.
- Keep adapters thin: translate calls and adapt data structures.
- Consider creating separate adapter classes for each integration point to keep concerns isolated.

## Example (Go-style)
```go
// Target interface
type PaymentProcessor interface {
    Charge(amount int) error
}

// Adaptee
type LegacyGateway struct{}
func (LegacyGateway) SendPayment(cents int) error { /*...*/ return nil }

// Adapter
type LegacyAdapter struct{ g LegacyGateway }
func (a LegacyAdapter) Charge(amount int) error {
    return a.g.SendPayment(amount)
}
```

## Pros / Cons
- Pros: Supports reuse, isolates integration logic.
- Cons: Adds classes and translation overhead.

## Related Patterns
Facade, Proxy

## References
- Gamma et al., "Design Patterns".