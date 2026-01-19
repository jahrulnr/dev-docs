# OAuth2 / OpenID Connect
## Gambaran Umum

OAuth2 adalah framework otorisasi untuk akses delegasi; OpenID Connect (OIDC) menambahkan identitas di atas OAuth2 untuk autentikasi. Standar ini memungkinkan autentikasi dan otorisasi yang aman dan standar.

## Kapan digunakan
Gunakan untuk otorisasi pihak ketiga (delegated access) dan skenario single sign-on (OIDC).

## Contoh
Authorization code flow menukar code dengan token; OIDC mengembalikan ID token berisi informasi pengguna.

## Kelebihan / Kekurangan
- Kelebihan: Standarisasi, dukungan luas, memisahkan identitas dari layanan.
- Kekurangan: Kompleksitas implementasi dan jebakan keamanan bila penggunaan flow tidak tepat.

## Referensi
- Spesifikasi OAuth2 dan OpenID Connect.