# Proxy Pattern

## Overview

A Proxy provides a surrogate or placeholder for another object to control access, add caching or logging, or delay expensive initialization without changing the original object. This pattern is essential for implementing lazy loading, access control, and remote communication in a clean, decoupled way. It allows clients to interact with the proxy as if it were the real object, while the proxy handles additional responsibilities transparently.

The proxy pattern comes in several types:

- **Virtual Proxy**: Delays the creation and initialization of expensive objects until they are needed.
- **Protection Proxy**: Controls access to the original object based on permissions.
- **Remote Proxy**: Represents an object in a different address space, handling network communication.
- **Caching Proxy**: Adds caching to improve performance by storing results of expensive operations.

This pattern promotes separation of concerns and enhances flexibility in system design.

## When to use
- Add an access-control layer (protection proxy).
- Lazily initialize expensive resources (virtual proxy).
- Wrap remote services and hide network concerns (remote proxy).
- Add caching, logging, or instrumentation.

## Implementation Guidance
- Implement the same interface as the real subject and forward calls.
- Keep proxy logic thin; avoid moving business rules into proxies.
- For remote proxies, handle serialization, timeouts, and retries at the proxy boundary.

## Example (Go-style)
```go
type Service interface {
    DoWork(ctx context.Context, r Request) (Response, error)
}

type RemoteProxy struct {
    client RemoteClient
}

func (p *RemoteProxy) DoWork(ctx context.Context, r Request) (Response, error) {
    // auth, logging, short-circuit, retries
    return p.client.Call(ctx, r)
}
```

## Pros / Cons
- Pros: Centralizes cross-cutting concerns, supports lazy-loading and access control.
- Cons: Adds indirection and potential performance/latency surprises.

## Pitfalls
- Don't duplicate business logic in the proxy; use it for orchestration and control only.
- Expose metrics for proxy latency and errors to avoid hidden performance issues.

## Related Patterns
Adapter, Decorator, Facade

## References
- Gamma et al., "Design Patterns".