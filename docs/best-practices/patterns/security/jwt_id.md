# Token-Based Authentication (JWT)

## Overview

**JSON Web Token (JWT)** adalah string ringkas dan URL-safe yang meng-encode claim (pernyataan tentang suatu subject) antar pihak. Di definisikan dalam [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), JWT terdiri dari tiga bagian Base64url—header, payload, dan signature—dipisahkan titik. Signature (atau MAC) memungkinkan verifier mendeteksi manipulasi tanpa memanggil issuer setiap request, cocok untuk [API authentication](authentication_id.md) stateless di belakang fleet yang di-load-balance.

JWT sering diterbitkan setelah alur login [OAuth2](oauth2_id.md) atau OpenID Connect: **access token** mengotorisasi panggilan API; **refresh token** (biasanya opaque, bukan JWT) memperoleh access token baru. ID token (OIDC) membawa claim identitas untuk aplikasi klien—bukan pengganti [authorization](authorization_id.md) API. Perlakukan JWT sebagai bearer credential: siapa pun yang memegang token bisa memakainya sampai expiry atau revocation.

Jebakan umum: menerima `alg: none`, mempercayai claim tanpa verifikasi signature, menyimpan token di `localStorage` (paparan XSS), dan token berumur panjang tanpa rotasi. Pasangkan TTL pendek dengan refresh flow, pengecekan `aud` dan `iss` eksplisit, serta signing asimetris (RS256, ES256) bila banyak service memverifikasi. Defense in depth: [API gateway](../integration/api-gateway_id.md) bisa memvalidasi JWT, tetapi service tetap harus menegakkan [least privilege](../../principles/security/least-privilege_id.md) per resource.

## How it works

1. **Issuer** menandatangani `{ header, payload }` dengan secret (HMAC) atau private key (RSA/EC).
2. **Client** mengirim `Authorization: Bearer <jwt>` (atau cookie, sesuai threat model).
3. **Verifier** memeriksa signature, `exp`, `nbf`, `iss`, `aud`, dan custom claim opsional.
4. **Authorization** memetakan claim (`scope`, `roles`, `sub`) ke permission—claim adalah input, bukan kebijakan lengkap.

Registered claim (RFC 7519): `sub`, `iss`, `aud`, `exp`, `iat`, `jti`. Custom claim sebaiknya memakai key bernamespace agar tidak bentrok.

## When to use

- REST/GraphQL API stateless yang butuh scale horizontal tanpa session stickiness.
- Mempropagasi identitas antar service setelah validasi di edge (utamakan token berumur pendek).
- Login federated di mana IdP menerbitkan access atau ID token bertanda tangan ([OAuth2](oauth2_id.md) / OIDC).

## When not to use

- Token privilege tinggi berumur panjang tanpa strategi revocation—utamakan session server atau token introspection.
- Menyimpan PII sensitif di payload (JWT sering hanya di-sign, tidak di-enkripsi; gunakan JWE jika enkripsi wajib).
- Menggantikan [mTLS](mtls_id.md) untuk trust service-to-service bila kedua sisi butuh identitas kriptografis kuat di lapisan transport.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Signed JWT (JWS) | Verifikasi cepat, tanpa lookup DB | Sulit revoke sebelum `exp` |
| Opaque token + introspection | Revocation terpusat | Round-trip ekstra ke auth server |
| Symmetric (HS256) | Sederhana | Shared secret di semua verifier |
| Asymmetric (RS256) | Distribusi public key | Disiplin key rotation |

## Example

Issue dan verify (konseptual):

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

- [Authentication](authentication_id.md) — JWT sebagai salah satu mekanisme auth
- [OAuth2 / OpenID Connect](oauth2_id.md) — alur standar yang menerbitkan JWT
- [Authorization](authorization_id.md) — scope dan role vs pengecekan resource
- [API gateway](../integration/api-gateway_id.md) — validasi JWT terpusat
- [Zero trust](../../principles/security/zero-trust_id.md) — verifikasi setiap token, setiap request

## References

- [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
- [RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
