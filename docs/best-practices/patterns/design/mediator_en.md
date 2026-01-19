# Mediator Pattern
## Overview

Mediator centralizes interaction logic between multiple objects, reducing direct dependencies and simplifying communication flows. It promotes loose coupling by eliminating the need for objects to communicate directly, making systems more maintainable and extensible.

## When to use
- When many components interact in complex ways and direct object-to-object coupling would become unmanageable.
- For GUIs (widgets), workflow orchestration, or chat systems.

## Implementation Guidance
- Define a Mediator interface that components use to communicate.
- Components notify the mediator of events; mediator coordinates reactions and forwards messages.
- Keep mediator logic focused; if it grows too complex, consider splitting responsibilities.

## Example (Pseudo)
A `ChatRoom` mediator receives messages from Users and broadcasts to others, centralizing routing and presence management.

## Pros / Cons
- Pros: Reduces coupling and centralizes coordination.
- Cons: Mediator can grow into a god object; needs careful separation of concerns.

## Pitfalls
- If mediator becomes too big, split into sub-mediators or extract services.

## References
- Gamma et al., "Design Patterns".