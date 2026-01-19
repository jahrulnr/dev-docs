# OAuth2 / OpenID Connect
## Overview

OAuth2 is an authorization framework for delegated access; OpenID Connect (OIDC) adds identity on top of OAuth2 for authentication. These standards enable secure, standardized authentication and authorization.

## When to use
Use for third-party authorization (delegated access) and single sign-on (OIDC) scenarios.

## Example
Authorization code flow exchanges a code for tokens; OIDC returns ID token with user info.

## Pros / Cons
- Pros: Standardized, widely supported, decouples identity from services.
- Cons: Implementation complexity and security pitfalls if flows are misused.

## References
- OAuth2 and OpenID Connect specs.