# Timeout

## Overview

**Timeout** menetapkan batas atas berapa lama operasi boleh berjalan sebelum caller menghentikan dan memperlakukan pekerjaan sebagai gagal. Tanpa timeout, thread, koneksi, dan goroutine menumpuk menunggu dependency yang diam—latency menumpuk, connection pool habis, dan kegagalan berkaskade di arsitektur **microservices**.

Timeout adalah mekanisme **fail-fast** paling sederhana dalam toolkit reliability. Memicu **retry** hanya saat mode kegagalan diketahui transient; menyerahkan ke **fallback** saat respons degraded dapat diterima; menginformasikan jendela **circuit breaker** saat error rate melonjak. Setiap HTTP client outbound, database driver, dan stub RPC harus punya deadline eksplisit—bukan “default platform” yang tidak pernah diukur.

Desain timeout efektif menyeimbangkan pengalaman user dan realitas dependency: terlalu agresif menyebabkan false failure; terlalu longgar menyembunyikan outage sampai sistem sudah jenuh.

## How it works

1. **Set deadline di edge** — API gateway atau service pertama menurunkan budget total dari SLA produk (mis. 3s user-facing).
2. **Propagasi context** — Teruskan `context.Context` (Go), cancellation token, atau tracing baggage agar panggilan nested berbagi sisa budget.
3. **Budget per-hop** — Alokasikan irisan ke query internal dan panggilan eksternal; sisakan margin untuk serialisasi dan antrian.
4. **Saat expiry** — Batalkan I/O, kembalikan error ke caller, log dengan **correlation ID**, increment **metrics** timeout.
5. **Perilaku downstream** — Handler server-side harus menghormati client disconnect agar tidak membuang kerja.

```text
User SLA 3000ms
  ├─ gateway 200ms
  ├─ service A 800ms
  │    ├─ DB 400ms (timeout 450ms)
  │    └─ payment API 350ms (timeout 400ms)
  └─ buffer 250ms
```

**Client timeout** vs **server timeout**: keduanya penting. Client bisa menyerah sementara server masih memproses—gunakan operasi idempotent jika client **retry**. **Health check** memakai timeout pendek terpisah dari panggilan bisnis.

## When to use

- Setiap panggilan jaringan, tunggu message, dan akuisisi lock di jalur production.
- Request user-facing di mana UI menggantung merusak kepercayaan lebih daripada error terkendali.
- Batch job dengan watchdog timer mencegah worker liar.
- Dipasangkan dengan **retry**—retry hanya saat timeout mengimplikasikan overload transient, bukan payload invalid.

## When not to use

- Query analitik sangat panjang tanpa redesign—gunakan async job dan polling alih-alih HTTP timeout 30 menit.
- Pekerjaan CPU single-machine tanpa tunggu eksternal—timeout kurang berguna (meski deadline job keseluruhan tetap membantu).
- Timeout identik pada setiap dependency tanpa memperhatikan profil p99 latency.
- Mengganti capacity planning atau isolasi **bulkhead**—timeout membatasi kerusakan tetapi tidak menambah kapasitas.

## Trade-offs

| Setting | Pros | Cons |
| --- | --- | --- |
| Agresif (rendah) | Fail cepat, melindungi pool | False positive pada jitter |
| Longgar (tinggi) | Lebih sedikit error semu | Penumpukan antrian berkaskade |
| Tetap per dependency | Model mental sederhana | Drift saat dependency berubah |
| Adaptif (p99 + margin) | Sesuai realitas | Butuh **metrics** dan disiplin tuning |

## Example

HTTP client Go dengan nested context deadline:

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(ctx, "GET", paymentURL, nil)
resp, err := httpClient.Do(req)
if errors.Is(err, context.DeadlineExceeded) {
    metrics.PaymentTimeouts.Inc()
    return fallbackQuote(ctx)
}
```

Handler server mencerminkan budget: `ctx, cancel := context.WithTimeout(ctx, 1500*time.Millisecond)` untuk leg DB.

## Related

- [Retry](retry_id.md)
- [Fallback](fallback_id.md)
- [Circuit breaker](circuit-breaker_id.md)
- [Correlation ID](../observability/correlation-id_id.md)

## References

- [Google Cloud: timeouts and retries](https://cloud.google.com/storage/docs/retry-strategy) — panduan propagasi deadline.
- [gRPC: deadlines](https://grpc.io/docs/guides/deadlines/) — semantik pembatalan lintas bahasa.
