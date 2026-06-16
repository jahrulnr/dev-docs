# Plugin Architecture

## Overview

A **plugin architecture** lets a host application extend behavior without rebuilding the core for every integration. Control planes (hosting panels, API gateways, observability stacks) use plugins for custom deploy steps, auth providers, middleware, and third-party connectors.

There is no single “best” plugin runtime. Production systems combine **tiers** by trust and privilege: HTTP integrations for low-risk work, **subprocess RPC** for privileged ops, **WebAssembly** for untrusted community code, and **in-process native modules** only when curated and toolchain-locked.

As of 2026, the industry is moving **away** from distributing Go `.so` plugins to heterogeneous OSS users (KrakenD Community Edition drops them in v3.0). New designs should prefer process isolation or Wasm over in-process dynamic loading for marketplaces.

## Key components

- **Host** — core application (e.g. GoSite) owns lifecycle, config, and permission grants.
- **Plugin manifest** — name, version, tier, hooks, permissions, checksum.
- **Hook / pipe** — named points in a request or lifecycle (deploy, nginx reload, SSL renew).
- **Runtime** — how plugin code runs: webhook, subprocess gRPC, Wasm, or native `.so`.
- **Catalog** — templates or signed binaries (not necessarily in-process code).

## Tiered model (recommended)

| Tier | Runtime | Trust | Typical use |
| --- | --- | --- | --- |
| 0 | HTTP / webhook | Untrusted with auth | Notifications, external DNS, AI routers |
| 1 | Subprocess RPC (e.g. HashiCorp go-plugin) | Signed vendors | docker/nginx/deploy integrations |
| 2 | WebAssembly | Sandboxed community | Validators, transformers |
| 3 | Native Go `plugin` `.so` | Curated only | Rare; high ABI cost |

## When to use

- You need **third-party or team-specific** behavior without forking the core.
- Different customers need different integrations (SSL DNS, deploy targets, observability).
- You want a **marketplace** or template catalog over time.
- Privileged operations (containers, reverse proxy) must stay **isolated** from untrusted code.

## When not to use

- A few static integrations that rarely change — use ordinary packages or config instead.
- Ultra-low-latency hot paths where subprocess overhead is unacceptable (measure first; often still fine).
- Community **Go `.so` marketplaces** without owning the entire build pipeline on both sides.
- Replacing a simple cron script with a full plugin framework on day one.

## Implementation guide

1. **Inventory hooks** in your domain (site create, ssl renew, job run, nginx reload).
2. **Start Tier 0** — outbound webhooks with signed payloads and timeouts.
3. **Define manifests** — tier, permissions, hook subscriptions, version.
4. **Add Tier 1** — subprocess plugins with narrow RPC interfaces and checksum verify on install.
5. **Add Tier 2** — Wasm only when you need untrusted authors; design host functions carefully.
6. **Defer Tier 3** — unless you control host and plugin builds in one release train.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Webhook (Tier 0) | Language-agnostic, easy ops | Network latency, retries, no tight coupling |
| go-plugin (Tier 1) | Crash isolation, Go-native, proven in Terraform/Vault | Subprocess overhead, interface design cost |
| Wasm (Tier 2) | Sandbox, portable bytecode | Host SDK design, debugging harder |
| Go stdlib `plugin` (Tier 3) | In-process speed | ABI lock, poor portability, security blast radius |
| Template catalog (panels) | No code execution in host | Not arbitrary logic — compose/stacks only |

## Examples

**KrakenD (lesson):** Historically used Go `.so` plugins with strict Go/arch/libc matching; CE removes plugin support in v3.0 because OSS build pipelines diverge. OSS users compile custom binaries or use Lua.

**HashiCorp stack:** Terraform, Vault, and Nomad use **go-plugin** (subprocess gRPC), explicitly preferring it over stdlib `plugin` for stability and security.

**Homelab panels:** Coolify and Portainer extend via **service/app templates** (compose catalogs), not user-supplied host binaries — a valid “plugin” product pattern without in-process code.

## Links

- [Go plugin runtimes](../../../technologies/infrastructure/go-plugin-runtimes_en.md)
- [Extensibility hooks](../../patterns/integration/extensibility-hooks_en.md)
- [Event-driven architecture](../styles/event-driven-architecture_en.md)
- [HashiCorp go-plugin](https://github.com/hashicorp/go-plugin)
- [KrakenD: dropping plugin support in CE](https://www.krakend.io/blog/dropping-plugins-support-on-community/)
