# Read Replicas
## Overview

Read replicas are copies of the primary database used to serve read-only queries, reducing load on the primary and improving read scalability. This pattern enables better performance and availability for read-intensive applications.

## When to use
Use when read traffic is significantly higher than write traffic and you can tolerate slightly stale data.

## Example
Use a primary DB for writes and several replicas for reporting and read-heavy endpoints.

## Pros / Cons
- Pros: Scales reads, offloads primary.
- Cons: Replication lag can cause stale reads; writes still bottleneck at primary.

## References
- Database replication docs.