# Event Sourcing

## Overview

Event Sourcing is an architectural pattern that stores state changes as a sequence of immutable events rather than updating the current state directly. The current state is reconstructed by replaying these events from the beginning. This approach provides a complete audit trail, enables temporal queries, and supports complex business logic in event-driven systems.

Benefits include complete audit history (every change is recorded), temporal queries (reconstruct state at any point in time), decoupling of write and read models, scalability through event streams, and natural support for event-driven architectures.

## Key Components

- **Event**: Immutable record representing a state change (e.g., `UserRegistered`, `OrderShipped`) with type, data, timestamp, and aggregate ID.
- **Event Store**: Append-only storage for events. Supports efficient append, read-by-aggregate, and stream replay.
- **Aggregate**: Loads state by replaying events and applies new events when commands are executed.
- **Projections / Event Handlers**: Build and maintain read models or trigger side effects asynchronously.
- **Snapshots**: Periodically store aggregate snapshots to speed up loading large event histories.

## Implementation Guidance
- Use optimistic concurrency with event version numbers.
- Implement snapshots for aggregates with long histories.
- Version events and provide migration strategies for event schema changes (upcasters).
- Ensure event processors are idempotent and track processed offsets.

## Operational Considerations
- Event store choice: Kafka (streaming), specialized event stores, or append-only tables.
- Monitor projection lag and implement replay tools for rebuilding projections.
- Plan retention and archiving strategy for events.

## Pitfalls
- Overuse where simple state updates suffice.
- Event schema evolution complexity without versioning/upcasters.

## References
- Event Sourcing literature and patterns; sample implementations in multiple languages.

```text
Command (e.g., CreateOrder)
          |
          v
+----------------+     Events      +----------------+
|   Aggregate    |  ----------->   |  Event Store   |
| (Apply Events) |                 | (Append-Only)  |
+----------------+                 +----------------+
          ^                                |
          |                                v
          |                       +----------------+
          |                       |  Projections  |
          |                       | (Build Views)  |
          +-----------------------+----------------+
```

## When to Use

Use Event Sourcing when audit trails are critical (e.g., financial systems, healthcare). For applications requiring temporal queries (e.g., "account balance last month"). In domains with complex business rules that benefit from event replay. When paired with CQRS for optimized reads. Avoid in simple CRUD applications where direct state updates suffice, or when storage costs for events are prohibitive.

## Implementation Guide

1. Define events as immutable structs with versioning support (e.g., include version field for schema evolution).
2. Implement an event store interface: `Append(events []Event)`, `Load(aggregateID string) []Event`.
3. Create aggregates: Load events to reconstruct state, validate commands, and produce new events.
4. Use projections to build read models: Subscribe to event streams and update denormalized views asynchronously.
5. Handle concurrency: Use optimistic locking with aggregate versions to prevent conflicts.
6. Ensure idempotency: Commands should be idempotent to handle retries.
7. Start small: Implement for one bounded context, then expand.

## Examples

In an e-commerce system, orders are managed via events like `OrderCreated`, `ItemAdded`, `PaymentProcessed`.

```go
// Event definition
type Event struct {
    AggregateID string
    Type        string
    Data        interface{}
    Timestamp   time.Time
    Version     int
}

// Aggregate example
type Order struct {
    ID       string
    Items    []OrderItem
    Status   string
    Version  int
}

func (o *Order) Load(events []Event) {
    for _, event := range events {
        o.apply(event)
        o.Version = event.Version
    }
}

func (o *Order) apply(event Event) {
    switch event.Type {
    case "OrderCreated":
        data := event.Data.(OrderCreatedData)
        o.ID = data.OrderID
        o.Status = "Created"
    case "ItemAdded":
        data := event.Data.(ItemAddedData)
        o.Items = append(o.Items, data.Item)
    // ... more cases
    }
}

func (o *Order) AddItem(item OrderItem) []Event {
    event := Event{
        AggregateID: o.ID,
        Type:        "ItemAdded",
        Data: ItemAddedData{Item: item},
        Timestamp:   time.Now(),
        Version:     o.Version + 1,
    }
    o.apply(event)
    return []Event{event}
}

// Event Store interface
type EventStore interface {
    Append(events []Event) error
    Load(aggregateID string) ([]Event, error)
}
```

## Links

For combining with CQRS, see [CQRS](../integration/cqrs_en.md). For event-driven architecture, check [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md). For domain modeling, refer to [Clean Architecture](../../../architecture/patterns/clean-architecture_en.md).