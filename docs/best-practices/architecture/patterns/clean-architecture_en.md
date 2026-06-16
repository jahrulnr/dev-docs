# Clean Architecture

## Overview

Clean Architecture is a software design philosophy created by Robert C. Martin (Uncle Bob) that organizes code into concentric layers (circles) to separate concerns. The core idea is to make the business logic (domain) independent of external details like databases, frameworks, or user interfaces. This ensures that changes to outer layers (like switching databases) don't affect the inner core.

The key principle is the "dependency rule": Inner layers should not depend on outer layers. Instead, dependencies point inward, promoting testability, maintainability, and flexibility. It's particularly useful for complex applications and aligns with SOLID principles and Domain-Driven Design (DDD).

## Key Components

Clean Architecture divides the application into four main layers:

- **Entities**: Core business rules and data structures that are independent of any framework or technology.
- **Use Cases (Application Layer)**: Application-specific business logic that orchestrates entities. This layer contains the workflows of your application.
- **Interface Adapters**: Controllers, gateways, and presenters that adapt data between the use cases and external agencies (like web frameworks or databases).
- **Frameworks & Drivers**: External tools, databases, web frameworks, and UI components. This is the outermost layer.

```text
+---------------------+
| Frameworks & Drivers|
| (UI, DB, Frameworks)|
+---------------------+
          |
+---------------------+
| Interface Adapters  |
| (Controllers,       |
|  Gateways)          |
+---------------------+
          |
+---------------------+
|   Use Cases         |
| (Application Logic) |
+---------------------+
          |
+---------------------+
|     Entities        |
| (Core Business Rules)|
+---------------------+
```

## When to Use

Choose Clean Architecture for:

- Complex applications with evolving requirements, where you need to swap technologies (e.g., changing from SQL to NoSQL databases).
- Teams that prioritize long-term maintainability and testability.
- Projects using DDD, where the domain model is central.
- Avoid in very simple apps where the overhead of layers adds unnecessary complexity.

## Implementation Guide

1. **Organize Code by Layers**: Create folders like `domain/` (entities), `application/` (use cases), `infrastructure/` (adapters and drivers).
2. **Apply Dependency Inversion**: Use interfaces in inner layers (e.g., `UserRepository` interface in domain, implemented in infrastructure).
3. **Keep Dependencies Inward**: Inner layers don't import outer ones. Use dependency injection to wire them.
4. **Test from the Inside Out**: Start testing entities and use cases with mocks for outer layers.

## Examples

In an e-commerce app, the `Order` entity (domain) handles core rules like "orders must have items." The `PlaceOrder` use case (application) orchestrates this. A `OrderController` (adapter) handles HTTP requests, and `OrderRepository` (infrastructure) saves to a database.

## Links

For more on SOLID principles, see [SOLID Principles](../../principles/solid_en.md). For DDD examples, check [Coding Rules](../../principles/code-quality/clean-code_en.md).
