# Pola Facade
## Gambaran Umum

Facade menyediakan antarmuka sederhana untuk subsistem kompleks, mengurangi coupling dan menyederhanakan penggunaan subsistem tersebut. Pola ini meningkatkan maintainability dengan menyembunyikan kompleksitas internal.

## Kapan digunakan
- Menyediakan API stabil dan sederhana di atas kumpulan komponen internal.
- Menyederhanakan pengujian integrasi dengan bergantung pada facade daripada banyak layanan internal.

## Panduan Implementasi
- Buat Facade yang mengkomposisi komponen internal dan menyediakan API minimal, kohesif.
- Gunakan metode berskala besar (coarse-grained) dan jangan mengekspose detail internal.

## Contoh (Pseudo)
`PaymentFacade.Process(order)` melakukan validasi, penagihan, dan notifikasi dengan mengorkestrasi layanan internal.

## Kelebihan / Kekurangan
- Kelebihan: Menyederhanakan kode klien, memusatkan orkestrasi.
- Kekurangan: Dapat menyembunyikan fungsionalitas penting atau menjadi besar jika digunakan berlebihan.

## Pola Terkait
Sering dipakai bersama Adapter; desain lapis facade ke facade membantu versi API.

## Referensi
- Gamma dkk., "Design Patterns".