# Metrics Collection

## Overview

**Metrics collection** is the practice of measuring system behavior as numeric time series—counters that only increase, gauges that go up and down, and histograms that capture distributions (latency percentiles). Unlike logs (discrete events) or traces (individual request paths), metrics compress behavior into aggregates suitable for dashboards, alerting, and capacity planning.

Well-chosen metrics answer: “Is the service healthy right now?”, “Are we meeting SLOs?”, and “What changed after the deploy?” They power **Prometheus**-style scraping, Grafana panels, and autoscaling rules. Poor metrics—unbounded label cardinality, vague names—create cost explosions and alert noise.

Metrics sit at the center of the observability triad: **structured logging** explains *what* happened for one case; **distributed tracing** shows *where* time went; metrics show *how often* and *how bad* across the fleet.

## How it works

1. **Instrument code** — Libraries expose metrics at HTTP handlers, queue consumers, and connection pools (e.g., `http_requests_total`, `http_request_duration_seconds`).
2. **Label thoughtfully** — Dimensions like `method`, `route`, `status` aid drill-down; avoid high-cardinality labels (`user_id`, raw URL paths).
3. **Expose or push** — Pull model: service serves `/metrics` for Prometheus scrape. Push model: short-lived jobs use Pushgateway or vendor agents.
4. **Scrape & store** — Prometheus or compatible TSDB retains samples with compaction and downsampling policies.
5. **Alert & visualize** — Recording rules, alertmanager routes, and **Grafana** dashboards translate thresholds into pages.

```text
App (/metrics) ──scrape──> Prometheus ──> Grafana / Alertmanager
```

**RED method** (Rate, Errors, Duration) suits request-driven services. **USE method** (Utilization, Saturation, Errors) suits resources (CPU, disks, pools). **SLO-based alerting** burns error budgets from SLI metrics rather than paging on every blip.

## When to use

- Production services with explicit availability or latency targets (SLOs/SLAs).
- Autoscaling and capacity planning based on throughput and resource saturation.
- Regression detection after releases—compare golden signals week-over-week.
- Complementing logs/traces with fleet-wide aggregates that are cheap to query at scale.

## When not to use

- Debugging a single failed request—use **correlation ID** logs or a **trace** instead.
- Storing full payload content or PII in metric labels—metrics are not a secret store.
- One-off scripts where exit code and stdout suffice.
- Measuring everything: start with golden signals; expand when questions remain unanswered.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Pull (Prometheus) | Simple service model, easy service discovery | Short jobs need push helpers |
| Push (vendor agent) | Works behind NAT | Harder to reason about target health |
| High-cardinality labels | Per-tenant drill-down | TSDB memory and query cost explode |
| Coarse aggregates only | Cheap | Slow to localize regressions |

## Example

Prometheus client instrumentation in Go:

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

Alert: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` for 5% error rate.

## Related

- [Health check](health-check_en.md)
- [Distributed tracing](distributed-tracing_en.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_en.md)
- [Grafana](../../../technologies/infrastructure/grafana_en.md)

## References

- [Prometheus: metric types and naming](https://prometheus.io/docs/practices/naming/)
- [Google SRE: SLI, SLO, and error budgets](https://sre.google/workbook/slo-document/) — tying metrics to reliability targets.
