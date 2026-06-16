# Health Check

## Overview

A **health check** is a small, well-defined probe that reports whether a service instance can safely receive traffic or is alive enough to be restarted. Orchestrators (Kubernetes, Docker Swarm, cloud load balancers) and monitoring systems poll these endpoints or commands to automate routing, scaling, and recovery.

The pattern separates **liveness** (“is the process stuck?”) from **readiness** (“can this instance serve requests right now?”). Conflating them causes flapping: a service still starting up gets killed for failing liveness, or a degraded instance keeps receiving traffic because liveness alone returns OK.

Health checks are the operational handshake between application code and platform infrastructure. They should be cheap, idempotent, and honest—checking real dependencies only when readiness requires it, not on every liveness tick.

## How it works

| Probe type | Question | Typical action if fail |
| --- | --- | --- |
| **Liveness** | Is the process deadlocked or broken beyond self-heal? | Restart the container/pod |
| **Readiness** | Can we route user traffic here? | Remove from load balancer |
| **Startup** | Has slow initialization finished? | Delay liveness until pass (K8s 1.16+) |

1. **Expose endpoints** — Common paths: `/healthz`, `/live`, `/ready`. Return HTTP 200 when healthy, 503 when not.
2. **Check dependencies selectively** — Readiness may verify database TCP, cache ping, or migration version; liveness should avoid heavy external calls.
3. **Platform polls** — kubelet, swarm manager, or ALB hits the endpoint on an interval with timeout and failure threshold.
4. **Integrate metrics** — Track probe failures and dependency check latency in **Prometheus** for alerting before users notice.

```text
Load balancer ──> readiness OK? ──> route traffic
       │
kubelet ──> liveness OK? ──> else restart pod
```

**Graceful shutdown**: mark readiness failed before draining connections so in-flight requests complete. **Deep checks** (full dependency graph) belong in admin tools or synthetic monitoring, not sub-second readiness probes.

## When to use

- Any service behind a load balancer or service mesh that must stop sending traffic to bad instances.
- Container orchestration where automatic restart replaces manual intervention.
- Autoscaling signals combined with **metrics** (CPU alone is insufficient for “ready to serve”).
- Multi-step startup (migrations, cache warm-up) where traffic must wait until complete.

## When not to use

- Local development processes with no orchestrator—manual `curl` suffices.
- Using health endpoints for heavy integration tests or batch work—they must stay lightweight.
- Exposing unauthenticated deep dependency details on a public URL (information disclosure risk).
- Replacing synthetic monitoring or **distributed tracing** for user-journey validation.

## Trade-offs

| Design | Pros | Cons |
| --- | --- | --- |
| Separate live/ready | Correct orchestration semantics | Two endpoints to maintain |
| Single `/health` | Simple | Orchestrator cannot distinguish stuck vs warming |
| DB check in readiness | Accurate routing | Thundering herd on DB if every pod polls aggressively |
| Exec probe (script) | Works without HTTP server | Harder to test; script bugs restart pods |

## Example

Kubernetes deployment with distinct probes:

```yaml
livenessProbe:
  httpGet: { path: /live, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
```

`/ready` returns 503 until migrations finish and the DB pool connects; `/live` only verifies the HTTP server responds.

## Related

- [Metrics collection](metrics-collection_en.md)
- [Timeout](../reliability/timeout_en.md)
- [Microservices architecture](../../architecture/styles/microservices-architecture_en.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_en.md)

## References

- [Kubernetes: configure liveness, readiness, and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Google SRE: monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/) — health vs symptom-based alerting.
