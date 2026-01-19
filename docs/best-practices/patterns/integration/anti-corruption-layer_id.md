# Anti-Corruption Layer (ACL)
## Gambaran Umum

ACL melindungi model domain Anda dari model eksternal dengan menerjemahkan antara protokol/model eksternal dan model internal Anda. Lapisan ini menjaga integritas domain dengan mencegah konsep asing merusak model bisnis Anda.

## Kapan digunakan
Gunakan saat mengintegrasikan sistem legacy atau model pihak ketiga untuk menghindari pencemaran domain dengan konsep asing.

## Contoh
Adapter dan translator yang mengubah format data legacy menjadi DTO domain Anda.

## Kelebihan / Kekurangan
- Kelebihan: Menjaga kebersihan domain model, mengisolasi perubahan eksternal.
- Kekurangan: Kode pemetaan tambahan dan pemeliharaan lebih banyak.

## Referensi
- Panduan Domain-Driven Design untuk integrasi sistem legacy.