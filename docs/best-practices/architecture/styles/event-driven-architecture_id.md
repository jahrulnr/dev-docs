# Arsitektur Event-Driven

## Gambaran Umum

Arsitektur Event-Driven (EDA) adalah gaya di mana komponen sistem berkomunikasi melalui event—notifikasi perubahan status. Produser memancarkan event, dan konsumen bereaksi secara asinkron. Ini mendekopling komponen, memungkinkan skalabilitas, responsivitas, dan pemrosesan real-time, tetapi memerlukan penanganan event dan manajemen konsistensi yang hati-hati.

## Karakteristik Utama

- **Produser dan Konsumen Event**: Komponen menghasilkan dan merespons event.
- **Komunikasi Asinkron**: Tidak ada panggilan langsung; event disiarkan.
- **Broker Event**: Middleware seperti Kafka atau RabbitMQ untuk routing.
- **Loose Coupling**: Komponen tidak saling mengetahui secara langsung.

## Kapan Digunakan

- Sistem yang membutuhkan respons real-time atau throughput tinggi.
- IoT, analitik, atau aplikasi reaktif.
- Hindari untuk skenario request-response sederhana.

## Keuntungan

- Skalabilitas dan toleransi kesalahan.
- Dekopling untuk evolusi lebih mudah.
- Mendukung alur kerja kompleks.

## Kekurangan

- Kompleksitas dalam debugging dan urutan event.
- Potensi badai event atau duplikat.
- Tantangan konsistensi data.

## Contoh

Sistem perdagangan saham di mana perubahan harga memicu peringatan dan pembaruan.

## Pola Terkait

- Publish/Subscribe, Event Sourcing.
- Digunakan dalam Microservices.

## Referensi

- Martin Fowler tentang Arsitektur Event-Driven.