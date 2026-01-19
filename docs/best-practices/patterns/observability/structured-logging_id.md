# Structured Logging
## Gambaran Umum

Structured Logging mengeluarkan log sebagai field yang dapat dibaca mesin (JSON) dibanding teks bebas, meningkatkan kemampuan pencarian dan parsing. Ini memungkinkan analisis log yang lebih efektif dan debugging di lingkungan produksi.

## Kapan digunakan
Gunakan di sistem produksi untuk memudahkan query, parsing, dan korelasi di sistem logging terpusat.

## Contoh
Log: {"timestamp":"...","level":"info","requestId":"...","userId":123,"message":"order created"}

## Kelebihan / Kekurangan
- Kelebihan: Memudahkan query dan integrasi tooling.
- Kekurangan: Pengaturan logging dan manajemen skema sedikit lebih kompleks.

## Referensi
- Praktik terbaik logging.