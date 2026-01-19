# Pola Mediator
## Gambaran Umum

Mediator memusatkan logika interaksi antara beberapa objek, mengurangi ketergantungan langsung dan menyederhanakan alur komunikasi. Ini mempromosikan loose coupling dengan menghilangkan kebutuhan objek untuk berkomunikasi secara langsung, membuat sistem lebih mudah dipelihara dan diperluas.

## Kapan digunakan
- Saat banyak komponen berinteraksi secara kompleks dan coupling langsung tidak dapat dikelola.
- Untuk antarmuka pengguna (widgets), orkestrasi workflow, atau sistem chat.

## Panduan Implementasi
- Definisikan antarmuka Mediator yang digunakan komponen untuk berkomunikasi.
- Komponen melaporkan event ke mediator; mediator mengoordinasikan reaksi dan meneruskan pesan.
- Jika mediator menumpuk tanggung jawab, bagi menjadi sub-mediator atau ekstrak layanan.

## Contoh (Pseudo)
`ChatRoom` mediator menerima pesan dari User dan menyiarkannya ke user lain, memusatkan routing dan manajemen presence.

## Kelebihan / Kekurangan
- Kelebihan: Mengurangi coupling dan memusatkan koordinasi.
- Kekurangan: Kalau tumbuh terlalu besar mediator dapat menjadi sulit dipelihara.

## Perhatian
- Jika mediator terlalu kompleks, pecah menjadi sub-mediator atau ekstrak logika ke service terpisah.

## Referensi
- Gamma dkk., "Design Patterns".