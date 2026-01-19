# Health Check
## Gambaran Umum

Health check menyediakan endpoint sederhana yang menunjukkan kesehatan layanan (liveness/readiness) yang digunakan oleh orchestrator dan sistem monitoring. Ini memungkinkan deteksi dini masalah dan pemulihan otomatis.

## Kapan digunakan
Gunakan untuk monitoring, orkestrasi (mis., readiness dan liveness probe di Kubernetes), dan otomatisasi failover.

## Contoh
`/healthz` mengembalikan 200 OK jika dependensi dapat dijangkau; `/ready` mengembalikan 200 saat layanan siap sepenuhnya.

## Kelebihan / Kekurangan
- Kelebihan: Memungkinkan pemulihan dan alerting otomatis.
- Kekurangan: Health check harus ringan dan tidak menambah beban; risiko false positive/negative.

## Referensi
- Dokumentasi probes Kubernetes.