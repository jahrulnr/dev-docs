# Metrics Collection
## Overview

Metrics Collection gathers quantitative measurements (latency, error rates, throughput) to monitor system performance and health. Ini memberikan wawasan numerik untuk memahami perilaku sistem dan mendeteksi masalah.

## When to use
Use to track service-level objectives, detect regressions, and drive alerting and capacity planning.

## Example
Expose Prometheus metrics: `http_requests_total`, `request_latency_seconds`, `error_rate`.

## Pros / Cons
- Pros: Objective observability, supports SLOs and alerting.
- Cons: Requires metric naming consistency and storage/retention planning.

## References
- Prometheus best practices.