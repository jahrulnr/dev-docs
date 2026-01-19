# Prinsip KISS

## Gambaran Umum

KISS (Keep It Simple, Stupid) adalah prinsip desain yang menekankan kesederhanaan dalam sistem, produk, atau kode. Berasal dari Lockheed Skunk Works pada 1960-an, ini menyarankan menghindari kompleksitas yang tidak perlu.

Tujuannya adalah kesederhanaan; hindari over-engineering; lebih suka solusi yang lurus. Manfaat termasuk lebih mudah dipahami, dipelihara, di-debug, dan pengembangan lebih cepat.

## Kapan Menggunakan

Di semua tugas coding dan desain, terutama saat tergoda menambahkan fitur "keren" tetapi tidak perlu; penting untuk developer untuk menghindari overcomplicating dasar.

## Cara Implementasi

Pilih solusi paling sederhana yang berfungsi (misalnya, gunakan loop alih-alih rekursi kompleks untuk menjumlahkan angka). Refactor kode kompleks ke dasar. Tanyakan, "Bisakah pemula memahami ini?"—jika tidak, sederhanakan.

```
Sederhana: [Input] --> [Proses] --> [Output]

Kompleks: [Input] --> [Subproses1] --> [Subproses2] --> [Output] (Tidak Perlu)
```

## Tautan

Untuk kesederhanaan di kode, lihat [Aturan Coding](../../coding-rules.md).
