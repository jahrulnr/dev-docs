# Fallback

## Overview

Pattern **fallback** menyediakan jalur kode alternatif saat dependency utama gagal atau melebihi **timeout**, sehingga sistem bisa degrade gracefully alih-alih gagal total pada user request. Fallback menukar kesegaran sempurna atau kelengkapan fitur demi availability berkelanjutan—katalog produk dari cache, konfigurasi default, atau respons async queued alih-alih error synchronous.

Fallback muncul di sistem resilient: CDN stale-while-revalidate, read replica saat primary DB lambat, dan halaman “maintenance” statis saat payment API down. Paling efektif bersama **circuit breaker** (hentikan memanggil dependency rusak), **retry** (hanya untuk fault transient), dan aturan produk jelas tentang arti degraded mode bagi pelanggan.

Fallback bukan kebohongan diam-diam. User dan operator harus paham kapan data mungkin stale atau fitur sementara tidak tersedia; **structured logging** dan **metrics** harus menandai rate penggunaan fallback.

## How it works

1. **Definisikan primary path** — Business logic normal memanggil service atau datastore otoritatif.
2. **Deteksi kegagalan** — Error, **timeout**, atau circuit open memicu cabang fallback.
3. **Pilih alternatif** — Cache hit, region sekunder, komputasi disederhanakan, atau nilai default aman.
4. **Kembalikan dengan sinyal** — Header HTTP, field respons (`degraded: true`), atau increment metric agar client dan dashboard tahu fallback terjadi.
5. **Pulih otomatis** — Saat primary sehat, traffic kembali tanpa switch manual—probe half-open circuit memverifikasi recovery.

```text
Request ──> try primary ──> OK ──> response (fresh)
                │
                fail / timeout / circuit open
                v
            fallback (cache / default / async accept)
```

**Chained fallback** (primary → cache → default hardcoded) menambah resilience tetapi mempersulit testing—dokumentasikan urutan dan prasyarat. **Write path** butuh aturan lebih ketat daripada read; jangan “fallback” capture pembayaran gagal menjadi sukses.

## When to use

- API read-heavy di mana data sedikit stale lebih baik daripada 503 bagi user.
- Enrichment opsional (rekomendasi, rating) yang tidak boleh memblokir checkout inti.
- Outage regional atau dependency di mana sumber sekunder ada.
- Mobile atau jaringan fluktuatif di mana UI degraded cepat mengalahkan hang lama—pasangkan dengan **timeout**.

## When not to use

- Otorisasi finansial, reservasi inventory, atau commit safety-critical—fail closed.
- Saat data fallback menyesatkan (dosis medis, saldo legal) tanpa peringatan eksplisit ke user.
- Sebagai crutch permanen untuk primary tidak andal yang seharusnya diperbaiki atau diisolasi dengan **bulkhead**.
- Mengganti **dead letter queue** untuk pekerjaan async—queue untuk proses nanti berbeda dari fallback inline.

## Trade-offs

| Strategy | Pros | Cons |
| --- | --- | --- |
| Cache fallback | Cepat, mengurangi beban primary | Staleness, kompleksitas invalidasi |
| Default statis | Prediktif | Bisa melanggar aturan bisnis |
| Async accept (“kami email Anda”) | UX jujur | Butuh queue durable + operasi DLQ |
| Feature toggle off | Cerita ops sederhana | Permukaan produk menyusut |

## Example

Service detail produk mencoba inventory live; saat gagal menyajikan stok cache dengan flag:

```go
stock, err := inventoryClient.GetStock(ctx, sku)
if err != nil {
    metrics.FallbackTotal.Inc()
    stock = cache.GetStock(sku) // may be stale
    w.Header().Set("X-Data-Source", "cache")
}
json.NewEncoder(w).Encode(map[string]any{"sku": sku, "stock": stock})
```

Alert jika `fallback_total` melebihi 5% selama 10 menit—kemungkinan degradasi upstream.

## Related

- [Circuit breaker](circuit-breaker_id.md)
- [Retry](retry_id.md)
- [Timeout](timeout_id.md)
- [Metrics collection](../observability/metrics-collection_id.md)

## References

- [Microsoft Azure Architecture Center: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — sering dikombinasikan dengan fallback.
- [Release It! (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) — pola stabilitas termasuk graceful degradation.
