# Law of Demeter

## Overview

The Law of Demeter (LoD) limits object interactions to "close" friends, reducing coupling. Named after the Demeter Project, it promotes encapsulation.

A method can only call methods on itself, its parameters, its attributes, or objects it creates/instantiates. Avoid "train wrecks" like `a.b.c.d()`.

Benefits: More maintainable, adaptable code; fewer cascading changes.

## When to Use

In OOP to prevent tight dependencies; when refactoring legacy code with deep chains.

## How to Implement

Restructure to use direct references or delegation (e.g., instead of `customer.getAddress().getCity()`, have `customer.getCity()`). Only talk to your "neighbors"—don't reach through others.

```
Violation: [A] --> [B] --> [C] --> [D] (Chain)

Compliance: [A] --> [B] (Direct or delegate)
```

## Links

For encapsulation, see [Coding Rules](../../coding-rules.md).
