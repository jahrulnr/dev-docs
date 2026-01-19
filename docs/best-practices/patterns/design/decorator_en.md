# Decorator Pattern

## Overview

Decorator attaches additional responsibilities to an object at runtime by wrapping it, providing a flexible alternative to subclassing for extending behavior. It allows for dynamic composition of behaviors without modifying the original class, making it ideal for adding features like logging or caching.

## When to use
- Add cross-cutting concerns (logging, metrics, authentication) to individual objects.
- Compose behavior dynamically without modifying the core implementation.

## Implementation Guidance
- Implement the same interface as the wrapped object and forward calls after pre-/post-processing.
- Keep decorators focused on a single concern and allow stacking multiple decorators.

## Example (Go-style)
```go
type Service interface { Do(ctx context.Context) error }

type LoggingDecorator struct { inner Service }
func (d LoggingDecorator) Do(ctx context.Context) error {
    log.Println("call start")
    err := d.inner.Do(ctx)
    log.Println("call end", err)
    return err
}
```

## Pros / Cons
- Pros: High flexibility, good separation of concerns.
- Cons: Many wrappers can complicate debugging and stack traces.

## Pitfalls
- Avoid deep decorator chains that obscure call flow; prefer clear naming and monitoring.

## Related Patterns
Proxy, Adapter, Chain of Responsibility

## References
- Gamma et al., "Design Patterns".