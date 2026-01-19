# Database Sharding
## Overview

Sharding splits a large database into smaller, faster, more manageable pieces called shards, each holding a subset of the data. This pattern enables horizontal scaling and improved performance for large datasets.

## When to use
Use when a single database cannot handle scale or size; shard by customer ID or tenant ID for horizontal scaling.

## Example
User data partitioned across shards by hashed user ID.

## Pros / Cons
- Pros: Horizontal scalability, reduced contention.
- Cons: Increased complexity in queries, cross-shard transactions are difficult.

## References
- Database vendor and scaling guides.