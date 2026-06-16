# Extensibility Hooks

## Overview

**Extensibility hooks** are named points in an application lifecycle where core logic can call registered extensions—plugins, webhooks, or scripts—without hard-coding every integration. Gateways call them “pipes” (router, proxy, transport); control planes call them “events” (before deploy, after SSL renew).

A hook design should specify: **when** it fires, **what data** is passed, whether handlers are **sync or async**, **timeout/rollback** behavior, and **permission** requirements.

## Key components

- **Hook name** — stable contract (`nginx.before_reload`, `ssl.after_renew`).
- **Payload** — structured context (site ID, paths, job output); avoid leaking secrets by default.
- **Dispatcher** — routes to Tier 0/1/2 handlers subscribed in manifest.
- **Ordering** — explicit priority when multiple plugins subscribe.
- **Failure policy** — fail-open vs fail-closed (security hooks should fail closed).

## Control-plane hook catalog (generic)

| Domain | Example hooks | Notes |
| --- | --- | --- |
| Sites / vhosts | `site.before_create`, `site.after_enable`, `site.config_changed` | Often triggers nginx regen |
| TLS | `ssl.before_issue`, `ssl.after_renew`, `ssl.on_failure` | ACME + DNS integrations |
| Reverse proxy | `nginx.before_reload`, `nginx.after_reload` | Roll back on reload failure |
| Jobs / tasks | `job.before_run`, `job.after_run`, `job.on_failure` | Stream logs via SSE separately |
| Cron | `cron.before_trigger` | Lightweight; avoid long work |
| Containers | `container.before_action` | start/stop/restart guardrails |
| Auth | `auth.after_login` | Audit webhooks only by default |
| Observability | `event.ingest` | Fan-out to SIEM/Grafana |

## When to use

- Multiple teams or vendors need the same lifecycle point with different behavior.
- Core should stay small; integrations vary per installation.
- You are building toward a **plugin manifest** and catalog.

## When not to use

- One-off internal scripts—call a package or function directly.
- Hooks on every HTTP request without a gateway’s performance budget.
- “Run arbitrary shell” hooks without sandboxing—that is a job runner, not a hook.

## Implementation guide

1. **List domains** in your monolith (website, ssl, nginx, jobs).
2. **Emit events** from service layer after validation, before irreversible side effects.
3. **Start with webhooks** (Tier 0); add process plugins when payloads need privileged APIs.
4. **Document rollback**: if `nginx.after_reload` fails, core should revert state (pattern used in hosting panels).
5. **Version hook payloads** (`v1`, `v2`) when fields change.

## Trade-offs

| Pattern | Pros | Cons |
| --- | --- | --- |
| In-process event bus | Low latency, easy debugging | Untrusted code must not subscribe directly |
| Outbound webhook | Language-agnostic | Retries, idempotency, network failures |
| Sync hooks | Simple consistency | Blocks user operations if plugin slow |
| Async queue | Resilient | Harder UX for “did plugin run?” |

## Examples

**KrakenD pipes:** Router (HTTP in), Proxy (backend logic), Transport (client to upstream)—each maps to plugin types (`server`, `req/resp`, `client`). Concept applies to hosting: edge (HTTP) vs orchestration (deploy) vs infrastructure client (docker API).

**GoSite-oriented mapping (research):** `service/website` enables sites and calls `nginx.Reload`; `infra/job/worker` runs queued commands with SSE—natural `site.*` and `job.*` hook families.

Manifest subscription example:

```yaml
hooks:
  - ssl.after_renew
  - job.on_failure
permissions:
  - webhook.only
```

## Links

- [Plugin architecture](../../architecture/patterns/plugin-architecture_en.md)
- [Go plugin runtimes](../../../technologies/infrastructure/go-plugin-runtimes_en.md)
- [Event-driven architecture](../../architecture/styles/event-driven-architecture_en.md)
