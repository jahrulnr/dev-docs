# Go Plugin Runtimes

## Overview

Go offers several ways to extend a running application. They differ sharply in **isolation**, **upgrade safety**, and **who can author plugins**. Choosing a runtime is an architecture decision—not a library pick.

This doc compares the main options used in production control planes and gateways. Verify upstream version notes before shipping; KrakenD CE plugin support changes in v3.0 are a recent example of runtime strategy shifting.

## Key components

### Standard library `plugin` (`.so`)

- Build: `go build -buildmode=plugin`
- Load: `plugin.Open(path)` then `Lookup` symbols
- Runs **in-process** with the host

Official documentation (`pkg.go.dev/plugin`) warns: limited OS support (Linux, FreeBSD, macOS), poor race-detector support, crashes unless host and plugins share **exact** toolchain, tags, and dependency versions.

### HashiCorp go-plugin

- Subprocess launched by host; communication via **net/rpc** or **gRPC** over local socket
- Plugin implements Go interfaces; host uses them as if in-process
- Features: crash isolation, logging bridge, protocol versioning, optional TLS, reattach for host upgrades

Used by Terraform, Vault, Nomad, Packer, Boundary, Waypoint. README states dynamic `.so` loading is unacceptable for Vault’s threat model.

### WebAssembly (Extism, Traefik wasm)

- Guest module with host-defined imports (capabilities)
- Traefik: manifest `runtime: wasm` with optional `envs`, `mounts`, `useUnsafe`
- Extism: framework explicitly for **untrusted** plugin code across languages

### Yaegi (interpreted Go)

- Traefik loads Go source via Yaegi interpreter for middleware/providers
- Faster iteration than compile; `useUnsafe` increases risk—avoid for untrusted authors

## When to use

| Runtime | Use when |
| --- | --- |
| Webhook / HTTP | Integration-only, any language, lowest privilege |
| go-plugin | Privileged Go extensions, vendor-signed binaries, Terraform-style providers |
| Wasm | Community plugins, need sandbox without full subprocess per call |
| Yaegi | Curated dynamic Go middleware (gateway-style), controlled source |
| stdlib `plugin` | You own entire build+deploy pipeline and need in-process speed |

## When not to use

| Runtime | Avoid when |
| --- | --- |
| stdlib `plugin` | Community marketplace, mixed OS/arch, frequent Go upgrades |
| go-plugin | Untrusted authors without binary signing and review |
| Wasm | Simple static integrations (overkill) |
| Yaegi | Untrusted code with unsafe/syscall enabled |

## Implementation guide

1. **Define interfaces** before runtime—what the host exposes and what plugins may call.
2. **Prefer go-plugin** for Go control planes that touch docker, nginx, or filesystem.
3. **Never expose docker socket** to Wasm or webhooks without a narrow API facade.
4. **Pin and verify** plugin artifacts (checksum, signature) on install.
5. **Version protocols** separately from SemVer (go-plugin protocol version pattern).

## Trade-offs

| Runtime | Pros | Cons |
| --- | --- | --- |
| stdlib `plugin` | Lowest call overhead | ABI lock, portability, security blast radius |
| go-plugin | Isolation, mature ops story | Process overhead, RPC boilerplate |
| Wasm | Sandbox, multi-language guests | Host API design, tooling |
| Yaegi | No separate compile for guests | Performance, security if unsafe enabled |
| HTTP | Simplest | No synchronous in-process hooks without network |

## Examples

Minimal stdlib load (illustrative only—prefer go-plugin for extensible products):

```go
p, err := plugin.Open("myplugin.so")
if err != nil { /* handle */ }
sym, err := p.Lookup("F")
```

go-plugin shape: host calls `plugin.Client`, plugin `main` calls `plugin.Serve` with `GRPCPlugin` implementation (see hashicorp/go-plugin examples).

## Links

- [Plugin architecture](../../best-practices/architecture/patterns/plugin-architecture_en.md)
- [Extensibility hooks](../../best-practices/patterns/integration/extensibility-hooks_en.md)
- [Go plugin package](https://pkg.go.dev/plugin)
- [HashiCorp go-plugin](https://github.com/hashicorp/go-plugin)
- [Extism](https://github.com/extism/extism)
- [Traefik plugins package](https://github.com/traefik/traefik/tree/master/pkg/plugins)
