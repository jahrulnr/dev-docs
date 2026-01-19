# Metrics Collection
## Gambaran Umum

Metrics Collection mengumpulkan pengukuran kuantitatif (latensi, rate error, throughput) untuk memantau performa dan kesehatan sistem. Ini memberikan wawasan numerik untuk memahami perilaku sistem dan mendeteksi masalah.

## Kapan digunakan
Gunakan untuk melacak SLO, mendeteksi regresi, dan mendukung alerting serta capacity planning.

## Contoh
Expose metrik Prometheus: `http_requests_total`, `request_latency_seconds`, `error_rate`.

## Kelebihan / Kekurangan
- Kelebihan: Observability objektif, mendukung SLO dan alerting.
- Kekurangan: Memerlukan konsistensi penamaan metrik dan perencanaan penyimpanan/retensi.

## Referensi
- Praktik terbaik Prometheus.