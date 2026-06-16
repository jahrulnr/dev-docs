# Adapter

## Overview

**Adapter** mengonversi *interface* sebuah *class* atau modul menjadi *interface* lain yang diharapkan *client*. Komponen yang tidak kompatibel bisa bekerja bersama tanpa mengubah kode sumber—membungkus SDK pihak ketiga, API *legacy*, atau model data asing di balik *port* yang sudah dipahami aplikasi Anda.

Adapter adalah perekat struktural. **Object adapter** mengomposisi *adaptee* dan menerjemahkan panggilan; **class adapter** (kurang umum di Go) memakai embedding/pewarisan. Adapter sering muncul di batas **hexagonal architecture**: `PostgresUserRepo` mengadaptasi baris driver SQL ke `User` domain; `StripePaymentAdapter` memetakan *webhook* provider ke *event* internal.

Jangan samakan Adapter dengan Facade (menyederhanakan banyak panggilan menjadi satu) atau Decorator (*interface* sama, perilaku tambahan). Tugas Adapter adalah **rekonsiliasi interface**.

## How it works

1. Identifikasi *interface* **Target** yang diharapkan kode *client*.
2. Bungkus **Adaptee** (API tidak kompatibel yang ada) dalam tipe **Adapter** yang mengimplementasikan Target.
3. Terjemahkan panggilan metode: petakan tipe, kode *error*, model paginasi, dan penamaan.
4. Injeksikan *adapter* di tempat Target diperlukan.

Jaga logika terjemahan tetap tipis; aturan domain tetap di luar *adapter*. Uji *adapter* dengan *fixture* rekaman dari *adaptee* nyata jika memungkinkan.

## When to use

- Mengintegrasikan *library* pihak ketiga atau *legacy* yang API-nya tidak cocok dengan *port* Anda.
- Migrasi bertahap: implementasi lama dan baru berbagi satu *interface* Target.
- Pengujian: sediakan *adapter* in-memory yang mengimplementasikan *port* yang sama.

## When not to use

- Anda mengontrol kedua sisi dan bisa mengubah API langsung—perbaiki sumber alih-alih *glue* permanen.
- Ketidakcocokan bersifat perilaku, bukan *interface*—mungkin butuh *domain service* lebih kaya, bukan *adapter* tipis.
- Banyak concern ortogonal (*cache* + terjemahan + auth)—pisahkan ke rantai *decorator* + *adapter*.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Reuse tanpa mengubah *adaptee* | Lapisan terjemahan bisa tertinggal dari pembaruan SDK |
| *Port* bersih untuk inti aplikasi | Risiko konsep *adaptee* bocor lewat Target |
| Memungkinkan migrasi inkremental | Indireksi ekstra dan bug pemetaan |

## Example

`LegacyPrinter` mengekspos `PrintText(s string)`. Aplikasi Anda mengharapkan `DocumentRenderer.Render(doc Document)`. `PrinterAdapter` mengimplementasikan `DocumentRenderer` dan memanggil `PrintText(doc.PlainText())`.

```go
type DocumentRenderer interface {
    Render(doc Document) error
}

type PrinterAdapter struct {
    legacy *LegacyPrinter
}

func (a PrinterAdapter) Render(doc Document) error {
    return a.legacy.PrintText(doc.PlainText())
}
```

## Related

- [Facade](../design/facade_id.md) — menyederhanakan *subsystem*; Adapter menerjemahkan *interface*
- [Decorator](../design/decorator_id.md) — *interface* sama, perilaku ekstra
- [Ports and adapters (hexagonal)](https://alistair.cockburn.us/hexagonal-architecture/) — konteks arsitektural

## References

- Gamma et al. — *Design Patterns*, bab Adapter
- *Anti-corruption layer* dalam domain-driven design
