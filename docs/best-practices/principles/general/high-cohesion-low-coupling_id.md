# High Cohesion, Low Coupling
## Gambaran Umum

High cohesion mengelompokkan fungsionalitas terkait; low coupling meminimalkan dependensi antar modul—keduanya meningkatkan maintainability. Prinsip-prinsip ini memandu desain sistem perangkat lunak agar lebih kuat, fleksibel, dan mudah berkembang seiring waktu.

## Kapan digunakan
Usahakan modul yang kohesif dan interface eksplisit di semua lapisan sistem.

## Contoh
`PaymentService` memiliki logika pembayaran (kohesi); menyediakan API kecil yang digunakan modul lain (low coupling).

## Kelebihan / Kekurangan
- Kelebihan: Lebih mudah memahami dan memodifikasi bagian secara independen.
- Kekurangan: Memerlukan usaha desain dan batasan yang jelas.

## Referensi
- Prinsip modularitas dan desain perangkat lunak.