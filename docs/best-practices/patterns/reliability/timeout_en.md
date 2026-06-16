# Timeout

## Overview

A **timeout** sets an upper bound on how long an operation may run before the caller aborts and treats the work as failed. Without timeouts, threads, connections, and goroutines accumulate waiting on silent dependencies—latency piles up, connection pools exhaust, and failures cascade across **microservices** architectures.

Timeouts are the simplest **fail-fast** mechanism in the reliability toolkit. They trigger **retry** only when the failure mode is known to be transient; they hand off to **fallback** when a degraded response is acceptable; they inform **circuit breaker** windows when error rates spike. Every outbound HTTP client, database driver, and RPC stub should have explicit deadlines—not “platform defaults” nobody measured.

Effective timeout design balances user experience and dependency reality: too aggressive causes false failures; too lenient hides outages until the system is already saturated.

## How it works

1. **Set deadline at the edge** — API gateway or first service derives a total budget from product SLA (e.g., 3s user-facing).
2. **Propagate context** — Pass `context.Context` (Go), cancellation tokens, or tracing baggage so nested calls share the remaining budget.
3. **Per-hop budgets** — Allocate slices to internal queries and external calls; leave margin for serialization and queue wait.
4. **On expiry** — Cancel I/O, return error to caller, log with **correlation ID**, increment timeout **metrics**.
5. **Downstream behavior** — Server-side handlers should respect client disconnects to avoid wasted work.

```text
User SLA 3000ms
  ├─ gateway 200ms
  ├─ service A 800ms
  │    ├─ DB 400ms (timeout 450ms)
  │    └─ payment API 350ms (timeout 400ms)
  └─ buffer 250ms
```

**Client timeout** vs **server timeout**: both matter. A client may give up while the server still processes—use idempotent operations if clients **retry**. **Health checks** use short, separate timeouts from business calls.

## When to use

- Every network call, message wait, and lock acquisition in production paths.
- User-facing requests where hanging UI damages trust more than a controlled error.
- Batch jobs with watchdog timers to prevent runaway workers.
- Pairing with **retry**—only retry when timeout implies transient overload, not when payload is invalid.

## When not to use

- Extremely long analytical queries without redesign—use async jobs and polling instead of a 30-minute HTTP timeout.
- Single-machine CPU work with no external wait—timeouts add little (though overall job deadlines still help).
- Identical timeout on every dependency regardless of p99 latency profiles.
- Replacing proper capacity planning or **bulkhead** isolation—timeouts limit damage but do not add capacity.

## Trade-offs

| Setting | Pros | Cons |
| --- | --- | --- |
| Aggressive (low) | Fast fail, protects pools | False positives on jitter |
| Lenient (high) | Fewer spurious errors | Cascading queue buildup |
| Fixed per dependency | Simple mental model | Drifts as dependencies evolve |
| Adaptive (p99 + margin) | Matches reality | Needs **metrics** and tuning discipline |

## Example

Go HTTP client with nested context deadline:

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(ctx, "GET", paymentURL, nil)
resp, err := httpClient.Do(req)
if errors.Is(err, context.DeadlineExceeded) {
    metrics.PaymentTimeouts.Inc()
    return fallbackQuote(ctx)
}
```

Server handler mirrors the budget: `ctx, cancel := context.WithTimeout(ctx, 1500*time.Millisecond)` for the DB leg.

## Related

- [Retry](retry_en.md)
- [Fallback](fallback_en.md)
- [Circuit breaker](circuit-breaker_en.md)
- [Correlation ID](../observability/correlation-id_en.md)

## References

- [Google Cloud: timeouts and retries](https://cloud.google.com/storage/docs/retry-strategy) — deadline propagation guidance.
- [gRPC: deadlines](https://grpc.io/docs/guides/deadlines/) — cross-language cancellation semantics.
