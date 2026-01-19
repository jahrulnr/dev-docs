# DRY Principle

## Overview

DRY (Don't Repeat Yourself) means avoiding duplication of knowledge or code. Coined by Andy Hunt and Dave Thomas in "The Pragmatic Programmer," it ensures changes are made in one place.

Single source of truth; use abstractions like functions, classes, or normalization to eliminate redundancy. Benefits: Easier maintenance, fewer bugs from inconsistent updates, better reusability.

## When to Use

Whenever code repetition appears; in databases, configs, or logic—especially in teams to prevent sync issues.

## How to Implement

Extract repeated code into functions/methods (e.g., duplicate validation logic into a `validateInput()` function). Use inheritance or composition. If you copy-paste code, stop and make it reusable.

```
Before (Repeated):
[Code Block A]  [Code Block A]  [Code Block A]

After (DRY):
[Shared Function] --> [Code Block A] (Called 3 times)
```

## Links

For reusable code, see [Coding Rules](../../coding-rules.md).
