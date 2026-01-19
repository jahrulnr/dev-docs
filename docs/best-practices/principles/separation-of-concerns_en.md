# Separation of Concerns

## Overview

Separation of Concerns (SoC) is a principle dividing a system into distinct sections, each handling one aspect. Coined by Edsger Dijkstra, it applies to software, hardware, and more.

Isolate functionalities (e.g., UI, business logic, data); focus on one concern per module. Benefits: Easier debugging, testing, maintenance; promotes modularity.

## When to Use

In layered architectures (e.g., MVC); always in complex systems to avoid mixing responsibilities.

## How to Implement

Use layers or modules (e.g., separate HTML/CSS/JS in web dev). In code, split classes by concern. Like separating laundry—wash, dry, fold in different steps.

```
[UI Layer]
    |
[Business Logic Layer]
    |
[Data Layer]
```

## Links

For layered architecture, see [Architecture](../../architecture/).
