# Active Record
## Gambaran Umum

Active Record menggabungkan objek domain dan logika persistensi dalam satu kelas; objek mengetahui cara menyimpan dirinya. Pola ini menyederhanakan akses data untuk aplikasi sederhana tetapi dapat meningkatkan coupling.

## Kapan digunakan
Cocok untuk aplikasi CRUD sederhana di mana pengikatan domain dan persistensi dapat diterima dan mudah diimplementasikan.

## Contoh
Kelas `User` dengan metode `save()`, `update()`, dan `delete()` yang beroperasi pada baris database.

## Kelebihan / Kekurangan
- Kelebihan: Mudah diimplementasikan; sedikit boilerplate untuk CRUD.
- Kekurangan: Ketergantungan erat domain dan persistensi, kurang cocok untuk domain kompleks.

## Referensi
- Martin Fowler, patterns of enterprise application architecture.