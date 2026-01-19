# Onion Architecture

## Overview

Onion Architecture, created by Jeffrey Palermo, organizes code into layers that "peel" outward from the domain core, emphasizing Domain-Driven Design (DDD). The innermost layer is pure business logic, and outer layers handle infrastructure. It's similar to Clean Architecture but focuses more on DDD principles.

The key benefit is maintainability: Changes to outer layers (like switching ORMs) don't affect the core. It promotes SOLID principles and separation of concerns, making the system robust for complex business domains.

## Key Components

- **Domain Layer**: Core business entities, value objects, and services. This is the heart of the application.
- **Application Layer**: Use cases and commands that orchestrate domain logic. It acts as a bridge.
- **Infrastructure Layer**: Repositories, external services, and UI components. This handles external dependencies.

```text
+---------------------+
| Infrastructure Layer|
| (UI, DB, External)  |
+---------------------+
          |
+---------------------+
| Application Layer   |
| (Use Cases, Commands|
+---------------------+
          |
+---------------------+
|   Domain Layer      |
| (Entities, Services)|
+---------------------+
```

## When to Use

Choose Onion Architecture for:

- DDD-focused projects with complex business logic.
- Applications needing scalability and independence from external tools.
- Teams building microservices or enterprise systems.
- Avoid in simple apps where layered structure adds complexity.

## Implementation Guide

1. **Layer Code with Domain at Center**: Structure folders as `domain/`, `application/`, `infrastructure/`.
2. **Use Interfaces for Cross-Layer Communication**: Define contracts in inner layers.
3. **Apply Dependency Inversion**: Infrastructure implements domain interfaces.
4. **Test Domain First**: Ensure core logic is tested independently.
5. **Expand Gradually**: Add layers as business complexity grows.

## Examples

In a banking app, the domain handles "account balance" rules. Application layer processes "transfer money." Infrastructure saves to a database.

## Links

For DDD details, see [Coding Rules](../../coding-rules.md). For SOLID, check [SOLID Principles](../README.md#solid-principles).
