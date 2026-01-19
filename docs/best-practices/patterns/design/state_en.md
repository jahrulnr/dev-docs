# State Pattern
## Overview

State lets an object change its behavior when its internal state changes by delegating behavior to state objects. It simplifies conditional logic and groups state-specific behavior. This pattern improves maintainability by separating state-specific behavior.

## When to use
- When behavior depends on an object's state and transitions are well-defined.
- When avoiding large switch/case or if/else branches improves clarity.

## Implementation Guidance
- Define a State interface with methods for state-specific behavior and transition logic.
- Implement ConcreteState types and delegate from the Context to current State.
- Encapsulate transition logic in states or in a central state machine to keep flows explicit.

## Example (Pseudo)
`Connection` context delegates `Send()` to current state: `Connected`, `Reconnecting`, or `Disconnected`.

## Pros / Cons
- Pros: Cleaner separation of state behaviors, easier testing of individual states.
- Cons: More classes and potential complexity in transition management.

## Pitfalls
- Keep transition logic clear to avoid state explosion; use diagrams or tables for complex workflows.

## References
- Gamma et al., "Design Patterns".