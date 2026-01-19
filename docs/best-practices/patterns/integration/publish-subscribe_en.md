# Publish / Subscribe
## Overview

Publish/Subscribe decouples producers (publishers) from consumers (subscribers) via an intermediary (broker) that routes messages based on topics. This pattern enables strong decoupling and scalability in event-driven systems.

## When to use
Use for event-driven architectures, broadcast scenarios, or when many consumers need to react to the same events.

## Example
An `OrderCreated` event is published; inventory, billing, and analytics services subscribe and react independently.

## Pros / Cons
- Pros: Loose coupling, easy to scale consumers, asynchronous communication.
- Cons: Increased operational complexity and eventual consistency concerns.

## References
- Messaging and event-driven architecture resources.