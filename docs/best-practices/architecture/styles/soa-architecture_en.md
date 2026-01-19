# Service-Oriented Architecture (SOA)

## Overview

Service-Oriented Architecture (SOA) is an architectural style that structures applications as a collection of loosely coupled services that communicate via standardized interfaces. Services are reusable business functionalities that can be orchestrated to form complex applications. SOA emphasizes interoperability, reusability, and enterprise-wide integration, and was widely adopted in large organizations before the rise of microservices.

## Key Characteristics

- **Loose Coupling**: Services are independent and can be modified without affecting others.
- **Standardized Interfaces**: Communication via protocols like SOAP, REST, or messaging standards.
- **Service Registry and Discovery**: Central repository for locating and invoking services.
- **Orchestration via ESB**: Enterprise Service Bus acts as a mediator for routing and transforming messages.

## When to Use

- Large enterprise systems requiring integration across multiple departments or legacy systems.
- Applications needing high reusability of business logic.
- Scenarios with heterogeneous technologies and platforms.
- Avoid for small, agile teams where microservices offer better flexibility without heavy governance.

## Benefits

- Improved interoperability between disparate systems.
- Reusability of services across applications.
- Easier maintenance and scalability of individual services.
- Supports gradual modernization of legacy systems.

## Drawbacks

- High complexity in governance, security, and service management.
- Performance overhead due to message-based communication.
- Requires significant upfront planning and infrastructure (e.g., ESB).
- Can lead to tight coupling if not implemented carefully.

## Examples

A banking system where services for account management, transaction processing, and reporting are exposed via standardized interfaces and orchestrated through an ESB.

## Related Patterns

- API Gateway for modern SOA implementations.
- Event-Driven Architecture for asynchronous communication.
- Contrast with Microservices for finer granularity.

## References

- OASIS SOA Reference Model.
- "Service-Oriented Architecture" by Thomas Erl.