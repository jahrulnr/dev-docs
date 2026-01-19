# Load Balancer
## Overview

A Load Balancer distributes incoming network traffic across multiple servers to improve availability and scalability. This component ensures efficient resource utilization and fault tolerance in distributed systems.

## When to use
Use to scale horizontal services, distribute load, and provide high availability.

## Example
Use an L4/L7 load balancer (NGINX, AWS ALB) to route requests across service instances and perform health checks.

## Pros / Cons
- Pros: Improved scalability and fault tolerance, centralized traffic control.
- Cons: Single point of configuration; misconfiguration can impact availability.

## References
- Load balancer vendor docs.