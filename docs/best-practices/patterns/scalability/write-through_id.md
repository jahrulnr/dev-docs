# Write Through Cache
## Gambaran Umum

Write Through menulis data ke cache dan penyimpanan utama secara sinkron saat update, memastikan cache dan penyimpanan konsisten. Pola ini menjamin integritas data dengan biaya latensi tulis yang lebih tinggi.

## Kapan digunakan
Gunakan saat konsistensi kuat antara cache dan database penting dan latensi tulis dapat diterima.

## Contoh
Saat update: tulis ke cache lalu persist ke DB; baca dari cache.

## Kelebihan / Kekurangan
- Kelebihan: Model konsistensi lebih sederhana, data segar di cache.
- Kekurangan: Latensi tulis meningkat, potensi bottleneck.

## Referensi
- Materi strategi caching.