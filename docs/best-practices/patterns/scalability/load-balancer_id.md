# Load Balancer
## Gambaran Umum

Load Balancer adalah komponen yang mendistribusikan trafik jaringan masuk ke beberapa server untuk meningkatkan ketersediaan dan skalabilitas. Komponen ini sangat penting untuk men-skalakan layanan secara horizontal, mendistribusikan beban, dan menyediakan high availability.

## Kapan digunakan
Gunakan untuk men-skalakan layanan secara horizontal, mendistribusikan beban, dan menyediakan high availability.

## Contoh
Gunakan L4/L7 load balancer (NGINX, AWS ALB) untuk merutekan permintaan ke instance layanan dan melakukan health check.

## Kelebihan / Kekurangan
- Kelebihan: Skalabilitas dan toleransi kesalahan meningkat, kontrol trafik terpusat.
- Kekurangan: Titik konfigurasi tunggal; kesalahan konfigurasi dapat memengaruhi ketersediaan.

## Referensi
- Dokumentasi vendor load balancer.