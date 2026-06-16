# Abstract Factory

## Overview

The **Abstract Factory** pattern provides an interface for creating families of related or dependent objects without specifying their concrete classes. A single factory implementation produces a coherent set of products—UI widgets for one theme, storage adapters for one cloud vendor, or parsers for one file format family.

Where **Factory Method** defers creation of one product to subclasses, Abstract Factory groups multiple factory methods so clients stay consistent: a `DarkThemeFactory` always returns matching `Button`, `Dialog`, and `Scrollbar` implementations, never mixing light and dark components.

The pattern shines when the system must swap entire product families at configuration time. The cost is rigidity: adding a new product type to the family usually requires extending the abstract factory interface and every concrete factory.

## How it works

1. Define abstract **Product** interfaces (`Button`, `Checkbox`) for each kind in the family.
2. Define **AbstractFactory** with one creation method per product (`CreateButton()`, `CreateCheckbox()`).
3. Implement **ConcreteFactory** per family (`WinFactory`, `MacFactory`).
4. Client code depends on AbstractFactory and Products only, receiving the configured factory at startup.

Avoid leaking concrete product types through the client; factory selection belongs in composition root or config.

## When to use

- Objects must be used together and must not be mixed across incompatible families.
- The system should be independent of how products are created, composed, and represented.
- You anticipate multiple parallel product lines (themes, platforms, tenants).

## When not to use

- Only one product type is created—Factory Method or simple constructor suffices.
- Families rarely change and only one implementation exists—YAGNI applies.
- New product types are added frequently—abstract factory churn hurts maintainability.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Enforces consistency within a family | Adding products touches all factories |
| Isolates concrete classes from clients | More interfaces and implementations |
| Swappable families at runtime/config | Can be heavy for small product sets |

## Example

A cross-platform toolkit:

```go
type UIFactory interface {
    CreateButton() Button
    CreateMenu() Menu
}

type MacFactory struct{}
func (MacFactory) CreateButton() Button { return MacButton{} }
func (MacFactory) CreateMenu() Menu     { return MacMenu{} }

func RenderApp(f UIFactory) {
    btn := f.CreateButton()
    menu := f.CreateMenu()
    // both match macOS look-and-feel
}
```

## Related

- [Factory Method](../design/factory-method_en.md) — single-product creation; often used inside concrete factories
- [Builder](../design/builder_en.md) — stepwise construction of one complex product
- [Prototype](https://en.wikipedia.org/wiki/Prototype_pattern) — clone existing instances instead of factory creation

## References

- Gamma et al. — *Design Patterns*, Abstract Factory chapter
- Platform abstraction layers and multi-tenant plugin families
