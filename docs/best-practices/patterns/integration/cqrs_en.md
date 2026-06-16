# CQRS (Command Query Responsibility Segregation)
## Overview

CQRS separates write (command) and read (query) models so each can be optimized and scaled independently. It's often used with event-driven mechanisms to synchronize read models and is valuable in systems where read and write workloads have different requirements.

## Key Concepts

- **Command Side (Write Model)**: Handles operations that change state, validates commands, and enforces business rules. Often implemented with aggregates and domain logic.
- **Query Side (Read Model)**: Uses denormalized, optimized structures to serve queries quickly (e.g., materialized views, NoSQL stores).
- **Eventual Consistency**: Updates to read models usually happen asynchronously; clients must tolerate or mitigate staleness.
- **Synchronization**: Use events (domain events or integration events) and idempotent processors to update read models reliably.

## Benefits
- Scalability: read and write pipelines can be scaled independently.
- Performance: read models optimized for queries.
- Separation: clearer responsibilities and testability of handlers.

```text
User Action (e.g., Update Profile)
          |
          v
+----------------+       Event/Message       +----------------+
| Command Model  |  --------------------->  |  Query Model   |
| (Write: Validate|                         | (Read: Fast     |
|  & Save)       |                         |  Retrieval)     |
+----------------+                         +----------------+
          |                                        |
          v                                        v
     Database (Transactional)              Database (Optimized)
```

## When to Use

Use in high-performance applications with heavy read loads (e.g., e-commerce sites). When read and write models differ significantly. In event-sourced systems or domains with complex business logic. Avoid in simple CRUD apps where a single model suffices.

## Implementation Guide

1. Split code into command and query handlers (e.g., `Commands/` and `Queries/` folders).
2. Use separate models: Commands work with domain entities enforcing rules; Queries use DTOs or views for fast retrieval.
3. Optionally, use event sourcing: Commands emit events that update the read model asynchronously (eventual consistency).
4. For databases: Commands use a transactional store (e.g., SQL); Queries use a read-optimized store (e.g., NoSQL or reporting DB).
5. Start simple: Implement CQRS for one feature (e.g., user registration as command, user list as query), then expand.
6. Ensure synchronization: Use events or messaging to keep read models updated after commands.

## Examples

In a blog system, commands handle "create post" (write), queries handle "list posts" (read). Read model uses a denormalized table for fast searches.

## Links

For event-driven patterns, see [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_en.md). For domain models, check [Coding Rules](../../principles/code-quality/clean-code_en.md).
