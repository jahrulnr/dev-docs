# Serverless Architecture

## Overview

Serverless Architecture delegates server management to cloud providers, running code in response to events without provisioning servers. Functions are executed on-demand, scaling automatically. This style focuses on code logic, reducing operational overhead, but can lead to vendor lock-in and cold start issues.

## Key Characteristics

- **Function as a Service (FaaS)**: Code runs in stateless functions (e.g., AWS Lambda).
- **Event-Triggered**: Invoked by HTTP requests, database changes, etc.
- **Auto-Scaling**: Scales based on demand.
- **No Server Management**: Provider handles infrastructure.

## When to Use

- Applications with variable or unpredictable traffic.
- Prototyping or event-driven workloads.
- Avoid for long-running processes or low-latency needs.

## Benefits

- Cost-efficiency: Pay only for execution time.
- Scalability and reduced ops.
- Faster development.

## Drawbacks

- Vendor lock-in.
- Cold starts and timeouts.
- Debugging challenges.

## Examples

A file processing service triggered by uploads.

## Related Patterns

- Event-Driven, Microservices.
- See AWS Serverless docs.

## References

- AWS Serverless Architecture.