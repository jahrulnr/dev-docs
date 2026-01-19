# Token-Based Authentication (JWT)
## Gambaran Umum

JWT (JSON Web Tokens) adalah token ringkas yang aman untuk URL, digunakan untuk merepresentasikan klaim antar pihak dan umum dipakai untuk autentikasi stateless. Mereka memungkinkan autentikasi yang aman dan skalabel tanpa state di sisi server.

## Kapan digunakan
Gunakan untuk autentikasi API stateless, token sesi berumur pendek, atau propagasi klaim otorisasi antar layanan.

## Contoh
Terbitkan JWT yang ditandatangani dengan user id dan role; verifikasi signature pada setiap permintaan.

## Kelebihan / Kekurangan
- Kelebihan: Stateless, mudah diskalakan, portable antar layanan.
- Kekurangan: Perlu mekanisme revocation dan hati-hati dengan token berdurasi panjang.

## Referensi
- JWT RFC 7519, praktik auth terbaik.