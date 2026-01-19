# Database Sharding
## Gambaran Umum

Database Sharding adalah teknik yang memecah database besar menjadi bagian lebih kecil (shard), masing-masing menyimpan subset data untuk meningkatkan kecepatan dan pengelolaan. Teknik ini sangat berguna ketika satu database tidak mampu menangani skala atau ukuran; shard berdasarkan customer ID atau tenant ID untuk skala horizontal.

## Kapan digunakan
Gunakan ketika satu database tidak mampu menangani skala atau ukuran; shard berdasarkan customer ID atau tenant ID untuk skala horizontal.

## Contoh
Data pengguna dipartisi ke shards dengan hashing user ID.

## Kelebihan / Kekurangan
- Kelebihan: Skalabilitas horizontal, mengurangi kontensi.
- Kekurangan: Kompleksitas query meningkat, transaksi lintas-shard sulit.

## Referensi
- Panduan vendor database dan skala.