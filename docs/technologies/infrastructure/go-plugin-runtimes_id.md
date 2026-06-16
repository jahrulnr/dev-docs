# Go Plugin Runtimes

## Overview

Go punya beberapa cara memperluas running application. Masing-masing berbeda dalam **isolation**, **upgrade safety**, dan **siapa yang boleh menulis plugin**. Memilih runtime adalah keputusan arsitektur — bukan sekadar memilih library.

Dokumen ini membandingkan opsi utama di production control plane dan gateway. Verifikasi catatan versi upstream sebelum ship; perubahan KrakenD CE plugin support di v3.0 adalah contoh strategi runtime yang bergeser.

## Key components

### Standard library `plugin` (`.so`)

- Build: `go build -buildmode=plugin`
- Load: `plugin.Open(path)` lalu `Lookup` symbols
- Berjalan **in-process** dengan host

Dokumentasi resmi (`pkg.go.dev/plugin`) memperingatkan: OS support terbatas (Linux, FreeBSD, macOS), race detector support buruk, crash kecuali host dan plugin share **exact** toolchain version, build tags, dan dependency versions.

### HashiCorp go-plugin

- Host spawn subprocess; komunikasi via **net/rpc** atau **gRPC** over local socket
- Plugin implement Go interface; host memakainya seolah in-process
- Fitur: crash isolation, logging bridge, protocol versioning, optional TLS, reattach untuk host upgrade

Dipakai Terraform, Vault, Nomad, Packer, Boundary, Waypoint. README menyatakan dynamic `.so` loading tidak acceptable untuk threat model Vault.

### WebAssembly (Extism, Traefik wasm)

- Guest module dengan host-defined imports (capabilities)
- Traefik: manifest `runtime: wasm` dengan optional `envs`, `mounts`, `useUnsafe`
- Extism: framework untuk **untrusted** plugin code lintas bahasa

### Yaegi (interpreted Go)

- Traefik load Go source via Yaegi interpreter untuk middleware/provider
- Iterasi lebih cepat daripada compile; `useUnsafe` naikkan risk — hindari untuk untrusted author

## When to use

| Runtime | Pakai ketika |
| --- | --- |
| Webhook / HTTP | Integration-only, any language, least privilege |
| go-plugin | Privileged Go extension, vendor-signed binary, Terraform-style provider |
| Wasm | Community plugin, butuh sandbox tanpa full subprocess per call |
| Yaegi | Curated dynamic Go middleware (gateway-style), controlled source |
| stdlib `plugin` | Anda own seluruh build+deploy pipeline dan butuh in-process speed |

## When not to use

| Runtime | Hindari ketika |
| --- | --- |
| stdlib `plugin` | Community marketplace, mixed OS/arch, frequent Go upgrade |
| go-plugin | Untrusted author tanpa binary signing dan review |
| Wasm | Integrasi statis sederhana (overkill) |
| Yaegi | Untrusted code dengan unsafe/syscall enabled |

## Implementation guide

1. **Define interfaces** sebelum runtime — apa yang host expose dan apa yang plugin boleh call.
2. **Prefer go-plugin** untuk Go control plane yang touch docker, nginx, atau filesystem.
3. **Jangan expose docker socket** ke Wasm atau webhook tanpa narrow API facade.
4. **Pin dan verify** plugin artifact (checksum, signature) saat install.
5. **Version protocol** terpisah dari SemVer (pola protocol version go-plugin).

## Trade-offs

| Runtime | Pros | Cons |
| --- | --- | --- |
| stdlib `plugin` | Lowest call overhead | ABI lock, portability, security blast radius |
| go-plugin | Isolation, mature ops story | Process overhead, RPC boilerplate |
| Wasm | Sandbox, multi-language guest | Host API design, tooling |
| Yaegi | Tanpa separate compile untuk guest | Performance, security jika unsafe enabled |
| HTTP | Paling sederhana | Tanpa synchronous in-process hook tanpa network |

## Examples

Minimal stdlib load (ilustrasi — prefer go-plugin untuk extensible product):

```go
p, err := plugin.Open("myplugin.so")
if err != nil { /* handle */ }
sym, err := p.Lookup("F")
```

go-plugin shape: host call `plugin.Client`, plugin `main` call `plugin.Serve` dengan `GRPCPlugin` implementation (lihat contoh hashicorp/go-plugin).

## Links

- [Arsitektur plugin](../../best-practices/architecture/patterns/plugin-architecture_id.md)
- [Extensibility hooks](../../best-practices/patterns/integration/extensibility-hooks_id.md)
- [Go plugin package](https://pkg.go.dev/plugin)
- [HashiCorp go-plugin](https://github.com/hashicorp/go-plugin)
- [Extism](https://github.com/extism/extism)
- [Traefik plugins package](https://github.com/traefik/traefik/tree/master/pkg/plugins)
