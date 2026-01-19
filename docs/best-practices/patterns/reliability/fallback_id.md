# Fallback
## Gambaran Umum

Fallback memberikan hasil atau perilaku alternatif ketika layanan utama gagal, memungkinkan degradasi yang anggun. Pola ini memastikan ketahanan sistem dengan menyediakan opsi cadangan.

## Kapan digunakan
Gunakan untuk mempertahankan ketersediaan layanan dengan fungsi terbatas selama kegagalan parsial.

## Contoh
Jika gateway pembayaran gagal, kembalikan respon 'coba nanti' atau antre pembayaran untuk pemrosesan manual atau tertunda.

## Kelebihan / Kekurangan
- Kelebihan: Meningkatkan pengalaman pengguna saat kegagalan, mencegah error berantai.
- Kekurangan: Perlu desain yang hati-hati agar perilaku fallback aman dan dapat diterima.

## Referensi
- Pola ketahanan dan strategi circuit breaker.