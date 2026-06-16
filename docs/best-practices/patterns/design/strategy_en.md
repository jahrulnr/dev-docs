# Strategy Pattern

## Overview

The Strategy Pattern is a behavioral design pattern that defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it, promoting flexibility and maintainability by allowing runtime selection of algorithms.

Benefits include separation of concerns (algorithm logic from client code), easy extension with new strategies, adherence to open-closed principle, and improved testability through strategy injection.

## Key Components

- **Strategy**: The interface or abstract class defining the algorithm's contract.
- **Concrete Strategy**: Specific implementations of the Strategy interface.
- **Context**: The class that uses a Strategy, maintaining a reference to it and delegating algorithm execution.

```text
Context
   |
   | uses
   v
+----------------+       implements     +----------------+
| Strategy       |  <---------------  | Concrete       |
| Interface      |                     | Strategy       |
+----------------+                     +----------------+
          ^
          |
     implements
          |
+----------------+
| Concrete       |
| Strategy 2     |
+----------------+
```

## When to Use

Use when you have multiple algorithms for a specific task and want to switch between them at runtime. When you want to avoid conditional statements for algorithm selection. In frameworks requiring pluggable algorithms. When algorithms are complex and need isolation from client code.

## Implementation Guide

1. Define a Strategy interface with a method for the algorithm.
2. Create Concrete Strategy classes implementing the Strategy interface.
3. Create a Context class that accepts a Strategy in its constructor or via a setter.
4. The Context delegates the algorithm execution to the current Strategy.
5. Clients can change strategies dynamically by injecting different implementations.

## Examples

In an ecommerce system, different discount strategies (PercentageDiscount, FixedAmountDiscount, BuyOneGetOne) can be applied to orders.

```go
// Strategy
type DiscountStrategy interface {
    ApplyDiscount(amount float64) float64
}

// Concrete Strategies
type PercentageDiscount struct {
    percentage float64
}

func (p PercentageDiscount) ApplyDiscount(amount float64) float64 {
    return amount * (1 - p.percentage/100)
}

type FixedAmountDiscount struct {
    discount float64
}

func (f FixedAmountDiscount) ApplyDiscount(amount float64) float64 {
    return amount - f.discount
}

// Context
type Order struct {
    amount   float64
    strategy DiscountStrategy
}

func NewOrder(amount float64, strategy DiscountStrategy) *Order {
    return &Order{amount: amount, strategy: strategy}
}

func (o *Order) SetStrategy(strategy DiscountStrategy) {
    o.strategy = strategy
}

func (o *Order) CalculateTotal() float64 {
    return o.strategy.ApplyDiscount(o.amount)
}
```

## Links

For related architectural patterns, see [Clean Architecture](../../architecture/patterns/clean-architecture_en.md). For domain models, check [Coding Rules](../../principles/code-quality/clean-code_en.md).