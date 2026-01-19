# Read Replicas
## Gambaran Umum

Read Replicas adalah salinan database utama yang digunakan untuk melayani query hanya-baca, mengurangi beban pada utama dan meningkatkan skalabilitas baca. Pola ini ideal ketika trafik baca jauh lebih tinggi daripada tulis dan Anda dapat menerima data sedikit usang.

## Kapan digunakan
Gunakan ketika trafik baca jauh lebih tinggi daripada tulis dan Anda dapat menerima data sedikit usang.

## Contoh
Gunakan DB utama untuk tulis dan beberapa replica untuk reporting dan endpoint baca berat.

## Kelebihan / Kekurangan
- Kelebihan: Meningkatkan skalabilitas baca, meringankan beban utama.
- Kekurangan: Lag replikasi menyebabkan baca usang; tulis tetap menjadi bottleneck.

## Referensi
- Dokumentasi replikasi database.