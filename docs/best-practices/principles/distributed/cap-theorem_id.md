# Teorema CAP
## Gambaran Umum

Teorema CAP menyatakan bahwa pada kondisi partisi jaringan, sistem terdistribusi harus memilih antara konsistensi dan ketersediaan (tidak dapat menjamin semua tiga: Consistency, Availability, Partition tolerance). Teorema fundamental ini membantu arsitek memahami trade-off dalam desain sistem terdistribusi.

## Kapan digunakan
Gunakan CAP sebagai kerangka pertimbangan tradeoff saat merancang sistem terdistribusi; prioritaskan berdasarkan kebutuhan (mis., CP vs AP).

## Contoh
Sistem yang konsisten kuat mungkin mengorbankan ketersediaan saat partisi; sistem AP tetap tersedia dengan konsistensi eventual.

## Kelebihan / Kekurangan
- Kelebihan: Membantu merasionalisasi tradeoff arsitektural.
- Kekurangan: Menyederhanakan nuansa dunia nyata; model lain (PACELC) memperluas CAP.

## Referensi
- Teorema CAP Brewer dan materi terkait.