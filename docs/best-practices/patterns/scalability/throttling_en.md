# Throttling
## Overview

Throttling limits the rate of requests to protect services from overload and ensure fair resource usage. This pattern helps maintain service availability and prevents cascading failures under high load.

## When to use
Use to prevent abuse, avoid overload during traffic spikes, and maintain system stability.

## Example
Rate limiting per API key: 100 requests per minute with 429 responses on excess.

## Pros / Cons
- Pros: Protects system, prevents cascading failures.
- Cons: Can reject legitimate requests under load; requires careful policy design.

## References
- API rate limiting best practices.