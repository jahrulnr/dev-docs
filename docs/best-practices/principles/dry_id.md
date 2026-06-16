# Prinsip DRY

## Overview

**DRY** (*Don't Repeat Yourself*) menyatakan setiap pengetahuan harus punya satu representasi otoritatif dalam sistem. Aturan bisnis, logika validasi, atau konstanta konfigurasi yang diduplikasi akan menyimpang seiring waktu—satu salinan diperbaiki, yang lain tidak, dan bug menjadi intermiten.

DRY menargetkan **duplikasi pengetahuan**, bukan kemiripan mekanis. Dua fungsi dengan sintaks serupa tetapi alasan berubah berbeda sebaiknya tetap terpisah (*coincidental duplication*). Memaksa kode tidak terkait ke satu abstraksi menciptakan coupling lebih buruk daripada pengulangan.

Seimbangkan DRY dengan **YAGNI** dan **KISS**: ekstrak logika bersama setelah pengulangan kedua atau ketiga yang dibenarkan, bukan pada pandangan pertama kemiripan.

## Key ideas

- Satu sumber kebenaran untuk aturan, skema, dan angka ajaib (paket konstanta, spesifikasi OpenAPI, migrasi DB).
- Kode hasil generasi dari skema (*protobuf*, klien OpenAPI) mengalahkan *struct* hasil salin tangan.
- Tes boleh mengulang langkah *arrange* jika *fixture* bersama mengaburkan intent—DRY bukan dogma untuk keterbacaan spesifikasi.
- Duplikasi lintas *service* mungkin butuh *contract test* alih-alih *shared library*.

## When to use

- Aturan bisnis yang sama muncul di validasi API, *worker*, dan backend UI.
- Perbaikan bug berulang kali mengharuskan mengedit banyak file dengan cara sama.
- Konfigurasi atau *feature flag* harus tetap sinkron antar modul.

## When not to use

- Kode mirip dengan pemicu perubahan berbeda (API admin vs publik).
- Utilitas bersama prematur yang hanya dipakai sekali—tunggu bukti.
- Mengoptimalkan jumlah baris mengorbankan independensi modul.

## Trade-offs

| Pengetahuan terpusat | Risiko |
| --- | --- |
| Perilaku dan perbaikan konsisten | Modul bersama jadi hambatan |
| Lebih sedikit maintenance salin-tempel | Over-abstraksi mengikat fitur tidak terkait |
| Audit aturan lebih mudah | Ekstraksi salah lebih sulit dibongkar |

## Example

Tarif pajak didefinisikan sekali:

```go
const VATRate = 0.11

func ApplyVAT(net decimal.Decimal) decimal.Decimal {
    return net.Mul(decimal.NewFromFloat(VATRate))
}
```

*HTTP handler* dan generator PDF faktur mengimpor fungsi yang sama—jangan duplikasi literal `0.11`.

## Related

- [KISS](kiss_id.md) — hindari *framework* deduplikasi kompleks
- [YAGNI](yagni_id.md) — jangan abstraksi sebelum pengulangan nyata
- [Separation of Concerns](separation-of-concerns_id.md) — berbagi pengetahuan tanpa menggabungkan tanggung jawab

## References

- Hunt & Thomas — *The Pragmatic Programmer*, bab DRY
- Fowler — trade-off duplikasi vs coupling dalam literatur refactoring
