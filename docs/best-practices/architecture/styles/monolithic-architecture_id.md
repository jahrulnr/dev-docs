# Arsitektur Monolitik

## Gambaran Umum

Arsitektur Monolitik adalah desain perangkat lunak tradisional di mana seluruh aplikasi dibangun sebagai satu unit terpadu. Semua komponen—antarmuka pengguna, logika bisnis, dan akses data—terkait erat dan di-deploy bersama. Gaya ini dominan sebelum microservices dan masih umum untuk aplikasi sederhana.

Ini mudah untuk dikembangkan dan di-deploy tetapi bisa menantang seiring pertumbuhan aplikasi, menyebabkan masalah skalabilitas, pemeliharaan, dan koordinasi tim.

## Karakteristik Utama

- **Basis Kode Tunggal**: Semua fungsionalitas dalam satu repositori.
- **Basis Data Bersama**: Sering satu basis data untuk semua komponen.
- **Kopling Ketat**: Perubahan di satu bagian dapat memengaruhi yang lain.
- **Deployment Terpadu**: Di-deploy sebagai satu artefak (misalnya, JAR, WAR).

## Kapan Digunakan

- Aplikasi kecil hingga sedang dengan persyaratan sederhana.
- Tim dengan sumber daya terbatas atau keahlian dalam sistem terdistribusi.
- Proyek proof-of-concept atau MVP.
- Hindari untuk aplikasi skala besar yang membutuhkan pembaruan sering atau skalabilitas tinggi.

## Keuntungan

- Kesederhanaan dalam pengembangan dan deployment.
- Pengujian dan debugging lebih mudah awalnya.
- Overhead operasional lebih rendah.

## Kekurangan

- Masalah skalabilitas: Sulit untuk menskalakan bagian individu.
- Tantangan pemeliharaan: Basis kode tumbuh tidak terkendali.
- Kunci teknologi: Lebih sulit untuk mengadopsi teknologi baru.

## Contoh

Aplikasi blog sederhana dengan autentikasi pengguna, postingan, dan komentar semua dalam satu aplikasi.

## Pola Terkait

- Arsitektur Berlapis untuk mengorganisir dalam monolit.
- Lihat juga Microservices untuk evolusi.

## Referensi

- Martin Fowler tentang Arsitektur Monolitik.