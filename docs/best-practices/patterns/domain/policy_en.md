# Policy Pattern
## Overview

Policy encapsulates business decision logic (rules or policies) often configurable and testable independently from domain entities. This approach promotes separation of concerns and makes business rules more maintainable and adaptable to changing requirements.

## When to use
Use to centralize business decisions that might change frequently or are configurable by stakeholders.

## Example
A `PricingPolicy` determines discounts based on customer tier and promotions.

## Pros / Cons
- Pros: Centralizes business rules, easier to test and modify.
- Cons: May require orchestration to apply policies consistently.

## References
- DDD and architecture resources.