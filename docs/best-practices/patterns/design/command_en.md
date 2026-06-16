# Command

## Overview

The **Command** pattern encapsulates a request as an object, letting you parameterize clients with different requests, queue or log operations, and support undo. The invoker holds a `Command` interface and calls `Execute()` without knowing concrete action details; receivers implement the actual work.

Commands power undo/redo in editors, job queues (each job is a command), transactional macros, RPC payloads, and CQRS write models where a command represents an intent (`PlaceOrder`, `UpdateProfile`). Separating invocation from execution enables cross-cutting concerns: logging, authorization, retry, and scheduling wrap execution uniformly.

The pattern pairs naturally with **Invoker** history stacks for undo and with **Composite** for macro commands (batch of sub-commands).

## How it works

1. Define `Command` with `Execute()` (and optionally `Undo()`).
2. **Concrete commands** store parameters and a reference to the **Receiver** (or closure over dependencies).
3. **Invoker** triggers `command.Execute()`; may store commands in a stack for undo.
4. **Receiver** contains domain logic; the command is a thin adapter.

Immutable command objects simplify replay and audit. Idempotent receivers matter when commands may retry.

## When to use

- You need to queue, schedule, or log requests as first-class values.
- Undo/redo or transactional rollback is required.
- The same invoker should run many operation types through one API.
- You are modeling domain intents explicitly (CQRS commands).

## When not to use

- A simple function call with no audit, queue, or undo needs—extra types add noise.
- Commands carry huge mutable state—prefer events or DTOs with clear boundaries.
- Distributed sagas need more than in-process Command objects (outbox, messaging).

## Trade-offs

| Pros | Cons |
| --- | --- |
| Decouples invoker from receiver | Proliferation of small command types |
| Supports undo, queue, macro | Indirection and boilerplate |
| Cross-cutting wrappers (auth, metrics) | Undo must be designed per operation |

## Example

A text editor stores `InsertTextCommand` with offset and string. Invoker executes and pushes to undo stack. `Undo()` deletes the inserted range.

```go
type Command interface {
    Execute() error
    Undo() error
}

type InsertText struct {
    doc   *Document
    pos   int
    text  string
}

func (c InsertText) Execute() error {
    return c.doc.Insert(c.pos, c.text)
}
func (c InsertText) Undo() error {
    return c.doc.Delete(c.pos, len(c.text))
}
```

## Related

- [Chain of Responsibility](../design/chain-of-responsibility_en.md) — pipeline of handlers; Command is encapsulated action
- [Strategy](../design/strategy_en.md) — interchangeable algorithms; Command is request object with lifecycle
- [State](../design/state_en.md) — transitions may be driven by commands

## References

- Gamma et al. — *Design Patterns*, Command chapter
- CQRS command handlers in domain-driven design practice
