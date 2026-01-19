# Token-Based Authentication (JWT)
## Overview

JWT (JSON Web Tokens) are compact, URL-safe tokens used to represent claims between parties and commonly used for stateless authentication. They enable secure, scalable authentication without server-side state.

## When to use
Use for stateless API authentication, short-lived tokens for user sessions, or authorization claims propagation.

## Example
Issue a signed JWT containing user id and roles; verify signature on each request.

## Pros / Cons
- Pros: Stateless, scalable, and portable across services.
- Cons: Token revocation and long-lived tokens must be managed carefully.

## References
- JWT RFC 7519, auth best practices.