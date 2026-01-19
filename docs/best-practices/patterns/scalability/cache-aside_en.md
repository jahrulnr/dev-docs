# Cache Aside
## Overview

Cache Aside (lazy loading) loads data into cache on demand: the application reads from cache and, on miss, loads from the database and populates the cache. This pattern optimizes performance for frequently accessed data.

## When to use
Use for reads-heavy workloads where caching can reduce database load with simple invalidation strategies.

## Example
On read: check cache -> miss -> load from DB -> populate cache -> return.

## Pros / Cons
- Pros: Simple, explicit cache population, good control over cache lifecycle.
- Cons: Cache misses add latency, invalidation can be tricky.

## References
- Caching strategy resources.