# Distributed Tracing
## Gambaran Umum

Distributed Tracing menangkap alur permintaan end-to-end di microservices untuk mengukur latensi dan mengidentifikasi titik kemacetan performa. Ini memberikan visibilitas ke dalam sistem terdistribusi untuk debugging dan optimasi.

## Kapan digunakan
Gunakan pada sistem microservices atau terdistribusi dimana pemahaman latensi dan alur permintaan penting.

## Contoh
Instrumentasikan layanan dengan OpenTelemetry untuk menghasilkan trace yang divisualisasikan di Jaeger atau Zipkin.

## Kelebihan / Kekurangan
- Kelebihan: Visibilitas mendalam terhadap alur permintaan dan hotspot performa.
- Kekurangan: Overhead instrumentasi dan biaya penyimpanan/pemrosesan.

## Referensi
- OpenTelemetry, dokumentasi Jaeger.