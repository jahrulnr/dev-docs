# Arsitektur Bersih (Clean Architecture)

## Gambaran Umum

Clean Architecture adalah filosofi desain perangkat lunak yang dibuat oleh Robert C. Martin (Uncle Bob) yang mengorganisir kode ke dalam lapisan konsentris (lingkaran) untuk memisahkan kepentingan. Ide utamanya adalah membuat logika bisnis (domain) independen dari detail eksternal seperti database, framework, atau antarmuka pengguna. Ini memastikan bahwa perubahan pada lapisan luar (seperti mengganti database) tidak memengaruhi inti dalam.

Prinsip kuncinya adalah "aturan dependensi": Lapisan dalam tidak boleh bergantung pada lapisan luar. Sebaliknya, dependensi mengarah ke dalam, mempromosikan kemampuan pengujian, pemeliharaan, dan fleksibilitas. Ini sangat berguna untuk aplikasi kompleks dan selaras dengan prinsip SOLID dan Domain-Driven Design (DDD).

## Komponen Utama

Clean Architecture membagi aplikasi menjadi empat lapisan utama:

- **Entitas**: Aturan bisnis inti dan struktur data yang independen dari framework atau teknologi apa pun.
- **Kasus Penggunaan (Lapisan Aplikasi)**: Logika bisnis spesifik aplikasi yang mengorkestrasi entitas. Lapisan ini berisi alur kerja aplikasi Anda.
- **Adapter Antarmuka**: Kontroler, gateway, dan presenter yang menyesuaikan data antara kasus penggunaan dan agen eksternal (seperti framework web atau database).
- **Framework & Driver**: Alat eksternal, database, framework web, dan komponen UI. Ini adalah lapisan terluar.

```text
+---------------------+
| Framework & Driver  |
| (UI, DB, Framework) |
+---------------------+
          |
+---------------------+
| Adapter Antarmuka   |
| (Kontroler, Gateway)|
+---------------------+
          |
+---------------------+
| Kasus Penggunaan   |
| (Logika Aplikasi)   |
+---------------------+
          |
+---------------------+
|     Entitas         |
| (Aturan Bisnis Inti)|
+---------------------+
```

## Kapan Menggunakan

Pilih Clean Architecture untuk:

- Aplikasi kompleks dengan persyaratan yang berkembang, di mana Anda perlu menukar teknologi (misalnya, dari SQL ke NoSQL).
- Tim yang memprioritaskan pemeliharaan jangka panjang dan kemampuan pengujian.
- Proyek menggunakan DDD, di mana model domain adalah pusat.
- Hindari di aplikasi sangat sederhana di mana overhead lapisan menambah kompleksitas yang tidak perlu.

## Panduan Implementasi

1. **Organisir Kode berdasarkan Lapisan**: Buat folder seperti `domain/` (entitas), `application/` (kasus penggunaan), `infrastructure/` (adapter dan driver).
2. **Terapkan Inversi Dependensi**: Gunakan antarmuka di lapisan dalam (misalnya, antarmuka `UserRepository` di domain, diimplementasikan di infrastruktur).
3. **Jaga Dependensi ke Dalam**: Lapisan dalam tidak mengimpor lapisan luar. Gunakan injeksi dependensi untuk menghubungkannya.
4. **Uji dari Dalam ke Luar**: Mulai menguji entitas dan kasus penggunaan dengan mock untuk lapisan luar.

## Contoh

Di aplikasi e-commerce, entitas `Order` (domain) menangani aturan inti seperti "pesanan harus memiliki item." Kasus penggunaan `PlaceOrder` (aplikasi) mengorkestrasi ini. `OrderController` (adapter) menangani permintaan HTTP, dan `OrderRepository` (infrastruktur) menyimpan ke database.

## Tautan

Untuk lebih lanjut tentang prinsip SOLID, lihat [Prinsip SOLID](../../principles/solid_id.md). Untuk contoh DDD, periksa [Aturan Coding](../../principles/code-quality/clean-code_id.md).
