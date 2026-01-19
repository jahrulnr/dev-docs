# Use Case Interactor
## Overview

Use Case Interactors (or Application Services) orchestrate application-level workflows by coordinating domain objects and repositories to fulfill a use case. They act as the entry point for application logic, ensuring clean separation between presentation, domain, and infrastructure layers.

## When to use
Use to encapsulate application flow logic separate from domain model and infrastructure concerns.

## Example
`CreateOrderInteractor` validates input, uses domain services/aggregates, and persists changes via repositories.

## Pros / Cons
- Pros: Clear separation of use case orchestration and domain rules.
- Cons: Can become anemic if too much domain logic is placed here.

## References
- Clean Architecture and Hexagonal Architecture resources.