# Domain-Driven Design (DDD)
## Gambaran Umum

Domain-Driven Design (DDD) adalah pendekatan untuk membangun perangkat lunak kompleks yang memusatkan perhatian pada domain — ruang masalah bisnis. DDD menekankan kolaborasi erat dengan pakar domain untuk membentuk model (Ubiquitous Language) yang menjadi dasar desain dan implementasi. Ini mencakup aspek strategis seperti bounded context dan context mapping, serta pola taktis seperti Entity, Value Object, Aggregate, Repository, Domain Service, dan Domain Event.

## Strategi vs Taktik
- **Strategic DDD**: Fokus pada bounded context, context mapping, dan boundary tim/ownership.
- **Tactical DDD**: Pola di dalam bounded context: Entity, Value Object, Aggregate, Repository, Domain Service, Domain Event.

## Pola & Praktik Inti
- **Ubiquitous Language**: Gunakan istilah yang sama di kode dan percakapan. Buat model kecil dan jelas.
- **Bounded Context**: Isolasi model untuk mencegah ambiguitas dan kopling. Gunakan context map (contoh: upstream/downstream, anti-corruption layer).
- **Aggregate**: Pertahankan invariant di dalam batas aggregate dan anggap root aggregate sebagai unit transaksional.
- **Domain Event**: Representasikan peristiwa penting; berguna untuk integrasi dan konsistensi eventual.
- **Anti-Corruption Layer**: Terjemahkan model eksternal agar tidak mencemari model domain internal.

## Panduan Implementasi
- Rancang aggregate berdasarkan kebutuhan konsistensi; pertahankan kecil.
- Repository untuk load/save aggregate; gunakan metode eksplisit ketimbang CRUD generik bila ada logika domain.
- Gunakan domain events untuk integrasi lintas bounded context dan update proyeksi secara asinkron.
- Pertimbangkan CQRS + Event Sourcing bila model baca dan tulis berbeda jauh.

## Contoh (pseudo-code)
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

## Kesalahan Umum
- Overmodelling: jangan pakai DDD untuk domain sederhana.
- Aggregate terlalu besar yang mengikat banyak resource — pecah bila perlu.
- Bounded contexts yang tidak jelas — investasikan waktu untuk context mapping.

## Kapan digunakan
- Domain bisnis kompleks, beberapa tim, atau saat kejelasan domain membawa nilai bisnis.

## Referensi & Bacaan Lanjut
- Eric Evans, "Domain-Driven Design"
- Vaughn Vernon, "Implementing Domain-Driven Design"
- https://dddcommunity.org/
