# OAuth2 / OpenID Connect

## Overview

**OAuth 2.0** adalah kerangka kerja authorization ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)) untuk *delegated access*: resource owner memberi client izin terbatas untuk bertindak atas nama mereka tanpa membagikan password. OAuth2 bukan protokol authentication—memakai OAuth2 saja untuk "login user" adalah kesalahan umum. **OpenID Connect (OIDC)** menambahkan lapisan identitas di atas OAuth2: **ID token** (biasanya [JWT](jwt_id.md)) membuktikan siapa yang terautentikasi, sementara **access token** mengotorisasi panggilan API.

Alur standar meliputi **authorization code** (dengan PKCE untuk public client seperti SPA dan mobile), **client credentials** (machine-to-machine), dan **device code** (perangkat terbatas input). Authorization server menerbitkan token; resource server memvalidasi dan menegakkan [authorization](authorization_id.md). [API gateway](../integration/api-gateway_id.md) sering mengakhiri OAuth di edge, memvalidasi token, lalu meneruskan identity claim ke upstream.

OAuth2 cocok dengan [zero trust](../../principles/security/zero-trust_id.md) bila setiap resource server memvalidasi token secara independen dan scope mengikuti [least privilege](../../principles/security/least-privilege_id.md). Defense in depth: gabungkan OAuth dengan MFA di IdP, access token berumur pendek, rotasi refresh token, dan pengecekan kebijakan per service—bukan hanya trust gateway.

## Key flows

| Flow | Client type | Use case |
| --- | --- | --- |
| Authorization code + PKCE | Public (SPA, mobile) | Login user, aplikasi pihak ketiga |
| Client credentials | Confidential (service) | Akses API service-to-service |
| Device code | TV, CLI | Perangkat tanpa browser |
| Refresh token | Client dengan grant sebelumnya | Perpanjang akses tanpa login ulang |

Hindari implicit flow untuk aplikasi baru; utamakan authorization code dengan PKCE.

## When to use

- Single sign-on (SSO) dan social login via identity provider yang patuh OIDC.
- Integrasi pihak ketiga di mana user memberi akses berscope (misalnya "baca kalender").
- Machine client memanggil API dengan client ID/secret atau token terikat sertifikat.
- Identitas terpusat sementara microservice tetap terlepas dari penyimpanan kredensial.

## When not to use

- Tool admin internal sederhana dengan satu basis user—OIDC menambah overhead operasional.
- Meneruskan access token ke JavaScript pihak ketiga yang tidak terpercaya tanpa PKCE dan CORS ketat.
- Memakai OAuth2 di mana [mTLS](mtls_id.md) saja cukup untuk service mesh tertutup (keduanya saling melengkapi).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| OIDC federation | SSO berbasis standar, ekosistem kaya | Ketergantungan IdP, kompleksitas alur |
| Self-hosted auth server | Kontrol penuh | Beban pemeliharaan keamanan |
| Gateway token validation | Kebijakan edge seragam | Service tetap harus authorize |
| Token introspection | Opaque token, revocation | Latency per request |

## Example

Authorization code dengan PKCE (disederhanakan):

```text
1. Client menghasilkan code_verifier + code_challenge (S256)
2. Redirect user ke /authorize?response_type=code&client_id=...&code_challenge=...
3. User login di IdP; redirect dengan ?code=...
4. POST /token dengan code + code_verifier → access_token, id_token, refresh_token
5. Panggilan API: Authorization: Bearer <access_token>
```

```json
// Claim ID token OIDC (ilustrasi)
{
  "iss": "https://idp.example.com",
  "sub": "8f3b2c1a",
  "aud": "my-spa-client",
  "email": "user@example.com"
}
```

## Related

- [Authentication](authentication_id.md) — OIDC menyediakan authentication federated
- [JWT](jwt_id.md) — format umum access dan ID token
- [Authorization](authorization_id.md) — scope vs kebijakan level resource
- [API gateway](../integration/api-gateway_id.md) — validasi token dan kebijakan route
- [Least privilege](../../principles/security/least-privilege_id.md) — scope OAuth sempit
- [Zero trust](../../principles/security/zero-trust_id.md) — verifikasi token di setiap service

## References

- [RFC 6749 — OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
- [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
