# Hukum Demeter

## Gambaran Umum

Hukum Demeter (LoD) membatasi interaksi objek ke "teman dekat", mengurangi kopling. Dinamai setelah Proyek Demeter, ini mempromosikan enkapsulasi.

Metode hanya dapat memanggil metode pada dirinya sendiri, parameternya, atributnya, atau objek yang dibuat/instantiasinya. Hindari "train wrecks" seperti `a.b.c.d()`.

Manfaat: Kode lebih dapat dipelihara, dapat disesuaikan; lebih sedikit perubahan cascading.

## Kapan Menggunakan

Di OOP untuk mencegah dependensi ketat; saat refactoring kode legacy dengan rantai dalam.

## Cara Implementasi

Restrukturisasi untuk menggunakan referensi langsung atau delegasi (misalnya, alih-alih `customer.getAddress().getCity()`, miliki `customer.getCity()`). Hanya bicara dengan "tetangga"—jangan jangkau melalui orang lain.

```
Pelanggaran: [A] --> [B] --> [C] --> [D] (Rantai)

Kepatuhan: [A] --> [B] (Langsung atau delegasi)
```

## Tautan

Untuk enkapsulasi, lihat [Aturan Coding](../../coding-rules.md).
