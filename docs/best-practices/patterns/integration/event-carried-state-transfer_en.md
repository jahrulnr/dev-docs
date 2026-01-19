# Event Carried State Transfer
## Overview

Event Carried State Transfer sends the necessary state in events so consumers can update their local views without extra lookups. This pattern optimizes event-driven systems by reducing the need for additional queries, improving performance and decoupling producers from consumers.

## When to use
Use when consumers need sufficient data to update read models or denormalized views and you want to minimize synchronous calls.

## Example
`OrderCreated` event contains order details so projection services can update read stores immediately.

## Pros / Cons
- Pros: Reduces synchronous lookups, speeds up read model updates.
- Cons: Larger event payloads and duplication of data across systems.

## References
- Event-driven system best practices.