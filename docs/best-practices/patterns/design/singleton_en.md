# Singleton

## Overview

Singleton ensures a class has a single instance and provides a global access point. Use sparingly—often better solved via dependency injection. This pattern is useful for managing shared resources but can lead to tight coupling and testing difficulties if overused.

## When to use
- Shared resources that are expensive to create (connection pools, caches).
- Cases where a single coordination point is required.

## Implementation Guidance
- Prefer dependency injection over global singletons for testability.
- Ensure thread-safe initialization (e.g., sync.Once in Go) and avoid mutable global state.

## Example (Go)
```go
var (
    cfg *Config
    once sync.Once
)

func GetConfig() *Config {
    once.Do(func() { cfg = loadConfig() })
    return cfg
}
```

## Pros / Cons
- Pros: Simple access to shared resources.
- Cons: Hidden dependencies, harder testing, can lead to tight coupling.

## Pitfalls
- Avoid making business logic depend on singletons; inject dependencies instead to preserve testability.

## References
- Design patterns and language-specific best practices.