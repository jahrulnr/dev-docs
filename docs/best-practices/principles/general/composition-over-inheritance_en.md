# Composition over Inheritance
## Overview

Composition favors combining simple, reusable components to build complex behavior rather than relying on deep class inheritance hierarchies. This approach leads to more maintainable and flexible code by promoting loose coupling and easier testing.

## When to use
Use composition to increase flexibility, enable runtime behavior changes, and avoid fragile base class problems.

## Example
Compose a `ReportService` by injecting `Storage`, `Formatter`, and `Notifier` components instead of inheriting from a base service.

## Pros / Cons
- Pros: Greater flexibility, better testability and substitution.
- Cons: Can require more wiring/boilerplate to assemble components.

## References
- Object-oriented design best practices.