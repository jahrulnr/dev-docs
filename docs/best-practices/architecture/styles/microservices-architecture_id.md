# Arsitektur Microservices

## Gambaran Umum

Arsitektur Microservices mendekomposisi aplikasi menjadi layanan kecil, independen yang berkomunikasi melalui API. Setiap layanan menangani kemampuan bisnis spesifik dan dapat dikembangkan, di-deploy, dan diskalakan secara terpisah. Gaya ini mempromosikan ketangkasan, skalabilitas, dan isolasi kesalahan tetapi memperkenalkan kompleksitas dalam komunikasi dan konsistensi data.

## Karakteristik Utama

- **Layanan Terdesentralisasi**: Setiap layanan otonom dengan basis kode dan basis data sendiri.
- **Komunikasi Berbasis API**: Layanan berinteraksi melalui REST, gRPC, atau pesan asinkron.
- **Deployment Independen**: Layanan dapat diperbarui dan diskalakan tanpa memengaruhi yang lain.
- **Teknologi Polyglot**: Bahasa pemrograman dan basis data berbeda per layanan.

## Kapan Digunakan

- Aplikasi skala besar dengan beberapa tim pengembangan.
- Sistem yang memerlukan rilis sering, ketersediaan tinggi, dan skalabilitas.
- Domain kompleks di mana layanan dapat dibatasi oleh kemampuan bisnis.
- Hindari untuk tim kecil atau aplikasi sederhana di mana overhead melebihi manfaat.

## Keuntungan

- Skalabilitas yang ditingkatkan: Skalakan layanan individu berdasarkan permintaan.
- Isolasi kesalahan: Kegagalan di satu layanan tidak menjatuhkan seluruh sistem.
- Fleksibilitas teknologi: Pilih alat terbaik untuk setiap layanan.
- Siklus deployment lebih cepat dan pemeliharaan lebih mudah.

## Kekurangan

- Kompleksitas yang meningkat dalam orkestrasi layanan, pengujian, dan pemantauan.
- Tantangan dengan konsistensi data di seluruh layanan (misalnya, transaksi terdistribusi).
- Latensi jaringan dan overhead komunikasi.
- Biaya operasional lebih tinggi untuk deployment dan infrastruktur.

## Contoh

Platform e-commerce dengan microservices terpisah untuk manajemen pengguna, katalog produk, pemrosesan pesanan, dan penanganan pembayaran, masing-masing dapat di-deploy secara independen.

## Pola Terkait

- API Gateway untuk routing permintaan.
- Pola Saga untuk mengelola transaksi terdistribusi.
- Circuit Breaker untuk ketahanan.
- Kontras dengan Arsitektur Monolitik.

## Referensi

- Sumber Microservices Martin Fowler.
- "Building Microservices" oleh Sam Newman.