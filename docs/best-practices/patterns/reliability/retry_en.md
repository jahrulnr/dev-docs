# Retry Pattern

## Overview

The Retry Pattern is a resilience design pattern that automatically retries failed operations, improving reliability in unreliable environments. It handles transient failures by attempting the operation multiple times with backoff strategies.

Benefits include handling transient faults (network issues, temporary unavailability), reduced manual intervention, configurable retry logic, and better system resilience.

## Key Components

- **Retry Logic**: Mechanism to attempt the operation again.
- **Backoff Strategy**: Delay between retries (fixed, exponential, jitter).
- **Max Retries**: Limit to prevent infinite loops.
- **Retry Condition**: Criteria for what constitutes a retryable failure.

```text
Operation Fails
       |
       v
+----------------+     Retryable?     +----------------+
| Check Failure  |  --------------->  | Retry with     |
| Type           |                     | Backoff        |
+----------------+                     +----------------+
       |                                      |
       | Not Retryable                        |
       v                                      v
+----------------+                     +----------------+
| Fail Fast      |  <--------------    | Max Retries    |
+----------------+                     | Exceeded?      |
                                         +----------------+
                                                |
                                                v
                                         +----------------+
                                         | Final Failure |
                                         +----------------+
```

## When to Use

Use for transient failures (e.g., network timeouts, service overload). In distributed systems or cloud environments. When operations are idempotent. Avoid for non-transient errors (e.g., authentication failures) or non-idempotent operations.

## Implementation Guide

1. Wrap the operation in a retry function.
2. Define retryable exceptions (e.g., timeouts, 5xx HTTP errors).
3. Implement backoff: Start with short delays, increase exponentially.
4. Add jitter to avoid thundering herd.
5. Set max retries (e.g., 3-5 attempts).
6. Log retries for monitoring.

## Examples

In an ecommerce order system, retry failed payment confirmations due to network issues, with exponential backoff.

```go
func Retry(operation func() error, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        err := operation()
        if err == nil {
            return nil
        }
        if !isRetryable(err) {
            return err
        }
        time.Sleep(time.Duration(i+1) * time.Second) // Exponential backoff
    }
    return errors.New("max retries exceeded")
}

func isRetryable(err error) bool {
    // Check for transient errors
    return strings.Contains(err.Error(), "timeout") || strings.Contains(err.Error(), "temporary")
}
```

## Links

For related resilience patterns, see [Circuit Breaker](circuit-breaker_en.md). For event-driven patterns, check [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md).
