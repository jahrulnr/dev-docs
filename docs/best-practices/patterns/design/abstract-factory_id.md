# Abstract Factory
## Gambaran Umum

Abstract Factory menyediakan antarmuka untuk membuat keluarga objek terkait atau bergantung tanpa mengungkapkan kelas konkret yang digunakan. Pola ini memungkinkan pembuatan objek yang konsisten dan terpisah dari implementasi spesifik.

## Kapan digunakan
- Saat sistem harus dapat dikonfigurasi dengan keluarga produk yang berbeda.
- Ketika produk yang terkait harus digunakan bersama secara konsisten.

## Panduan Implementasi
- Definisikan antarmuka produk abstrak dan antarmuka factory abstrak.
- Implementasikan factory konkret untuk setiap keluarga produk.

## Contoh (Pseudo)
GUI toolkit yang membuat `Button` dan `Window` untuk `MacOSFactory` atau `WindowsFactory`.

## Kelebihan / Kekurangan
- Kelebihan: Memisahkan penggunaan dari implementasi konkret dan menjaga konsistensi produk.
- Kekurangan: Menambah kompleksitas ketika menambah tipe produk baru.

## Pola Terkait
Factory Method, Builder

## Referensi
- Gamma dkk., "Design Patterns".