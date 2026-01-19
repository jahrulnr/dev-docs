# Compensation Transaction Pattern

## Overview

The Compensation Transaction Pattern is a design pattern for handling failures in distributed systems by providing compensating actions that can undo the effects of previously executed operations. This pattern ensures data consistency and system reliability in scenarios where traditional rollback mechanisms are not available or practical, such as in microservices architectures, long-running business processes, or event-driven systems.

Benefits include enabling graceful failure recovery without distributed locking, supporting eventual consistency, reducing the complexity of error handling, and allowing systems to maintain integrity even when individual operations fail.

## Key Components

- **Transaction Coordinator**: Central component that manages the execution of transactions and coordinates compensation when failures occur.
- **Compensating Actions**: Reversible operations that undo the effects of successful transactions, restoring the system to a consistent state.
- **Transaction Log**: Persistent record of executed transactions and their current state for tracking and recovery purposes.
- **Failure Detector**: Mechanism that identifies transaction failures and triggers the compensation process.

```text
Execute Transaction
         |
         v
    +------------+     Success     +------------+
    | Transaction|  ------------>  | Transaction |
    | Step 1     |                 | Step 2      |
    +------------+                 +------------+
         |                               |
         | Failure                       | Success
         v                               v
    +------------+                 +------------+
    | Compensate |  <------------  | Transaction|
    | Step 1     |                 | Step 3      |
    +------------+                 +------------+
         |                               |
         |                               | Failure
         v                               v
    +------------+                 +------------+
    | Recovery   |                 | Compensate |
    | Complete   |  <------------  | Steps 2&1  |
    +------------+                 +------------+
                                     |
                                     v
                                +------------+
                                | All Steps  |
                                | Complete   |
                                +------------+
```

## When to Use

Use the Compensation Transaction Pattern when building distributed systems that require reliable failure handling. When operations span multiple services or systems and traditional ACID transactions are not feasible. For long-running business processes like financial transfers, order processing, or booking systems. When implementing event-driven architectures where operations cannot be easily rolled back. When you need to maintain data consistency across heterogeneous systems. Avoid when transactions are simple and can be handled with traditional database transactions.

## Implementation Guide

1. Identify all operations that need compensation and define clear compensating actions for each.
2. Implement a transaction coordinator to manage the execution flow and failure handling.
3. Create a persistent transaction log to track the state of each operation.
4. Define failure detection mechanisms and compensation triggers.
5. Implement idempotent compensating actions to handle repeated execution safely.
6. Add monitoring and alerting for compensation execution and failures.
7. Test compensation scenarios thoroughly, including partial failures and network issues.

## Examples

In a banking system, compensation handles failed money transfers by reversing debits and credits.

```go
type CompensableTransaction struct {
    Execute    func(ctx context.Context) error
    Compensate func(ctx context.Context) error
    ID         string
}

type CompensationManager struct {
    transactions []CompensableTransaction
    executed     map[string]bool
    log          []string
}

func (cm *CompensationManager) ExecuteTransaction(ctx context.Context, tx CompensableTransaction) error {
    // Execute the transaction
    if err := tx.Execute(ctx); err != nil {
        return err
    }
    
    // Mark as executed
    cm.executed[tx.ID] = true
    cm.log = append(cm.log, "Executed: "+tx.ID)
    
    return nil
}

func (cm *CompensationManager) Compensate(ctx context.Context) error {
    // Compensate in reverse order
    for i := len(cm.transactions) - 1; i >= 0; i-- {
        tx := cm.transactions[i]
        if cm.executed[tx.ID] {
            if err := tx.Compensate(ctx); err != nil {
                // Log compensation failure but continue
                cm.log = append(cm.log, "Compensation failed for: "+tx.ID)
            } else {
                cm.log = append(cm.log, "Compensated: "+tx.ID)
            }
        }
    }
    return nil
}

// Usage example
func transferMoneySaga() *CompensationManager {
    return &CompensationManager{
        executed: make(map[string]bool),
        transactions: []CompensableTransaction{
            {
                ID: "debit",
                Execute: func(ctx context.Context) error {
                    // Debit source account
                    return debitAccount(ctx, "source", 100)
                },
                Compensate: func(ctx context.Context) error {
                    // Credit back to source
                    return creditAccount(ctx, "source", 100)
                },
            },
            {
                ID: "credit",
                Execute: func(ctx context.Context) error {
                    // Credit destination account
                    return creditAccount(ctx, "dest", 100)
                },
                Compensate: func(ctx context.Context) error {
                    // Debit from destination
                    return debitAccount(ctx, "dest", 100)
                },
            },
        },
    }
}
```

## Links

For related transaction patterns, see [Saga Pattern](saga_en.md) and [Two-Phase Commit Pattern](two-phase-commit_en.md). For reliability patterns, check [Circuit Breaker](../reliability/circuit-breaker_en.md). For event-driven concepts, see [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md).