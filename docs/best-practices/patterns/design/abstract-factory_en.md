# Abstract Factory
## Overview

Abstract Factory provides an interface to create families of related or dependent objects without specifying their concrete classes. This pattern enables consistent object creation decoupled from specific implementations.

## When to use
- When your system needs to be configured with one of multiple families of products.
- To enforce consistency among products that belong together.

## Implementation Guidance
- Define abstract product interfaces and an abstract factory interface that creates them.
- Implement concrete factories for each product family.

## Example (Pseudo)
A GUI framework that can create `Button` and `Window` for `MacOSFactory` or `WindowsFactory`.

## Pros / Cons
- Pros: Enforces consistency across products, isolates concrete classes.
- Cons: Adding new product types requires changes to factory interfaces.

## Related Patterns
Factory Method, Builder

## References
- Gamma et al., "Design Patterns".Abstract Factory provides an interface for creating families of related or dependent objects without specifying their concrete classes.

## When to use
Use when the system should be independent of how products are created, composed, and represented, or when multiple families of products are required.

## Example
A UI toolkit supporting different look-and-feels: AbstractFactory creates Buttons and Menus for each theme.

## Pros / Cons
- Pros: Enforces consistency among products, isolates concrete classes.
- Cons: Can be complex to add new product types.

## References
- Gamma et al., "Design Patterns".