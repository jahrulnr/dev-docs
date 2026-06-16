# Layered Architecture

## Overview

Layered Architecture (also known as multitier or n-tier architecture) organizes an application into horizontal layers, each with a specific responsibility and communicating only with adjacent layers. This creates clear separation of concerns, making the system modular and easier to maintain.

Benefits include separation of concerns, maintainability, testability, scalability, and reusability. Layers can be updated or tested independently, and lower layers can be reused across different presentations.

## Key components

- **Presentation Layer**: Handles user interface and interaction (e.g., web pages, APIs, mobile apps). It displays data and captures user input.
- **Application/Service Layer**: Contains business logic workflows, orchestrates operations, and acts as a bridge between presentation and domain layers.
- **Domain/Business Layer**: Encapsulates core business rules, entities, and logic independent of external concerns.
- **Infrastructure/Data Layer**: Manages data persistence, external services, and low-level operations (e.g., databases, file systems, APIs).

```text
+---------------------+
|  Presentation Layer |
|  (UI, APIs)         |
+---------------------+
          |
+---------------------+
| Application Layer   |
| (Business Workflows)|
+---------------------+
          |
+---------------------+
|   Domain Layer      |
| (Business Rules)    |
+---------------------+
          |
+---------------------+
| Infrastructure Layer|
| (Data, External)    |
+---------------------+
```

## When to use

Use for complex applications with multiple stakeholders, needing independent evolution of UI, logic, and data. Supports multiple frontends sharing the same backend. Avoid in simple apps where layers add unnecessary complexity.

## When not to use

- Very small services where strict layers force extra indirection for little gain.
- Teams that repeatedly bypass layers (“presentation calls data layer directly”), which leads to confusion and hidden coupling.
- Highly modular domains that benefit more from Clean Architecture / Ports and Adapters (layering alone may be insufficient to protect the domain).

## Implementation guide

1. Organize code into folders like `presentation/`, `application/`, `domain/`, `infrastructure/`.
2. Define interfaces in higher layers for lower layers to implement (e.g., `UserRepository` in domain, implemented in infrastructure).
3. Ensure dependencies flow downward: Presentation depends on Application, which depends on Domain, which depends on Infrastructure. Use dependency injection.
4. Test each layer in isolation (e.g., mock data layer when testing business logic).
5. Start small: For simple apps, begin with Presentation and Domain, adding layers as complexity grows.

## Trade-offs

- **Layer leakage risk**: Without discipline, layers become a naming convention rather than a boundary.
- **Anemic middle layer**: The “service layer” can turn into pass-through code if business rules are not modeled properly.
- **Cross-cutting concerns**: Logging/auth/transactions can spread across layers unless handled systematically.

## Examples

In a web app, presentation handles HTML rendering, application processes user requests, domain validates business rules, infrastructure queries the database.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_en.md`
- `docs/best-practices/architecture/patterns/onion-architecture_en.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_en.md`

## Links

For separation of concerns, see [Coding Rules](../../principles/code-quality/clean-code_en.md). For testing layers, check [Infrastructure README](../../practices/integration/test-driven-development_en.md).

## References

- Martin Fowler, “PresentationDomainDataLayering” (layering overview and variants).
