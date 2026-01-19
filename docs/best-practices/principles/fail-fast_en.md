# Fail-Fast Principle

## Overview

Fail-Fast means detecting and reporting errors immediately, halting flawed processes. Used in systems design, it contrasts with fault-tolerant systems.

Check conditions early (e.g., preconditions, state); throw exceptions or halt on errors. Benefits: Easier debugging, prevents silent failures, improves reliability.

## When to Use

In critical systems, iterators, or startup checks; when errors could cascade.

## How to Implement

Validate inputs at function start (e.g., `if (!valid) throw Error`). Use assertions. Fail early like a game over screen—don't let bad data sneak through.

```
[Input] --> [Check] --> [Fail if Invalid] --> [Process]
                    |
                    v
               [Error Halt]
```

## Links

For error handling, see [Coding Rules](../../coding-rules.md).
