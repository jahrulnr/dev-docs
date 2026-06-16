# State

## Overview

The **State** pattern lets an object alter its behavior when its internal state changes; the object appears to change its class. Each state is encapsulated in its own type implementing a common interface, and the context delegates behavior to the current state object instead of switching on enums or flags.

State machines appear everywhere: TCP connections (CLOSED, ESTABLISHED, …), order workflows (pending → paid → shipped), media players (playing, paused, stopped), and UI modes (edit vs view). Without the pattern, a single class accumulates `switch state` branches that are hard to extend and test.

State differs from **Strategy**: Strategy is usually configured once from outside for an algorithm variant; State transitions are often internal and tied to domain events. Both replace conditional logic with polymorphism.

## How it works

1. Define a **State** interface with methods representing context behavior (`HandleRequest()`, `Next()`).
2. Implement one concrete state class per allowable state.
3. The **Context** holds a reference to the current State and forwards calls to it.
4. States may transition the context by calling `context.SetState(newState)` when rules permit.

Transitions can be table-driven (map from event + state → next state) for clarity in complex machines.

## When to use

- Behavior depends on state and you have many transitions or states.
- `switch`/`if` chains on status codes grow with every new state.
- States share little code and deserve separate types with focused tests.

## When not to use

- Only two or three simple states with stable rules—a small enum and functions may suffice.
- States differ only by data, not behavior—store state as data, not polymorphic types.
- Distributed workflows spanning services—model with explicit workflow engines or event sourcing, not a single in-memory State graph alone.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Localizes state-specific logic | More types and wiring |
| Open/closed for new states | Transition matrix can be hard to visualize |
| Easier unit testing per state | Risk of invalid transitions if not guarded |

## Example

A `Turnstile` context delegates to `Locked` or `Unlocked` state. `Coin()` in `Locked` unlocks; `Push()` in `Unlocked` locks after admitting one person.

```go
type TurnstileState interface {
    Coin(t *Turnstile)
    Push(t *Turnstile)
}

type Locked struct{}
func (Locked) Coin(t *Turnstile) { t.setState(Unlocked{}) }

type Turnstile struct {
    state TurnstileState
}
func (t *Turnstile) Coin() { t.state.Coin(t) }
```

## Related

- [Strategy](../design/strategy_en.md) — interchangeable algorithms; State models lifecycle
- [Command](../design/command_en.md) — can trigger state transitions as side effects
- [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine) (conceptual foundation)

## References

- Gamma et al. — *Design Patterns*, State chapter
- Explicit state machines in telecom, protocols, and workflow engines
