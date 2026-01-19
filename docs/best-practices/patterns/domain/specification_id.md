# Pola Specification
## Gambaran Umum

Specification mengenkapsulasi aturan bisnis yang dapat dikombinasikan (AND/OR/NOT) dan digunakan kembali untuk query atau validasi objek domain. Pola ini memungkinkan logika bisnis yang fleksibel dan dapat dikomposisi, membuatnya lebih mudah untuk memelihara dan menguji kondisi kompleks.

## Kapan digunakan
Gunakan untuk aturan bisnis kompleks yang perlu dipakai ulang dan dikombinasikan di berbagai konteks.

## Contoh
`IsPremiumCustomer` DAN `HasValidSubscription` digunakan untuk mengotorisasi akses.

## Kelebihan / Kekurangan
- Kelebihan: Aturan dapat digunakan ulang, dapat dikomposisi, meningkatkan keterbacaan.
- Kekurangan: Menambah indirection dan verbose.

## Referensi
- Sumber daya Domain-Driven Design.