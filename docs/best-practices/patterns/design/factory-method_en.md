# Factory Method
## Overview

Factory Method defines an interface for creating objects and lets subclasses decide which concrete classes to instantiate. It separates object construction from usage. This pattern enables flexible and extensible object creation.

## When to use
- When a class cannot predict the class of objects it must create.
- When you want subclasses to control instantiation.
- To encapsulate object creation and promote testability.

## Implementation Guidance
- Define a Creator interface/type with a factory method (e.g., `Create()`).
- Concrete creators implement the factory method to return different product implementations.
- Use dependency injection to allow testing with mock factories.

## Example (Go-style)
```go
type Product interface {
    Do() string
}

type ConcreteProductA struct{}
func (ConcreteProductA) Do() string { return "A" }

type Factory interface {
    Create() Product
}

type ConcreteFactoryA struct{}
func (ConcreteFactoryA) Create() Product { return ConcreteProductA{} }
```

## Pros / Cons
- Pros: Encapsulates creation; improves extensibility and testability.
- Cons: Increases number of classes/types and indirection.

## Pitfalls
- Overuse can lead to unnecessary complexity; prefer simpler constructors when appropriate.

## Related Patterns
Abstract Factory, Builder

## References
- Gamma et al., "Design Patterns: Elements of Reusable Object-Oriented Software".