# Structured Logging

## Overview

**Structured logging** emits log records as machine-parseable fields—typically JSON lines—rather than free-form prose. Each event carries a stable schema: timestamp, severity, message, service name, and domain-specific keys (`request_id`, `order_id`, `duration_ms`). Parsers, indexers, and alert rules consume these fields without fragile regular expressions.

The pattern emerged because plain text logs do not scale in distributed systems. A line like `User 42 order failed` is human-readable but expensive to query at volume. A JSON object `{"level":"error","user_id":42,"error":"timeout"}` enables precise filters in **centralized logging** platforms and joins with **correlation IDs** and trace IDs.

Structured logging is not “log more.” It is a contract between application teams and observability pipelines: field names stay consistent, levels mean something, and sensitive data is redacted before emission.

## How it works

1. **Choose a schema** — Adopt a convention (ECS, your org’s standard) for common fields; document required keys per service tier.
2. **Use a structured logger** — Libraries (zap, slog, structlog, Logrus with JSON formatter) serialize maps to JSON on stdout.
3. **Bind context** — Middleware attaches `request_id`, `trace_id`, and authenticated subject to a request-scoped logger passed down the call stack.
4. **Level discipline** — `debug` for development volume; `info` for lifecycle events; `warn` for recoverable anomalies; `error` for operator attention.
5. **Ship unchanged** — Agents forward JSON lines to Elasticsearch (**ELK stack**), Loki, or cloud logging; field extraction is trivial.

```text
Handler ──> logger.With("request_id", id) ──> {"level":"info",...} ──> stdout ──> collector
```

**Avoid** logging huge blobs (full HTTP bodies, stack traces on every info line). **Do** log structured error types and safe metadata. Pair logs with **metrics** for rates and **traces** for latency anatomy.

## When to use

- Production services ingested by **centralized logging** or SIEM tooling.
- Microservices where cross-service investigation depends on shared field names.
- Compliance audits requiring searchable, attributable records (who did what, when).
- Any environment where log-based alerting (`error_rate`, specific `error_code`) is planned.

## When not to use

- Local scratch debugging where printf-style output is faster—switch back to structured before merge.
- Ultra-low-latency paths where serialization cost is measurable and not yet optimized (rare; prefer async appenders).
- Logging secrets, tokens, or full payment PANs—structure does not make redaction optional.
- Replacing **metrics** or **health checks**—logs are event streams, not time-series aggregates.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| JSON lines to stdout | Container-native, parser-friendly | Slightly larger bytes than plain text |
| Text + key=value | Readable in tail | Weaker tooling integration |
| Strict schema registry | Reliable dashboards | Migration cost when fields change |
| Log everything at debug in prod | Deep detail | Cost and noise; use sampling |

## Example

Go `slog` with request context:

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

Output (one line): `{"time":"...","level":"INFO","service":"billing","request_id":"abc",...}`.

## Related

- [Centralized logging](centralized-logging_en.md)
- [Correlation ID](correlation-id_en.md)
- [ELK stack](../../../technologies/infrastructure/elk-stack_en.md)
- [Metrics collection](metrics-collection_en.md)

## References

- [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) — portable field naming.
- [Go slog package](https://pkg.go.dev/log/slog) — structured logging in the standard library.
