# Command Pattern
## Overview

Command encapsulates a request as an object, decoupling the sender from the receiver. It enables queuing, scheduling, logging, and undoable operations. This pattern provides flexibility in handling requests.

## When to use
- Implement undo/redo systems.
- Queue operations for asynchronous processing.
- Parameterize actions and support logging/replay.

## Implementation Guidance
- Define a Command interface with an Execute() method and optionally Undo().
- Implement concrete commands that hold references to receivers and required parameters.
- Use an Invoker to queue, schedule, or execute commands.

## Example (Go-style)
```go
type Command interface { Execute() error; Undo() error }

type OrderCommand struct { orderID string }
func (c OrderCommand) Execute() error { /* apply order */ return nil }
func (c OrderCommand) Undo() error { /* revert order */ return nil }

type Invoker struct { queue []Command }
func (i *Invoker) Push(c Command) { i.queue = append(i.queue, c) }
func (i *Invoker) Run() { for _, c := range i.queue { c.Execute() } }
```

## Pros / Cons
- Pros: Flexible, testable, supports replay and audit.
- Cons: Can generate many small classes and boilerplate.

## Pitfalls
- Avoid burying business logic in Invokers; commands should encapsulate a single responsibility.

## References
- Gamma et al., "Design Patterns".