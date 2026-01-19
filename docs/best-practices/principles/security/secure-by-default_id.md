# Secure by Default
## Gambaran Umum

Secure by Default berarti sistem dikonfigurasi dengan default yang aman (least privilege, pengaturan jaringan aman) dan memerlukan aksi eksplisit untuk melonggarkan keamanan. Pendekatan ini memastikan keamanan dibangun dari awal daripada ditambahkan sebagai afterthought.

## Kapan digunakan
Terapkan pada desain produk dan infrastruktur untuk mengurangi konfigurasi tidak aman akibat kelalaian.

## Contoh
Default deny inbound network rules, kebijakan password kuat, dan nonaktifkan endpoint debug di produksi.

## Kelebihan / Kekurangan
- Kelebihan: Mengurangi attack surface dan kesalahan konfigurasi.
- Kekurangan: Mungkin memerlukan konfigurasi eksplisit untuk kasus penggunaan non-standar.

## Referensi
- Praktik konfigurasi aman.