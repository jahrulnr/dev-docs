# Correlation ID

## Overview

A **correlation ID** (also called request ID or trace context key) is a unique identifier assigned to a single logical operation—typically an HTTP request or message—and propagated through every hop that participates in handling it. The same value appears in logs, metrics labels (sparingly), and trace spans so engineers can answer: “What happened to *this* checkout?”

Without correlation, distributed debugging devolves into timestamp guessing across unrelated log lines. With it, support and SRE teams filter one ID and see a coherent narrative from edge to database.

Correlation IDs are lightweight compared to full **distributed tracing**, but they complement tracing: the ID often becomes a span attribute or log field inside a trace backend. They also bridge teams that have structured logs today but are not yet fully instrumented for traces.

## How it works

1. **Generate or accept** — On entry (API gateway, load balancer, first service), create a UUID or accept an incoming header such as `X-Request-ID` or `X-Correlation-ID`. Reject or sanitize malformed values.
2. **Store in context** — Attach the ID to request-scoped context (Go `context.Context`, middleware locals) for the lifetime of the request.
3. **Propagate outbound** — Every downstream HTTP call, gRPC metadata field, and message envelope should carry the same ID (and optionally a separate **parent span ID** when tracing is enabled).
4. **Emit in telemetry** — Include the field in every **structured log** line; avoid logging it only on errors.
5. **Surface to clients** — Return the ID in error responses (header or JSON) so users can quote it when opening tickets.

```text
Client ──> Gateway [id=abc] ──> Service A [id=abc] ──> Service B [id=abc]
                │                      │                      │
                └──── same id in logs / traces / metrics ─────┘
```

**Async work** (queue consumers, cron) should copy the ID from the triggering message or start a new correlated child ID linked in metadata. **Background jobs** spawned from a request should inherit the parent ID for causality.

## When to use

- Any multi-service or async pipeline where a user-visible action spans more than one component.
- Production systems with **centralized logging** where cross-service search is required.
- APIs exposed to external consumers who need a reference number for support escalations.
- Gradual observability rollout: correlation IDs deliver value before full trace instrumentation ships.

## When not to use

- Strictly internal batch jobs with no user-facing causality chain—batch run IDs may be more appropriate.
- Systems where propagating client-supplied IDs enables log injection or cardinality attacks without validation.
- Replacing authentication, authorization, or **distributed tracing**—an ID alone does not show latency breakdown or dependency graphs.
- Logging highly sensitive tokens; the correlation ID should be opaque, not a session secret.

## Trade-offs

| Choice | Pros | Cons |
| --- | --- | --- |
| Server-generated UUID | Tamper-resistant, uniform format | Client cannot correlate pre-gateway failures |
| Client-supplied ID | End-to-end from mobile app | Must validate length/format; abuse risk |
| W3C `traceparent` header | Standard for tracing interop | Heavier than a simple request ID |
| New ID per internal retry | Clear retry boundaries | Harder to tie back to original user action |

## Example

Middleware assigns `request_id`, stores it in context, and an HTTP client forwards it:

```go
func middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-ID")
        if id == "" {
            id = uuid.NewString()
        }
        ctx := context.WithValue(r.Context(), requestIDKey, id)
        w.Header().Set("X-Request-ID", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

Downstream call: `req.Header.Set("X-Request-ID", idFromContext(ctx))`.

## Related

- [Structured logging](structured-logging_en.md)
- [Distributed tracing](distributed-tracing_en.md)
- [Centralized logging](centralized-logging_en.md)

## References

- [W3C Trace Context](https://www.w3.org/TR/trace-context/) — `traceparent` / `tracestate` for trace and correlation interop.
- [Google Cloud: distributed tracing and correlation](https://cloud.google.com/trace/docs) — propagation patterns in cloud environments.
