# Idempotency
## Overview

Idempotency ensures that repeating an operation has the same effect as doing it once, which is critical for reliable retries. This property makes systems more resilient to failures and network issues in distributed environments.

## When to use
Use in APIs, message processing, and payment flows where retries are common.

## Example
Use an idempotency key for POST requests to ensure duplicate requests do not create duplicate resources.

## Pros / Cons
- Pros: Enables safe retries and reduces duplicate side-effects.
- Cons: Requires storage of request IDs/state and careful key management.

## References
- API idempotency patterns and messaging best practices.