# Law of Demeter

## Overview

The **Law of Demeter** (LoD), or "principle of least knowledge," says a module should talk only to its immediate friends—not strangers. In practice: avoid long chains of getters that reach through object graphs (`order.getCustomer().getAddress().getZip()`), which couple callers to distant internal structure.

LoD encourages **narrow interfaces** and **tell, don't ask**: ask an object to perform work with its own data instead of pulling internals out to manipulate elsewhere. Violations ("train wrecks") make refactors painful—changing `Address` breaks code that never should have depended on it.

LoD is a guideline, not dogma. DTOs, mappers, and query layers sometimes need multiple fields; contain that knowledge in one place rather than spreading reach-through calls.

## Key ideas

- Methods on a class should use only: itself, parameters, objects it creates, its direct components.
- Prefer domain methods (`order.shipToZip()`) over exposing deep object graphs.
- Facades and application services coordinate without leaking every entity getter.
- In Go, small interfaces at call sites reduce temptation to reach into structs.

## When to use

- Domain models where encapsulation protects invariants.
- APIs stabilizing module boundaries between teams.
- Refactoring legacy code with fragile dependency chains.

## When not to use

- Reporting or analytics that legitimately aggregate many fields—use a dedicated read model or projection.
- Serialization layers that must map full object trees—keep mapping localized.
- Performance-critical paths where measured profiling shows delegation overhead (rare).

## Trade-offs

| Following LoD | Cost |
| --- | --- |
| Looser coupling, safer refactors | More wrapper methods or services |
| Clearer ownership of behavior | Can feel verbose for simple data carriers |
| Hides internal graph changes | Indirection for readers unfamiliar with domain |

## Example

Avoid:

```go
zip := order.Customer.Address.Zip // train wreck
```

Prefer:

```go
zip, err := order.ShippingZip()
```

`Order` delegates to owned `Customer`/`Address` internally; callers stay stable if address storage changes.

## Related

- [Separation of Concerns](separation-of-concerns_en.md) — limit what each module knows
- [Facade](../patterns/design/facade_en.md) — stable entry points over subsystems
- [SOLID](solid_en.md) — especially encapsulation and interface segregation

## References

- Lieberherr et al. — original Law of Demeter (Northeastern University, 1987)
- Hunt & Thomas — *The Pragmatic Programmer*, "Tell, Don't Ask"
