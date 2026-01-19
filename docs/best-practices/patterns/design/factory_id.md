# Pola Pabrik

## Gambaran Umum

Pola Pabrik adalah pola desain kreasi yang menyediakan antarmuka untuk membuat objek di superclass, tetapi memungkinkan subclass untuk mengubah jenis objek yang akan dibuat. Ini mengenkapsulasi logika pembuatan objek, mempromosikan loose coupling dan membuat kode lebih fleksibel dan mudah dipelihara.

Manfaat termasuk enkapsulasi logika instansiasi, pengujian yang lebih mudah (mock factories), kepatuhan terhadap prinsip open-closed, dan dukungan untuk polimorfisme.

## Komponen Utama

- **Produk**: Antarmuka atau kelas abstrak yang mendefinisikan objek yang akan dibuat.
- **Produk Konkret**: Implementasi spesifik dari Produk.
- **Pembuat (Pabrik)**: Antarmuka atau kelas abstrak yang mendeklarasikan metode pabrik.
- **Pembuat Konkret**: Mengimplementasikan metode pabrik untuk mengembalikan instance Produk Konkret.

```text
Pembuat (Pabrik Abstrak)
          |
          v
+----------------+       Membuat       +----------------+
| Pembuat        |  --------------->  | Produk         |
| Konkret        |                     | Konkret        |
+----------------+                     +----------------+
          ^
          |
     Metode Pabrik
```

## Kapan Menggunakan

Gunakan ketika jenis objek yang tepat untuk dibuat ditentukan pada runtime. Ketika Anda ingin memusatkan logika pembuatan objek. Dalam framework di mana subclass memutuskan objek mana yang akan diinstansiasi. Hindari ketika pembuatan objek sederhana dan tidak memerlukan abstraksi.

## Panduan Implementasi

1. Definisikan antarmuka Produk atau kelas abstrak.
2. Buat kelas Produk Konkret yang mengimplementasikan Produk.
3. Definisikan kelas Pembuat abstrak dengan metode pabrik yang mengembalikan Produk.
4. Implementasikan kelas Pembuat Konkret yang menimpa metode pabrik untuk mengembalikan Produk Konkret spesifik.
5. Gunakan pabrik dalam kode klien untuk membuat objek tanpa mengetahui jenis yang tepat.

## Contoh

Dalam sistem ecommerce, PaymentFactory membuat prosesor pembayaran yang berbeda (misalnya, CreditCardPayment, PayPalPayment) berdasarkan pilihan pengguna.

```go
// Produk
type PaymentProcessor interface {
    Process(amount float64) error
}

// Produk Konkret
type CreditCardProcessor struct{}
func (c CreditCardProcessor) Process(amount float64) error { /* implementasi */ }

type PayPalProcessor struct{}
func (p PayPalProcessor) Process(amount float64) error { /* implementasi */ }

// Pembuat
type PaymentFactory interface {
    CreateProcessor() PaymentProcessor
}

// Pembuat Konkret
type CreditCardFactory struct{}
func (c CreditCardFactory) CreateProcessor() PaymentProcessor {
    return CreditCardProcessor{}
}
```

## Tautan

Untuk pola arsitektural terkait, lihat [Clean Architecture](../architecture/clean-architecture_en.md). Untuk model domain, periksa [Coding Rules](../../coding-rules.md).
