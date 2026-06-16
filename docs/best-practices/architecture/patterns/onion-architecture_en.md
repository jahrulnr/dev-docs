# Onion Architecture

## Overview

Onion Architecture, created by Jeffrey Palermo, organizes code into layers that "peel" outward from the domain core, emphasizing Domain-Driven Design (DDD). The innermost layer is pure business logic, and outer layers handle infrastructure. It's similar to Clean Architecture but focuses more on DDD principles.

The key benefit is maintainability: Changes to outer layers (like switching ORMs) don't affect the core. It promotes SOLID principles and separation of concerns, making the system robust for complex business domains.

## Key components

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

## When to use

Choose Onion Architecture for:

- DDD-focused projects with complex business logic.
- Applications needing scalability and independence from external tools.
- Teams building microservices or enterprise systems.

## When not to use

- Simple applications where domain complexity is low and the layering adds overhead.
- Teams that are not ready to invest in modeling the domain (without DDD discipline, Onion Architecture often collapses into “just folders”).

## Implementation guide

1. **Layer Code with Domain at Center**: Structure folders as `domain/`, `application/`, `infrastructure/`.
2. **Use Interfaces for Cross-Layer Communication**: Define contracts in inner layers.
3. **Apply Dependency Inversion**: Infrastructure implements domain interfaces.
4. **Test Domain First**: Ensure core logic is tested independently.
5. **Expand Gradually**: Add layers as business complexity grows.

## Trade-offs

- **Extra indirection**: Interfaces and mapping code add complexity up front.
- **Domain modeling cost**: The payoff depends on having meaningful business rules in the domain.
- **Risk of “infrastructure in the domain”**: Without discipline, ORM annotations and framework types leak into the core.

## Examples

In a banking app, the domain handles "account balance" rules. Application layer processes "transfer money." Infrastructure saves to a database.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_en.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_en.md`
- `docs/best-practices/architecture/patterns/ddd_en.md`

## Links

For DDD details, see [Coding Rules](../../principles/code-quality/clean-code_en.md). For SOLID, check [SOLID Principles](../../principles/solid_en.md).

## References

- Jeffrey Palermo, “The Onion Architecture” (original introduction).
