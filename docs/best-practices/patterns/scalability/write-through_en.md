# Write Through Cache
## Overview

Write Through writes data to the cache and the backing store synchronously on updates, ensuring cache and store are always consistent. This pattern guarantees data integrity at the cost of higher write latency.

## When to use
Use when strong consistency between cache and database is important and write latency is acceptable.

## Example
On update: write to cache and then persist to DB; reads come from cache.

## Pros / Cons
- Pros: Simpler consistency model, fresh data in cache.
- Cons: Write latency increases, potential bottleneck on writes.

## References
- Caching strategy materials.