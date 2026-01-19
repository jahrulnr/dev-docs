# Bulkhead Pattern

## Overview

The Bulkhead Pattern is a resilience design pattern that isolates different parts of a system into separate compartments, preventing failure in one part from cascading to others. Named after the watertight compartments in ships that contain flooding, it ensures system stability by limiting the impact of failures.

Benefits include failure isolation (prevents resource exhaustion in one area affecting others), improved fault tolerance, better resource utilization, and graceful degradation under load.

## Key Components

- **Bulkheads**: Isolated compartments or resource pools.
- **Resource Limits**: Maximum resources allocated per bulkhead.
- **Failure Isolation**: Failures contained within their bulkhead.
- **Fallback Mechanisms**: Alternative behavior when bulkhead is full.

```text
System Resources
+-------------------+
| Bulkhead A        |  <- Service A operations
| [Pool: 10 threads]|
+-------------------+
| Bulkhead B        |  <- Service B operations
| [Pool: 5 threads] |
+-------------------+
| Bulkhead C        |  <- Service C operations
| [Pool: 8 threads] |
+-------------------+
Failure in A doesn't affect B or C
```

## When to Use

Use when different system components have varying failure rates or resource needs. In microservices with mixed workloads. When you want to prevent a failing service from consuming all resources. For database connections, thread pools, or API rate limits. Avoid when components are tightly coupled or when overhead of isolation outweighs benefits.

## Implementation Guide

1. Identify system components that can fail independently.
2. Create separate resource pools (threads, connections) for each component.
3. Set appropriate limits for each pool based on expected load.
4. Implement queuing or rejection when pool limits are reached.
5. Monitor pool utilization and adjust limits as needed.
6. Use circuit breakers within bulkheads for additional protection.

## Examples

In a web application with multiple external API calls, Bulkhead prevents one slow API from blocking others.

```go
type Bulkhead struct {
    semaphore chan struct{}
}

func NewBulkhead(limit int) *Bulkhead {
    return &Bulkhead{
        semaphore: make(chan struct{}, limit),
    }
}

func (b *Bulkhead) Execute(fn func() error) error {
    b.semaphore <- struct{}{} // Acquire
    defer func() { <-b.semaphore }() // Release
    
    return fn()
}

// Usage
apiBulkhead := NewBulkhead(10) // Limit to 10 concurrent calls
paymentBulkhead := NewBulkhead(5) // Limit to 5 concurrent calls

err := apiBulkhead.Execute(func() error {
    // Call external API
    return callExternalAPI()
})
```

## Links

For related reliability patterns, see [Circuit Breaker](circuit-breaker_en.md) and [Retry](retry_en.md). For architectural patterns, check [Microservices](../architecture/microservices_en.md) (coming soon).