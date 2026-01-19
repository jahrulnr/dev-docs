# Arsitektur Heksagonal (Hexagonal Architecture)

## Gambaran Umum

Hexagonal Architecture, juga dikenal sebagai Ports and Adapters, adalah pola desain oleh Alistair Cockburn yang mengisolasi aplikasi inti ( "heksagon") dari kepentingan eksternal melalui "port" (antarmuka untuk input/output) dan "adapter" (implementasi untuk database, API). Ini seperti sistem plug-and-play di mana inti tidak tahu tentang spesifik, membuatnya sangat fleksibel dan dapat diuji.

Manfaat utama adalah decoupling: Logika bisnis inti tetap tidak berubah terlepas dari perubahan eksternal, seperti beralih dari API web ke antarmuka baris perintah. Ini mendukung banyak antarmuka tanpa duplikasi dan selaras dengan inversi dependensi.

## Komponen Utama

- **Inti (Logika Bisnis)**: Heksagon pusat yang berisi entitas domain, layanan, dan aturan. Ini mendefinisikan apa yang dilakukan aplikasi.
- **Port**: Antarmuka yang mendefinisikan bagaimana inti berinteraksi dengan dunia luar (misalnya, port input untuk perintah, port output untuk pengambilan data).
- **Adapter**: Implementasi konkret dari port untuk sistem eksternal, seperti kontroler web (adapter primer) atau repositori database (adapter sekunder).

```text
   +-------------------+
   | Adapter Primer   |
   | (Web, CLI, API)  |
   +-------------------+
           |
   +-------------------+
   |       Port        |
   | (Antarmuka)       |
   +-------------------+
           |
   +-------------------+
   |      Inti         |
   | (Logika Bisnis)   |
   +-------------------+
           |
   +-------------------+
   |       Port        |
   | (Antarmuka)       |
   +-------------------+
           |
   +-------------------+
   | Adapter Sekunder  |
   | (DB, API Eksternal)|
   +-------------------+
```

## Kapan Menggunakan

Gunakan Hexagonal Architecture untuk:

- Aplikasi dengan integrasi eksternal yang bervariasi, seperti yang membutuhkan API REST dan antrian pesan.
- Sistem yang membutuhkan kemampuan pengujian tinggi, di mana Anda dapat dengan mudah mock adapter.
- Proyek dengan banyak frontend (web, mobile, CLI) yang berbagi inti yang sama.
- Hindari di aplikasi CRUD sederhana di mana struktur pola mungkin berlebihan.

## Panduan Implementasi

1. **Definisikan Port di Inti**: Buat antarmuka untuk input (misalnya, `OrderService`) dan output (misalnya, `OrderRepository`) di lapisan domain.
2. **Implementasikan Adapter di Luar**: Bangun adapter primer (misalnya, kontroler REST) dan sekunder (misalnya, repositori SQL) di infrastruktur.
3. **Jaga Inti Independen**: Inti hanya bergantung pada port, bukan adapter. Gunakan injeksi dependensi.
4. **Uji dengan Mock**: Dengan mudah tukar adapter untuk pengujian dengan mock port.
5. **Mulai dengan Satu Adapter**: Mulai dengan adapter web, lalu tambahkan yang lain seperti CLI.

## Contoh

Di sistem pembayaran, inti menangani logika "proses pembayaran". Port mendefinisikan "kirim notifikasi." Adapter mengimplementasikan ini untuk email atau SMS tanpa mengubah inti.

## Tautan

Untuk lebih lanjut tentang inversi dependensi, lihat [Prinsip SOLID](../README.md#solid-principles). Untuk contoh antarmuka, periksa [Aturan Coding](../../coding-rules.md).
