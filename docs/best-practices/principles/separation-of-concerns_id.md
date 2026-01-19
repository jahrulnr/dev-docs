# Pemisahan Kepentingan

## Gambaran Umum

Pemisahan Kepentingan (SoC) adalah prinsip membagi sistem ke dalam bagian yang berbeda, masing-masing menangani satu aspek. Diciptakan oleh Edsger Dijkstra, ini berlaku untuk perangkat lunak, perangkat keras, dan lainnya.

Isolasi fungsionalitas (misalnya, UI, logika bisnis, data); fokus pada satu kepentingan per modul. Manfaat: Debugging lebih mudah, pengujian, pemeliharaan; mempromosikan modularitas.

## Kapan Menggunakan

Di arsitektur berlapis (misalnya, MVC); selalu di sistem kompleks untuk menghindari pencampuran tanggung jawab.

## Cara Implementasi

Gunakan lapisan atau modul (misalnya, pisahkan HTML/CSS/JS di web dev). Di kode, pisahkan kelas berdasarkan kepentingan. Seperti memisahkan cucian—cuci, keringkan, lipat di langkah berbeda.

```
[Lapisan UI]
    |
[Lapisan Logika Bisnis]
    |
[Lapisan Data]
```

## Tautan

Untuk arsitektur berlapis, lihat [Architecture](../../architecture/).
