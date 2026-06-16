# Separation of Concerns

## Overview

**Separation of Concerns** (SoC) membagi sistem menjadi bagian berbeda, masing-masing menangani *concern* terpisah. *Concern* adalah area fungsional atau tanggung jawab yang kohesif—autentikasi, persistensi, rendering, penagihan—bukan selalu satu *class* per *concern*.

SoC mengurangi jeratan: UI tidak boleh menyematkan SQL; aturan domain tidak bergantung pada kode status HTTP; adaptor infrastruktur tidak menentukan alur bisnis. Modul yang terpisah baik berubah independen, diuji terisolasi, dan kepemilikannya jelas antar tim.

SoC ada di setiap skala: fungsi dalam berkas, paket dalam *service*, *service* dalam platform, dan lapisan dalam arsitektur **hexagonal** atau **clean**. Over-separation (*nano-service*, indireksi berlebihan) sama berbahayanya dengan *monolithic ball of mud*—targetkan batas kohesif dengan *interface* stabil.

## Key ideas

- Satu modul, satu alasan utama berubah (selaras dengan Single Responsibility).
- Dependensi mengarah ke dalam: domain tidak mengimpor *framework*.
- *Concern cross-cutting* (*logging*, metrik) menempel lewat *hook*/*middleware*, bukan salin-tempel.
- Batas adalah kontrak (*interface*, *event*), bukan hanya nama folder.

## When to use

- *Codebase* membesar di mana perubahan merambat tidak terduga.
- Banyak tim berkontribusi pada satu produk.
- Sistem butuh *test double* independen untuk domain vs IO.

## When not to use

- Prototipe buang di mana kecepatan mengalahkan struktur—refactor saat bertahan terbukti.
- Dekomposisi ekstrem di mana latensi jaringan dan biaya operasi melebihi manfaat.
- Saat batas diciptakan tanpa pemicu perubahan nyata (lapisan "service" kosong).

## Trade-offs

| Pemisahan jelas | Biaya |
| --- | --- |
| Pengujian dan kerja paralel lebih mudah | Lebih banyak *interface* dan pemetaan |
| Refactor lebih aman dalam satu batas | Tes integrasi tetap diperlukan |
| Kepemilikan jelas | Risiko irisan salah (hanya berdasarkan lapisan teknis) |

## Example

*Web handler* mem-parse HTTP, memanggil `OrderService.PlaceOrder(cmd)`, dan memetakan *error* ke kode status. `OrderService` menegakkan aturan bisnis dan memanggil *interface* `OrderRepository`. `PostgresOrderRepository` menangani SQL—tidak dicampur di *handler*.

```go
func (h *Handler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
    cmd, err := decodePlaceOrder(r)
    if err != nil { writeBadRequest(w, err); return }
    id, err := h.orders.Place(cmd)
    if err != nil { writeDomainError(w, err); return }
    writeJSON(w, id)
}
```

## Related

- [SOLID](solid_id.md) — Single Responsibility dan Dependency Inversion
- [Law of Demeter](law-of-demeter_id.md) — batasi pengetahuan antar modul
- [High Cohesion, Low Coupling](general/high-cohesion-low-coupling_id.md) — prinsip pendamping

## References

- Dijkstra — esai awal tentang struktur program menurut *concern*
- Literatur Clean Architecture / hexagonal (*ports and adapters*)
