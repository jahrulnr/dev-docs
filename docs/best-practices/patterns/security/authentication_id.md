# Pola Authentication

## Overview

**Authentication** adalah proses memverifikasi bahwa identitas yang diklaim benar-benar valid—menjawab *siapa* yang mengirim request sebelum keputusan akses diambil. Ini berbeda dari [authorization](authorization_id.md), yang menjawab *apa* yang boleh dilakukan identitas tersebut. Di sistem terdistribusi, authentication biasanya dijalankan di edge ([API gateway](../integration/api-gateway_id.md)), di boundary service, atau di dalam request path setiap microservice, tergantung seberapa besar trust yang Anda berikan ke jaringan.

Authentication yang kuat menggabungkan satu atau lebih faktor: sesuatu yang Anda ketahui (password, PIN), sesuatu yang Anda miliki (perangkat OTP, hardware key), atau sesuatu yang Anda adalah (biometrik). Untuk traffic machine-to-machine, faktor sering disederhanakan menjadi bukti kriptografis—signature [JWT](jwt_id.md), [OAuth2](oauth2_id.md) client credentials, atau sertifikat [mutual TLS](mtls_id.md). [Zero trust](../../principles/security/zero-trust_id.md) memperlakukan setiap panggilan sebagai tidak terpercaya sampai identitas diverifikasi, terlepas dari lokasi jaringan.

Authentication harus **fail-closed**: kredensial yang tidak valid, kedaluwarsa, atau hilang menghasilkan penolakan, bukan akses anonim. Pasangkan dengan audit logging (siapa login, kapan, dari mana) agar insiden bisa ditelusuri. Defense in depth berarti authentication hanya satu lapisan—bukan satu-satunya kontrol.

## How it works

Alur request tipikal:

1. Client menyajikan kredensial (session cookie, bearer token, client certificate, atau signed assertion).
2. Verifier memeriksa integritas, expiry, audience, dan kepercayaan issuer.
3. Jika sukses, sistem mengikat **principal** (user ID, service account, client ID) ke request context.
4. [Authorization](authorization_id.md) downstream memakai principal tersebut; authentication sendiri tidak memberi permission.

Pola umum:

| Pattern | Typical use | Server state |
| --- | --- | --- |
| Session cookie | Browser apps | Stateful session store |
| Bearer JWT | APIs, SPAs dengan backend | Stateless (dengan trade-off revocation) |
| OAuth2 / OIDC | SSO, login pihak ketiga | Token + optional session |
| API key | Service account, webhook | Key registry |
| mTLS | Service-to-service | Certificate PKI |

## When to use

- Sistem apa pun yang mengekspos data atau aksi di luar konten read-only yang benar-benar publik.
- API, admin console, dan internal tool—bahkan di jaringan "private" di bawah [zero trust](../../principles/security/zero-trust_id.md).
- Operasi berisiko tinggi: pembayaran, perubahan privilege, export data—wajib step-up authentication (MFA).

## When not to use

- Jangan mengautentikasi *di dalam* business logic jika edge atau gateway bisa memvalidasi sekali lalu mempropagasi signed identity claim.
- Hindari crypto atau skema password buatan sendiri; gunakan library dan protokol yang mapan.
- Aset statis publik dan health check yang sengaja tanpa auth harus di-scope eksplisit—bukan celah tak disengaja.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Stateful sessions | Revocation mudah, kontrol di server | Scaling session store, sticky sessions |
| JWT (stateless) | API scalable horizontal | Revocation dan key rotation perlu perencanaan |
| Federated (OIDC) | Identitas terpusat, SSO | Ketergantungan pada ketersediaan IdP |
| mTLS | Identitas service kuat | Overhead lifecycle sertifikat |

## Example

API gateway memvalidasi [JWT](jwt_id.md) `Authorization: Bearer`, memeriksa `iss` dan `exp`, lalu meneruskan `X-User-Id` ke upstream hanya setelah verifikasi signature—tidak pernah mempercayai header identitas dari client saja:

```http
GET /api/orders HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

```go
// Pseudocode: verify sebelum handler
claims, err := verifier.Verify(token, expectedAudience)
if err != nil {
    return http.StatusUnauthorized
}
ctx = context.WithPrincipal(ctx, claims.Subject)
```

## Related

- [Authorization](authorization_id.md) — keputusan akses setelah identitas diketahui
- [JWT](jwt_id.md) — format bearer token umum untuk API
- [OAuth2 / OpenID Connect](oauth2_id.md) — login terdelegasi dan federated
- [Mutual TLS](mtls_id.md) — authentication berbasis sertifikat untuk service
- [Least privilege](../../principles/security/least-privilege_id.md) — permission minimal setelah auth
- [Zero trust](../../principles/security/zero-trust_id.md) — verifikasi setiap request
- [API gateway](../integration/api-gateway_id.md) — auth terpusat di edge

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B — Digital Identity Guidelines (Authentication)](https://pages.nist.gov/800-63-3/sp800-63b.html)
