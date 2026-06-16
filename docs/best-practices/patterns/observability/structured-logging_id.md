# Structured Logging

## Overview

**Structured logging** mengeluarkan record log sebagai field yang bisa di-parse mesin—biasanya baris JSON—bukan prosa bebas. Setiap event membawa schema stabil: timestamp, severity, message, nama service, dan key domain (`request_id`, `order_id`, `duration_ms`). Parser, indexer, dan alert rule mengonsumsi field ini tanpa regular expression yang rapuh.

Pattern ini muncul karena plain text log tidak scale di distributed system. Baris seperti `User 42 order failed` mudah dibaca manusia tetapi mahal di-query pada volume tinggi. Objek JSON `{"level":"error","user_id":42,"error":"timeout"}` memungkinkan filter presisi di platform **centralized logging** dan join dengan **correlation ID** serta trace ID.

Structured logging bukan “log lebih banyak.” Ini kontrak antara tim aplikasi dan pipeline observability: nama field konsisten, level punya arti, dan data sensitif di-redaksi sebelum emission.

## How it works

1. **Pilih schema** — Adopsi konvensi (ECS, standar organisasi) untuk field umum; dokumentasikan key wajib per tier service.
2. **Pakai structured logger** — Library (zap, slog, structlog, Logrus dengan JSON formatter) menserialisasi map ke JSON di stdout.
3. **Bind context** — Middleware melampirkan `request_id`, `trace_id`, dan subjek terautentikasi ke logger request-scoped yang diteruskan ke call stack.
4. **Disiplin level** — `debug` untuk volume development; `info` untuk event lifecycle; `warn` untuk anomali yang bisa dipulihkan; `error` untuk perhatian operator.
5. **Ship tanpa ubah** — Agent meneruskan baris JSON ke Elasticsearch (**ELK stack**), Loki, atau cloud logging; ekstraksi field trivial.

```text
Handler ──> logger.With("request_id", id) ──> {"level":"info",...} ──> stdout ──> collector
```

**Hindari** log blob besar (body HTTP penuh, stack trace di setiap baris info). **Lakukan** log tipe error terstruktur dan metadata aman. Pasangkan log dengan **metrics** untuk rate dan **trace** untuk anatomi latency.

## When to use

- Service production yang di-ingest oleh **centralized logging** atau tooling SIEM.
- Microservices di mana investigasi lintas service bergantung pada nama field bersama.
- Audit compliance yang membutuhkan record searchable dan dapat diatribusikan (siapa melakukan apa, kapan).
- Lingkungan dengan rencana log-based alerting (`error_rate`, `error_code` spesifik).

## When not to use

- Debug lokal scratch di mana output gaya printf lebih cepat—kembali ke structured sebelum merge.
- Hot path ultra-low-latency di mana biaya serialisasi terukur dan belum dioptimasi (jarang; utamakan async appender).
- Log secret, token, atau PAN pembayaran penuh—struktur tidak membuat redaksi opsional.
- Mengganti **metrics** atau **health check**—log adalah event stream, bukan agregat time-series.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| JSON lines ke stdout | Native container, ramah parser | Byte sedikit lebih besar daripada plain text |
| Text + key=value | Mudah dibaca saat tail | Integrasi tooling lebih lemah |
| Schema registry ketat | Dashboard andal | Biaya migrasi saat field berubah |
| Log segalanya di debug di prod | Detail dalam | Biaya dan noise; pakai sampling |

## Example

Go `slog` dengan request context:

```go
logger := slog.With(
    "service", "billing",
    "request_id", requestIDFrom(ctx),
    "trace_id", traceIDFrom(ctx),
)
logger.Info("invoice created",
    "invoice_id", inv.ID,
    "amount_cents", inv.Amount,
    "duration_ms", time.Since(start).Milliseconds(),
)
```

Output (satu baris): `{"time":"...","level":"INFO","service":"billing","request_id":"abc",...}`.

## Related

- [Centralized logging](centralized-logging_id.md)
- [Correlation ID](correlation-id_id.md)
- [ELK stack](../../../technologies/infrastructure/elk-stack_id.md)
- [Metrics collection](metrics-collection_id.md)

## References

- [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) — penamaan field portabel.
- [Go slog package](https://pkg.go.dev/log/slog) — structured logging di standard library.
