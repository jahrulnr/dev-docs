# Feature Toggle
## Gambaran Umum

Feature Toggle (flag) mengontrol ketersediaan fitur saat runtime, memungkinkan dark launch, rollout bertahap, dan rollback cepat. Teknik ini memungkinkan deployment yang lebih aman dan manajemen fitur yang lebih fleksibel.

## Kapan digunakan
Gunakan untuk progressive delivery, eksperimen, dan memisahkan rilis fitur dari deployment kode.

## Contoh
Flag boolean `newCheckoutEnabled` mengaktifkan alur checkout baru untuk subset pengguna.

## Kelebihan / Kekurangan
- Kelebihan: Kontrol rilis yang halus, mendukung A/B testing.
- Kekurangan: Hutang flag jika tidak dibersihkan, kompleksitas jalur kode.

## Referensi
- Praktik terbaik feature flagging.