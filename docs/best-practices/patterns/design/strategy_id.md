# Pola Strategi

## Gambaran Umum

Pola Strategi adalah pola desain perilaku yang mendefinisikan keluarga algoritma, mengenkapsulasi masing-masing, dan membuatnya dapat dipertukarkan. Ini memungkinkan algoritma bervariasi secara independen dari klien yang menggunakannya, mempromosikan fleksibilitas dan kemudahan pemeliharaan dengan memungkinkan pemilihan algoritma pada runtime.

Manfaat termasuk pemisahan kepentingan (logika algoritma dari kode klien), kemudahan ekstensi dengan strategi baru, kepatuhan terhadap prinsip open-closed, dan peningkatan kemampuan pengujian melalui injeksi strategi.

## Komponen Utama

- **Strategi**: Antarmuka atau kelas abstrak yang mendefinisikan kontrak algoritma.
- **Strategi Konkret**: Implementasi spesifik dari antarmuka Strategi.
- **Konteks**: Kelas yang menggunakan Strategi, mempertahankan referensi ke sana dan mendelegasikan eksekusi algoritma.

```text
Konteks
   |
   | menggunakan
   v
+----------------+       mengimplementasikan     +----------------+
| Antarmuka      |  <---------------  | Strategi       |
| Strategi       |                     | Konkret        |
+----------------+                     +----------------+
          ^
          |
     mengimplementasikan
          |
+----------------+
| Strategi       |
| Konkret 2      |
+----------------+
```

## Kapan Menggunakan

Gunakan ketika Anda memiliki beberapa algoritma untuk tugas tertentu dan ingin beralih di antara mereka pada runtime. Ketika Anda ingin menghindari pernyataan kondisional untuk pemilihan algoritma. Dalam framework yang memerlukan algoritma yang dapat dipasang. Ketika algoritma kompleks dan perlu diisolasi dari kode klien.

## Panduan Implementasi

1. Definisikan antarmuka Strategi dengan metode untuk algoritma.
2. Buat kelas Strategi Konkret yang mengimplementasikan antarmuka Strategi.
3. Buat kelas Konteks yang menerima Strategi di konstruktor atau melalui setter.
4. Konteks mendelegasikan eksekusi algoritma ke Strategi saat ini.
5. Klien dapat mengubah strategi secara dinamis dengan menyuntikkan implementasi yang berbeda.

## Contoh

Dalam sistem ecommerce, strategi diskon yang berbeda (PercentageDiscount, FixedAmountDiscount, BuyOneGetOne) dapat diterapkan pada pesanan.

```go
// Strategi
type DiscountStrategy interface {
    ApplyDiscount(amount float64) float64
}

// Strategi Konkret
type PercentageDiscount struct {
    percentage float64
}

func (p PercentageDiscount) ApplyDiscount(amount float64) float64 {
    return amount * (1 - p.percentage/100)
}

type FixedAmountDiscount struct {
    discount float64
}

func (f FixedAmountDiscount) ApplyDiscount(amount float64) float64 {
    return amount - f.discount
}

// Konteks
type Order struct {
    amount   float64
    strategy DiscountStrategy
}

func NewOrder(amount float64, strategy DiscountStrategy) *Order {
    return &Order{amount: amount, strategy: strategy}
}

func (o *Order) SetStrategy(strategy DiscountStrategy) {
    o.strategy = strategy
}

func (o *Order) CalculateTotal() float64 {
    return o.strategy.ApplyDiscount(o.amount)
}
```

## Tautan

Untuk pola arsitektural terkait, lihat [Clean Architecture](../architecture/clean-architecture_en.md). Untuk model domain, periksa [Coding Rules](../../coding-rules.md).