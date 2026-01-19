# Builder
## Gambaran Umum

Builder memisahkan konstruksi objek kompleks dari representasinya, memungkinkan proses yang sama menghasilkan representasi berbeda. Pola ini menyederhanakan pembuatan objek dengan banyak parameter atau langkah.

## Kapan digunakan
- Saat pembuatan objek membutuhkan banyak langkah opsional atau konfigurasi.
- Untuk menghindari konstruktor dengan terlalu banyak parameter.

## Panduan Implementasi
- Definisikan antarmuka Builder dengan metode konfigurasi dan `Build()`.
- Implementasikan builder konkret untuk berbagai representasi.

## Contoh (Pseudo)
`QueryBuilder` yang menyusun filter, pengurutan, dan pagination lalu menghasilkan string SQL.

## Kelebihan / Kekurangan
- Kelebihan: Jelas dan mudah diuji untuk objek kompleks.
- Kekurangan: Menambah jumlah kelas.

## Referensi
- Gamma dkk., "Design Patterns".