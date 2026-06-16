# CQRS (Command Query Responsibility Segregation)
## Gambaran Umum

CQRS memisahkan model tulis (command) dan baca (query) sehingga masing-masing dapat dioptimalkan dan diskalakan secara independen. Sering dipadukan dengan mekanisme event-driven untuk menyinkronkan model baca.

## Konsep Utama
- **Sisi Command (Model Tulis)**: Menangani operasi yang mengubah state, memvalidasi command, dan menerapkan aturan bisnis.
- **Sisi Query (Model Baca)**: Menggunakan struktur terdenormalisasi yang dioptimalkan untuk query cepat.
- **Konsistensi Eventual**: Pembaruan model baca biasanya dilakukan asinkron; klien harus menangani potensi keterlambatan data.
- **Sinkronisasi**: Gunakan event dan processor idempotent untuk menjaga konsistensi read model.

## Komponen Utama

- **Sisi Command (Model Tulis)**: Menangani operasi yang mengubah status (misalnya, membuat, memperbarui, menghapus data). Ini menegakkan aturan bisnis dan memvalidasi command. Sering menggunakan domain-driven design dengan agregat dan event.
- **Sisi Query (Model Baca)**: Menangani operasi yang mengambil data untuk ditampilkan (misalnya, mengambil daftar atau laporan). Ini dapat denormalisasi data untuk baca cepat dan mungkin menggunakan database atau tampilan terpisah.
- **Mediator/Event Bus (Opsional)**: Memfasilitasi komunikasi antara sisi command dan query, sering melalui event untuk konsistensi eventual.

```text
Aksi Pengguna (mis., Perbarui Profil)
          |
          v
+----------------+       Event/Pesan       +----------------+
| Model Command  |  --------------------->  | Model Query    |
| (Tulis: Validasi|                         | (Baca: Pengambilan|
|  & Simpan)     |                         |  Cepat)        |
+----------------+                         +----------------+
          |                                        |
          v                                        v
     Database (Transaksional)              Database (Dioptimalkan)
```

## Kapan Menggunakan

Gunakan di aplikasi performa tinggi dengan beban baca berat (misalnya, situs e-commerce). Ketika model baca dan tulis berbeda secara signifikan. Di sistem event-sourced atau domain dengan logika bisnis kompleks. Hindari di aplikasi CRUD sederhana di mana satu model cukup.

## Panduan Implementasi

1. Pisahkan kode ke dalam handler command dan query (misalnya, folder `Commands/` dan `Queries/`).
2. Gunakan model terpisah: Command bekerja dengan entitas domain yang menegakkan aturan; Query menggunakan DTO atau tampilan untuk pengambilan cepat.
3. Opsional, gunakan event sourcing: Command memancarkan event yang memperbarui model baca secara asinkron (konsistensi eventual).
4. Untuk database: Command menggunakan penyimpanan transaksional (misalnya, SQL); Query menggunakan penyimpanan dioptimalkan baca (misalnya, NoSQL atau DB pelaporan).
5. Mulai sederhana: Implementasikan CQRS untuk satu fitur (misalnya, registrasi pengguna sebagai command, daftar pengguna sebagai query), lalu perluas.
6. Pastikan sinkronisasi: Gunakan event atau messaging untuk menjaga model baca diperbarui setelah command.

## Contoh

Di sistem blog, command menangani "buat posting" (tulis), query menangani "daftar posting" (baca). Model baca menggunakan tabel denormalisasi untuk pencarian cepat.

## Tautan

Untuk pola event-driven, lihat [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_id.md). Untuk model domain, periksa [Aturan Coding](../../principles/code-quality/clean-code_id.md).
