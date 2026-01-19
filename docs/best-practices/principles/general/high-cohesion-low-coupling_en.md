# High Cohesion, Low Coupling
## Overview

High cohesion groups related functionality together; low coupling minimizes dependencies between modules—both improve maintainability. These principles guide the design of software systems to be more robust, flexible, and easier to evolve over time.

## When to use
Aim for cohesive modules and explicit interfaces in all system layers.

## Example
A `PaymentService` owns payment logic (cohesion); it exposes a small API used by other modules (low coupling).

## Pros / Cons
- Pros: Easier to reason about and modify parts independently.
- Cons: Requires design effort and clear boundaries.

## References
- Software modularity and design principles.