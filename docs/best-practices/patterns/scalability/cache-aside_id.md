# Cache Aside
## Gambaran Umum

Cache Aside adalah pola yang memuat data ke cache saat dibutuhkan: aplikasi membaca dari cache dan bila miss, memuat dari database dan mengisi cache. Pola ini sangat berguna untuk beban baca tinggi di mana caching dapat mengurangi beban database dengan strategi invalidasi sederhana.

## Kapan digunakan
Gunakan untuk beban baca tinggi di mana caching dapat mengurangi beban database dengan strategi invalidasi sederhana.

## Contoh
Saat baca: cek cache -> miss -> load dari DB -> isi cache -> kembalikan.

## Kelebihan / Kekurangan
- Kelebihan: Sederhana, kontrol eksplisit atas populasi cache.
- Kekurangan: Cache miss menambah latensi, invalidasi sulit.

## Referensi
- Sumber daya strategi caching.