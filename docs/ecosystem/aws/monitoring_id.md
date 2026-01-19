# Monitoring & Logging

## Amazon CloudWatch

Amazon CloudWatch adalah layanan monitoring dan observabilitas yang menyediakan data dan wawasan yang dapat ditindaklanjuti untuk memantau aplikasi dan infrastruktur.

## Kasus Penggunaan Umum
- Monitoring infrastruktur dan alerting
- Monitoring performa aplikasi
- Agregasi dan analisis log
- Auto-scaling berdasarkan metrik

## Praktik Terbaik
- Siapkan dashboard yang komprehensif
- Konfigurasikan alarm dan threshold yang sesuai
- Gunakan CloudWatch Logs untuk logging terpusat
- Implementasikan metrik kustom untuk KPI bisnis

## AWS CloudTrail

AWS CloudTrail memungkinkan governance, kepatuhan, audit operasional, dan audit risiko dari akun AWS Anda dengan mencatat panggilan API dan event terkait.

## Kasus Penggunaan Umum
- Analisis keamanan dan audit kepatuhan
- Troubleshooting operasional
- Pelacakan perubahan dan forensik
- Pelaporan kepatuhan regulasi

## Praktik Terbaik
- Aktifkan CloudTrail di semua region
- Gunakan CloudTrail Insights untuk deteksi anomali
- Konfigurasikan validasi integritas file log
- Integrasikan dengan CloudWatch Logs untuk monitoring

## AWS Config

AWS Config adalah layanan yang memungkinkan audit kepatuhan, analisis keamanan, dan pelacakan sumber daya dengan merekam perubahan konfigurasi sumber daya AWS.

## Kasus Penggunaan Umum
- Monitoring dan pelaporan kepatuhan
- Penilaian postur keamanan
- Manajemen perubahan dan audit
- Pemetaan dependensi sumber daya

## Praktik Terbaik
- Aktifkan aturan AWS Config untuk kepatuhan otomatis
- Gunakan Config aggregators untuk tampilan multi-akun
- Konfigurasikan periode retensi yang sesuai
- Integrasikan dengan AWS Systems Manager untuk remediasi

## AWS Personal Health Dashboard

AWS Personal Health Dashboard memberikan alert dan panduan remediasi ketika AWS mengalami event yang mungkin memengaruhi Anda.

## Kasus Penggunaan Umum
- Notifikasi masalah proaktif
- Kesadaran maintenance terjadwal
- Alert degradasi layanan
- Pelacakan event spesifik akun

## Praktik Terbaik
- Konfigurasikan notifikasi email dan SMS
- Siapkan CloudWatch Events untuk otomasi
- Tinjau dashboard secara teratur untuk event mendatang
- Gunakan Health API untuk akses programatik