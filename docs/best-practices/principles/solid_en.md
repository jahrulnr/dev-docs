# SOLID Principles

## Overview

SOLID is a set of five design principles for object-oriented programming (OOP) that make code more understandable, flexible, and maintainable. Introduced by Robert C. Martin (Uncle Bob), they help avoid code rot by promoting good class design.

The principles are: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. They reduce bugs, improve testability, enhance flexibility, and make code easier to maintain and extend.

## Single Responsibility Principle (SRP)

A class should have only one reason to change (one job). This keeps classes focused and prevents them from doing too much.

**When to Use**: In any class that handles multiple tasks. Avoid in simple scripts.

**How to Implement**: Split classes with multiple jobs (e.g., a `User` class handling data and email—separate into `User` and `EmailService`).

## Open-Closed Principle (OCP)

Software entities should be open for extension but closed for modification. Add new features without editing existing code.

**When to Use**: When adding features to stable codebases.

**How to Implement**: Use inheritance or interfaces to extend behavior.

## Liskov Substitution Principle (LSP)

Subclasses should be substitutable for their base classes without breaking behavior. Ensure derived classes don't violate base class contracts.

**When to Use**: In inheritance hierarchies to avoid unexpected errors.

**How to Implement**: Make sure subclasses fully implement base class methods correctly.

## Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they don't use. Keep interfaces small and specific.

**When to Use**: With large interfaces that not all classes need.

**How to Implement**: Split large interfaces into smaller, focused ones.

## Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions (high-level modules shouldn't depend on low-level ones). This promotes loose coupling.

**When to Use**: To make code flexible and testable.

**How to Implement**: Use interfaces and dependency injection.

```text
Without DIP (Tight Coupling):
[High-Level Module] --> [Low-Level Module]

With DIP (Loose Coupling):
[High-Level Module] --> [Abstraction (Interface)] <-- [Low-Level Module]
```

## Links

For examples, see [Coding Rules](../../coding-rules.md).
