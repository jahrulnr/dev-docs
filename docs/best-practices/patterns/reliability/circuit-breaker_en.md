# Circuit Breaker Pattern
## Overview

A Circuit Breaker prevents repeated failed calls to an unstable dependency by opening and short-circuiting requests when error metrics exceed a configured threshold. This helps stabilize the system and prevent cascading outages.

## States & Parameters
- **Closed**: Normal operation; metrics are recorded.
- **Open**: Requests fail fast for the configured reset timeout.
- **Half-Open**: A limited number of probe requests allowed to test recovery.
- **Parameters**: failure threshold (percentage), reset timeout, success threshold for half-open.

## Implementation Guidance
- Track error rates and latencies with a sliding window and prefer percentage thresholds over fixed counts.
- Expose metrics: failure_count, request_count, circuit_open_duration, half_open_attempts.
- Integrate with monitoring/alerting; expose Prometheus metrics (e.g., circuit_breaker_open_total).
- Combine with retry/backoff and fallback strategies for robust behavior.

## Example Configuration
- failure_threshold: 50% over last 2 minutes
- reset_timeout: 30s
- half_open_success_threshold: 5

## Libraries & Tools
- Java: resilience4j; .NET: Polly; Go: github.com/sony/gobreaker.

## Observability & Testing
- Inject failures and validate state transitions; monitor metrics and circuit state.
- Log state transitions and reason codes to aid debugging.

## Notes
- Overly aggressive thresholds can harm availability; tune based on real traffic patterns.
- Circuit Breaker is not a silver bullet: use alongside capacity planning and sound system design.

## References
- Resilience patterns and resilience4j/Polly documentation.

```text
Request
   |
   v
+--------+     Failures > Threshold     +--------+
| Closed |  --------------------------> | Open   |
| (Pass) |                             | (Fail  |
+--------+                             | Fast)  |
   ^                                    +--------+
   | Recovery OK                          |
   |                                      |
   v                                      v
+--------+     Timeout Expired       +--------+
| Half-  |  <-----------------------  | (Wait) |
| Open   |                             +--------+
| (Test) |
+--------+
```

## When to Use

Use for external service calls (APIs, databases) prone to failures. In microservices architectures. When you want to avoid wasting resources on failing services. Avoid for local operations or when failures are rare.

## Implementation Guide

1. Wrap service calls in a Circuit Breaker class.
2. Track success/failure counts.
3. Open circuit when failures exceed threshold.
4. After timeout, enter half-open and test with a single request.
5. Close if test succeeds; reopen if fails.
6. Use libraries like Hystrix (Java) or Polly (.NET) for implementation.

## Examples

In an ecommerce payment system, Circuit Breaker protects against failing payment gateway APIs by failing fast and showing a "try again later" message.

```go
type CircuitBreaker struct {
    state string
    failureCount int
    threshold int
    timeout time.Time
}

func (cb *CircuitBreaker) Call(service func() error) error {
    if cb.state == "open" && time.Now().Before(cb.timeout) {
        return errors.New("circuit open")
    }
    err := service()
    if err != nil {
        cb.failureCount++
        if cb.failureCount > cb.threshold {
            cb.state = "open"
            cb.timeout = time.Now().Add(30 * time.Second)
        }
    } else {
        cb.failureCount = 0
        cb.state = "closed"
    }
    return err
}
```

## Links

For related architectural patterns, see [Microservices](../architecture/microservices_en.md) (coming soon). For event-driven patterns, check [Event-Driven Architecture](../ecosystem/aws/event-driven_en.md).
