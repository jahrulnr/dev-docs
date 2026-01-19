# Centralized Logging
## Gambaran Umum

Centralized Logging mengumpulkan log dari layanan ke sistem pusat (mis., ELK, Loki) untuk pencarian, analisis, dan alerting. Ini memungkinkan troubleshooting yang efisien dan pemantauan sistem terdistribusi.

## Kapan digunakan
Gunakan untuk menyederhanakan troubleshooting, mengkorelasikan kejadian antar layanan, dan mendukung penanganan insiden.

## Contoh
Kirim log terstruktur ke Elasticsearch dan visualisasikan di Kibana.

## Kelebihan / Kekurangan
- Kelebihan: Debugging lebih mudah, pencarian terpusat, retensi dan alerting.
- Kekurangan: Biaya penyimpanan, perlu kebijakan manajemen log.

## Referensi
- ELK stack, dokumentasi Loki.