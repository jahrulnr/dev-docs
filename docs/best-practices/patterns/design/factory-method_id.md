# Factory Method
## Gambaran Umum

Factory Method mendefinisikan antarmuka untuk membuat objek dan membiarkan subclass menentukan kelas konkrit yang diinstansiasi, memisahkan pembuatan dari penggunaan. Pola ini memungkinkan pembuatan objek yang fleksibel dan dapat diperluas.

## Kapan digunakan
- Saat kelas tidak dapat memprediksi tipe objek yang dibutuhkan.
- Saat subclass perlu mengendalikan instansiasi objek.
- Untuk meningkatkan testabilitas lewat penggantian factory saat pengujian.

## Panduan Implementasi
- Definisikan antarmuka Creator dengan metode `Create()`.
- Implementasikan Creator konkret yang mengembalikan produk berbeda.
- Gunakan dependency injection untuk memudahkan pengujian.

## Contoh (Gaya Go)
```go
type Product interface { Do() string }

type ConcreteA struct{}
func (ConcreteA) Do() string { return "A" }

type Factory interface { Create() Product }

type FactoryA struct{}
func (FactoryA) Create() Product { return ConcreteA{} }
```

## Kelebihan / Kekurangan
- Kelebihan: Enkapsulasi pembuatan, extensible.
- Kekurangan: Menambah jumlah tipe dan kompleksitas.

## Perhatian
- Hindari penggunaan berlebih ketika konstruktor sederhana cukup.

## Pola Terkait
Abstract Factory, Builder

## Referensi
- Gamma dkk., "Design Patterns: Elements of Reusable Object-Oriented Software".