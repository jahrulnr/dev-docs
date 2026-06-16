# Pola Authorization

## Overview

**Authorization** menentukan apakah [principal](authentication_id.md) yang sudah terautentikasi boleh melakukan aksi tertentu pada resource tertentu—menjawab *apa* yang diizinkan setelah *siapa* sudah diketahui. Authorization yang lemah adalah penyebab utama kebocoran data: penyerang login dengan akun privilege rendah lalu mengeksploitasi pengecekan akses yang hilang atau terlalu luas (IDOR, privilege escalation).

Rancang authorization mengelilingi [least privilege](../../principles/security/least-privilege_id.md): berikan hanya permission yang dibutuhkan untuk tugas tersebut, selama waktu sesingkat mungkin. Kebijakan bisa berbasis role (RBAC), attribute (ABAC), relationship (ReBAC), atau capability. Di microservices, enforce authorization di setiap service boundary—token yang divalidasi di [API gateway](../integration/api-gateway_id.md) tidak menghilangkan kebutuhan pengecekan per-resource di downstream.

Policy engine terpusat (Open Policy Agent, cloud IAM) memisahkan **policy decision** dari **policy enforcement**. [Policy Enforcement Point (PEP)](pep_id.md) di gateway atau service menerapkan keputusan secara konsisten. Di bawah [zero trust](../../principles/security/zero-trust_id.md), authorization dievaluasi ulang per request memakai konteks terkini (user, device posture, sensitivitas resource), bukan diasumsikan dari zona jaringan saja.

## Key ideas

| Model | Decision basis | Good fit |
| --- | --- | --- |
| RBAC | Role → permission | Hierarki organisasi stabil, admin vs user |
| ABAC | Attribute (user, resource, env) | Aturan dinamis, sensitif konteks |
| ReBAC | Relasi graph | "Owner project X", graph dokumen/sosial |
| ACL | Allow list per resource | Set resource kecil dan tetap |

Defense in depth: gabungkan role kasar di edge dengan pengecekan granular di domain code (misalnya "bolehkah user ini mengedit *order ini*?").

## When to use

- Setiap endpoint API dan aksi UI yang membaca atau mengubah data terlindungi.
- Sistem multi-tenant—tenant ID harus menjadi bagian setiap keputusan authorization.
- Alur admin, billing, dan export di mana horizontal privilege escalation berisiko.

## When not to use

- Jangan mengandalkan "security through obscurity" (URL tersembunyi) menggantikan pengecekan eksplisit.
- Hindari `if (user.isAdmin)` tersebar tanpa model kebijakan yang bisa dirawat seiring sistem bertumbuh.
- Resource read-only publik harus ditandai eksplisit sebagai publik dalam policy—bukan dibiarkan tidak terdefinisi.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| RBAC | Mudah dijelaskan, onboarding sederhana | Role explosion, grant kasar |
| ABAC / policy engine | Fleksibel, aware konteks | Lebih sulit diuji dan diaudit |
| Central PDP + PEP | Kebijakan konsisten org-wide | Latency, ketersediaan PDP |
| Per-service checks | Latency rendah, spesifik domain | Risiko aturan tidak konsisten |

## Example

RBAC di gateway ditambah pengecekan level resource di service:

```yaml
# Gateway: kebijakan route kasar
routes:
  - path: /admin/*
    required_roles: [admin]
```

```go
func UpdateOrder(ctx context.Context, orderID string) error {
    principal := auth.FromContext(ctx)
    order, _ := repo.GetOrder(orderID)
    if order.OwnerID != principal.UserID && !principal.HasRole("admin") {
        return ErrForbidden // 403, bukan 404 — hindari bocorkan keberadaan
    }
    // ...
}
```

## Related

- [Authentication](authentication_id.md) — identitas sebelum authorization
- [Policy Enforcement Point (PEP)](pep_id.md) — tempat kebijakan diterapkan
- [Least privilege](../../principles/security/least-privilege_id.md) — permission seminimal mungkin
- [Zero trust](../../principles/security/zero-trust_id.md) — verifikasi berkelanjutan
- [API gateway](../integration/api-gateway_id.md) — authz kasar di edge
- [JWT](jwt_id.md) — membawa role/scope dalam token (claim adalah petunjuk, bukan bukti tunggal)

## References

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST SP 800-162 — ABAC](https://csrc.nist.gov/publications/detail/sp/800-162/final)
