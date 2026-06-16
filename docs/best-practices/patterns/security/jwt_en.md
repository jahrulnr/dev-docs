# Token-Based Authentication (JWT)

## Overview

A **JSON Web Token (JWT)** is a compact, URL-safe string that encodes claims (assertions about a subject) between parties. Defined in [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), a JWT has three Base64url-encoded parts—header, payload, and signature—separated by dots. The signature (or MAC) lets verifiers detect tampering without calling the issuer on every request, which suits stateless [API authentication](authentication_en.md) behind a load-balanced fleet.

JWTs are often issued after [OAuth2](oauth2_en.md) or OpenID Connect login flows: an **access token** authorizes API calls; a **refresh token** (usually opaque, not a JWT) obtains new access tokens. ID tokens (OIDC) carry identity claims for the client application—they are not a substitute for API [authorization](authorization_en.md). Treat JWTs as bearer credentials: anyone who possesses the token can use it until expiry or revocation.

Common pitfalls include accepting `alg: none`, trusting claims without signature verification, storing tokens in `localStorage` (XSS exposure), and long-lived tokens without rotation. Pair short TTLs with refresh flows, explicit `aud` (audience) and `iss` (issuer) checks, and asymmetric signing (RS256, ES256) when multiple services verify tokens. Defense in depth: the [API gateway](../integration/api-gateway_en.md) may validate JWTs, but services should still enforce [least privilege](../../principles/security/least-privilege_en.md) on each resource.

## How it works

1. **Issuer** signs `{ header, payload }` with a secret (HMAC) or private key (RSA/EC).
2. **Client** sends `Authorization: Bearer <jwt>` (or cookie, per threat model).
3. **Verifier** checks signature, `exp`, `nbf`, `iss`, `aud`, and optional custom claims.
4. **Authorization** maps claims (`scope`, `roles`, `sub`) to permissions—claims are inputs, not the full policy.

Registered claims (RFC 7519): `sub`, `iss`, `aud`, `exp`, `iat`, `jti`. Custom claims should use namespaced keys to avoid collisions.

## When to use

- Stateless REST/GraphQL APIs where horizontal scale matters and session stickiness is undesirable.
- Propagating identity between services after edge validation (prefer short-lived tokens).
- Federated login where an IdP issues signed access or ID tokens ([OAuth2](oauth2_en.md) / OIDC).

## When not to use

- Long-lived, high-privilege tokens without revocation strategy—prefer session server or token introspection.
- Storing sensitive PII in the payload (JWTs are often only signed, not encrypted; use JWE if encryption is required).
- Replacing [mTLS](mtls_en.md) for service-to-service trust when both sides need strong cryptographic identity at the transport layer.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Signed JWT (JWS) | Fast verification, no DB lookup | Hard to revoke before `exp` |
| Opaque token + introspection | Central revocation | Extra round-trip to auth server |
| Symmetric (HS256) | Simple | Shared secret across all verifiers |
| Asymmetric (RS256) | Public key distribution | Key rotation discipline required |

## Example

Issue and verify (conceptual):

```json
// Payload (claims)
{
  "sub": "user-42",
  "iss": "https://auth.example.com",
  "aud": "api.example.com",
  "exp": 1718553600,
  "scope": "orders:read"
}
```

```go
token, _ := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
    if t.Method.Alg() != "RS256" {
        return nil, fmt.Errorf("unexpected alg")
    }
    return publicKey, nil
})
```

## Related

- [Authentication](authentication_en.md) — JWT as one auth mechanism
- [OAuth2 / OpenID Connect](oauth2_en.md) — standard flows that issue JWTs
- [Authorization](authorization_en.md) — scopes and roles vs resource checks
- [API gateway](../integration/api-gateway_en.md) — centralized JWT validation
- [Zero trust](../../principles/security/zero-trust_en.md) — verify every token, every request

## References

- [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
- [RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
