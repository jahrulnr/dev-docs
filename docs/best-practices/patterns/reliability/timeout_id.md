# Timeout
## Gambaran Umum

Timeout menetapkan batas waktu maksimal sebuah operasi dapat berjalan, mencegah resource tertahan tanpa batas. Ini memastikan sistem tetap responsif dan mencegah kegagalan cascading.

## Kapan digunakan
Gunakan untuk gagal cepat pada dependensi yang tidak merespons atau tugas berjalan lama agar sumber daya dibebaskan dan memicu retry/fallback.

## Contoh
Set timeout client HTTP 2 detik; pada timeout, kembalikan error atau aktifkan fallback.

## Kelebihan / Kekurangan
- Kelebihan: Melindungi sumber daya sistem, mencegah penumpukan permintaan.
- Kekurangan: Perlu tuning agar tidak memicu false positive pada operasi lambat tetapi sehat.

## Referensi
- Rekayasa ketahanan dan praktik terbaik timeout client.