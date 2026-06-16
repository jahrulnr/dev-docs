# Chain of Responsibility

## Overview

**Chain of Responsibility** passes a request along a chain of handlers. Each handler either processes the request or forwards it to the next link. The sender does not know which handler will ultimately act—decoupling producers from consumers.

The pattern appears in HTTP middleware stacks, logging pipelines (filter by level), support ticket escalation, and UI event bubbling. It trades explicit routing for flexible composition.

## How it works

1. Define a `Handler` interface: `Handle(request)` returns handled or pass-to-next.
2. Link handlers in order (linked list, slice, or middleware wrapper).
3. The chain stops when a handler processes the request or the chain ends (unhandled case must be defined).

In web frameworks, middleware is the dominant modern form: each layer wraps the next `http.Handler`.

## When to use

- Multiple objects might handle a request and the set may change at runtime.
- You want to add/remove processing steps without editing the sender.
- Processing stages are optional or ordered (validation → auth → business logic).

## When not to use

- Exactly one handler must always run—use direct dispatch.
- Order is hard to reason about and debugging the chain is costly for your team.
- Deep chains with heavy logic—consider a pipeline with explicit stage names and observability.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Loose coupling, open for extension | Harder to trace flow and debug |
| Composable stages (middleware) | Request may reach chain end unhandled |
| Single Responsibility per handler | Performance overhead if chain is long |

## Example

HTTP middleware: CORS → authentication → rate limit → handler. Each middleware either writes a response or calls `next.ServeHTTP(w, r)`.

Logging: a message enters at `DebugHandler`; if level is too low, it forwards to `InfoHandler`, then `Warn`, then `Error`.

## Related

- [Decorator](../design/decorator_en.md) — similar composition, different intent (add behavior vs route)
- [Middleware pattern](https://en.wikipedia.org/wiki/Chain-of-responsibility_pattern) in HTTP stacks

## References

- Gamma et al. — *Design Patterns*, Chain of Responsibility
- Common in `net/http` middleware and Gin/Echo/Chi chains
