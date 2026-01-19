# Anti-Corruption Layer (ACL)
## Overview

ACL protects your domain model from external models by translating between external protocols/models and your internal model. This layer maintains domain integrity by preventing foreign concepts from corrupting your business model.

## When to use
Use when integrating legacy systems or third-party models to avoid polluting your domain with foreign concepts.

## Example
Adapters and translators that convert legacy data formats into your domain DTOs.

## Pros / Cons
- Pros: Keeps domain model clean, isolates external changes.
- Cons: Extra mapping code and added maintenance.

## References
- Domain-Driven Design guidance on integrating legacy systems.