# Health Check

## Overview

**Health check** adalah probe kecil dan terdefinisi yang melaporkan apakah instance service aman menerima traffic atau masih hidup cukup untuk di-restart. Orchestrator (Kubernetes, Docker Swarm, cloud load balancer) dan sistem monitoring mem-poll endpoint atau perintah ini untuk mengotomasi routing, scaling, dan recovery.

Pattern ini memisahkan **liveness** (“apakah proses macet?”) dari **readiness** (“bisakah instance ini melayani request sekarang?”). Menggabungkan keduanya menyebabkan flapping: service yang masih startup di-kill karena gagal liveness, atau instance degraded tetap menerima traffic karena liveness saja mengembalikan OK.

Health check adalah handshake operasional antara application code dan platform infrastructure. Harus murah, idempotent, dan jujur—memeriksa dependency nyata hanya saat readiness membutuhkannya, bukan di setiap tick liveness.

## How it works

| Probe type | Question | Typical action if fail |
| --- | --- | --- |
| **Liveness** | Apakah proses deadlock atau rusak tanpa self-heal? | Restart container/pod |
| **Readiness** | Bisakah kita route user traffic ke sini? | Hapus dari load balancer |
| **Startup** | Apakah inisialisasi lambat selesai? | Tunda liveness sampai pass (K8s 1.16+) |

1. **Expose endpoint** — Path umum: `/healthz`, `/live`, `/ready`. Kembalikan HTTP 200 saat sehat, 503 saat tidak.
2. **Periksa dependency selektif** — Readiness bisa verifikasi TCP database, ping cache, atau versi migrasi; liveness hindari panggilan eksternal berat.
3. **Platform poll** — kubelet, swarm manager, atau ALB mengakses endpoint pada interval dengan timeout dan failure threshold.
4. **Integrasi metrics** — Lacak kegagalan probe dan latency dependency check di **Prometheus** untuk alerting sebelum user menyadari.

```text
Load balancer ──> readiness OK? ──> route traffic
       │
kubelet ──> liveness OK? ──> else restart pod
```

**Graceful shutdown**: tandai readiness gagal sebelum drain koneksi agar in-flight request selesai. **Deep check** (graf dependency penuh) cocok di admin tool atau synthetic monitoring, bukan readiness probe sub-detik.

## When to use

- Service di belakang load balancer atau service mesh yang harus berhenti mengirim traffic ke instance buruk.
- Container orchestration di mana restart otomatis menggantikan intervensi manual.
- Sinyal autoscaling dikombinasikan dengan **metrics** (CPU saja tidak cukup untuk “siap melayani”).
- Startup multi-langkah (migrasi, cache warm-up) di mana traffic harus menunggu sampai selesai.

## When not to use

- Proses development lokal tanpa orchestrator—`curl` manual cukup.
- Menggunakan health endpoint untuk integration test berat atau batch work—harus tetap ringan.
- Mengekspos detail dependency dalam tanpa autentikasi di URL publik (risiko information disclosure).
- Mengganti synthetic monitoring atau **distributed tracing** untuk validasi user journey.

## Trade-offs

| Design | Pros | Cons |
| --- | --- | --- |
| Live/ready terpisah | Semantik orchestration benar | Dua endpoint untuk dirawat |
| Satu `/health` | Sederhana | Orchestrator tidak bedakan stuck vs warming |
| DB check di readiness | Routing akurat | Thundering herd ke DB jika setiap pod poll agresif |
| Exec probe (script) | Bekerja tanpa HTTP server | Sulit ditest; bug script restart pod |

## Example

Deployment Kubernetes dengan probe terpisah:

```yaml
livenessProbe:
  httpGet: { path: /live, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
```

`/ready` mengembalikan 503 sampai migrasi selesai dan pool DB terhubung; `/live` hanya memverifikasi HTTP server merespons.

## Related

- [Metrics collection](metrics-collection_id.md)
- [Timeout](../reliability/timeout_id.md)
- [Microservices architecture](../../architecture/styles/microservices-architecture_id.md)
- [Prometheus](../../../technologies/infrastructure/prometheus_id.md)

## References

- [Kubernetes: configure liveness, readiness, and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Google SRE: monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/) — health vs alerting berbasis gejala.
