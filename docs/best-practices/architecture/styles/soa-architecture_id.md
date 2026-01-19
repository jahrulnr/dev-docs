# Arsitektur Berorientasi Layanan (SOA)

## Gambaran Umum

Arsitektur Berorientasi Layanan (SOA) adalah gaya arsitektur yang menyusun aplikasi sebagai kumpulan layanan yang loosely coupled yang berkomunikasi melalui antarmuka standar. Layanan adalah fungsionalitas bisnis yang dapat digunakan kembali dan dapat diorkestrasi untuk membentuk aplikasi kompleks. SOA menekankan interoperabilitas, reusability, dan integrasi perusahaan, dan banyak diadopsi di organisasi besar sebelum munculnya microservices.

## Karakteristik Utama

- **Loose Coupling**: Layanan independen dan dapat dimodifikasi tanpa memengaruhi yang lain.
- **Antarmuka Standar**: Komunikasi melalui protokol seperti SOAP, REST, atau standar pesan.
- **Registry dan Discovery Layanan**: Repositori pusat untuk menemukan dan memanggil layanan.
- **Orkestrasi melalui ESB**: Enterprise Service Bus bertindak sebagai mediator untuk routing dan transformasi pesan.

## Kapan Digunakan

- Sistem perusahaan besar yang memerlukan integrasi di seluruh departemen atau sistem legacy.
- Aplikasi yang membutuhkan reusability tinggi dari logika bisnis.
- Skenario dengan teknologi dan platform heterogen.
- Hindari untuk tim kecil, agile di mana microservices menawarkan fleksibilitas yang lebih baik tanpa governance berat.

## Keuntungan

- Interoperabilitas yang ditingkatkan antara sistem yang berbeda.
- Reusability layanan di seluruh aplikasi.
- Pemeliharaan dan skalabilitas layanan individu lebih mudah.
- Mendukung modernisasi bertahap sistem legacy.

## Kekurangan

- Kompleksitas tinggi dalam governance, keamanan, dan manajemen layanan.
- Overhead performa karena komunikasi berbasis pesan.
- Memerlukan perencanaan awal dan infrastruktur yang signifikan (misalnya, ESB).
- Dapat menyebabkan tight coupling jika tidak diimplementasikan dengan hati-hati.

## Contoh

Sistem perbankan di mana layanan untuk manajemen akun, pemrosesan transaksi, dan pelaporan diekspos melalui antarmuka standar dan diorkestrasi melalui ESB.

## Pola Terkait

- API Gateway untuk implementasi SOA modern.
- Arsitektur Event-Driven untuk komunikasi asinkron.
- Kontras dengan Microservices untuk granularitas yang lebih halus.

## Referensi

- Model Referensi SOA OASIS.
- "Service-Oriented Architecture" oleh Thomas Erl.