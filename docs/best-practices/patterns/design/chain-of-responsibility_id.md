# Pola Chain of Responsibility
## Gambaran Umum

Chain of Responsibility memungkinkan beberapa handler berkesempatan memproses sebuah permintaan dengan merangkainya; permintaan diteruskan sampai ada handler yang menanganinya. Pola ini memungkinkan pemrosesan permintaan yang fleksibel dan terpisah.

## Kapan digunakan
- Ketika beberapa komponen dapat menangani permintaan dan Anda ingin memisahkan pengirim dari penerima.
- Untuk pipeline pemrosesan seperti validasi dan enrich.

## Panduan Implementasi
- Definisikan interface Handler dengan metode yang menangani atau meneruskan request.
- Buat chain dengan menghubungkan handler atau menggunakan pola middleware.

## Contoh
Rantai middleware HTTP di mana setiap middleware dapat menangani atau meneruskan request.

## Kelebihan / Kekurangan
- Kelebihan: Fleksibel, mendukung komposisi.
- Kekurangan: Alur dapat sulit dilacak saat debugging.

## Referensi
- Literatur pola desain umum.