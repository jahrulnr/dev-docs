# Two-Phase Commit Pattern

## Overview

The Two-Phase Commit Pattern is a distributed algorithm that coordinates all the processes that participate in a distributed atomic transaction on whether to commit or abort (roll back) the transaction. It ensures atomicity across multiple resources or services, guaranteeing that either all participants commit the transaction or all abort it. This pattern provides strong consistency but can impact performance and availability due to its blocking nature.

Benefits include ensuring ACID properties in distributed systems, preventing partial commits, and maintaining data integrity across multiple databases or services.

## Key Components

- **Coordinator**: Central component that manages the transaction lifecycle and coordinates with participants.
- **Participants**: Individual resources or services that participate in the distributed transaction.
- **Transaction Manager**: Handles the prepare and commit phases of the protocol.
- **Resource Managers**: Manage local resources and provide prepare, commit, and abort operations.

```text
Coordinator                    Participants
     |                               |
     | 1. Prepare Request            |
     +------------------------------>|
     |                               |
     | 2. Vote (Yes/No)              |
     |<------------------------------+
     |                               |
     | 3. Commit Request (if all Yes)|
     +------------------------------>|
     |                               |
     | 4. Commit Acknowledgment      |
     |<------------------------------+
     |                               |
     | Or Abort Request (if any No)  |
     +------------------------------>|
     |                               |
     | 5. Abort Acknowledgment       |
     |<------------------------------+
```

## When to Use

Use the Two-Phase Commit Pattern when building distributed systems requiring strong consistency guarantees. When transactions span multiple databases or services and partial failures must be avoided. For financial systems, banking operations, or any scenario where data integrity is critical. When eventual consistency is unacceptable and immediate consistency is required. Avoid when high availability is more important than consistency, or in systems with frequent network partitions.

## Implementation Guide

1. Design a reliable coordinator that can handle failures and recovery.
2. Implement participants with prepare, commit, and abort operations.
3. Define clear timeout policies for each phase to prevent indefinite blocking.
4. Implement logging and persistence for transaction state recovery.
5. Add monitoring for transaction progress and failure detection.
6. Test thoroughly with various failure scenarios including coordinator crashes.
7. Consider implementing optimizations like presumed abort or commit protocols.

## Examples

In a banking transfer system, 2PC ensures money is debited from one account and credited to another atomically.

```go
type Participant interface {
    Prepare(ctx context.Context, txID string) error
    Commit(ctx context.Context, txID string) error
    Abort(ctx context.Context, txID string) error
}

type Coordinator struct {
    participants []Participant
    txLog        map[string]string // Transaction state log
}

func (c *Coordinator) ExecuteTransaction(ctx context.Context, txID string) error {
    // Phase 1: Prepare
    votes := make([]bool, len(c.participants))
    for i, p := range c.participants {
        if err := p.Prepare(ctx, txID); err != nil {
            votes[i] = false
        } else {
            votes[i] = true
        }
    }

    // Check if all voted yes
    allYes := true
    for _, vote := range votes {
        if !vote {
            allYes = false
            break
        }
    }

    // Phase 2: Commit or Abort
    if allYes {
        c.txLog[txID] = "committing"
        for _, p := range c.participants {
            if err := p.Commit(ctx, txID); err != nil {
                // Handle commit failure - may need manual intervention
                return err
            }
        }
        c.txLog[txID] = "committed"
        return nil
    } else {
        c.txLog[txID] = "aborting"
        for _, p := range c.participants {
            p.Abort(ctx, txID) // Ignore errors in abort
        }
        c.txLog[txID] = "aborted"
        return errors.New("transaction aborted")
    }
}

// Usage example
func transferMoney(fromAccount, toAccount *BankAccount, amount float64) error {
    txID := generateTransactionID()
    
    coordinator := &Coordinator{
        participants: []Participant{fromAccount, toAccount},
        txLog: make(map[string]string),
    }
    
    return coordinator.ExecuteTransaction(context.Background(), txID)
}
```

## Links

For alternative approaches to distributed transactions, see [Saga Pattern](saga_en.md). For reliability patterns in distributed systems, see [Circuit Breaker](../reliability/circuit-breaker_en.md). For event-driven architecture concepts, check [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md).