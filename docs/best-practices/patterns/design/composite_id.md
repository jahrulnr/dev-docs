# Composite
## Gambaran Umum

Composite menggabungkan objek menjadi struktur pohon untuk merepresentasikan hierarki bagian‑keseluruhan dan memungkinkan klien memperlakukan objek tunggal dan komposit secara seragam. Pola ini sangat berguna untuk membangun struktur hierarki di mana operasi pada keseluruhan harus konsisten dengan operasi pada bagian-bagiannya.

## Kapan digunakan
- Untuk struktur hirarki seperti komponen UI atau sistem file.
- Ketika klien harus memperlakukan komposit dan leaf sama.

## Panduan Implementasi
- Definisikan antarmuka `Component` yang diimplementasikan leaf dan composite.
- `Composite` menyimpan children dan mendelegasikan operasi.

## Contoh
Sistem file dengan `File` dan `Directory` yang mengimplementasikan antarmuka yang sama.

## Kelebihan / Kekurangan
- Kelebihan: Menyederhanakan penanganan struktur pohon.
- Kekurangan: Dapat memperumit keamanan tipe dan menampilkan operasi yang tidak valid pada leaf.

## Referensi
- Gamma dkk., "Design Patterns".