# Prinsip SOLID

## Gambaran Umum

SOLID adalah seperangkat lima prinsip desain untuk pemrograman berorientasi objek (OOP) yang membuat kode lebih mudah dipahami, fleksibel, dan dapat dipelihara. Diperkenalkan oleh Robert C. Martin (Uncle Bob), mereka membantu menghindari pembusukan kode dengan mempromosikan desain kelas yang baik.

Prinsipnya adalah: Tanggung Jawab Tunggal, Terbuka-Tertutup, Substitusi Liskov, Segregasi Antarmuka, dan Inversi Dependensi. Mereka mengurangi bug, meningkatkan kemampuan pengujian, meningkatkan fleksibilitas, dan membuat kode lebih mudah dipelihara dan diperluas.

## Prinsip Tanggung Jawab Tunggal (SRP)

Kelas harus memiliki hanya satu alasan untuk berubah (satu pekerjaan). Ini membuat kelas fokus dan mencegah mereka melakukan terlalu banyak.

**Kapan Menggunakan**: Di kelas apa pun yang menangani banyak tugas. Hindari di skrip sederhana.

**Cara Implementasi**: Pisahkan kelas dengan banyak pekerjaan (misalnya, kelas `User` yang menangani data dan email—pisahkan menjadi `User` dan `EmailService`).

## Prinsip Terbuka-Tertutup (OCP)

Entitas perangkat lunak harus terbuka untuk ekstensi tetapi tertutup untuk modifikasi. Tambahkan fitur baru tanpa mengedit kode yang ada.

**Kapan Menggunakan**: Saat menambahkan fitur ke basis kode yang stabil.

**Cara Implementasi**: Gunakan pewarisan atau antarmuka untuk memperluas perilaku.

## Prinsip Substitusi Liskov (LSP)

Subkelas harus dapat digantikan untuk kelas dasar mereka tanpa merusak perilaku. Pastikan kelas turunan tidak melanggar kontrak kelas dasar.

**Kapan Menggunakan**: Dalam hierarki pewarisan untuk menghindari kesalahan tak terduga.

**Cara Implementasi**: Pastikan subkelas sepenuhnya mengimplementasikan metode kelas dasar dengan benar.

## Prinsip Segregasi Antarmuka (ISP)

Klien tidak boleh dipaksa bergantung pada antarmuka yang tidak mereka gunakan. Jaga antarmuka tetap kecil dan spesifik.

**Kapan Menggunakan**: Dengan antarmuka besar yang tidak semua kelas butuhkan.

**Cara Implementasi**: Pisahkan antarmuka besar menjadi yang lebih kecil dan fokus.

## Prinsip Inversi Dependensi (DIP)

Bergantung pada abstraksi, bukan konkret (modul tingkat tinggi tidak boleh bergantung pada modul tingkat rendah). Ini mempromosikan kopling longgar.

**Kapan Menggunakan**: Untuk membuat kode fleksibel dan dapat diuji.

**Cara Implementasi**: Gunakan antarmuka dan injeksi dependensi.

```text
Tanpa DIP (Kopling Ketat):
[Modul Tingkat Tinggi] --> [Modul Tingkat Rendah]

Dengan DIP (Kopling Longgar):
[Modul Tingkat Tinggi] --> [Abstraksi (Antarmuka)] <-- [Modul Tingkat Rendah]
```

## Tautan

Untuk contoh, lihat [Aturan Coding](../../coding-rules.md).
