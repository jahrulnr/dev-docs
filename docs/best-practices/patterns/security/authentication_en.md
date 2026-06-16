# Authentication Pattern

## Overview

**Authentication** is the process of verifying that a claimed identity is genuine—answering *who* is making a request before any access decision is made. It is distinct from [authorization](authorization_en.md), which answers *what* that identity may do. In distributed systems, authentication typically runs at the edge ([API gateway](../integration/api-gateway_en.md)), at service boundaries, or inside the request path of each microservice, depending on how much trust you place in the network.

Strong authentication combines one or more factors: something you know (password, PIN), something you have (OTP device, hardware key), or something you are (biometric). For machine-to-machine traffic, factors often reduce to cryptographic proof—[JWT](jwt_en.md) signatures, [OAuth2](oauth2_en.md) client credentials, or [mutual TLS](mtls_en.md) certificates. [Zero trust](../../principles/security/zero-trust_en.md) treats every call as untrusted until identity is verified, regardless of network location.

Authentication should **fail closed**: invalid, expired, or missing credentials result in rejection, not anonymous access. Pair authentication with audit logging (who authenticated, when, from where) so incidents can be traced. Defense in depth means authentication is one layer—never the only control.

## How it works

A typical request flow:

1. The client presents credentials (session cookie, bearer token, client certificate, or signed assertion).
2. The verifier checks integrity, expiry, audience, and issuer trust.
3. On success, the system binds a **principal** (user ID, service account, client ID) to the request context.
4. Downstream [authorization](authorization_en.md) uses that principal; authentication does not grant permissions by itself.

Common patterns:

| Pattern | Typical use | Server state |
| --- | --- | --- |
| Session cookie | Browser apps | Stateful session store |
| Bearer JWT | APIs, SPAs with backend | Stateless (with revocation trade-offs) |
| OAuth2 / OIDC | SSO, third-party login | Tokens + optional session |
| API key | Service accounts, webhooks | Key registry |
| mTLS | Service-to-service | Certificate PKI |

## When to use

- Any system that exposes data or actions beyond fully public read-only content.
- APIs, admin consoles, and internal tools—even on a "private" network under [zero trust](../../principles/security/zero-trust_en.md).
- High-risk operations: payments, privilege changes, data export—require step-up authentication (MFA).

## When not to use

- Do not authenticate *inside* business logic when the edge or gateway can validate once and propagate a signed identity claim.
- Avoid rolling custom crypto or password schemes; use established libraries and protocols.
- Public static assets and health checks that intentionally omit auth should be explicitly scoped—not accidental gaps.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Stateful sessions | Easy revocation, server control | Session store scaling, sticky sessions |
| JWT (stateless) | Horizontally scalable APIs | Revocation and key rotation need planning |
| Federated (OIDC) | Central identity, SSO | Dependency on IdP availability |
| mTLS | Strong service identity | Certificate lifecycle overhead |

## Example

An API gateway validates an `Authorization: Bearer` [JWT](jwt_en.md), checks `iss` and `exp`, then forwards `X-User-Id` to upstream only after signature verification—never trusting client-supplied identity headers alone:

```http
GET /api/orders HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

```go
// Pseudocode: verify before handler
claims, err := verifier.Verify(token, expectedAudience)
if err != nil {
    return http.StatusUnauthorized
}
ctx = context.WithPrincipal(ctx, claims.Subject)
```

## Related

- [Authorization](authorization_en.md) — access decisions after identity is known
- [JWT](jwt_en.md) — common bearer-token format for APIs
- [OAuth2 / OpenID Connect](oauth2_en.md) — delegated and federated login
- [Mutual TLS](mtls_en.md) — certificate-based service authentication
- [Least privilege](../../principles/security/least-privilege_en.md) — minimal permissions after auth
- [Zero trust](../../principles/security/zero-trust_en.md) — verify every request
- [API gateway](../integration/api-gateway_en.md) — centralized auth at the edge

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B — Digital Identity Guidelines (Authentication)](https://pages.nist.gov/800-63-3/sp800-63b.html)
