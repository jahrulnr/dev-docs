# Prometheus

## Overview

Prometheus is an open-source monitoring and alerting toolkit (originally built at SoundCloud) and a common choice for cloud-native environments. It scrapes metrics from targets over HTTP, stores them as labeled time series, and supports querying with PromQL. It is designed to be reliable during incidents: a single Prometheus server should keep working even when parts of your system are failing.

Prometheus typically complements a visualization layer (often Grafana) and an alert routing system (often Alertmanager). It fits best when you can expose numerical metrics (counters, gauges, histograms) and you want flexible aggregation and slicing via labels.

## Key concepts

- **Target**: An endpoint Prometheus scrapes (usually `/metrics`)
- **Job / instance**: Logical grouping and concrete scrape targets
- **Labels**: Key/value dimensions on a time series (e.g. `method="GET"`)
- **Exporter**: A component that exposes metrics for a system (e.g. node exporter)
- **Alerting rule**: A PromQL expression evaluated periodically to trigger alerts
- **Recording rule**: A PromQL expression stored as a new time series for reuse/performance

## When to use

- You need **metrics** (not only logs) for services, hosts, or Kubernetes workloads
- You want **label-based** analysis (per endpoint, per tenant, per region, etc.)
- You need deterministic behavior during outages (local storage, pull-based scraping)

## When not to use

- You primarily need **log search** (use a log stack such as Elasticsearch/Kibana or Loki)
- You need long-term analytics on very high-cardinality dimensions you cannot control
- You cannot expose scrape endpoints (or cannot open network paths for scraping)

## Trade-offs

- **Pros**: Simple operational model; powerful query language; strong ecosystem
- **Cons**: High-cardinality labels can explode storage/CPU; long-term storage needs an add-on (remote write/long-term store); pull model can be tricky across network boundaries

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
      .help("Total number of handled requests")
      .labelNames("status", "route")
      .register();

  static final Histogram requestDuration = Histogram.build()
      .name("app_request_duration_seconds")
      .help("Request duration in seconds")
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
          description: "P95 latency is {{ $value }}s for route={{ $labels.route }}"

      - alert: HighErrorRate
        expr: rate(app_requests_total{status=~"5.."}[5m]) / rate(app_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
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

- `docs/technologies/infrastructure/grafana_en.md`
- `docs/technologies/infrastructure/kubernetes_en.md`
- `docs/technologies/infrastructure/elk-stack_en.md`

## References

- Prometheus documentation: https://prometheus.io/docs/introduction/overview/
- PromQL basics: https://prometheus.io/docs/prometheus/latest/querying/basics/
