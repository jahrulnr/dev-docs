# Centralized Logging

## Overview

**Centralized logging** aggregates log output from many hosts, containers, and services into a single searchable store. Instead of SSH-ing into individual machines during an incident, operators query one index (or stream) filtered by time, service, severity, or request identifier.

The pattern exists because distributed systems scatter evidence: a single user request may touch an edge proxy, API gateway, three microservices, a worker, and a database replica. Local log files on each node are impractical at scale. A central pipeline—collect, buffer, parse, index, retain—turns raw text into an investigation surface.

Centralized logging pairs naturally with **structured logging** (machine-readable fields) and **correlation IDs** so events from the same request can be joined. It is one leg of the observability triad alongside **metrics** and **distributed tracing**; each answers different questions during diagnosis.

## How it works

1. **Emit** — Applications write logs to stdout/stderr (containers) or a local file; prefer structured JSON when possible.
2. **Ship** — Agents or sidecars (Fluent Bit, Filebeat, Vector) tail sources and forward batches to a collector or directly to storage.
3. **Ingest & parse** — The backend normalizes timestamps, extracts fields, and may enrich with Kubernetes metadata or geo tags.
4. **Index & store** — Search engines (Elasticsearch in an **ELK stack**) or log-native stores (Loki) retain data according to retention policy.
5. **Query & alert** — Dashboards (Kibana, Grafana) and alert rules fire on error spikes, missing heartbeats, or security patterns.

```text
Service A ──> agent ──┐
Service B ──> agent ──┼──> ingest ──> store ──> search / alerts
Service C ──> agent ──┘
```

Operational concerns include **volume control** (sampling, log levels), **PII redaction** before indexing, **retention tiers** (hot vs cold), and **cost** of storage and indexing at high cardinality.

## When to use

- You run more than a handful of instances or containers and cannot rely on per-host `grep`.
- Incidents require correlating events across services (payment failure spanning API, queue, and worker).
- Compliance or security teams need durable, queryable audit trails in one place.
- You want alerting on log patterns (error rate, auth failures) integrated with on-call workflows.

## When not to use

- A single monolith on one VM with low traffic—plain rotated files and `journalctl` may suffice.
- Ultra-sensitive payloads that must never leave the host without a formal classification and encryption program.
- Debugging a one-off local issue where tailing a single process is faster than waiting for pipeline lag.
- Replacing **metrics** or **traces** with logs alone; high-cardinality “log everything as metrics” is expensive and brittle.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| ELK / OpenSearch stack | Rich full-text search, mature ecosystem | Indexing cost, cluster operations |
| Loki (label-based) | Lower cost for high volume; Grafana integration | Less ad-hoc text search than Elasticsearch |
| Cloud vendor log service | Managed scaling, IAM integration | Vendor lock-in, egress costs |
| Log on disk only | Simple, no pipeline lag | Poor cross-service correlation at scale |

## Example

A checkout API and order worker both log JSON with a shared `request_id`. Fluent Bit ships container stdout to Elasticsearch; on-call searches `request_id:"a1b2c3"` in Kibana and sees the API timeout followed by a worker retry—without opening three pods.

```json
{"ts":"2026-06-16T10:01:02Z","level":"error","service":"checkout-api","request_id":"a1b2c3","message":"payment client timeout"}
```

## Related

- [Structured logging](structured-logging_en.md)
- [Correlation ID](correlation-id_en.md)
- [ELK stack](../../../technologies/infrastructure/elk-stack_en.md)
- [Grafana](../../../technologies/infrastructure/grafana_en.md)

## References

- [Elastic: logging best practices](https://www.elastic.co/guide/en/ecs/current/index.html) — Elastic Common Schema for field consistency.
- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/) — label-first log aggregation.
