# Distributed Tracing

## Overview

**Distributed tracing** records the end-to-end path of a request as it crosses process and network boundaries. Each unit of work becomes a **span** with a start time, duration, service name, and optional attributes; spans link parent-to-child to form a **trace**—a tree or DAG that shows where latency accumulated and which dependency failed.

Tracing answers questions logs and aggregate metrics struggle with: “Why did this request take 4 seconds?” and “Which downstream database call dominated?” A single slow trace reveals N+1 patterns, retry storms, and serial choke points that average latency metrics hide.

Modern systems standardize on OpenTelemetry for instrumentation and export traces to backends such as Jaeger, Zipkin, or vendor APM. Tracing pairs with **correlation IDs** (often embedded in span context) and **structured logging** (trace ID in log fields) for a complete incident picture.

## How it works

1. **Instrument entry** — Middleware at the edge starts a root span when a request arrives (HTTP, gRPC, message consume).
2. **Propagate context** — W3C Trace Context headers (`traceparent`) or equivalent metadata carry trace and span IDs to downstream calls automatically when SDKs are configured.
3. **Child spans** — Each internal operation (DB query, cache get, external API) creates a child span; errors set span status without necessarily failing the parent until policy dictates.
4. **Export** — Spans batch-export to a collector (OpenTelemetry Collector) or directly to a trace backend; sampling reduces volume in high-traffic systems.
5. **Visualize** — UI shows waterfall timelines, critical path, and service dependency graphs derived from trace data.

```text
[API Gateway]─────── span: 420ms ───────┐
     │                                   │
     ├──> [Auth] span: 15ms              │
     ├──> [Orders] span: 380ms           │
     │         ├── DB span: 340ms  ◀── bottleneck
     └──> [Notify] span: 8ms (async)     │
```

**Sampling** (head-based or tail-based) balances cost and fidelity: always sample errors; probabilistically sample success paths. **Cardinality** of span attributes must be controlled—do not tag every user ID as a span attribute in high-QPS services.

## When to use

- **Microservices** or serverless chains where more than two hops sit on the critical path.
- Latency SLOs where you must attribute delay to specific dependencies.
- Rolling out performance work and needing before/after evidence per endpoint.
- Debugging intermittent failures that **metrics** averages and sparse **logs** cannot explain.

## When not to use

- Single-process monoliths with acceptable local profilers and logs—tracing adds overhead for marginal gain.
- Batch ETL where wall-clock per record matters less than throughput counters.
- Environments that cannot store or retain trace data responsibly (cost, privacy).
- As a substitute for **health checks**, **metrics**, or load testing—traces diagnose; they do not prevent overload.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| 100% sampling | Full fidelity | Expensive storage and collector load |
| Head sampling (1%) | Predictable cost | May miss rare slow requests |
| Tail sampling (keep slow/errors) | Best incident signal | More complex collector pipeline |
| Auto-instrumentation only | Fast rollout | Blind spots in custom libraries |

## Example

OpenTelemetry HTTP middleware creates spans; a manual child span wraps a repository call:

```go
ctx, span := otel.Tracer("checkout").Start(r.Context(), "POST /checkout")
defer span.End()

ctx, dbSpan := otel.Tracer("checkout").Start(ctx, "db.InsertOrder")
err := repo.InsertOrder(ctx, order)
dbSpan.End()
```

Operators search trace ID `7f3a…` in Jaeger and see `db.InsertOrder` consumed 92% of request time.

## Related

- [Correlation ID](correlation-id_en.md)
- [Metrics collection](metrics-collection_en.md)
- [Microservices architecture](../../architecture/styles/microservices-architecture_en.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_en.md)

## References

- [OpenTelemetry documentation](https://opentelemetry.io/docs/) — APIs, SDKs, and semantic conventions.
- [Jaeger documentation](https://www.jaegertracing.io/docs/) — open-source trace storage and UI.
