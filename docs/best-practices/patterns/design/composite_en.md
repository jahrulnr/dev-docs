# Composite
## Overview

Composite composes objects into tree structures to represent part-whole hierarchies. It allows clients to treat individual objects and compositions uniformly. This pattern is particularly useful for building hierarchical structures where operations on the whole should be consistent with operations on parts.

## When to use
- Represent hierarchical structures (UI trees, file systems).
- When clients should treat composite and leaf objects uniformly.

## Implementation Guidance
- Define a Component interface implemented by Leaf and Composite.
- Composite maintains children and delegates operations to them as needed.

## Example
A filesystem where `File` and `Directory` implement a common interface; `Directory` contains children.

## Pros / Cons
- Pros: Simplifies handling of tree structures.
- Cons: Can blur distinction between leaf and composite operations and complicate type safety.

## References
- Gamma et al., "Design Patterns".