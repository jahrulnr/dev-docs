# Health Check
## Overview

Health checks expose simple endpoints that indicate service health (liveness/readiness) used by orchestrators and monitoring systems. Ini memungkinkan deteksi dini masalah dan pemulihan otomatis.

## When to use
Use for monitoring, orchestration (e.g., Kubernetes readiness and liveness probes), and automation of failover.

## Example
`/healthz` returns 200 OK if dependencies are reachable; `/ready` returns 200 when the service is fully initialized.

## Pros / Cons
- Pros: Enables automated recovery and alerting.
- Cons: Health checks must be lightweight and not cause additional load; false positives/negatives possible.

## References
- Kubernetes probes documentation.