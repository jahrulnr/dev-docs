# Authorization Pattern

## Overview

**Authorization** determines whether an authenticated [principal](authentication_en.md) may perform a specific action on a specific resource—answering *what* is allowed after *who* has been established. Poor authorization is a leading cause of data breaches: attackers authenticate with a low-privilege account and exploit missing or overly broad access checks (IDOR, privilege escalation).

Design authorization around [least privilege](../../principles/security/least-privilege_en.md): grant only the permissions required for a task, for the shortest time needed. Policies can be role-based (RBAC), attribute-based (ABAC), relationship-based (ReBAC), or capability-based. In microservices, enforce authorization at every service boundary—a token validated at the [API gateway](../integration/api-gateway_en.md) does not remove the need for per-resource checks downstream.

Centralized policy engines (Open Policy Agent, cloud IAM) separate **policy decision** from **policy enforcement**. A [Policy Enforcement Point (PEP)](pep_en.md) at the gateway or service applies decisions consistently. Under [zero trust](../../principles/security/zero-trust_en.md), authorization is re-evaluated per request using current context (user, device posture, resource sensitivity), not assumed from network zone alone.

## Key ideas

| Model | Decision basis | Good fit |
| --- | --- | --- |
| RBAC | Roles → permissions | Stable org hierarchies, admin vs user |
| ABAC | Attributes (user, resource, env) | Dynamic, context-sensitive rules |
| ReBAC | Graph relationships | "Owner of project X", social/doc graphs |
| ACL | Per-resource allow list | Small, fixed resource sets |

Defense in depth: combine coarse roles at the edge with fine-grained checks in domain code (e.g., "can this user edit *this* order?").

## When to use

- Every API endpoint and UI action that reads or mutates protected data.
- Multi-tenant systems—tenant ID must be part of every authorization decision.
- Admin, billing, and export flows where horizontal privilege escalation is a risk.

## When not to use

- Do not rely on "security through obscurity" (hidden URLs) instead of explicit checks.
- Avoid scattering ad-hoc `if (user.isAdmin)` without a maintainable policy model as the system grows.
- Public read-only resources should be explicitly marked public in policy—not left undefined.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| RBAC | Simple to explain, easy onboarding | Role explosion, coarse grants |
| ABAC / policy engine | Flexible, context-aware | Harder to test and audit |
| Central PDP + PEP | Consistent org-wide policy | Latency, PDP availability |
| Per-service checks | Low latency, domain-specific | Risk of inconsistent rules |

## Example

RBAC at the gateway plus resource-level check in the service:

```yaml
# Gateway: coarse route policy
routes:
  - path: /admin/*
    required_roles: [admin]
```

```go
func UpdateOrder(ctx context.Context, orderID string) error {
    principal := auth.FromContext(ctx)
    order, _ := repo.GetOrder(orderID)
    if order.OwnerID != principal.UserID && !principal.HasRole("admin") {
        return ErrForbidden // 403, not 404 — avoid leaking existence
    }
    // ...
}
```

## Related

- [Authentication](authentication_en.md) — identity before authorization
- [Policy Enforcement Point (PEP)](pep_en.md) — where policies are applied
- [Least privilege](../../principles/security/least-privilege_en.md) — minimal necessary permissions
- [Zero trust](../../principles/security/zero-trust_en.md) — continuous verification
- [API gateway](../integration/api-gateway_en.md) — coarse authz at the edge
- [JWT](jwt_en.md) — carrying roles/scopes in tokens (claims are hints, not sole proof)

## References

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST SP 800-162 — ABAC](https://csrc.nist.gov/publications/detail/sp/800-162/final)
