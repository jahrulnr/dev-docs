# Event Notification
## Gambaran Umum

Event Notification melibatkan broadcasting bahwa sesuatu telah terjadi (event) sehingga pihak yang tertarik dapat bereaksi; payload biasanya minimal dan menunjukkan terjadinya suatu peristiwa. Pola ini memungkinkan sistem reaktif dengan coupling minimal antara komponen.

## Kapan digunakan
Gunakan untuk low coupling dimana listener merespon asinkron terhadap event seperti `UserSignedUp` atau `OrderShipped`.

## Contoh
Mempublikasikan notifikasi `OrderShipped` yang memicu layanan email dan tracking.

## Kelebihan / Kekurangan
- Kelebihan: Low coupling dan semantik sederhana.
- Kekurangan: Listener perlu mengambil data tambahan bila dibutuhkan; konsistensi eventual.

## Referensi
- Pola arsitektur event-driven.