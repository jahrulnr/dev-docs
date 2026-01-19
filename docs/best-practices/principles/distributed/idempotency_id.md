# Idempotency
## Gambaran Umum

Idempotensi memastikan bahwa operasi yang sama dapat dijalankan berulang kali tanpa efek samping tambahan setelah eksekusi pertama. Properti ini membuat sistem lebih tangguh terhadap kegagalan dan masalah jaringan di lingkungan terdistribusi.

## Kapan digunakan
Gunakan untuk endpoint yang mungkin diulang (retries) seperti pemrosesan pesan, payment, atau webhook handlers.

## Example
Gunakan idempotency key pada permintaan pembayaran sehingga duplikat tidak menghasilkan ganda transaksi.

## Kelebihan / Kekurangan
- Kelebihan: Mempermudah retry dan memastikan konsistensi pada kegagalan/transien errors.
- Kekurangan: Memerlukan penyimpanan status idempotency dan desain kunci yang tepat.

## Referensi
- Praktik idempotency pada API dan messaging.