# Active Record
## Overview

Active Record combines domain object and persistence logic in the same class; objects know how to persist themselves. This pattern simplifies data access for simple applications but can increase coupling.

## When to use
Use for simple CRUD applications where coupling domain and persistence is acceptable and simple to implement.

## Example
An `User` class with methods `save()`, `update()`, and `delete()` that operate on the database row.

## Pros / Cons
- Pros: Simple and straightforward to implement; low boilerplate for CRUD.
- Cons: Tight coupling of domain and persistence, can lead to anemic domain model in complex systems.

## References
- Martin Fowler, patterns of enterprise application architecture.