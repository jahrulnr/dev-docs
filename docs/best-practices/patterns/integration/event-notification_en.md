# Event Notification
## Overview

Event Notification involves broadcasting that something happened (an event) so interested parties can react; payloads typically contain minimal information and indicate occurrence. This pattern enables reactive systems with minimal coupling between components.

## When to use
Use for loose coupling where listeners react asynchronously to events like `UserSignedUp` or `OrderShipped`.

## Example
Publishing an `OrderShipped` notification that triggers email and tracking services.

## Pros / Cons
- Pros: Low coupling and simple semantics.
- Cons: Listeners must fetch additional data if needed; eventual consistency concerns.

## References
- Event-driven architecture patterns.