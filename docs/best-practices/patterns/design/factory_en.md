# Factory Pattern

## Overview

The Factory Pattern is a creational design pattern that provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created. It encapsulates object creation logic, promoting loose coupling and making the code more flexible and maintainable.

Benefits include encapsulation of instantiation logic, easier testing (mock factories), adherence to open-closed principle, and support for polymorphism.

## Key Components

- **Product**: The interface or abstract class defining the objects to be created.
- **Concrete Product**: Specific implementations of the Product.
- **Creator (Factory)**: The interface or abstract class declaring the factory method.
- **Concrete Creator**: Implements the factory method to return Concrete Product instances.

```text
Creator (Abstract Factory)
          |
          v
+----------------+       Creates       +----------------+
| Concrete       |  --------------->  | Concrete       |
| Creator        |                     | Product        |
+----------------+                     +----------------+
          ^
          |
     Factory Method
```

## When to Use

Use when the exact type of object to create is determined at runtime. When you want to centralize object creation logic. In frameworks where subclasses decide which objects to instantiate. Avoid when object creation is simple and doesn't require abstraction.

## Implementation Guide

1. Define a Product interface or abstract class.
2. Create Concrete Product classes implementing the Product.
3. Define a Creator abstract class with a factory method returning Product.
4. Implement Concrete Creator classes overriding the factory method to return specific Concrete Products.
5. Use the factory in client code to create objects without knowing the exact type.

## Examples

In an ecommerce system, a PaymentFactory creates different payment processors (e.g., CreditCardPayment, PayPalPayment) based on user selection.

```go
// Product
type PaymentProcessor interface {
    Process(amount float64) error
}

// Concrete Products
type CreditCardProcessor struct{}
func (c CreditCardProcessor) Process(amount float64) error { /* implementation */ }

type PayPalProcessor struct{}
func (p PayPalProcessor) Process(amount float64) error { /* implementation */ }

// Creator
type PaymentFactory interface {
    CreateProcessor() PaymentProcessor
}

// Concrete Creator
type CreditCardFactory struct{}
func (c CreditCardFactory) CreateProcessor() PaymentProcessor {
    return CreditCardProcessor{}
}
```

## Links

For related architectural patterns, see [Clean Architecture](../../architecture/patterns/clean-architecture_en.md). For domain models, check [Coding Rules](../../principles/code-quality/clean-code_en.md).
