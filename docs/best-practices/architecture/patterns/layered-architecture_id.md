# Arsitektur Berlapis (Layered Architecture)

## Gambaran Umum

Layered Architecture (juga dikenal sebagai multitier atau n-tier) mengorganisir aplikasi ke dalam lapisan horizontal, masing-masing dengan tanggung jawab spesifik dan berkomunikasi hanya dengan lapisan yang berdekatan. Ini menciptakan pemisahan kepentingan yang jelas, membuat sistem modular dan lebih mudah dipelihara.

Manfaat termasuk pemisahan kepentingan, pemeliharaan, kemampuan pengujian, skalabilitas, dan reusabilitas. Lapisan dapat diperbarui atau diuji secara independen, dan lapisan bawah dapat digunakan kembali di berbagai presentasi.

## Komponen Utama

- **Lapisan Presentasi**: Menangani antarmuka pengguna dan interaksi (misalnya, halaman web, API, aplikasi mobile). Ini menampilkan data dan menangkap input pengguna.
- **Lapisan Aplikasi/Layanan**: Berisi alur kerja logika bisnis, mengorkestrasi operasi, dan bertindak sebagai jembatan antara presentasi dan lapisan domain.
- **Lapisan Domain/Bisnis**: Merangkum aturan bisnis inti, entitas, dan logika independen dari kepentingan eksternal.
- **Lapisan Infrastruktur/Data**: Mengelola persistensi data, layanan eksternal, dan operasi tingkat rendah (misalnya, database, sistem file, API).

```text
+---------------------+
| Lapisan Presentasi  |
| (UI, API)           |
+---------------------+
          |
+---------------------+
| Lapisan Aplikasi    |
| (Alur Kerja Bisnis) |
+---------------------+
          |
+---------------------+
| Lapisan Domain      |
| (Aturan Bisnis)     |
+---------------------+
          |
+---------------------+
| Lapisan Infrastruktur|
| (Data, Eksternal)   |
+---------------------+
```

## Kapan Menggunakan

Gunakan untuk aplikasi kompleks dengan banyak pemangku kepentingan, membutuhkan evolusi independen UI, logika, dan data. Mendukung banyak frontend yang berbagi backend yang sama. Hindari di aplikasi sederhana di mana lapisan menambah kompleksitas yang tidak perlu.

## Panduan Implementasi

1. Organisir kode ke dalam folder seperti `presentation/`, `application/`, `domain/`, `infrastructure/`.
2. Definisikan antarmuka di lapisan yang lebih tinggi untuk lapisan yang lebih rendah untuk diimplementasikan (misalnya, `UserRepository` di domain, diimplementasikan di infrastruktur).
3. Pastikan dependensi mengalir ke bawah: Presentasi bergantung pada Aplikasi, yang bergantung pada Domain, yang bergantung pada Infrastruktur. Gunakan injeksi dependensi.
4. Uji setiap lapisan secara isolasi (misalnya, mock lapisan data saat menguji logika bisnis).
5. Mulai kecil: Untuk aplikasi sederhana, mulai dengan Presentasi dan Domain, tambahkan lapisan seiring kompleksitas tumbuh.

## Contoh

Di aplikasi web, presentasi menangani rendering HTML, aplikasi memproses permintaan pengguna, domain memvalidasi aturan bisnis, infrastruktur menanyakan database.

## Tautan

Untuk pemisahan kepentingan, lihat [Aturan Coding](../../coding-rules.md). Untuk pengujian lapisan, periksa [Infrastructure README](../../infra/README.md).
