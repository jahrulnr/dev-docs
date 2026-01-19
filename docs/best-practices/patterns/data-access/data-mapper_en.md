# Data Mapper
## Overview

Data Mapper separates the in-memory domain objects from the database schema by mapping between them. This pattern enables clean separation of concerns between business logic and data persistence.

## When to use
Use when you want a persistence layer decoupled from domain objects and need complex mapping logic.

## Example
Implement mappers that translate between `Order` objects and database rows/columns.

## Pros / Cons
- Pros: Clean separation, domain model remains persistence-ignorant.
- Cons: Extra mapping code and potential performance overhead.

## References
- Patterns of enterprise application architecture.