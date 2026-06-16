# Decorator

## Overview

The **Decorator** pattern attaches additional responsibilities to an object dynamically. Decorators implement the same interface as the component they wrap and forward calls while adding behavior before or after (logging, caching, compression, authorization). Composition replaces subclass explosion for optional features.

Decorators differ from **Adapter** (interface translation) and **Proxy** (access control, lazy loading, often invisible). Decorator's intent is **transparent extension** of behavior in layers: `BufferedStream` wraps `FileStream`; `MetricsHandler` wraps `BusinessHandler`.

In many codebases, middleware, wrappers, and `io.Reader` chains in Go are decorator structures even when not named as such.

## How it works

1. Define a **Component** interface with core operations.
2. **ConcreteComponent** implements base behavior.
3. **Decorator** holds a reference to Component (or interface), implements the same interface, and delegates with extras.
4. Stack multiple decorators: `new Retry(new Metrics(new HTTPClient(base)))`.

Order matters: caching outside retry differs from retry outside caching.

## When to use

- Responsibilities can be combined arbitrarily and should not be fixed at compile time via subclassing.
- You want to add behavior without modifying the original class (Open/Closed).
- Features are optional cross-cutting layers (metrics, tracing, rate limits).

## When not to use

- A single stable combination of behaviors—a concrete class or function pipeline with named stages may be clearer.
- Decorator stacks become deep and hard to debug—document order and consider explicit pipeline types.
- The wrapped object interface is large—decorating every method is tedious; aspect-oriented or middleware hooks may fit better.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Flexible composition of features | Many small wrapper types |
| Open/closed for new decorators | Debugging through layers |
| Runtime stacking | Interface must stay consistent |

## Example

An `DataSource` interface; `LoggingDecorator` logs before delegating; `CachingDecorator` returns cached results when valid.

```go
type DataSource interface {
    Fetch(id string) ([]byte, error)
}

type LoggingDS struct{ next DataSource }

func (d LoggingDS) Fetch(id string) ([]byte, error) {
    log.Printf("fetch %s", id)
    return d.next.Fetch(id)
}
```

HTTP middleware wrapping `http.Handler` is the same structural idea.

## Related

- [Adapter](../design/adapter_en.md) — changes interface; Decorator preserves it
- [Chain of Responsibility](../design/chain-of-responsibility_en.md) — similar chaining; routing vs enrichment
- [Proxy](../design/proxy_en.md) — often controls access; Decorator adds behavior

## References

- Gamma et al. — *Design Patterns*, Decorator chapter
- `io` package wrapper patterns in Go; HTTP middleware stacks
