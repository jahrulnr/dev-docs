# Eventual Consistency
## Overview

Eventual Consistency means that, in a distributed system, updates will propagate and replicas will converge to the same state over time. This model allows for better scalability and availability compared to strong consistency models.

## When to use
Use in distributed architectures to achieve availability and partition tolerance when strict consistency is not required.

## Example
An update to a user's profile propagates to caches and search indexes asynchronously.

## Pros / Cons
- Pros: Improves availability and scalability.
- Cons: Requires handling stale reads and designing for reconciliation.

## References
- Distributed system design and CAP theorem resources.