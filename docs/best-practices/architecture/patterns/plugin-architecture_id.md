# Arsitektur Plugin

## Overview

**Plugin architecture** memungkinkan host application memperluas behavior tanpa rebuild core untuk setiap integrasi. Control plane (hosting panel, API gateway, observability stack) memakai plugin untuk custom deploy step, auth provider, middleware, dan third-party connector.

Tidak ada satu plugin runtime yang cocok untuk semua kasus. Sistem produksi menggabungkan **tier** berdasarkan trust dan privilege: integrasi HTTP untuk risiko rendah, **subprocess RPC** untuk privileged ops, **WebAssembly** untuk untrusted community code, dan **native in-process module** hanya jika dikurasi dan toolchain-nya terkunci.

Per 2026, industri bergerak menjauh dari distribusi Go `.so` plugin ke basis pengguna OSS yang heterogen (KrakenD Community Edition menghapusnya di v3.0). Desain baru sebaiknya memilih process isolation atau Wasm, bukan dynamic in-process loading untuk marketplace.

## Key components

- **Host** — core application (mis. GoSite) mengelola lifecycle, config, dan permission grant.
- **Plugin manifest** — name, version, tier, hooks, permissions, checksum.
- **Hook / pipe** — named point dalam lifecycle (deploy, nginx reload, SSL renew).
- **Runtime** — cara plugin code dijalankan: webhook, subprocess gRPC, Wasm, atau native `.so`.
- **Catalog** — template atau signed binary (belum tentu in-process code).

## Model bertingkat (disarankan)

| Tier | Runtime | Trust | Typical use |
| --- | --- | --- | --- |
| 0 | HTTP / webhook | Untrusted + auth | Notifikasi, external DNS, AI router |
| 1 | Subprocess RPC (mis. HashiCorp go-plugin) | Signed vendor | Integrasi docker/nginx/deploy |
| 2 | WebAssembly | Sandboxed community | Validator, transformer |
| 3 | Go `plugin` native `.so` | Curated only | Jarang; ABI cost tinggi |

## When to use

- Butuh behavior **third-party atau per-tim** tanpa fork core.
- Tiap instalasi butuh integrasi berbeda (SSL DNS, deploy target, observability).
- Ingin **marketplace** atau template catalog seiring waktu.
- Privileged ops (container, reverse proxy) harus **terisolasi** dari untrusted code.

## When not to use

- Beberapa integrasi statis yang jarang berubah — pakai package atau config biasa.
- **Ultra-low-latency hot path** tanpa toleransi subprocess overhead (ukur dulu; sering masih OK).
- **Community Go `.so` marketplace** tanpa menguasai build pipeline di kedua sisi.
- Mengganti cron script sederhana dengan full plugin framework di hari pertama.

## Implementation guide

1. **Inventaris hooks** di domain Anda (site create, SSL renew, job run, nginx reload).
2. **Mulai Tier 0** — outbound webhook dengan signed payload dan timeout.
3. **Definisikan manifest** — tier, permissions, hook subscription, version.
4. **Tambah Tier 1** — subprocess plugin dengan narrow RPC interface dan checksum verify saat install.
5. **Tambah Tier 2** — Wasm hanya jika butuh untrusted author; rancang host function dengan hati-hati.
6. **Tunda Tier 3** — kecuali Anda mengontrol build host dan plugin dalam satu release train.

## Trade-offs

| Approach | Pros | Cons |
| --- | --- | --- |
| Webhook (Tier 0) | Language-agnostic, ops mudah | Network latency, retry, loose coupling |
| go-plugin (Tier 1) | Crash isolation, Go-native, proven di Terraform/Vault | Subprocess overhead, interface design cost |
| Wasm (Tier 2) | Sandbox, portable bytecode | Host SDK design, debugging lebih sulit |
| Go stdlib `plugin` (Tier 3) | In-process speed | ABI lock, portability buruk, security blast radius |
| Template catalog (panel) | Tanpa code execution di host | Bukan arbitrary logic — hanya compose/stack |

## Examples

**KrakenD (pelajaran):** Dulu memakai Go `.so` plugin dengan strict Go/arch/libc matching; CE menghapus plugin support di v3.0 karena OSS build pipeline divergen. Pengguna OSS compile custom binary atau pakai Lua.

**HashiCorp stack:** Terraform, Vault, dan Nomad memakai **go-plugin** (subprocess gRPC), secara eksplisit memilih ini daripada stdlib `plugin` untuk stability dan security.

**Homelab panel:** Coolify dan Portainer memperluas lewat **service/app template** (compose catalog), bukan user-supplied host binary — pola produk “plugin” yang valid tanpa in-process code.

## Links

- [Go plugin runtimes](../../../technologies/infrastructure/go-plugin-runtimes_id.md)
- [Extensibility hooks](../../patterns/integration/extensibility-hooks_id.md)
- [Event-driven architecture](../styles/event-driven-architecture_id.md)
- [HashiCorp go-plugin](https://github.com/hashicorp/go-plugin)
- [KrakenD: dropping plugin support in CE](https://www.krakend.io/blog/dropping-plugins-support-on-community/)
