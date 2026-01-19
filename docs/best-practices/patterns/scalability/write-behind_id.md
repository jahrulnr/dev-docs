# Write Behind Cache
## Gambaran Umum

Write Behind Cache adalah pola di mana hanya cache yang diupdate segera dan perubahan disimpan ke penyimpanan utama secara asinkron kemudian. Pola ini berguna untuk mengurangi latensi tulis dan beban database ketika persistensi eventual dapat diterima.

## Kapan digunakan
Gunakan untuk mengurangi latensi tulis dan beban DB ketika persistensi eventual dapat diterima.

## Contoh
Update diantrekan dan di-flush ke DB secara batch oleh worker background.

## Kelebihan / Kekurangan
- Kelebihan: Latensi tulis rendah, batching efisien.
- Kekurangan: Risiko kehilangan data jika kegagalan sebelum persist, kompleksitas sistem meningkat.

## Referensi
- Strategi caching dan persistensi.