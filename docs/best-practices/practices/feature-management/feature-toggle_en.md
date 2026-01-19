# Feature Toggle
## Overview

Feature Toggles (flags) control feature availability at runtime, enabling dark launches, gradual rollouts, and quick rollbacks. This technique allows for safer deployments and more flexible feature management.

## When to use
Use for progressive delivery, experimentation, and decoupling feature release from code deployment.

## Example
A boolean `newCheckoutEnabled` flag toggles the new checkout flow for subsets of users.

## Pros / Cons
- Pros: Fine-grained control over releases, supports A/B testing.
- Cons: Toggle debt if not cleaned up, additional complexity in code paths.

## References
- Feature flagging best practices.