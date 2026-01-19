# Correlation ID
## Overview

Correlation ID is a unique identifier attached to requests that allows tracing the request path across services and logs. Ini memungkinkan debugging yang efektif di sistem terdistribusi dengan menghubungkan log dan trace dari alur permintaan yang sama.

## When to use
Use for distributed tracing and debugging to correlate logs and traces belonging to the same request flow.

## Example
Attach `X-Request-ID` to incoming HTTP requests and propagate it across services and logs.

## Pros / Cons
- Pros: Significantly eases debugging across services.
- Cons: Requires consistent propagation and instrumentation.

## References
- Distributed tracing and logging guides.