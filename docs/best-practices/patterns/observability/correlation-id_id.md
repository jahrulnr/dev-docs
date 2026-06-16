# Correlation ID

## Overview

**Correlation ID** (juga disebut request ID atau trace context key) adalah identifier unik yang ditetapkan ke satu operasi logis—biasanya HTTP request atau message—dan dipropagasi ke setiap hop yang ikut menanganinya. Nilai yang sama muncul di log, label metrics (secukupnya), dan span trace agar engineer bisa menjawab: “Apa yang terjadi pada checkout *ini*?”

Tanpa korelasi, debug di distributed system berubah menjadi tebak-tebakan timestamp di baris log yang tidak berhubungan. Dengan correlation ID, tim support dan SRE memfilter satu ID dan melihat narasi koheren dari edge hingga database.

Correlation ID ringan dibanding **distributed tracing** penuh, tetapi melengkapi tracing: ID sering menjadi atribut span atau field log di dalam trace backend. ID juga menjembatani tim yang sudah punya structured log tetapi belum fully instrumented untuk trace.

## How it works

1. **Generate atau terima** — Di entry point (API gateway, load balancer, service pertama), buat UUID atau terima header masuk seperti `X-Request-ID` atau `X-Correlation-ID`. Tolak atau sanitasi nilai yang malformed.
2. **Simpan di context** — Lampirkan ID ke request-scoped context (Go `context.Context`, middleware locals) sepanjang lifetime request.
3. **Propagasi outbound** — Setiap HTTP call downstream, field metadata gRPC, dan envelope message harus membawa ID yang sama (dan opsional **parent span ID** terpisah jika tracing aktif).
4. **Emit di telemetry** — Sertakan field di setiap baris **structured log**; hindari log ID hanya pada error.
5. **Tampilkan ke client** — Kembalikan ID di error response (header atau JSON) agar user bisa mengutipnya saat buka tiket.

```text
Client ──> Gateway [id=abc] ──> Service A [id=abc] ──> Service B [id=abc]
                │                      │                      │
                └──── same id in logs / traces / metrics ─────┘
```

**Async work** (queue consumer, cron) harus menyalin ID dari message pemicu atau memulai child ID baru yang di-link di metadata. **Background job** dari request harus mewarisi parent ID untuk kausalitas.

## When to use

- Pipeline multi-service atau async di mana aksi user-visible melintasi lebih dari satu komponen.
- Sistem production dengan **centralized logging** yang membutuhkan pencarian lintas service.
- API ke konsumen eksternal yang membutuhkan nomor referensi untuk eskalasi support.
- Rollout observability bertahap: correlation ID memberi nilai sebelum instrumentasi trace penuh rilis.

## When not to use

- Batch job internal murni tanpa rantai kausalitas user-facing—batch run ID mungkin lebih tepat.
- Sistem di mana propagasi ID dari client memungkinkan log injection atau serangan cardinality tanpa validasi.
- Mengganti autentikasi, otorisasi, atau **distributed tracing**—ID saja tidak menunjukkan breakdown latency atau dependency graph.
- Log token sangat sensitif; correlation ID harus opaque, bukan session secret.

## Trade-offs

| Choice | Pros | Cons |
| --- | --- | --- |
| UUID di-generate server | Tahan manipulasi, format seragam | Client tidak bisa korelasi kegagalan pre-gateway |
| ID dari client | End-to-end dari mobile app | Harus validasi panjang/format; risiko abuse |
| Header W3C `traceparent` | Standar untuk interop tracing | Lebih berat daripada request ID sederhana |
| ID baru per internal retry | Batas retry jelas | Lebih sulit dikaitkan ke aksi user asli |

## Example

Middleware menetapkan `request_id`, menyimpannya di context, dan HTTP client meneruskannya:

```go
func middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-ID")
        if id == "" {
            id = uuid.NewString()
        }
        ctx := context.WithValue(r.Context(), requestIDKey, id)
        w.Header().Set("X-Request-ID", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

Panggilan downstream: `req.Header.Set("X-Request-ID", idFromContext(ctx))`.

## Related

- [Structured logging](structured-logging_id.md)
- [Distributed tracing](distributed-tracing_id.md)
- [Centralized logging](centralized-logging_id.md)

## References

- [W3C Trace Context](https://www.w3.org/TR/trace-context/) — `traceparent` / `tracestate` untuk interop trace dan korelasi.
- [Google Cloud: distributed tracing and correlation](https://cloud.google.com/trace/docs) — pola propagasi di lingkungan cloud.
