# Mediator

## Overview

The **Mediator** pattern defines an object that encapsulates how a set of objects interact. Instead of peers referencing each other directly (dense coupling), they communicate only through the mediator. This centralizes interaction rules and makes it easier to change collaboration behavior without editing every participant.

Mediators appear in chat rooms (users send messages via the room, not to each other directly), air-traffic control (planes talk to the tower), UI dialog coordinators (widgets notify a controller; the controller updates other widgets), and domain workflows where many aggregates must react to the same event.

The trade-off is familiar: you reduce **spaghetti references** but introduce a **hub** that can grow complex. A disciplined mediator exposes narrow protocols (commands/events) rather than exposing every participant's internals.

## How it works

1. Define a **Mediator** interface with methods for each interaction the system supports (`Notify(sender, event)` or typed handlers).
2. **Colleague** objects hold a reference to the mediator and call it when they need side effects on others.
3. The mediator implements routing: given an event, it invokes the right colleagues in the right order.
4. Colleagues do not hold direct references to each other (or only weakly, for display).

Event buses and message brokers are architectural mediators at larger scale; the GoF pattern is the in-process OO form.

## When to use

- Many objects have intricate, many-to-many interaction patterns.
- Reusing a colleague in another context would drag along unwanted dependencies.
- Interaction rules change often and should live in one place.

## When not to use

- Only two objects interact—a direct reference is simpler.
- The mediator becomes a god object with all business logic; consider domain services or event-driven boundaries.
- Distributed systems need durable messaging—an in-memory mediator is not enough alone.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Looser coupling between colleagues | Mediator complexity can concentrate risk |
| Easier to reason about interaction rules | Single point that may bottleneck testing |
| Supports reuse of colleagues | Can hide data flow if over-abstracted |

## Example

A form with `NameField`, `EmailField`, and `SubmitButton`. Fields call `formMediator.OnChange()`. The mediator enables Submit only when both fields validate, without fields knowing about each other.

```go
type FormMediator interface {
    FieldChanged(name string, value string)
}

type LoginForm struct {
    emailValid, nameValid bool
}

func (m *LoginForm) FieldChanged(name, value string) {
    switch name {
    case "email":
        m.emailValid = strings.Contains(value, "@")
    case "name":
        m.nameValid = len(value) > 0
    }
    // enable submit UI based on m.emailValid && m.nameValid
}
```

## Related

- [Observer](../design/observer_en.md) — one-to-many notification; Mediator coordinates many-to-many
- [Facade](../design/facade_en.md) — simplifies a subsystem for outsiders; Mediator governs peer talk
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_en.md) — broker-scale mediation

## References

- Gamma et al. — *Design Patterns*, Mediator chapter
- MVC/MVP controllers as UI mediators (community practice)
