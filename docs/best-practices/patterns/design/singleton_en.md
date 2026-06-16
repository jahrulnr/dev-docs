# Singleton

## Overview

The **Singleton** pattern ensures a class has only one instance and provides a global point of access to it. Typical motivations include coordinating access to a shared resource (configuration registry, connection pool facade, hardware device) or amortizing expensive initialization.

Singleton is among the most **misused** patterns. Global mutable state complicates testing, hides dependencies, and encourages implicit coupling. Modern guidance often prefers **dependency injection** of a single shared instance configured at application startup rather than `GetInstance()` calls scattered through the codebase.

When Singleton is appropriate, treat it as a **scoped singleton** (one instance per process or per request context), make initialization thread-safe, and avoid business logic inside the singleton type.

## How it works

1. Hide constructors (private or package-level) so external code cannot `new` arbitrary instances.
2. Expose a static/global accessor (`Instance()`, `sync.Once` in Go) that lazily or eagerly creates the sole instance.
3. Optionally subclass or interface-wrap the singleton for testing (provide a reset hook only in tests).

In Go, package-level `var` with `sync.Once` is idiomatic when a true single instance is required. Many teams instead pass interfaces via constructors and use `wire`/`fx` for composition root wiring.

## When to use

- Exactly one instance must exist by policy (OS resource, global config loader).
- The cost of creating the object is high and reuse is always desired.
- You need a narrow, documented global registry with no hidden mutations.

## When not to use

- For convenience—to avoid passing dependencies (use DI).
- When unit tests need alternate implementations (interfaces + injection).
- In distributed systems—each process has its own instance; cluster-wide singleton needs external coordination (DB lock, leader election).

## Trade-offs

| Pros | Cons |
| --- | --- |
| Controlled single instance | Hidden global dependencies |
| Lazy init can defer cost | Thread-safety and lifecycle complexity |
| Familiar pattern for legacy codebases | Hard to test in isolation |

## Example

Thread-safe lazy init in Go:

```go
var (
    instance *Config
    once     sync.Once
)

func ConfigInstance() *Config {
    once.Do(func() {
        instance = loadConfig()
    })
    return instance
}
```

Prefer: `func NewServer(cfg Config, db DB) *Server` with `cfg` built once in `main()`.

## Related

- [Factory Method](../design/factory-method_en.md) — creation patterns; Singleton restricts cardinality
- [Abstract Factory](../design/abstract-factory_en.md) — families of objects; avoid singleton factories without need
- [Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) — preferred alternative for testability

## References

- Gamma et al. — *Design Patterns*, Singleton chapter
- Critical views: "Singleton considered harmful" in testing literature; Go community preference for explicit wiring
