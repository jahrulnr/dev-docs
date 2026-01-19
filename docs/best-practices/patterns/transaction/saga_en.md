# Saga Pattern

## Overview

The Saga Pattern is a design pattern for managing distributed transactions in microservices architectures. It coordinates a series of local transactions across multiple services, ensuring data consistency through compensating actions when failures occur. Instead of using distributed transactions with two-phase commit, sagas provide a way to maintain eventual consistency in complex business processes.

Benefits include enabling distributed transactions without tight coupling, improving fault tolerance by allowing partial rollbacks, supporting long-running processes, and facilitating eventual consistency in microservices environments.

## Key Components

- **Saga Orchestrator**: Central coordinator that manages the sequence of saga steps and handles failures (for orchestration approach).
- **Saga Participants**: Individual services that execute local transactions as part of the saga.
- **Compensating Transactions**: Actions to undo the effects of previous successful steps when a failure occurs.
- **Saga Log**: Records saga state and progress for recovery, auditing and debugging.

## Orchestration vs Choreography
- **Orchestration**: A central coordinator explicitly tells participants what to do and when. Easier to observe and control but introduces a central point of logic.
- **Choreography**: Participants emit and react to events; no central coordinator. More decoupled, but can be harder to reason about end-to-end.

## Implementation Guidance
- Define idempotent local transactions and compensating actions.
- Persist saga state to enable recovery and audit.
- Monitor saga progress and failures; alert on repeated compensations.

## Pitfalls & Tips
- Ensure compensating actions are safe and can be retried.
- Avoid long-running locks across services; design for eventual consistency.
- Test failure and recovery scenarios extensively.

```text
Start Saga
     |
     v
+------------+     Success     +------------+
| Execute    |  ------------>  | Execute    |
| Step 1     |                 | Step 2     |
+------------+                 +------------+
     |                               |
     | Failure                       | Success
     v                               v
+------------+                 +------------+
| Compensate |  <------------  | Execute    |
| Step 1     |                 | Step 3     |
+------------+                 +------------+
     |                               |
     |                               | Failure
     v                               v
+------------+                 +------------+
| Saga       |                 | Compensate |
| Failed     |  <------------  | Step 2 & 1 |
+------------+                 +------------+
                                     |
                                     v
                                +------------+
                                | Saga       |
                                | Complete   |
                                +------------+
```

## When to Use

Use the Saga Pattern when building microservices architectures requiring distributed transactions. When operations span multiple services and strong consistency is needed. For long-running business processes like order fulfillment, booking systems, or financial transfers. When two-phase commit protocols are undesirable due to performance or availability concerns. Avoid when transactions are simple and contained within a single service.

## Implementation Guide

1. Identify the business process and break it into atomic steps.
2. Define compensating actions for each step that can reverse its effects.
3. Choose between orchestration (central coordinator) or choreography (event-driven).
4. Implement saga state management and persistence for recovery.
5. Define clear failure handling and timeout policies.
6. Add monitoring and logging for saga execution.
7. Test failure scenarios and compensating actions thoroughly.

## Examples

In an ecommerce order system, a saga manages order creation, payment processing, and inventory reservation with compensating actions for each step.

```go
type SagaStep struct {
    Execute    func(ctx context.Context) error
    Compensate func(ctx context.Context) error
}

type Saga struct {
    steps []SagaStep
    log   []int // Track executed steps
}

func (s *Saga) Execute(ctx context.Context) error {
    for i, step := range s.steps {
        if err := step.Execute(ctx); err != nil {
            // Compensate in reverse order
            for j := i; j >= 0; j-- {
                if compErr := s.steps[j].Compensate(ctx); compErr != nil {
                    // Log compensation failure
                }
            }
            return err
        }
        s.log = append(s.log, i)
    }
    return nil
}

// Usage example
func createOrderSaga() *Saga {
    return &Saga{
        steps: []SagaStep{
            {
                Execute: func(ctx context.Context) error {
                    // Create order in database
                    return createOrder(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Delete order
                    return deleteOrder(ctx)
                },
            },
            {
                Execute: func(ctx context.Context) error {
                    // Process payment
                    return processPayment(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Refund payment
                    return refundPayment(ctx)
                },
            },
            {
                Execute: func(ctx context.Context) error {
                    // Reserve inventory
                    return reserveInventory(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Release inventory
                    return releaseInventory(ctx)
                },
            },
        },
    }
}
```

## Links

For related integration patterns, see [CQRS](../integration/cqrs_en.md). For event-driven architecture concepts, check [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md). For reliability patterns in distributed systems, see [Circuit Breaker](../reliability/circuit-breaker_en.md).
