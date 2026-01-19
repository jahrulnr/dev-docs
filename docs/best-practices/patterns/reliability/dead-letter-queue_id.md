# Dead Letter Queue (DLQ)
## Gambaran Umum

DLQ adalah antrean yang menyimpan pesan yang tidak dapat diproses setelah retry, memungkinkan inspeksi dan resolusi manual. Ini meningkatkan ketahanan pemrosesan pesan dengan menangani kegagalan secara terstruktur.

## Kapan digunakan
Gunakan agar pemrosesan pesan lebih tangguh, menghindari retry tak berujung, dan menganalisis kegagalan berulang.

## Contoh
Jika pesan gagal diproses 3 kali, pindahkan ke `order-processing-dlq` untuk pemeriksaan operator.

## Kelebihan / Kekurangan
- Kelebihan: Mencegah retry storm, memungkinkan investigasi pesan bermasalah.
- Kekurangan: Memerlukan proses operasional untuk menangani item DLQ.

## Referensi
- Praktik terbaik sistem messaging (Kafka, SQS).