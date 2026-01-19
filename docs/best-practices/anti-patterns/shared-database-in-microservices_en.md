# Shared Database in Microservices
## Overview

Shared Database in Microservices is an anti-pattern that ties services to a single data model, leading to coupling and coordination problems. This approach prevents independent evolution and deployment, increasing the risk of conflicts and schema coupling. As an alternative, adopt per-service data stores or bounded contexts; use events or APIs to share data between services.

## Why it's a problem
It prevents independent evolution and deployment, increasing risk of conflicts and schema coupling.

## Mitigation
Adopt per-service data stores or bounded contexts; use events or APIs to share data between services.

## References
- Microservices data ownership resources.