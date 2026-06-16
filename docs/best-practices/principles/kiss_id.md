# Prinsip KISS

## Overview

**KISS** (*Keep It Simple, Stupid*) adalah prinsip desain yang memprioritaskan solusi paling sederhana yang benar-benar menyelesaikan masalah. Berasal dari rekayasa dirgantara (Kelly Johnson, Lockheed Skunk Works), prinsip ini memperingatkan kompleksitas yang tidak perlu pada sistem, API, dan jalur kode.

Kesederhanaan bukan kemalasan atau memotong sudut. Artinya menahan abstraksi spekulatif, menghindari trik pintar yang mengaburkan intent, dan memilih struktur yang mudah dibaca alih-alih pola yang sedang tren jika biayanya tidak sebanding. Sistem sederhana lebih mudah di-*review*, dioperasikan, di-*debug*, dan di-*onboard*—terutama saat insiden.

KISS berpasangan dengan **YAGNI** (jangan membangun untuk masa depan hipotetis) dan **DRY** (tetapi jangan menggabungkan logika tidak terkait hanya demi deduplikasi). Tujuannya kejelasan dan maintainability, bukan jumlah baris minimal.

## Key ideas

- Utamakan struktur data dan alur kontrol yang jelas daripada *framework* generik.
- Tunda abstraksi sampai muncul kasus pemakaian kedua yang nyata.
- Optimalkan untuk pembaca kode enam bulan kemudian.
- *Complexity budget*: habiskan hanya di tempat kebutuhan menuntut (performa, kepatuhan, skala).

## When to use

- Selalu sebagai bias default saat mendesain modul, API, dan infrastruktur.
- Saat meninjau PR yang menambah lapisan tanpa kebutuhan konkret saat ini.
- Saat *postmortem* insiden menyebut kebingungan atau indireksi tidak transparan sebagai kontributor.

## When not to use

- Jangan samakan KISS dengan mengabaikan constraint nyata (keamanan, SLA, jejak audit regulasi).
- Jangan menyederhanakan dengan menghilangkan penanganan *error*, observability, atau tes saat risiko tinggi.
- Kompleksitas sah (konsensus terdistribusi, enkripsi) tetap butuh desain ketat—KISS menargetkan kompleksitas yang **tidak perlu**.

## Trade-offs

| Pendekatan lebih sederhana | Risiko jika berlebihan |
| --- | --- |
| Lebih cepat *ship* dan dipahami | Bisa kurang pas jika kebutuhan masa depan sudah diketahui |
| Lebih sedikit komponen di produksi | Biaya refactor jika kebutuhan berubah drastis |
| *Onboarding* lebih jelas | Bisa terlihat "naif" di budaya yang sangat berpola |

## Example

Menjumlahkan *slice* bilangan bulat: *loop* `for` adalah KISS. *Pipeline reducer* generik dengan *plugin* bukan—kecuali banyak strategi penjumlahan memang sudah dibutuhkan.

```go
func Sum(nums []int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}
```

Sebelum menambah *factory*, *event bus*, atau *plugin hook*, tanyakan: "Masalah konkret apa yang ini selesaikan hari ini?"

## Related

- [YAGNI](yagni_id.md) — hindari fitur spekulatif
- [DRY](dry_id.md) — berbagi pengetahuan tanpa coupling paksa
- [Separation of Concerns](separation-of-concerns_id.md) — modul sederhana dengan batas jelas

## References

- Asal-usul KISS di Skunk Works / U.S. Navy (folklore rekayasa, banyak dikutip)
- Martin Fowler — esai YAGNI dan desain inkremental
