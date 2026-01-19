# Authentication Pattern
## Overview

Authentication verifies the identity of a user or service (who you are) and is the first step in security. This ensures that only legitimate entities can access the system.

## When to use
Always use for systems requiring access control; implement strong authentication for sensitive operations.

## Example
JWT-based authentication, OAuth2 authorization code flow, or mutual TLS client certificates.

## Pros / Cons
- Pros: Essential for security and accountability.
- Cons: If misconfigured, can be bypassed; must protect credentials and tokens.

## References
- OWASP authentication guidelines, OAuth2 specs.