# Write Behind Cache
## Overview

Write Behind (write-back) updates only the cache immediately and asynchronously persists changes to the backing store later. This pattern improves write performance but introduces the risk of data loss if the cache fails.

## When to use
Use to reduce write latency and database load when eventual persistence is acceptable.

## Example
Updates are queued and flushed to DB in batches by a background worker.

## Pros / Cons
- Pros: Lower write latency, efficient batching.
- Cons: Risk of data loss on failure before persistence, increased system complexity.

## References
- Caching and persistence strategies.