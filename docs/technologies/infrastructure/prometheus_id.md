# Prometheus

## Overview

Prometheus adalah toolkit monitoring dan alerting open-source (awal dibuat di SoundCloud) dan umum dipakai di environment cloud-native. Prometheus melakukan scrape metrik dari target melalui HTTP, menyimpan metrik sebagai time series dengan label, dan menyediakan bahasa query PromQL. Prometheus dirancang agar tetap dapat diandalkan saat insiden: satu server Prometheus seharusnya tetap berguna meskipun sebagian sistem sedang bermasalah.

Dalam praktiknya, Prometheus sering dipasangkan dengan lapisan visualisasi (misalnya Grafana) dan sistem routing notifikasi alert (misalnya Alertmanager). Prometheus cocok ketika Anda bisa mengekspor metrik numerik (counter, gauge, histogram) dan membutuhkan agregasi fleksibel berbasis label.

## Key concepts

- **Target**: Endpoint yang di-scrape Prometheus (biasanya `/metrics`)
- **Job / instance**: Pengelompokan logis dan target scrape yang konkret
- **Labels**: Dimensi key/value pada time series (misalnya `method="GET"`)
- **Exporter**: Komponen yang mengekspos metrik untuk sebuah sistem (misalnya node exporter)
- **Alerting rule**: Ekspresi PromQL yang dievaluasi berkala untuk memicu alert
- **Recording rule**: Ekspresi PromQL yang disimpan sebagai time series baru untuk reuse/performa

## When to use

- Anda butuh **metrics** (bukan hanya log) untuk service, host, atau workload Kubernetes
- Anda ingin analisis berbasis **label** (per endpoint, per tenant, per region, dsb.)
- Anda butuh perilaku yang deterministik saat outage (local storage, pull-based scraping)

## When not to use

- Kebutuhan utama Anda adalah **log search** (pakai log stack seperti Elasticsearch/Kibana atau Loki)
- Anda butuh analitik jangka panjang pada dimensi high-cardinality yang tidak bisa Anda kontrol
- Anda tidak bisa mengekspos endpoint scrape (atau tidak memungkinkan membuka jalur network untuk scraping)

## Trade-offs

- **Pros**: Model operasional sederhana; bahasa query kuat; ekosistem matang
- **Cons**: Label high-cardinality bisa membuat storage/CPU membengkak; penyimpanan jangka panjang butuh komponen tambahan (remote write/long-term store); model pull kadang menantang lintas boundary network

## Examples

### Basic Prometheus configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "app"
    static_configs:
      - targets: ["api-service:8080"]
    metrics_path: "/actuator/prometheus"
    scrape_interval: 5s
```

### Application metrics (example names)

```java
import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;

public class AppMetrics {
  static final Counter requestsTotal = Counter.build()
      .name("app_requests_total")
      .help("Total request yang diproses")
      .labelNames("status", "route")
      .register();

  static final Histogram requestDuration = Histogram.build()
      .name("app_request_duration_seconds")
      .help("Durasi request dalam detik")
      .labelNames("method", "route")
      .buckets(0.1, 0.5, 1.0, 2.5, 5.0)
      .register();
}
```

### Alerting rules (generic)

```yaml
# alert_rules.yml
groups:
  - name: app_alerts
    rules:
      - alert: HighRequestLatencyP95
        expr: histogram_quantile(0.95, rate(app_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request latency detected"
          description: "P95 latency adalah {{ $value }}s untuk route={{ $labels.route }}"

      - alert: HighErrorRate
        expr: rate(app_requests_total{status=~"5.."}[5m]) / rate(app_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate adalah {{ $value | humanizePercentage }}"
```

### Recording rules (generic)

```yaml
# recording_rules.yml
groups:
  - name: app_recording_rules
    interval: 30s
    rules:
      - record: job:app_requests_total:rate5m
        expr: rate(app_requests_total[5m])
```

### PromQL quick examples

```promql
rate(app_requests_total[5m])

histogram_quantile(0.95, rate(app_request_duration_seconds_bucket[5m]))

rate(app_requests_total{status=~"5.."}[5m]) / rate(app_requests_total[5m]) * 100
```

## Related

- `docs/technologies/infrastructure/grafana_id.md`
- `docs/technologies/infrastructure/kubernetes_id.md`
- `docs/technologies/infrastructure/elk-stack_id.md`

## References

- Prometheus documentation: https://prometheus.io/docs/introduction/overview/
- PromQL basics: https://prometheus.io/docs/prometheus/latest/querying/basics/
