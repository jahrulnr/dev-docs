# Hexagonal Architecture

## Overview

Hexagonal Architecture, also known as Ports and Adapters, is a design pattern by Alistair Cockburn that isolates the core application (the "hexagon") from external concerns via "ports" (interfaces for input/output) and "adapters" (implementations for databases, APIs). It's like a plug-and-play system where the core doesn't know about specifics, making it highly flexible and testable.

The main benefit is decoupling: The core business logic remains unchanged regardless of external changes, such as switching from a web API to a command-line interface. This supports multiple interfaces without duplication and aligns with dependency inversion.

## Key Components

- **Core (Business Logic)**: The central hexagon containing domain entities, services, and rules. It defines what the application does.
- **Ports**: Interfaces that define how the core interacts with the outside world (e.g., input ports for commands, output ports for data retrieval).
- **Adapters**: Concrete implementations of ports for external systems, like web controllers (primary adapters) or database repositories (secondary adapters).

```text
   +-------------------+
   |   Primary Adapter |
   | (Web, CLI, API)   |
   +-------------------+
           |
   +-------------------+
   |       Port        |
   | (Interface)       |
   +-------------------+
           |
   +-------------------+
   |      Core         |
   | (Business Logic)  |
   +-------------------+
           |
   +-------------------+
   |       Port        |
   | (Interface)       |
   +-------------------+
           |
   +-------------------+
   | Secondary Adapter |
   | (DB, External API)|
   +-------------------+
```

## When to Use

Use Hexagonal Architecture for:

- Applications with varied external integrations, like those needing both REST APIs and message queues.
- Systems requiring high testability, where you can easily mock adapters.
- Projects with multiple frontends (web, mobile, CLI) sharing the same core.
- Avoid in simple CRUD apps where the pattern's structure might be overkill.

## Implementation Guide

1. **Define Ports in the Core**: Create interfaces for inputs (e.g., `OrderService`) and outputs (e.g., `OrderRepository`) in the domain layer.
2. **Implement Adapters Outside**: Build primary adapters (e.g., REST controllers) and secondary adapters (e.g., SQL repositories) in infrastructure.
3. **Keep Core Independent**: The core only depends on ports, not adapters. Use dependency injection.
4. **Test with Mocks**: Easily swap adapters for testing by mocking ports.
5. **Start with One Adapter**: Begin with a web adapter, then add others like CLI.

## Examples

In a payment system, the core handles "process payment" logic. A port defines "send notification." Adapters implement this for email or SMS without changing the core.

## Links

For more on dependency inversion, see [SOLID Principles](../README.md#solid-principles). For interface examples, check [Coding Rules](../../coding-rules.md).
