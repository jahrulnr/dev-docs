# Backward Compatibility
## Overview

Backward Compatibility ensures newer versions of services or APIs continue to work with older clients, enabling safe evolution. This principle is crucial in distributed systems to maintain interoperability and avoid breaking changes that could disrupt dependent services.

## When to use
Use when rolling out changes in distributed systems where not all clients can be upgraded simultaneously.

## Example
Add optional fields to API responses rather than removing or renaming fields.

## Pros / Cons
- Pros: Reduces deployment coordination, smoother upgrades.
- Cons: Can lead to longer-lived legacy behavior and complexity.

## References
- API versioning and compatibility guidelines.