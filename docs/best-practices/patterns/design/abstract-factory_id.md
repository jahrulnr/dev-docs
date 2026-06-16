# Abstract Factory

## Overview

**Abstract Factory** menyediakan *interface* untuk membuat keluarga objek terkait atau saling bergantung tanpa menentukan *class* konkretnya. Satu implementasi *factory* menghasilkan kumpulan produk yang koheren—*widget* UI untuk satu tema, adaptor *storage* untuk satu vendor cloud, atau *parser* untuk satu keluarga format file.

Di mana **Factory Method** menunda pembuatan satu produk ke *subclass*, Abstract Factory mengelompokkan banyak *factory method* agar *client* tetap konsisten: `DarkThemeFactory` selalu mengembalikan implementasi `Button`, `Dialog`, dan `Scrollbar` yang cocok, tidak pernah mencampur komponen terang dan gelap.

Pola ini kuat saat sistem harus menukar seluruh keluarga produk saat waktu konfigurasi. Biayanya adalah kekakuan: menambah tipe produk baru ke keluarga biasanya memperluas *interface abstract factory* dan setiap *concrete factory*.

## How it works

1. Definisikan *interface* **Product** abstrak (`Button`, `Checkbox`) untuk setiap jenis dalam keluarga.
2. Definisikan **AbstractFactory** dengan satu metode pembuatan per produk (`CreateButton()`, `CreateCheckbox()`).
3. Implementasikan **ConcreteFactory** per keluarga (`WinFactory`, `MacFactory`).
4. Kode *client* hanya bergantung pada AbstractFactory dan Product, menerima *factory* yang dikonfigurasi saat *startup*.

Hindari membocorkan tipe produk konkret ke *client*; pemilihan *factory* ada di *composition root* atau konfigurasi.

## When to use

- Objek harus dipakai bersama dan tidak boleh dicampur antar keluarga yang tidak kompatibel.
- Sistem harus independen dari cara produk dibuat, disusun, dan direpresentasikan.
- Anda mengantisipasi banyak jalur produk paralel (tema, platform, *tenant*).

## When not to use

- Hanya satu tipe produk yang dibuat—Factory Method atau konstruktor sederhana cukup.
- Keluarga jarang berubah dan hanya ada satu implementasi—YAGNI berlaku.
- Tipe produk baru sering ditambahkan—perubahan *abstract factory* merusak maintainability.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Menegakkan konsistensi dalam satu keluarga | Menambah produk menyentuh semua *factory* |
| Mengisolasi *class* konkret dari *client* | Lebih banyak *interface* dan implementasi |
| Keluarga dapat ditukar saat *runtime*/konfigurasi | Berat untuk kumpulan produk kecil |

## Example

Toolkit lintas platform:

```go
type UIFactory interface {
    CreateButton() Button
    CreateMenu() Menu
}

type MacFactory struct{}
func (MacFactory) CreateButton() Button { return MacButton{} }
func (MacFactory) CreateMenu() Menu     { return MacMenu{} }

func RenderApp(f UIFactory) {
    btn := f.CreateButton()
    menu := f.CreateMenu()
    // both match macOS look-and-feel
}
```

## Related

- [Factory Method](../design/factory-method_id.md) — pembuatan satu produk; sering dipakai di dalam *concrete factory*
- [Builder](../design/builder_id.md) — konstruksi bertahap satu produk kompleks
- [Prototype](https://en.wikipedia.org/wiki/Prototype_pattern) — klon instance yang ada alih-alih pembuatan *factory*

## References

- Gamma et al. — *Design Patterns*, bab Abstract Factory
- Lapisan abstraksi platform dan keluarga *plugin* multi-*tenant*
