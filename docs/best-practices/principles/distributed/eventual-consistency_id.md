# Eventual Consistency
## Gambaran Umum

Eventual Consistency berarti dalam sistem terdistribusi, pembaruan akan menyebar dan replika akan konvergen ke state yang sama seiring waktu. Model ini memungkinkan skalabilitas dan ketersediaan yang lebih baik dibandingkan model konsistensi kuat.

## Kapan digunakan
Gunakan dalam arsitektur terdistribusi untuk mencapai ketersediaan dan toleransi partisi saat konsistensi ketat tidak wajib.

## Contoh
Update profil pengguna menyebar ke cache dan indeks pencarian secara asinkron.

## Kelebihan / Kekurangan
- Kelebihan: Meningkatkan ketersediaan dan skalabilitas.
- Kekurangan: Perlu menangani baca usang dan mekanisme rekonsiliasi.

## Referensi
- Desain sistem terdistribusi dan sumber daya CAP theorem.