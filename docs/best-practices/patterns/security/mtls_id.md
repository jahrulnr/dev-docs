# Mutual TLS (mTLS)

## Overview

**Mutual TLS (mTLS)** memperluas TLS standar sehingga *client dan server* sama-sama menyajikan sertifikat X.509 saat handshake dan memverifikasi trust chain satu sama lain. HTTPS biasa hanya mengautentikasi server ke client; mTLS juga mengautentikasi client ke server. Ini menjadikan mTLS mekanisme [authentication](authentication_id.md) kuat untuk traffic service-to-service, terutama di dalam platform di mana setiap workload punya identitas kriptografis.

mTLS adalah pilar [zero trust](../../principles/security/zero-trust_id.md): lokasi jaringan tidak berarti trust. Dikombinasikan dengan [authorization](authorization_id.md) (memetakan SPIFFE ID sertifikat atau SAN ke role) dan [JWT](jwt_id.md) opsional di lapisan aplikasi, mTLS menerapkan defense in depth—kompromi satu lapisan tidak otomatis memberi akses. Service mesh (Istio, Linkerd), [API gateway](../integration/api-gateway_id.md) internal, dan load balancer cloud umumnya terminate atau meneruskan mTLS.

Biaya operasional adalah penghalang utama: issuance, rotasi, revocation sertifikat, dan distribusi trust store membutuhkan otomasi (internal CA bergaya ACME, SPIFFE/SPIRE, atau sertifikat terkelola cloud). Sertifikat berumur pendek (jam hingga hari) mengurangi blast radius dibanding client cert multi-tahun.

## How it works

1. Client dan server menegosiasikan TLS 1.2+ dengan cipher suite yang mendukung client auth.
2. Server menyajikan sertifikatnya; client memvalidasi terhadap CA terpercaya.
3. Server meminta client certificate; client menyajikan yang ditandatangani CA terpercaya.
4. Server memetakan identitas sertifikat (CN, SAN, URI SPIFFE) ke daftar principal atau kebijakan.
5. Data aplikasi mengalir di channel terenkripsi; ALPN opsional memilih HTTP/2 atau gRPC.

mTLS memberikan authentication dan kerahasiaan di lapisan **transport**; tidak menggantikan [authorization](authorization_id.md) level aplikasi atau alur [OAuth2](oauth2_id.md) untuk end user.

## When to use

- Traffic east-west antar microservice di Kubernetes atau lingkungan multi-account cloud.
- API B2B di mana partner menyajikan client certificate khusus organisasi.
- API admin internal dan control plane berjaminan tinggi.
- Melengkapi [OAuth2](oauth2_id.md)/[JWT](jwt_id.md) di edge dengan identitas mesin yang tidak semudah bearer token disalin.

## When not to use

- Situs publik berbasis browser—browser umumnya tidak menyajikan client cert pada alur user tipikal (kecuali beberapa deployment enterprise).
- Jalur sensitif latency tanpa connection pooling jika handshake mendominasi (reuse sesi TLS).
- Tim tanpa lifecycle sertifikat terotomasi—rotasi manual berujung outage dan insiden sertifikat kedaluwarsa.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Mesh-managed mTLS | Transparan bagi kode aplikasi | Kompleksitas mesh, debugging |
| Gateway-terminated mTLS | Kebijakan trust terpusat | Backend mungkin hanya melihat identitas gateway |
| Application-level TLS | Kontrol penuh | Setiap service mengelola sertifikat |
| mTLS + JWT | Identitas berlapis (mesin + user) | Dua stack validasi |

## Example

Nginx upstream mTLS (ilustrasi):

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

SPIFFE ID di SAN sertifikat (konseptual):

```text
URI SAN: spiffe://trust.domain/ns/payments/sa/billing-worker
```

## Related

- [Authentication](authentication_id.md) — identitas berbasis sertifikat
- [Authorization](authorization_id.md) — petakan identitas cert ke permission
- [API gateway](../integration/api-gateway_id.md) — terminasi mTLS di edge
- [JWT](jwt_id.md) — sering dilayer di atas mTLS untuk konteks user
- [OAuth2](oauth2_id.md) — delegasi user vs mTLS mesin
- [Zero trust](../../principles/security/zero-trust_id.md) — verifikasi setiap workload
- [Policy Enforcement Point (PEP)](pep_id.md) — gunakan attribute cert dalam kebijakan

## References

- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)
- [SPIFFE — Secure Production Identity Framework](https://spiffe.io/docs/latest/spiffe-about/overview/)
- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/publications/detail/sp/800-207/final)
