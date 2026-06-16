# Metrics Collection

## Overview

**Metrics collection** adalah praktik mengukur perilaku sistem sebagai time series numerik—counter yang hanya naik, gauge yang naik-turun, dan histogram yang menangkap distribusi (persentil latency). Berbeda dengan log (event diskrit) atau trace (jalur request individual), metrics mengompresi perilaku menjadi agregat untuk dashboard, alerting, dan capacity planning.

Metrics yang dipilih dengan baik menjawab: “Apakah service sehat sekarang?”, “Apakah kita memenuhi SLO?”, dan “Apa yang berubah setelah deploy?” Mereka menggerakkan scraping ala **Prometheus**, panel Grafana, dan aturan autoscaling. Metrics buruk—cardinality label tak terbatas, nama samar—menimbulkan ledakan biaya dan noise alert.

Metrics berada di pusat triad observability: **structured logging** menjelaskan *apa* terjadi pada satu kasus; **distributed tracing** menunjukkan *di mana* waktu habis; metrics menunjukkan *seberapa sering* dan *seberapa parah* di seluruh fleet.

## How it works

1. **Instrumentasi kode** — Library mengekspos metrics di HTTP handler, queue consumer, dan connection pool (mis. `http_requests_total`, `http_request_duration_seconds`).
2. **Label bijak** — Dimensi seperti `method`, `route`, `status` membantu drill-down; hindari label cardinality tinggi (`user_id`, raw URL path).
3. **Expose atau push** — Model pull: service menyajikan `/metrics` untuk scrape Prometheus. Model push: job berumur pendek memakai Pushgateway atau agent vendor.
4. **Scrape & store** — Prometheus atau TSDB kompatibel menyimpan sample dengan kebijakan compaction dan downsampling.
5. **Alert & visualisasi** — Recording rule, route Alertmanager, dan dashboard **Grafana** menerjemahkan threshold menjadi halaman on-call.

```text
App (/metrics) ──scrape──> Prometheus ──> Grafana / Alertmanager
```

**RED method** (Rate, Errors, Duration) cocok untuk service berbasis request. **USE method** (Utilization, Saturation, Errors) cocok untuk resource (CPU, disk, pool). **SLO-based alerting** membakar error budget dari metrik SLI daripada paging setiap fluktuasi kecil.

## When to use

- Service production dengan target availability atau latency eksplisit (SLO/SLA).
- Autoscaling dan capacity planning berdasarkan throughput dan saturasi resource.
- Deteksi regresi setelah rilis—bandingkan golden signal minggu ke minggu.
- Melengkapi log/trace dengan agregat fleet-wide yang murah di-query pada skala besar.

## When not to use

- Debug satu request gagal—gunakan log **correlation ID** atau **trace**.
- Menyimpan konten payload penuh atau PII di label metric—metrics bukan secret store.
- Script sekali jalan di mana exit code dan stdout cukup.
- Mengukur segalanya: mulai dari golden signal; perluas saat pertanyaan masih terbuka.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Pull (Prometheus) | Model service sederhana, service discovery mudah | Job pendek butuh helper push |
| Push (agent vendor) | Bekerja di belakang NAT | Lebih sulit menilai kesehatan target |
| Label cardinality tinggi | Drill-down per-tenant | Memori TSDB dan biaya query meledak |
| Agregat kasar saja | Murah | Lambat melokalisasi regresi |

## Example

Instrumentasi client Prometheus di Go:

```go
var requestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
    Name:    "http_request_duration_seconds",
    Buckets: prometheus.DefBuckets,
}, []string{"method", "route", "status"})

func handler(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    // ...
    requestDuration.WithLabelValues(r.Method, "/checkout", "200").Observe(time.Since(start).Seconds())
}
```

Alert: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` untuk error rate 5%.

## Related

- [Health check](health-check_id.md)
- [Distributed tracing](distributed-tracing_id.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_id.md)
- [Grafana](../../../technologies/infrastructure/grafana_id.md)

## References

- [Prometheus: metric types and naming](https://prometheus.io/docs/practices/naming/)
- [Google SRE: SLI, SLO, and error budgets](https://sre.google/workbook/slo-document/) — mengaitkan metrics dengan target reliability.
