# Builder
## Overview

Builder separates the construction of a complex object from its representation, enabling the same construction process to create different representations. This pattern simplifies object creation with many parameters or steps.

## When to use
- When constructing an object requires many optional steps or configurations.
- To avoid telescoping constructors and improve readability.

## Implementation Guidance
- Define a Builder interface with fluent methods for configuration and a Build() method.
- Implement concrete builders for different representations.

## Example (Pseudo)
A `QueryBuilder` that composes filters, ordering, and pagination options, then builds a SQL query string.

## Pros / Cons
- Pros: Clear and readable construction of complex objects.
- Cons: More classes and an additional abstraction layer.

## Related Patterns
Factory Method, Abstract Factory

## References
- Gamma et al., "Design Patterns".Builder separates the construction of a complex object from its representation so the same construction process can create different representations.

## When to use
Use when creating complex objects step-by-step, or when creation needs to support different representations.

## Example
Building a complex `House` with steps: build foundation, add walls, add roof; Director orchestrates steps using a Builder.

## Pros / Cons
- Pros: Clear construction process, good for immutability and complex objects.
- Cons: More code, may be overkill for simple objects.

## References
- Gamma et al., "Design Patterns".