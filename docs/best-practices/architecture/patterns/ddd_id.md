# Domain-Driven Design (DDD)
## Overview

Domain-Driven Design (DDD) adalah pendekatan untuk membangun perangkat lunak kompleks yang memusatkan perhatian pada domain — ruang masalah bisnis. DDD menekankan kolaborasi erat dengan pakar domain untuk membentuk model (Ubiquitous Language) yang menjadi dasar desain dan implementasi. Ini mencakup aspek strategis seperti bounded context dan context mapping, serta pola taktis seperti Entity, Value Object, Aggregate, Repository, Domain Service, dan Domain Event.

## Key components

### Strategic vs tactical
- **Strategic DDD**: Fokus pada bounded context, context mapping, dan boundary tim/ownership.
- **Tactical DDD**: Pola di dalam bounded context: Entity, Value Object, Aggregate, Repository, Domain Service, Domain Event.

### Core patterns and practices
- **Ubiquitous Language**: Gunakan istilah yang sama di kode dan percakapan. Buat model kecil dan jelas.
- **Bounded Context**: Isolasi model untuk mencegah ambiguitas dan kopling. Gunakan context map (contoh: upstream/downstream, anti-corruption layer).
- **Aggregate**: Pertahankan invariant di dalam batas aggregate dan anggap root aggregate sebagai unit transaksional.
- **Domain Event**: Representasikan peristiwa penting; berguna untuk integrasi dan konsistensi eventual.
- **Anti-Corruption Layer**: Terjemahkan model eksternal agar tidak mencemari model domain internal.

## When to use

- Aturan bisnis kompleks, beberapa tim, atau ketika kejelasan domain memberi nilai bisnis yang nyata.
- Sistem yang harus mengintegrasikan beberapa model/terminologi (bounded context membantu mengurangi ambiguitas).

## When not to use

- Domain trivial ketika sebagian besar nilai adalah CRUD plumbing (Anda tetap bisa pakai naming/boundary yang baik, tapi DDD penuh biasanya terlalu berat).
- Tim tanpa akses ke domain experts atau tanpa waktu untuk domain modeling; DDD butuh kolaborasi dan iterasi.

## Implementation guide

- Rancang aggregate berdasarkan kebutuhan konsistensi; pertahankan kecil.
- Repository untuk load/save aggregate; gunakan metode eksplisit ketimbang CRUD generik bila ada logika domain.
- Gunakan domain events untuk integrasi lintas bounded context dan update proyeksi secara asinkron.
- Pertimbangkan CQRS + Event Sourcing bila model baca dan tulis berbeda jauh.

## Trade-offs

- **Biaya modeling di awal**: Perlu waktu untuk menyepakati language, boundary, dan eksplorasi sebelum kode stabil.
- **Risiko salah pakai**: “DDD di mana-mana” mudah berubah jadi overmodeling dan memperlambat delivery.
- **Perawatan boundary**: Bounded context dan pola integrasinya butuh disiplin berkelanjutan saat tim dan kebutuhan berubah.

## Examples

Contoh (pseudo-code):
```go
// Aggregate root
type Order struct {
  ID string
  Items []OrderLine
  Status string
}

func (o *Order) AddItem(item OrderLine) error {
  o.Items = append(o.Items, item)
  return nil
}

// Domain event
type OrderPlaced struct { OrderID string; Time time.Time }
```

## Common pitfalls
- Overmodelling: jangan pakai DDD untuk domain sederhana.
- Aggregate terlalu besar yang mengikat banyak resource — pecah bila perlu.
- Bounded contexts yang tidak jelas — investasikan waktu untuk context mapping.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_id.md`
- `docs/best-practices/architecture/patterns/onion-architecture_id.md`
- `docs/best-practices/principles/solid_id.md`

## References & further reading
- Eric Evans, "Domain-Driven Design"
- Vaughn Vernon, "Implementing Domain-Driven Design"
- https://dddcommunity.org/
