# Factory Method

## Overview

**Factory Method** mendefinisikan *interface* untuk membuat objek tetapi membiarkan *subclass* atau implementor memutuskan *class* konkret mana yang diinstansiasi. Instansiasi ditunda ke *creator* khusus sementara kode *client* bergantung pada abstraksi, bukan tipe konkret.

Factory Method muncul di *framework* dengan titik ekstensi: `Document.CreatePage()`, *registry plugin* yang membangun *handler* berdasarkan nama, dan suite tes yang menukar implementasi nyata vs *mock* lewat *factory* yang diinjeksi. Ini saudara satu-produk dari **Abstract Factory**, yang mengelompokkan banyak metode pembuatan untuk produk terkait.

Berbeda dari **Builder** (perakitan bertahap satu objek kompleks), Factory Method biasanya mengembalikan produk yang sudah utuh dalam satu panggilan. Berbeda dari **Simple Factory** (fungsi mandiri), Factory Method bersifat polimorfik—*subclass* meng-override pembuatan.

## How it works

1. Definisikan *interface* **Product** yang merepresentasikan objek yang dibuat.
2. Definisikan **Creator** dengan *factory method* `CreateProduct()` (atau *interface* `Factory` di Go).
3. **Concrete creator** mengimplementasikan *factory method* untuk mengembalikan produk tertentu.
4. Kode *client* memakai *interface* Creator/Product; pemilihan lewat DI, konfigurasi, atau *subclass*.

Di Go, fungsi konstruktor dan *factory* yang mengembalikan *interface* (`NewReader(format string) Reader`) adalah Factory Method idiomatik tanpa pewarisan.

## When to use

- Sebuah *class* tidak bisa mengantisipasi tipe konkret yang harus dibuatnya.
- *Subclass* atau *plugin* harus mengontrol produk yang dibangun.
- Anda ingin memusatkan pembuatan untuk pengujian (injeksi *mock factory*).

## When not to use

- Hanya satu implementasi dan tidak akan bervariasi—konstruktor langsung lebih sederhana (YAGNI).
- Konstruksi butuh banyak langkah opsional—pertimbangkan Builder.
- Anda harus membuat keluarga produk yang selaras—pertimbangkan Abstract Factory.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Memisahkan *client* dari tipe konkret | Lebih banyak tipe dan indireksi |
| Ekstensi lewat *creator*/produk baru | Bisa menyembunyikan asal objek |
| Testability lewat injeksi *factory* | Overuse untuk panggilan `new` trivial |

## Example

```go
type Notifier interface {
    Send(msg string) error
}

type NotifierFactory interface {
    Create() Notifier
}

type EmailFactory struct{}
func (EmailFactory) Create() Notifier { return EmailNotifier{} }

type SMSFactory struct{}
func (SMSFactory) Create() Notifier { return SMSNotifier{} }

func NotifyAll(f NotifierFactory, msg string) error {
    return f.Create().Send(msg)
}
```

## Related

- [Abstract Factory](../design/abstract-factory_id.md) — keluarga produk terkait
- [Builder](../design/builder_id.md) — konstruksi kompleks multi-langkah
- [SOLID](../../principles/solid_id.md) — *wiring factory* konkret saat *startup*

## References

- Gamma et al. — *Design Patterns*, bab Factory Method
- Fungsi *factory* Go yang mengembalikan *interface* (idiom komunitas)
