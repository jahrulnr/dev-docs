# Centralized Logging

## Overview

**Centralized logging** mengagregasi output log dari banyak host, container, dan service ke satu store yang bisa di-search. Alih-alih SSH ke tiap mesin saat incident, operator query satu index (atau stream) dengan filter waktu, service, severity, atau request identifier.

Pattern ini ada karena distributed system menyebarkan bukti: satu user request bisa menyentuh edge proxy, API gateway, tiga microservice, worker, dan database replica. File log lokal di tiap node tidak praktis pada skala besar. Pipeline terpusat—collect, buffer, parse, index, retain—mengubah raw text menjadi permukaan investigasi.

Centralized logging berpasangan natural dengan **structured logging** (field machine-readable) dan **correlation ID** agar event dari request yang sama bisa di-join. Ini salah satu pilar observability bersama **metrics** dan **distributed tracing**; masing-masing menjawab pertanyaan berbeda saat diagnosis.

## How it works

1. **Emit** — Aplikasi menulis log ke stdout/stderr (container) atau file lokal; utamakan JSON terstruktur jika memungkinkan.
2. **Ship** — Agent atau sidecar (Fluent Bit, Filebeat, Vector) tail source dan forward batch ke collector atau langsung ke storage.
3. **Ingest & parse** — Backend menormalisasi timestamp, mengekstrak field, dan bisa enrich dengan metadata Kubernetes atau geo tag.
4. **Index & store** — Search engine (Elasticsearch di **ELK stack**) atau log-native store (Loki) menyimpan data sesuai retention policy.
5. **Query & alert** — Dashboard (Kibana, Grafana) dan alert rule memicu pada lonjakan error, heartbeat hilang, atau pola security.

```text
Service A ──> agent ──┐
Service B ──> agent ──┼──> ingest ──> store ──> search / alerts
Service C ──> agent ──┘
```

Concern operasional meliputi **volume control** (sampling, log level), **redaksi PII** sebelum indexing, **retention tier** (hot vs cold), dan **biaya** storage serta indexing pada cardinality tinggi.

## When to use

- Anda menjalankan lebih dari sedikit instance atau container dan tidak bisa mengandalkan `grep` per host.
- Incident membutuhkan korelasi event lintas service (kegagalan payment yang melibatkan API, queue, dan worker).
- Tim compliance atau security membutuhkan audit trail yang durable dan queryable di satu tempat.
- Anda ingin alerting pada pola log (error rate, auth failure) terintegrasi dengan workflow on-call.

## When not to use

- Monolith tunggal di satu VM dengan traffic rendah—file rotated dan `journalctl` mungkin cukup.
- Payload ultra-sensitif yang tidak boleh meninggalkan host tanpa program klasifikasi dan enkripsi formal.
- Debug masalah lokal sekali pakai di mana tail satu proses lebih cepat daripada menunggu pipeline lag.
- Mengganti **metrics** atau **trace** hanya dengan log; “log everything as metrics” ber-cardinality tinggi mahal dan rapuh.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| ELK / OpenSearch stack | Full-text search kaya, ecosystem matang | Biaya indexing, operasi cluster |
| Loki (label-based) | Biaya lebih rendah untuk volume tinggi; integrasi Grafana | Pencarian teks ad-hoc lebih terbatas daripada Elasticsearch |
| Cloud vendor log service | Scaling terkelola, integrasi IAM | Vendor lock-in, biaya egress |
| Log on disk only | Sederhana, tanpa pipeline lag | Korelasi lintas service buruk pada skala |

## Example

Checkout API dan order worker sama-sama log JSON dengan `request_id` bersama. Fluent Bit mengirim stdout container ke Elasticsearch; on-call search `request_id:"a1b2c3"` di Kibana dan melihat API timeout diikuti worker retry—tanpa membuka tiga pod.

```json
{"ts":"2026-06-16T10:01:02Z","level":"error","service":"checkout-api","request_id":"a1b2c3","message":"payment client timeout"}
```

## Related

- [Structured logging](structured-logging_id.md)
- [Correlation ID](correlation-id_id.md)
- [ELK stack](../../../technologies/infrastructure/elk-stack_id.md)
- [Grafana](../../../technologies/infrastructure/grafana_id.md)

## References

- [Elastic: logging best practices](https://www.elastic.co/guide/en/ecs/current/index.html) — Elastic Common Schema untuk konsistensi field.
- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/) — agregasi log berbasis label.
