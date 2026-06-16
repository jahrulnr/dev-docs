# Factory Method

## Overview

The **Factory Method** pattern defines an interface for creating an object but lets subclasses or implementors decide which concrete class to instantiate. It defers instantiation to specialized creators while keeping client code dependent on abstractions, not concrete types.

Factory Method appears in frameworks that hook extension points: `Document.CreatePage()`, plugin registries that construct handlers by name, and test suites that swap real vs mock implementations via injected factories. It is the single-product sibling of **Abstract Factory**, which groups multiple creation methods for related products.

Unlike **Builder** (stepwise assembly of one complex object), Factory Method typically returns a fully formed product in one call. Unlike **Simple Factory** (a standalone function), Factory Method is polymorphic—subclasses override creation.

## How it works

1. Define a **Product** interface representing the created object.
2. Define a **Creator** with a factory method `CreateProduct()` (or `Factory` interface in Go).
3. **Concrete creators** implement the factory method to return specific products.
4. Client code uses Creator/Product interfaces; selection happens via DI, config, or subclass.

In Go, constructor functions and interface-returning factories (`NewReader(format string) Reader`) are idiomatic factory methods without inheritance.

## When to use

- A class cannot anticipate the concrete type it must create.
- Subclasses or plugins should control which product is built.
- You want to centralize creation for testing (inject mock factories).

## When not to use

- Only one implementation exists and will not vary—a direct constructor is simpler (YAGNI).
- Construction requires many optional steps—consider Builder.
- You must create coordinated families of products—consider Abstract Factory.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Decouples clients from concrete types | More types and indirection |
| Extension via new creators/products | Can obscure where objects are born |
| Testability via factory injection | Overuse for trivial `new` calls |

## Example

```go
type Notifier interface {
    Send(msg string) error
}

type NotifierFactory interface {
    Create() Notifier
}

type EmailFactory struct{}
func (EmailFactory) Create() Notifier { return EmailNotifier{} }

type SMSFactory struct{}
func (SMSFactory) Create() Notifier { return SMSNotifier{} }

func NotifyAll(f NotifierFactory, msg string) error {
    return f.Create().Send(msg)
}
```

## Related

- [Abstract Factory](../design/abstract-factory_en.md) — families of related products
- [Builder](../design/builder_en.md) — complex multi-step construction
- [Dependency injection](../../principles/solid_en.md) — wiring concrete factories at startup

## References

- Gamma et al. — *Design Patterns*, Factory Method chapter
- Go factory functions returning interfaces (community idiom)
