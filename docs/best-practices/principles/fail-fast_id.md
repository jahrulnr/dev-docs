# Prinsip Fail-Fast

## Gambaran Umum

Fail-Fast berarti mendeteksi dan melaporkan kesalahan segera, menghentikan proses yang cacat. Digunakan di desain sistem, ini kontras dengan sistem fault-tolerant.

Periksa kondisi awal (misalnya, preconditions, state); lempar exception atau hentikan pada kesalahan. Manfaat: Debugging lebih mudah, mencegah kegagalan diam, meningkatkan reliabilitas.

## Kapan Menggunakan

Di sistem kritis, iterator, atau pemeriksaan startup; saat kesalahan bisa cascade.

## Cara Implementasi

Validasi input di awal fungsi (misalnya, `if (!valid) throw Error`). Gunakan assertions. Gagal awal seperti layar game over—jangan biarkan data buruk menyusup.

```
[Input] --> [Periksa] --> [Gagal jika Tidak Valid] --> [Proses]
                    |
                    v
               [Henti Kesalahan]
```

## Tautan

Untuk penanganan kesalahan, lihat [Aturan Coding](../../coding-rules.md).
