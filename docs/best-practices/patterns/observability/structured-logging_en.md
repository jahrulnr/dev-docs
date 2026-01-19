# Structured Logging
## Overview

Structured Logging emits logs as machine-readable fields (JSON) rather than free-form text, improving searchability and parsing. This enables more effective log analysis and debugging in production environments.

## When to use
Use for production systems to enable efficient querying, parsing, and correlation in centralized logging systems.

## Example
Log: {"timestamp":"...","level":"info","requestId":"...","userId":123,"message":"order created"}

## Pros / Cons
- Pros: Easier querying and tooling integration.
- Cons: Slightly more complex logging setup and schema management.

## References
- Logging best practices.