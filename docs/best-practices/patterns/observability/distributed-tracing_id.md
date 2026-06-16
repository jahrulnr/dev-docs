# Distributed Tracing

## Overview

**Distributed tracing** merekam jalur end-to-end sebuah request saat melintasi batas proses dan jaringan. Setiap unit kerja menjadi **span** dengan waktu mulai, durasi, nama service, dan atribut opsional; span terhubung parent-to-child membentuk **trace**—pohon atau DAG yang menunjukkan di mana latency menumpuk dan dependency mana yang gagal.

Tracing menjawab pertanyaan yang sulit bagi log dan metrics agregat: “Mengapa request ini 4 detik?” dan “Panggilan database downstream mana yang dominan?” Satu trace lambat mengungkap pola N+1, retry storm, dan choke point serial yang disembunyikan metrics rata-rata.

Sistem modern distandarkan pada OpenTelemetry untuk instrumentasi dan mengekspor trace ke backend seperti Jaeger, Zipkin, atau APM vendor. Tracing berpasangan dengan **correlation ID** (sering tertanam di span context) dan **structured logging** (trace ID di field log) untuk gambaran incident lengkap.

## How it works

1. **Instrument entry** — Middleware di edge memulai root span saat request tiba (HTTP, gRPC, message consume).
2. **Propagasi context** — Header W3C Trace Context (`traceparent`) atau metadata setara membawa trace dan span ID ke panggilan downstream secara otomatis saat SDK dikonfigurasi.
3. **Child span** — Setiap operasi internal (query DB, cache get, external API) membuat child span; error menetapkan status span tanpa selalu gagalkan parent sampai kebijakan menentukan.
4. **Export** — Span di-batch-export ke collector (OpenTelemetry Collector) atau langsung ke trace backend; sampling mengurangi volume di sistem traffic tinggi.
5. **Visualisasi** — UI menampilkan timeline waterfall, critical path, dan dependency graph service dari data trace.

```text
[API Gateway]─────── span: 420ms ───────┐
     │                                   │
     ├──> [Auth] span: 15ms              │
     ├──> [Orders] span: 380ms           │
     │         ├── DB span: 340ms  ◀── bottleneck
     └──> [Notify] span: 8ms (async)     │
```

**Sampling** (head-based atau tail-based) menyeimbangkan biaya dan fidelitas: selalu sample error; sample probabilistik pada jalur sukses. **Cardinality** atribut span harus dikontrol—jangan tag setiap user ID sebagai atribut span di service QPS tinggi.

## When to use

- **Microservices** atau rantai serverless dengan lebih dari dua hop di critical path.
- SLO latency di mana Anda harus mengatribusikan delay ke dependency spesifik.
- Rollout pekerjaan performa dan butuh bukti before/after per endpoint.
- Debug kegagalan intermiten yang tidak bisa dijelaskan **metrics** rata-rata dan **log** sparse.

## When not to use

- Monolith single-process dengan profiler lokal dan log yang memadai—tracing menambah overhead dengan gain marginal.
- Batch ETL di mana wall-clock per record kurang penting daripada counter throughput.
- Lingkungan yang tidak bisa menyimpan atau retain data trace secara bertanggung jawab (biaya, privasi).
- Sebagai pengganti **health check**, **metrics**, atau load testing—trace mendiagnosis; tidak mencegah overload.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Sampling 100% | Fidelitas penuh | Storage dan beban collector mahal |
| Head sampling (1%) | Biaya prediktif | Bisa melewatkan request lambat langka |
| Tail sampling (simpan slow/error) | Sinyal incident terbaik | Pipeline collector lebih kompleks |
| Auto-instrumentation saja | Rollout cepat | Blind spot di library custom |

## Example

Middleware HTTP OpenTelemetry membuat span; child span manual membungkus panggilan repository:

```go
ctx, span := otel.Tracer("checkout").Start(r.Context(), "POST /checkout")
defer span.End()

ctx, dbSpan := otel.Tracer("checkout").Start(ctx, "db.InsertOrder")
err := repo.InsertOrder(ctx, order)
dbSpan.End()
```

Operator mencari trace ID `7f3a…` di Jaeger dan melihat `db.InsertOrder` mengonsumsi 92% waktu request.

## Related

- [Correlation ID](correlation-id_id.md)
- [Metrics collection](metrics-collection_id.md)
- [Microservices architecture](../../architecture/styles/microservices-architecture_id.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_id.md)

## References

- [OpenTelemetry documentation](https://opentelemetry.io/docs/) — API, SDK, dan semantic convention.
- [Jaeger documentation](https://www.jaegertracing.io/docs/) — penyimpanan trace open-source dan UI.
