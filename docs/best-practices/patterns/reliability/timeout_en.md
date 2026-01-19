# Timeout
## Overview

Timeout enforces an upper bound on how long an operation may run, preventing resources from being held indefinitely. This ensures systems remain responsive and prevent cascading failures.

## When to use
Use to fail fast on unresponsive dependencies or long-running tasks to free resources and trigger retry/fallback logic.

## Example
Set HTTP client request timeout to 2 seconds; on timeout, return an error or trigger fallback.

## Pros / Cons
- Pros: Protects system resources, prevents request pile-up.
- Cons: Requires careful tuning to avoid false positives for slow but healthy operations.

## References
- Resilience engineering and client timeout best practices.