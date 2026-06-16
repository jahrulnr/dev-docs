# Extensibility Hooks

## Overview

**Extensibility hooks** adalah named point dalam application lifecycle di mana core logic memanggil registered extension — plugin, webhook, atau script — tanpa hard-code setiap integrasi. Gateway menyebutnya **pipe** (router, proxy, transport); control plane menyebutnya **event** (before deploy, after SSL renew).

Hook design harus jelas: **kapan** fire, **payload** apa yang dikirim, handler **sync atau async**, **timeout/rollback** behavior, dan **permission** requirement.

## Key components

- **Hook name** — stable contract (`nginx.before_reload`, `ssl.after_renew`).
- **Payload** — structured context (site ID, paths, job output); jangan leak secrets by default.
- **Dispatcher** — route ke Tier 0/1/2 handler yang subscribe di manifest.
- **Ordering** — explicit priority jika banyak plugin subscribe.
- **Failure policy** — fail-open vs fail-closed (security hook sebaiknya fail closed).

## Katalog hook control-plane (umum)

| Domain | Example hooks | Notes |
| --- | --- | --- |
| Sites / vhosts | `site.before_create`, `site.after_enable`, `site.config_changed` | Sering trigger nginx regen |
| TLS | `ssl.before_issue`, `ssl.after_renew`, `ssl.on_failure` | ACME + DNS integration |
| Reverse proxy | `nginx.before_reload`, `nginx.after_reload` | Rollback jika reload gagal |
| Jobs / tasks | `job.before_run`, `job.after_run`, `job.on_failure` | Log stream via SSE terpisah |
| Cron | `cron.before_trigger` | Lightweight; hindari long-running work |
| Containers | `container.before_action` | Guardrail start/stop/restart |
| Auth | `auth.after_login` | Default: audit webhook only |
| Observability | `event.ingest` | Fan-out ke SIEM/Grafana |

## When to use

- Banyak tim atau vendor butuh lifecycle point yang sama dengan behavior berbeda.
- Core harus tetap kecil; integrasi bervariasi per instalasi.
- Membangun menuju **plugin manifest** dan catalog.

## When not to use

- One-off internal script — call package atau function langsung.
- Hook di setiap HTTP request tanpa performance budget gateway.
- Hook “run arbitrary shell” tanpa sandbox — itu job runner, bukan hook.

## Implementation guide

1. **List domains** di monolith Anda (website, ssl, nginx, jobs).
2. **Emit event** dari service layer setelah validasi, sebelum irreversible side effect.
3. **Mulai dengan webhook** (Tier 0); tambah process plugin saat payload butuh privileged API.
4. **Dokumentasikan rollback**: jika `nginx.after_reload` gagal, core harus revert state (pola hosting panel).
5. **Version hook payload** (`v1`, `v2`) saat field berubah.

## Trade-offs

| Pattern | Pros | Cons |
| --- | --- | --- |
| In-process event bus | Low latency, debugging mudah | Untrusted code tidak boleh subscribe langsung |
| Outbound webhook | Language-agnostic | Retry, idempotency, network failure |
| Sync hooks | Consistency sederhana | Block user operation jika plugin lambat |
| Async queue | Resilient | UX lebih sulit untuk “apakah plugin sudah jalan?” |

## Examples

**KrakenD pipes:** Router (HTTP in), Proxy (backend logic), Transport (client ke upstream) — masing-masing map ke plugin type (`server`, `req/resp`, `client`). Konsep sama untuk hosting: edge (HTTP) vs orchestration (deploy) vs infra client (docker API).

**GoSite mapping (riset):** `service/website` enable site dan call `nginx.Reload`; `infra/job/worker` run queued command dengan SSE — natural hook family `site.*` dan `job.*`.

Contoh manifest subscription:

```yaml
hooks:
  - ssl.after_renew
  - job.on_failure
permissions:
  - webhook.only
```

## Links

- [Arsitektur plugin](../../architecture/patterns/plugin-architecture_id.md)
- [Go plugin runtimes](../../../technologies/infrastructure/go-plugin-runtimes_id.md)
- [Event-driven architecture](../../architecture/styles/event-driven-architecture_id.md)
