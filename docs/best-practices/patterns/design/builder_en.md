# Builder

## Overview

The **Builder** pattern separates construction of a complex object from its representation. A builder exposes step-by-step configuration (often fluent methods) and a final `Build()` that produces the product. The same construction process can yield different representations by swapping concrete builders.

You see Builder in query APIs, HTTP client configurators, test data builders, and protobuf/grpc message builders. It addresses **telescoping constructors**—constructors with many optional parameters that become unreadable and error-prone.

## How it works

1. Define a `Builder` interface (or abstract builder) with configuration methods and `Build()`.
2. Implement one or more concrete builders for different product variants.
3. Optionally use a **Director** that orchestrates fixed build sequences (less common in application code).

Builders often return `this` from setter methods for chaining. Immutability of the final product is a common motivation.

## When to use

- Many optional fields or construction steps for one product type.
- You want readable, self-documenting assembly code instead of long constructors.
- The construction algorithm must be reusable with different representations (e.g. JSON vs SQL query).

## When not to use

- Simple structs with few fields—a constructor or struct literal is enough.
- Objects that must be fully valid at every intermediate step (consider a factory or validated constructor instead).
- When Go’s functional options pattern (`WithTimeout`, `WithRetry`) is idiomatic and sufficient.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Readable construction, hides complexity | More types and boilerplate |
| Easy to add optional steps without breaking callers | Risk of invalid partial state before `Build()` |
| Supports multiple representations | Can be overkill for small objects |

## Example

A `HTTPClientBuilder` sets timeout, retry policy, and TLS config, then `Build()` returns an immutable client:

```go
client := NewHTTPClientBuilder().
    WithTimeout(5 * time.Second).
    WithRetry(3).
    Build()
```

A `QueryBuilder` composes `WHERE`, `ORDER BY`, and `LIMIT` into a parameterized SQL string.

## Related

- [Factory Method](../design/factory-method_en.md)
- [Abstract Factory](../design/abstract-factory_en.md)
- [Fluent interface](https://martinfowler.com/bliki/FluentInterface.html) (external concept)

## References

- Gamma, Helm, Johnson, Vlissides — *Design Patterns* (GoF), Builder chapter
- Effective construction patterns in Go: functional options vs builder (community practice)
