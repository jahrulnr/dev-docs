# Policy Enforcement Point (PEP)
## Gambaran Umum

PEP menegakkan keputusan kontrol akses dari Policy Decision Point (PDP) di tingkat layanan, memastikan kebijakan otorisasi diterapkan konsisten. Ini memungkinkan kontrol akses yang terpusat dan konsisten.

## Kapan digunakan
Gunakan ketika manajemen kebijakan terpusat (PDP) diperlukan dan penegakan harus terjadi di boundary layanan/API.

## Contoh
API gateway bertindak sebagai PEP dengan menanyakan PDP untuk setiap permintaan dan mengizinkan/menolak berdasarkan kebijakan.

## Kelebihan / Kekurangan
- Kelebihan: Keputusan terpusat, penegakan konsisten antar layanan.
- Kekurangan: Menambah ketergantungan pada ketersediaan dan latensi PDP; perlu komunikasi aman.

## Referensi
- XACML dan framework kontrol akses.