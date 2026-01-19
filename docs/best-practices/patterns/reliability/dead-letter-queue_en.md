# Dead Letter Queue (DLQ)
## Overview

DLQ is a queue that stores messages that could not be processed after retries, enabling inspection and manual resolution. This improves message processing resilience by handling failures in a structured way.

## When to use
Use for robust message processing to avoid endless retries and to analyze recurring failures.

## Example
If a message fails processing 3 times, move it to `order-processing-dlq` for operator review.

## Pros / Cons
- Pros: Prevents retry storms, allows manual investigation of problematic messages.
- Cons: Requires operational processes for handling DLQ items.

## References
- Messaging system best practices (Kafka, SQS).