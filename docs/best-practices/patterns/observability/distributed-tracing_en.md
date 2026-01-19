# Distributed Tracing
## Overview

Distributed Tracing captures end-to-end request flows across microservices to measure latency and pinpoint performance bottlenecks. This provides visibility into distributed systems for debugging and optimization.

## When to use
Use in microservices or distributed systems where understanding request latency and flow is critical.

## Example
Instrument services with OpenTelemetry to emit traces that are visualized in Jaeger or Zipkin.

## Pros / Cons
- Pros: Deep visibility into request flows and performance hotspots.
- Cons: Instrumentation overhead and storage/processing costs.

## References
- OpenTelemetry, Jaeger documentation.