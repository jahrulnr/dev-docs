# Policy Enforcement Point (PEP)

## Overview

Dalam arsitektur access control—terutama yang terinspirasi XACML—**Policy Enforcement Point (PEP)** adalah komponen yang mencegat request dan *menegakkan* keputusan allow/deny. PEP tidak memutuskan kebijakan sendiri: ia meminta **Policy Decision Point (PDP)** mengevaluasi aturan, opsional mengumpulkan attribute dari **Policy Information Point (PIP)**, lalu menerapkan hasilnya sebelum request mencapai business logic. Pemisahan ini menjaga aturan [authorization](authorization_id.md) terpusat sementara enforcement tetap di setiap boundary yang relevan.

Penempatan PEP umum: [API gateway](../integration/api-gateway_id.md) (validasi [JWT](jwt_id.md), cek scope level route), sidecar service mesh (Envoy + OPA), middleware aplikasi, dan trigger row-level security di database. PEP gateway bisa menolak traffic yang jelas tidak valid lebih awal; PEP service tetap memverifikasi "user A boleh akses order 123" karena aturan edge kasar tidak bisa meng-encode semua constraint domain.

PEP harus **fail-closed** bila PDP tidak terjangkau, kecuali kebijakan secara eksplisit mengizinkan mode degradasi (jarang untuk sistem sensitif keamanan). Di bawah [zero trust](../../principles/security/zero-trust_id.md), setiap hop memperlakukan jaringan sebagai hostile—beberapa PEP menerapkan defense in depth, bukan satu pengecekan perimeter. Selaraskan keputusan PEP dengan [least privilege](../../principles/security/least-privilege_id.md): default deny, permit eksplisit.

## How it works

```text
Request → PEP → (attribute dari PIP) → PDP → keputusan → PEP allow atau block → handler
```

| Role | Responsibility |
| --- | --- |
| PEP | Intercept, panggil PDP, enforce keputusan, audit |
| PDP | Evaluasi kebijakan (OPA, Cedar, cloud IAM, engine kustom) |
| PIP | Sediakan attribute (grup user, tag resource, threat intel) |
| PAP | Policy Administration Point — tempat kebijakan ditulis/diversion |

## When to use

- Organisasi dengan banyak microservice yang butuh [authorization](authorization_id.md) konsisten org-wide tanpa menyalin aturan ke setiap repo.
- Lingkungan terregulasi yang mewajibkan audit terpusat atas keputusan akses.
- Produk API yang mengekspos backend sama lewat tier klien berbeda (scope free vs enterprise).
- Service mesh atau gateway yang sudah ada di request path—menambah logika PEP punya biaya marginal rendah.

## When not to use

- Monolith tunggal dengan sedikit role—pengecekan inline atau library RBAC sederhana mungkin cukup.
- Jalur kritis latency di mana panggilan PDP sinkron setiap request tidak dapat diterima tanpa cache—dan cache membawa risiko staleness.
- Bila PDP menjadi single point of failure tanpa HA dan tanpa desain fail-closed yang aman.

## Trade-offs

| Placement | Pros | Cons |
| --- | --- | --- |
| API gateway PEP | Satu tempat untuk TLS, authn, authz kasar | Tidak melihat semua konteks domain |
| Sidecar PEP | Enforcement seragam per pod | Kompleksitas operasional |
| In-app middleware | Konteks domain kaya | Risiko kebijakan tidak konsisten |
| Embedded OPA | Kebijakan Rego portabel | Sinkronisasi bundle, version drift |

## Example

PEP gateway mendelegasikan ke OPA; PEP service menambah pengecekan resource:

```rego
# Kebijakan PDP (OPA) — gateway: scope route
default allow = false
allow {
    input.method == "GET"
    input.path = "/api/orders"
    "orders:read" in input.token.scopes
}
```

```go
// PEP level service (aturan domain)
func (p *PEP) EnforceUpdateOrder(ctx context.Context, orderID string) error {
    input := buildOPAInput(ctx, orderID)
    if !p.pdp.Allow(ctx, "orders/update", input) {
        return ErrForbidden
    }
    return nil
}
```

## Related

- [Authorization](authorization_id.md) — apa yang ditegakkan PEP
- [Authentication](authentication_id.md) — input identitas ke kebijakan
- [API gateway](../integration/api-gateway_id.md) — PEP natural di edge
- [JWT](jwt_id.md) — claim token sebagai input PDP
- [Least privilege](../../principles/security/least-privilege_id.md) — kebijakan default-deny
- [Zero trust](../../principles/security/zero-trust_id.md) — PEP di setiap trust boundary
- [Mutual TLS](mtls_en.md) — identitas transport sebagai attribute kebijakan

## References

- [OASIS XACML overview](https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html)
- [Open Policy Agent (OPA) documentation](https://www.openpolicyagent.org/docs/latest/)
- [NIST SP 800-162 — ABAC](https://csrc.nist.gov/publications/detail/sp/800-162/final)
