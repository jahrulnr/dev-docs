# Domain-Driven Design (DDD)
## Overview

Domain-Driven Design (DDD) is an approach to building complex software that centers on the domain — the problem space of the business. DDD emphasizes close collaboration with domain experts to create a model (Ubiquitous Language) that drives design and implementation. It includes strategic aspects like bounded contexts and context mapping, and tactical patterns such as Entities, Value Objects, Aggregates, Repositories, Domain Services, and Domain Events.

## Key components

### Strategic vs tactical
- **Strategic DDD**: Focuses on bounded contexts, context mapping, and team/ownership boundaries.
- **Tactical DDD**: Focuses on patterns inside a bounded context: Entities, Value Objects, Aggregates, Repositories, Domain Services, and Domain Events.

### Core patterns and practices
- **Ubiquitous Language**: Use the same terms in code and conversation. Keep models small and precise.
- **Bounded Context**: Isolate models to prevent ambiguity and coupling between contexts. Use context maps to describe relationships (e.g., upstream/downstream, anti-corruption layer).
- **Aggregates**: Enforce invariants within an aggregate boundary and treat aggregate root as transactional unit.
- **Domain Events**: Represent significant occurrences; useful for integration and eventual consistency.
- **Anti-Corruption Layer**: Translate between external models and your domain to avoid leaking foreign concepts.

## When to use

- Complex business rules, multiple teams, or when domain clarity yields business value.
- Systems where integrating multiple models/terminologies is unavoidable (bounded contexts reduce ambiguity).

## When not to use

- Trivial domains where most value is CRUD plumbing (you may still use good naming and boundaries, but full DDD is likely too heavy).
- Teams without access to domain experts or without time for modeling work; DDD requires collaboration and iteration.

## Implementation guide

- Design aggregates around transactional consistency; keep aggregates small.
- Use repositories to load/save aggregates; prefer explicit methods over generic CRUD where domain logic matters.
- Apply domain events for cross-context integration and to update projections asynchronously.
- Consider CQRS + Event Sourcing when read/write models diverge significantly.

## Trade-offs

- **Up-front modeling cost**: You spend time on language, boundaries, and exploration before code stabilizes.
- **Misapplication risk**: “DDD everywhere” can become overmodeling and slow delivery.
- **Boundary maintenance**: Bounded contexts and integration patterns require ongoing discipline as teams change.

## Examples

Example (pseudo-Go):
```go
// Aggregate root
type Order struct {
  ID string
  Items []OrderLine
  Status string
}

func (o *Order) AddItem(item OrderLine) error {
  // enforce invariants
  o.Items = append(o.Items, item)
  return nil
}

// Domain event
type OrderPlaced struct { OrderID string; Time time.Time }
```

## Common pitfalls
- Overmodeling: don’t apply DDD for trivial domains.
- Large aggregates that span many resources — split where possible.
- Confusing bounded contexts — invest time in context mapping.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_en.md`
- `docs/best-practices/architecture/patterns/onion-architecture_en.md`
- `docs/best-practices/principles/solid_en.md`

## References & further reading
- Eric Evans, "Domain-Driven Design"
- Vaughn Vernon, "Implementing Domain-Driven Design"
- https://dddcommunity.org/