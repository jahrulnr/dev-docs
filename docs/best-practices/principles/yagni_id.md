# Prinsip YAGNI

## Overview

**YAGNI** (*You Aren't Gonna Need It*) adalah prinsip Extreme Programming: implementasikan hanya apa yang diminta kebutuhan saat ini, bukan apa yang Anda bayangkan mungkin dibutuhkan nanti. Fitur spekulatif menambah kode untuk dirawat, tes untuk dijalankan, dan beban kognitif—sering tanpa pernah memberi nilai.

YAGNI tidak melarang perencanaan atau titik ekstensi yang bersih. Yang dilarang adalah **membangun kapabilitas yang tidak dipakai sekarang** karena "mungkin suatu hari butuh *multi-tenant sharding*." Saat kebutuhan datang, Anda mengimplementasikan dengan konteks hari itu—sering lebih sederhana daripada desain spekulatif.

Seimbangkan YAGNI dengan **refactoring** saat kasus serupa kedua muncul (*Rule of Three*). Antidot duplikasi bukan abstraksi prematur; melainkan generalisasi berbasis bukti.

## Key ideas

- *Ship* perubahan terkecil yang memenuhi *story* atau tiket.
- Hapus *dead code* dan *feature flag* untuk jalur yang ditinggalkan.
- Utamakan konfigurasi daripada *framework plugin* yang tidak terpakai.
- Dokumentasikan risiko masa depan yang diketahui di tiket atau ADR, bukan di jalur kode produksi.

## When to use

- Item *backlog* mendeskripsikan satu perilaku konkret—implementasikan hanya itu.
- *Review* menambah abstraksi "demi fleksibilitas" tanpa konsumen kedua.
- Tim *startup* atau sensitif biaya di mana beban maintenance penting.

## When not to use

- Regulasi atau keselamatan mewajibkan kapabilitas sebelum go-live (*audit logging*, enkripsi *at rest*).
- SLA kontraktual membutuhkan *hook* yang aktif pada tanggal tetap—koordinasikan dengan pengiriman, bukan *stub* diam-diam.
- Pekerjaan performa atau kapasitas dengan bukti pengukuran kebutuhan yang akan datang (bukan tebakan).

## Trade-offs

| Mengikuti YAGNI | Biaya |
| --- | --- |
| Lebih sedikit pemborosan, pengiriman lebih cepat | Refactor mungkin saat kebutuhan muncul |
| Permukaan serangan dan kegagalan lebih kecil | Bisa terasa picik bagi perencana |
| *Codebase* lebih jelas | Butuh disiplin di *review* |

## Example

Tiket meminta ekspor CSV saja. Jangan membangun sistem *plugin* `Exporter` generik dengan driver XML dan Parquet. Implementasikan `ExportCSV()`; ekstrak *interface* saat ekspor PDF benar-benar diminta.

```go
func ExportCSV(rows []Row, w io.Writer) error {
    cw := csv.NewWriter(w)
    // write header and rows
    cw.Flush()
    return cw.Error()
}
```

## Related

- [KISS](kiss_id.md) — kesederhanaan sebagai default
- [DRY](dry_id.md) — deduplikasi setelah pengulangan nyata
- [Fail Fast](fail-fast_id.md) — tolak asumsi tidak valid lebih awal alih-alih cabang spekulatif

## References

- Beck & Andres — *Extreme Programming Explained*, YAGNI
- Martin Fowler — bliki tentang YAGNI dan desain inkremental
