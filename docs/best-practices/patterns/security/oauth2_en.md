# OAuth2 / OpenID Connect

## Overview

**OAuth 2.0** is an authorization framework ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)) for *delegated access*: a resource owner grants a client limited permission to act on their behalf without sharing a password. It is not an authentication protocol by itself—using OAuth2 alone to "log users in" is a common mistake. **OpenID Connect (OIDC)** layers identity on top of OAuth2: an **ID token** (typically a [JWT](jwt_en.md)) proves who authenticated, while an **access token** authorizes API calls.

Standard flows include **authorization code** (with PKCE for public clients such as SPAs and mobile apps), **client credentials** (machine-to-machine), and **device code** (input-constrained devices). The authorization server issues tokens; resource servers validate them and enforce [authorization](authorization_en.md). An [API gateway](../integration/api-gateway_en.md) often terminates OAuth at the edge, validates tokens, and forwards identity claims upstream.

OAuth2 fits [zero trust](../../principles/security/zero-trust_en.md) when every resource server validates tokens independently and scopes follow [least privilege](../../principles/security/least-privilege_en.md). Defense in depth: combine OAuth with MFA at the IdP, short-lived access tokens, refresh-token rotation, and per-service policy checks—not gateway trust alone.

## Key flows

| Flow | Client type | Use case |
| --- | --- | --- |
| Authorization code + PKCE | Public (SPA, mobile) | User login, third-party apps |
| Client credentials | Confidential (service) | Service-to-service API access |
| Device code | TV, CLI | Devices without a browser |
| Refresh token | Any with prior grant | Renew access without re-login |

Avoid the implicit flow for new applications; prefer authorization code with PKCE.

## When to use

- Single sign-on (SSO) and social login via OIDC-compliant identity providers.
- Third-party integrations where users grant scoped access (e.g., "read calendar").
- Machine clients calling APIs with client ID/secret or certificate-bound tokens.
- Centralizing identity while microservices remain decoupled from credential stores.

## When not to use

- Simple internal admin tools with a single user base—OIDC adds operational overhead.
- Passing access tokens to untrusted third-party JavaScript without PKCE and strict CORS.
- Using OAuth2 where [mTLS](mtls_en.md) alone suffices for closed service meshes (they complement each other).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| OIDC federation | Standards-based SSO, rich ecosystem | IdP dependency, flow complexity |
| Self-hosted auth server | Full control | Security maintenance burden |
| Gateway token validation | Uniform edge policy | Services must still authorize |
| Token introspection | Opaque tokens, revocation | Latency per request |

## Example

Authorization code with PKCE (simplified):

```text
1. Client generates code_verifier + code_challenge (S256)
2. Redirect user to /authorize?response_type=code&client_id=...&code_challenge=...
3. User authenticates at IdP; redirect with ?code=...
4. POST /token with code + code_verifier → access_token, id_token, refresh_token
5. API call: Authorization: Bearer <access_token>
```

```json
// OIDC ID token claims (illustrative)
{
  "iss": "https://idp.example.com",
  "sub": "8f3b2c1a",
  "aud": "my-spa-client",
  "email": "user@example.com"
}
```

## Related

- [Authentication](authentication_en.md) — OIDC provides federated authentication
- [JWT](jwt_en.md) — common format for access and ID tokens
- [Authorization](authorization_en.md) — scopes vs resource-level policy
- [API gateway](../integration/api-gateway_en.md) — token validation and route policies
- [Least privilege](../../principles/security/least-privilege_en.md) — narrow OAuth scopes
- [Zero trust](../../principles/security/zero-trust_en.md) — verify tokens on every service

## References

- [RFC 6749 — OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
- [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
