# SOLID Principles

## Overview

SOLID is a set of five design principles for object-oriented programming (OOP) that make code more understandable, flexible, and maintainable. Popularized by Robert C. Martin (Uncle Bob), it helps reduce "code rot" by encouraging small, focused types and stable boundaries.

The principles are: Single Responsibility (SRP), Open-Closed (OCP), Liskov Substitution (LSP), Interface Segregation (ISP), and Dependency Inversion (DIP). Practiced well, SOLID typically improves testability, supports incremental change, and reduces accidental coupling.

## Key ideas

- Prefer **cohesion** (focused responsibilities) over "god objects".
- Keep behavior **extensible** without editing stable code paths.
- Make subtype relationships **behaviorally safe** (contracts matter).
- Keep interfaces **small and client-specific**.
- Push dependencies **toward abstractions** (loose coupling), often via **dependency injection**.

## When to use

- Codebases that will evolve over time (multiple features, multiple maintainers).
- Domains where correctness and testability matter (business rules, pricing, authorization, workflows).
- Systems where you need clear seams for replacement or integration (adapters, persistence, external APIs).

## When not to use

- One-off scripts, prototypes, or glue code where speed matters more than longevity.
- Very small programs where extra indirection increases complexity without payoff.
- Performance-critical hot paths where allocations/virtual dispatch are the primary bottleneck (apply selectively).

## Trade-offs

- **Indirection cost**: more types/interfaces can make code harder to navigate without good naming and structure.
- **Over-engineering risk**: chasing "perfect SOLID" can slow delivery and hide simple logic behind abstractions.
- **Context dependency**: SOLID is a heuristic; apply where change pressure and complexity justify it.

## Single Responsibility Principle (SRP)

A class should have only one reason to change (one job). This keeps classes focused and prevents them from doing too much.

**When to use**: When a type mixes unrelated concerns (e.g., business rules + I/O + formatting).

**How to implement**: Split responsibilities into separate types (e.g., a `User` entity holding state and a `EmailService` for email sending).

**Common pitfall**: Splitting too early into many tiny types without clear boundaries.

## Open-Closed Principle (OCP)

Software entities should be open for extension but closed for modification. Add new features without editing existing code.

**When to use**: When adding new variants to stable code paths (new payment method, new export format, new rule).

**How to implement**: Prefer composition with interfaces/strategies; use inheritance only when the subtype relationship is valid and stable.

**Common pitfall**: Misusing inheritance to simulate configuration (fragile base class).

## Liskov Substitution Principle (LSP)

Subclasses should be substitutable for their base classes without breaking behavior. Ensure derived classes don't violate base class contracts.

**When to use**: Anytime you rely on polymorphism (inheritance or interface implementations) in core flows.

**How to implement**: Preserve preconditions/postconditions and invariants; avoid strengthening inputs or weakening guarantees in the subtype.

**Common pitfall**: Subtypes that throw "not supported" at runtime for methods they must support.

## Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they don't use. Keep interfaces small and specific.

**When to use**: When a single interface grows large and different clients only need different subsets.

**How to implement**: Split into multiple focused interfaces; design interfaces from the client’s perspective.

**Common pitfall**: Creating too many micro-interfaces without clear usage (harder discovery).

## Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions (high-level modules shouldn't depend on low-level ones). This promotes loose coupling.

**When to use**: When you need to replace infrastructure (DB, HTTP clients) or isolate business logic for testing.

**How to implement**: Introduce stable interfaces at the boundary and wire implementations via dependency injection (constructor injection is a common default).

```text
Without DIP (Tight Coupling):
[High-Level Module] --> [Low-Level Module]

With DIP (Loose Coupling):
[High-Level Module] --> [Abstraction (Interface)] <-- [Low-Level Module]
```

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_en.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_en.md`
- `docs/best-practices/architecture/patterns/layered-architecture_en.md`

## Links

For examples, see [Coding Rules](../../principles/code-quality/clean-code_en.md).

## References

- Robert C. Martin, *Agile Software Development: Principles, Patterns, and Practices*.
