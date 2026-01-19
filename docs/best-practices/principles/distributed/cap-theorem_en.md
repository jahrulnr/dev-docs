# CAP Theorem
## Overview

CAP theorem states that in the presence of network partitions a distributed system must choose between consistency and availability (cannot guarantee all three: Consistency, Availability, Partition tolerance). This fundamental theorem helps architects understand the trade-offs in distributed system design.

## When to use
Use CAP as a tradeoff framework when designing distributed systems; prioritize based on requirements (e.g., CP vs AP).

## Example
A strongly-consistent system might sacrifice availability during partitions; an AP system remains available with eventual consistency.

## Pros / Cons
- Pros: Helps reason about architectural tradeoffs.
- Cons: Simplifies real-world nuances; other models (PACELC) extend CAP.

## References
- Brewer’s CAP theorem and follow-up materials.