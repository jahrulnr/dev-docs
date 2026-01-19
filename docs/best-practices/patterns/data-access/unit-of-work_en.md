# Unit of Work
## Overview

Unit of Work maintains a list of objects affected by a business transaction and coordinates writing out changes and resolving concurrency problems. This pattern ensures data consistency by grouping related operations.

## When to use
Use when you need to batch multiple changes into a single transaction and minimize database round-trips.

## Example
An ORM `UnitOfWork` tracks created/updated/deleted entities and commits them in one transaction.

## Pros / Cons
- Pros: Transaction management centralised, reduces database calls.
- Cons: Memory growth if tracking many entities, complexity in lifecycle management.

## References
- Martin Fowler, patterns of enterprise application architecture.