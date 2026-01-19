# Monolithic Architecture

## Overview

Monolithic Architecture is a traditional software design where an entire application is built as a single, unified unit. All components—user interface, business logic, and data access—are tightly coupled and deployed together. This style was dominant before microservices and is still common for simpler applications.

It's straightforward to develop and deploy but can become challenging as the application grows, leading to issues with scalability, maintainability, and team coordination.

## Key Characteristics

- **Single Codebase**: All functionality in one repository.
- **Shared Database**: Often a single database for all components.
- **Tight Coupling**: Changes in one part can affect others.
- **Unified Deployment**: Deployed as one artifact (e.g., JAR, WAR).

## When to Use

- Small to medium applications with simple requirements.
- Teams with limited resources or expertise in distributed systems.
- Proof-of-concept or MVP projects.
- Avoid for large-scale applications needing frequent updates or high scalability.

## Benefits

- Simplicity in development and deployment.
- Easier testing and debugging initially.
- Lower operational overhead.

## Drawbacks

- Scalability issues: Hard to scale individual parts.
- Maintenance challenges: Codebase grows unwieldy.
- Technology lock-in: Harder to adopt new tech.

## Examples

A simple blog application with user auth, posts, and comments all in one app.

## Related Patterns

- Layered Architecture for organizing within the monolith.
- See also Microservices for evolution.

## References

- Martin Fowler on Monolithic Architecture.