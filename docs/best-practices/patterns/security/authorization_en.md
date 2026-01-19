# Authorization Pattern
## Overview

Authorization decides what an authenticated principal is allowed to do (access control). Implement as RBAC, ABAC, or capability-based access. This ensures that only authorized users can access resources.

## When to use
Use to enforce fine-grained access control across APIs and resources.

## Example
Role-based access: `admin` can create users; `user` can only edit own profile.

## Pros / Cons
- Pros: Enforces least privilege when designed correctly.
- Cons: Complexity increases with many roles/policies; misconfiguration causes over-privilege.

## References
- OWASP access control guidance.