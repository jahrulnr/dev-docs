# Policy Enforcement Point (PEP)
## Overview

PEP enforces access control decisions from a Policy Decision Point (PDP) at the service level, ensuring authorization policies are applied consistently. This enables centralized and consistent access control.

## When to use
Use when central policy management (PDP) is needed and enforcement must occur at service/API boundaries.

## Example
API gateway acts as PEP by querying PDP for each request and allowing/denying based on policy.

## Pros / Cons
- Pros: Centralized policy decisions, consistent enforcement across services.
- Cons: Adds dependency on PDP availability and latency; requires secure communication.

## References
- XACML and access control frameworks.