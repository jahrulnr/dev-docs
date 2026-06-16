# Policy Enforcement Point (PEP)

## Overview

In access-control architectures—especially those inspired by XACML—a **Policy Enforcement Point (PEP)** is the component that intercepts a request and *enforces* an allow/deny decision. It does not decide policy alone: it asks a **Policy Decision Point (PDP)** to evaluate rules, optionally gathers attributes from a **Policy Information Point (PIP)**, and applies the outcome before the request reaches business logic. This separation keeps [authorization](authorization_en.md) rules centralized while enforcement stays at every boundary that matters.

Common PEP placements include the [API gateway](../integration/api-gateway_en.md) (validate [JWT](jwt_en.md), check route-level scopes), service mesh sidecars (Envoy + OPA), application middleware, and database row-level security triggers. A gateway PEP might deny obviously invalid traffic early; a service PEP still verifies "user A may access order 123" because coarse edge rules cannot encode all domain constraints.

PEPs should **fail closed** when the PDP is unreachable unless policy explicitly allows a degraded mode (rare for security-sensitive systems). Under [zero trust](../../principles/security/zero-trust_en.md), every hop treats the network as hostile—multiple PEPs implement defense in depth rather than a single perimeter check. Align PEP decisions with [least privilege](../../principles/security/least-privilege_en.md): default deny, explicit permit.

## How it works

```text
Request → PEP → (attributes from PIP) → PDP → decision → PEP allows or blocks → handler
```

| Role | Responsibility |
| --- | --- |
| PEP | Intercept, call PDP, enforce decision, audit |
| PDP | Evaluate policy (OPA, Cedar, cloud IAM, custom engine) |
| PIP | Supply attributes (user groups, resource tags, threat intel) |
| PAP | Policy Administration Point — where policies are authored/versioned |

## When to use

- Organizations with many microservices that need consistent org-wide [authorization](authorization_en.md) without copying rules into every repo.
- Regulated environments requiring centralized audit of access decisions.
- API products exposing the same backend through different client tiers (free vs enterprise scopes).
- Service meshes or gateways already in the request path—adding PEP logic has low marginal cost.

## When not to use

- A single monolith with a handful of roles—inline checks or a simple RBAC library may suffice.
- Latency-critical paths where synchronous PDP calls on every request are unacceptable without caching—and caching introduces staleness risk.
- When the PDP becomes a single point of failure without HA and without a safe fail-closed design.

## Trade-offs

| Placement | Pros | Cons |
| --- | --- | --- |
| API gateway PEP | One place for TLS, authn, coarse authz | Cannot see all domain context |
| Sidecar PEP | Uniform per-pod enforcement | Operational complexity |
| In-app middleware | Rich domain context | Risk of inconsistent policies |
| Embedded OPA | Portable Rego policies | Bundle sync, version drift |

## Example

Gateway PEP delegates to OPA; service PEP adds resource check:

```rego
# PDP policy (OPA) — gateway: route scope
default allow = false
allow {
    input.method == "GET"
    input.path = "/api/orders"
    "orders:read" in input.token.scopes
}
```

```go
// Service-level PEP (domain rule)
func (p *PEP) EnforceUpdateOrder(ctx context.Context, orderID string) error {
    input := buildOPAInput(ctx, orderID)
    if !p.pdp.Allow(ctx, "orders/update", input) {
        return ErrForbidden
    }
    return nil
}
```

## Related

- [Authorization](authorization_en.md) — what PEP enforces
- [Authentication](authentication_en.md) — identity input to policy
- [API gateway](../integration/api-gateway_en.md) — natural edge PEP
- [JWT](jwt_en.md) — token claims fed into PDP
- [Least privilege](../../principles/security/least-privilege_en.md) — default-deny policies
- [Zero trust](../../principles/security/zero-trust_en.md) — PEP at every trust boundary
- [Mutual TLS](mtls_en.md) — transport identity as a policy attribute

## References

- [OASIS XACML overview](https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html)
- [Open Policy Agent (OPA) documentation](https://www.openpolicyagent.org/docs/latest/)
- [NIST SP 800-162 — ABAC](https://csrc.nist.gov/publications/detail/sp/800-162/final)
