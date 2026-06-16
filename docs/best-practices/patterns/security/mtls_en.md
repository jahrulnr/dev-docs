# Mutual TLS (mTLS)

## Overview

**Mutual TLS (mTLS)** extends standard TLS so that *both* the client and server present X.509 certificates during the handshake and verify each other's trust chain. Ordinary HTTPS only authenticates the server to the client; mTLS also authenticates the client to the server. That makes it a strong [authentication](authentication_en.md) mechanism for service-to-service traffic, especially inside a platform where every workload has a cryptographic identity.

mTLS is a pillar of [zero trust](../../principles/security/zero-trust_en.md): network location does not imply trust. Combined with [authorization](authorization_en.md) (mapping certificate SPIFFE ID or SAN to roles) and optional [JWT](jwt_en.md) at the application layer, it implements defense in depth—compromise of one layer does not automatically grant access. Service meshes (Istio, Linkerd), internal [API gateways](../integration/api-gateway_en.md), and cloud load balancers commonly terminate or pass through mTLS.

Operational cost is the main barrier: certificate issuance, rotation, revocation, and trust store distribution require automation (ACME-style internal CAs, SPIFFE/SPIRE, or cloud-managed certs). Short-lived certificates (hours to days) reduce blast radius compared to multi-year client certs.

## How it works

1. Client and server negotiate TLS 1.2+ with cipher suites that support client auth.
2. Server presents its certificate; client validates against trusted CAs.
3. Server requests a client certificate; client presents one signed by a trusted CA.
4. Server maps certificate identity (CN, SAN, SPIFFE URI) to an allowed principal list or policy.
5. Application data flows over the encrypted channel; optional ALPN selects HTTP/2 or gRPC.

mTLS provides **transport** authentication and confidentiality; it does not replace application-level [authorization](authorization_en.md) or user [OAuth2](oauth2_en.md) flows for end users.

## When to use

- East-west traffic between microservices in Kubernetes or multi-account cloud environments.
- B2B APIs where partners present organization-specific client certificates.
- High-assurance internal admin APIs and control planes.
- Complementing edge [OAuth2](oauth2_en.md)/[JWT](jwt_en.md) with machine identity that cannot be copied as easily as a bearer token alone.

## When not to use

- Public browser-facing sites—browsers do not present client certs in typical user flows (exceptions: some enterprise deployments).
- Latency-sensitive paths without connection pooling if handshakes dominate (reuse TLS sessions).
- Teams without automated cert lifecycle—manual rotation leads to outages and expired cert incidents.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Mesh-managed mTLS | Transparent to app code | Mesh complexity, debugging |
| Gateway-terminated mTLS | Central trust policy | Backend may see only gateway identity |
| Application-level TLS | Full control | Every service manages certs |
| mTLS + JWT | Layered identity (machine + user) | Two validation stacks |

## Example

Nginx upstream mTLS (illustrative):

```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/certs/server.pem;
    ssl_certificate_key /etc/certs/server-key.pem;
    ssl_client_certificate /etc/certs/ca.pem;
    ssl_verify_client on;

    if ($ssl_client_verify != SUCCESS) {
        return 403;
    }
    proxy_pass http://backend;
}
```

SPIFFE ID in certificate SAN (conceptual):

```text
URI SAN: spiffe://trust.domain/ns/payments/sa/billing-worker
```

## Related

- [Authentication](authentication_en.md) — certificate-based identity
- [Authorization](authorization_en.md) — map cert identity to permissions
- [API gateway](../integration/api-gateway_en.md) — mTLS termination at the edge
- [JWT](jwt_en.md) — often layered above mTLS for user context
- [OAuth2](oauth2_en.md) — user delegation vs machine mTLS
- [Zero trust](../../principles/security/zero-trust_en.md) — verify every workload
- [Policy Enforcement Point (PEP)](pep_en.md) — use cert attributes in policy

## References

- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)
- [SPIFFE — Secure Production Identity Framework](https://spiffe.io/docs/latest/spiffe-about/overview/)
- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/publications/detail/sp/800-207/final)
