# Composite

## Overview

The **Composite** pattern composes objects into tree structures to represent part-whole hierarchies. Clients treat individual objects (*leaves*) and groups of objects (*composites*) through the same interface, so operations on a subtree behave like operations on a single node.

You see Composite in UI component trees, filesystem APIs, organizational charts, and document structures (sections containing paragraphs). It removes branching logic from callers: instead of `if isLeaf { ... } else { for child ... }` scattered everywhere, one `Render()` or `Size()` call on the root propagates correctly.

The pattern trades type precision for uniformity. Not every operation makes sense for every node type; the interface must be chosen carefully so leaves and composites both support the contract—or composites delegate only to children that can handle a request.

## How it works

1. Define a **Component** interface with operations shared by leaves and composites (e.g. `Draw()`, `GetPrice()`).
2. **Leaf** implements Component directly with terminal behavior.
3. **Composite** holds a collection of child Components and implements Component by delegating to children (often recursively).
4. Clients interact only with the Component interface, unaware whether the instance is leaf or composite.

Optional: composites expose `Add`/`Remove` for building the tree; some designs keep tree mutation in a separate builder to keep the Component interface minimal.

## When to use

- The domain is naturally hierarchical and clients should ignore the difference between one item and a group.
- Operations must apply recursively (sum weights, render tree, validate subtree).
- You want to add new component types without changing client traversal code.

## When not to use

- Leaves and composites need very different APIs—forcing a shared interface creates empty or misleading methods.
- Type safety is critical and you cannot tolerate `interface{}` or runtime checks for unsupported operations.
- The structure is flat; a simple list or map avoids unnecessary abstraction.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Uniform client code over trees | Shared interface may be too broad or leaky |
| Easy to add new leaf/composite types | Harder to restrict operations to leaves only |
| Natural fit for recursive algorithms | Deep trees can hide performance costs |

## Example

A graphics editor: `Shape` interface with `Draw()`. `Circle` and `Rectangle` are leaves. `Group` is a composite holding `[]Shape` and draws each child. The canvas calls `root.Draw()` whether `root` is one shape or a nested group.

```go
type Shape interface {
    Draw() string
}

type Group struct {
    children []Shape
}

func (g Group) Draw() string {
    var out string
    for _, c := range g.children {
        out += c.Draw()
    }
    return out
}
```

## Related

- [Decorator](../design/decorator_en.md) — wraps one object; Composite aggregates many
- [Facade](../design/facade_en.md) — simplifies a subsystem; Composite models structure
- [Iterator](https://en.wikipedia.org/wiki/Iterator_pattern) — often used to walk composite trees

## References

- Gamma, Helm, Johnson, Vlissides — *Design Patterns* (GoF), Composite chapter
- Common in UI frameworks (React component trees, scene graphs)
