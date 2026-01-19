# Chain of Responsibility
## Overview

Chain of Responsibility lets multiple handlers have a chance to process a request by chaining them; the request is passed along the chain until a handler handles it. This pattern enables flexible and decoupled request processing.

## When to use
- When multiple components may handle a request and you want to decouple sender from receivers.
- For pipelines of processing steps (validation, enrichment, delivery).

## Implementation Guidance
- Define a Handler interface with a method that either handles or forwards the request.
- Compose chains by linking handlers or using middleware patterns.

## Example
HTTP middleware chain where each middleware either handles the request or passes it to the next.

## Pros / Cons
- Pros: Flexible, promotes decoupling and composition.
- Cons: Can be harder to trace request flow and debug.

## Related Patterns
Decorator, Chain-based middleware

## References
- Common design pattern literature.Chain of Responsibility passes a request along a chain of handlers; each handler decides to process or forward it.

## When to use
Use to decouple sender and receiver and allow multiple possible handlers without hard-coding the receiver.

## Example
A logging system where messages pass through handlers (debug, info, warn) and are handled by appropriate level.

## Pros / Cons
- Pros: Flexible request handling, easy to add handlers.
- Cons: Request may not be handled; debugging chain order can be tricky.

## References
- Gamma et al., "Design Patterns".