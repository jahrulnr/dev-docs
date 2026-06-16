# Anti-Corruption Layer (ACL)

## Overview

**Anti-corruption layer** (ACL) adalah komponen batas yang menerjemahkan antara model, protokol, atau format data sistem eksternal dengan domain model internal aplikasi Anda. Istilah ini berasal dari Domain-Driven Design (DDD): tanpa translasi, konsep asing akan merembes ke bounded context dan perlahan mengkorupsi ubiquitous language serta invariant bisnis.

ACL bukan sekadar adapter di tepi jaringan. Ini adalah **semantic firewall** yang disengaja—memetakan status code legacy ke domain enum, membentuk ulang payload third-party menjadi aggregate, dan menyembunyikan keanehan versioning API SaaS dari sisa codebase. Aplikasi host hanya berbicara dengan tipe miliknya; ACL yang memegang seluruh pengetahuan tentang sistem luar.

Tim paling sering memperkenalkan ACL saat mengintegrasikan ERP, payment gateway, CRM, atau ekspor mainframe berusia puluhan tahun. Alternatifnya—membiarkan struct `PaymentProviderResponse` muncul di domain service—mengikat business rule ke nama field vendor dan membuat setiap perubahan schema upstream menjadi refactor domain-wide.

## How it works

1. **Facade** — interface sempit yang dipanggil domain (mis. `BillingPort`, `LegacyInventoryClient`).
2. **Translator** — memetakan external DTO ↔ domain object; memvalidasi dan menolak data asing yang tidak valid di batas.
3. **Adapter** — menangani wire protocol (REST, SOAP, file drop, message queue).
4. **Anti-corruption dua arah** — command keluar dan event masuk sama-sama melalui translasi agar model tidak saling menyeberang.

```
  Domain layer          ACL                    External system
  +-----------+    +------------------+    +------------------+
  | Order     |--->| Translator       |--->| Legacy SOAP API  |
  | Service   |<---| + Adapter        |<---| (alien schema)   |
  +-----------+    +------------------+    +------------------+
```

ACL bisa berupa package khusus, microservice, atau sidecar. Usahakan **stateless** jika memungkinkan; cache lookup eksternal di belakang facade, bukan di domain entity.

## When to use

- Mengintegrasikan **sistem legacy atau third-party** yang data model-nya tidak selaras dengan domain Anda.
- **Bounded context** harus tetap murni sementara tim lain atau vendor menguasai schema upstream.
- API eksternal sering berubah dan Anda ingin satu tempat untuk menyerap versioning.
- Anda sedang strangler monolith dan butuh seam stabil antara stack lama dan baru.

## When not to use

- API eksternal sudah cocok satu-ke-satu dengan domain — thin HTTP client mungkin cukup.
- Anda mengontrol kedua sisi dan bisa mengevolusi **shared contract** (internal gRPC, OpenAPI milik bersama).
- Integrasi hanya script sekali pakai tanpa business logic — over-abstracting menambah biaya tanpa manfaat.
- Jalur latency-sensitive di mana hop mapping tambahan tidak dapat diterima tanpa caching (ukur dulu).

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Dedicated ACL service | Mengisolasi foreign model sepenuhnya; tim bisa deploy independen | Network hop, overhead operasional |
| In-process ACL package | Latency rendah, testing sederhana | Foreign type masih menggoda import jika disiplin longgar |
| Direct domain mapping (tanpa ACL) | Kode awal lebih sedikit | Domain tercemar; refactor menyebar ke mana-mana |
| API gateway saja | Auth dan routing terpusat | Gateway tidak seharusnya memegang business translation — layer salah |

## Example

Layanan shipping mengekspos `ShipmentStatus` sebagai kode satu huruf (`P`, `D`, `X`). Domain Anda memakai `ShipmentLifecycle` dengan state eksplisit dan business rule.

```go
// acl/shipping/facade.go — domain hanya melihat ini
type ShipmentPort interface {
    Track(ctx context.Context, id ShipmentID) (domain.Shipment, error)
}

// acl/shipping/translator.go — pengetahuan foreign dikarantina di sini
func toDomain(raw legacy.TrackResponse) (domain.Shipment, error) {
    status, ok := statusMap[raw.Code] // P -> InTransit, dst.
    if !ok {
        return domain.Shipment{}, fmt.Errorf("unknown legacy code: %s", raw.Code)
    }
    return domain.Shipment{ID: raw.Ref, Status: status, ...}, nil
}
```

Domain service bergantung pada `ShipmentPort`, tidak pernah pada `legacy.TrackResponse`.

## Related

- [Domain-Driven Design (DDD)](../../architecture/patterns/ddd_id.md)
- [API Gateway](./api-gateway_id.md)
- [Event Notification](./event-notification_id.md)
- [CQRS](./cqrs_id.md)

## References

- Eric Evans, *Domain-Driven Design* — integrating bounded contexts and translation layers
- Vaughn Vernon, *Implementing Domain-Driven Design* — anti-corruption layer patterns in practice
- Martin Fowler, [Anti-Corruption Layer](https://martinfowler.com/bliki/AntiCorruptionLayer.html)
