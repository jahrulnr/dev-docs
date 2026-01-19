# Arsitektur Onion (Onion Architecture)

## Gambaran Umum

Onion Architecture, dibuat oleh Jeffrey Palermo, mengorganisir kode ke dalam lapisan yang "mengupas" ke luar dari inti domain, menekankan Domain-Driven Design (DDD). Lapisan terdalam adalah logika bisnis murni, dan lapisan luar menangani infrastruktur. Ini mirip dengan Clean Architecture tetapi lebih fokus pada prinsip DDD.

Manfaat utama adalah pemeliharaan: Perubahan pada lapisan luar (seperti mengganti ORM) tidak memengaruhi inti. Ini mempromosikan prinsip SOLID dan pemisahan kepentingan, membuat sistem kuat untuk domain bisnis yang kompleks.

## Komponen Utama

- **Lapisan Domain**: Entitas bisnis inti, objek nilai, dan layanan. Ini adalah jantung aplikasi.
- **Lapisan Aplikasi**: Kasus penggunaan dan perintah yang mengorkestrasi logika domain. Ini bertindak sebagai jembatan.
- **Lapisan Infrastruktur**: Repositori, layanan eksternal, dan komponen UI. Ini menangani dependensi eksternal.

```text
+---------------------+
| Lapisan Infrastruktur|
| (UI, DB, Eksternal) |
+---------------------+
          |
+---------------------+
| Lapisan Aplikasi    |
| (Kasus Penggunaan,  |
|  Perintah)          |
+---------------------+
          |
+---------------------+
| Lapisan Domain      |
| (Entitas, Layanan)  |
+---------------------+
```

## Kapan Menggunakan

Pilih Onion Architecture untuk:

- Proyek berfokus DDD dengan logika bisnis yang kompleks.
- Aplikasi yang membutuhkan skalabilitas dan independensi dari alat eksternal.
- Tim yang membangun microservices atau sistem enterprise.
- Hindari di aplikasi sederhana di mana struktur berlapis menambah kompleksitas.

## Panduan Implementasi

1. **Lapisan Kode dengan Domain di Pusat**: Struktur folder sebagai `domain/`, `application/`, `infrastructure/`.
2. **Gunakan Antarmuka untuk Komunikasi Lintas Lapisan**: Definisikan kontrak di lapisan dalam.
3. **Terapkan Inversi Dependensi**: Infrastruktur mengimplementasikan antarmuka domain.
4. **Uji Domain Pertama**: Pastikan logika inti diuji secara independen.
5. **Perluas Secara Bertahap**: Tambahkan lapisan seiring kompleksitas bisnis tumbuh.

## Contoh

Di aplikasi perbankan, domain menangani aturan "saldo akun". Lapisan aplikasi memproses "transfer uang". Infrastruktur menyimpan ke database.

## Tautan

Untuk detail DDD, lihat [Aturan Coding](../../coding-rules.md). Untuk SOLID, periksa [Prinsip SOLID](../README.md#solid-principles).
