# Singleton
## Gambaran Umum

Singleton memastikan sebuah tipe hanya memiliki satu instance dan menyediakan titik akses global. Gunakan dengan hemat; dependency injection sering merupakan solusi yang lebih baik. Pola ini berguna untuk mengelola sumber daya bersama tetapi dapat menyebabkan coupling ketat dan kesulitan testing jika digunakan berlebihan.

## Kapan digunakan
- Sumber daya bersama yang mahal untuk dibuat (pool koneksi, cache).
- Ketika diperlukan titik koordinasi tunggal.

## Panduan Implementasi
- Prefer dependency injection demi testabilitas.
- Pastikan inisialisasi thread-safe (mis., `sync.Once` di Go) dan hindari state global yang mutable.

## Contoh (Go)
```go
var (
    cfg *Config
    once sync.Once
)

func GetConfig() *Config {
    once.Do(func() { cfg = loadConfig() })
    return cfg
}
```

## Kelebihan / Kekurangan
- Kelebihan: Akses sederhana ke sumber daya bersama.
- Kekurangan: Menyembunyikan dependency, mempersulit pengujian.

## Perhatian
- Hindari ketergantungan bisnis pada singleton; injeksikan dependency untuk menjaga testabilitas.

## Referensi
- Pola desain dan praktik terbaik per bahasa.