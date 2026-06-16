# Composite

## Overview

**Composite** menyusun objek menjadi struktur *tree* untuk merepresentasikan hierarki *part-whole*. *Client* memperlakukan objek tunggal (*leaf*) dan kumpulan objek (*composite*) melalui *interface* yang sama, sehingga operasi pada *subtree* berperilaku seperti operasi pada satu *node*.

Pola ini muncul di *UI component tree*, API *filesystem*, bagan organisasi, dan struktur dokumen (bagian yang berisi paragraf). Composite menghilangkan *branching logic* dari pemanggil: alih-alih `if isLeaf { ... } else { for child ... }` tersebar di banyak tempat, satu panggilan `Render()` atau `Size()` pada *root* sudah menyebar dengan benar.

Pola ini menukar presisi tipe dengan keseragaman. Tidak setiap operasi masuk akal untuk setiap tipe *node*; *interface* harus dipilih agar *leaf* dan *composite* sama-sama mendukung kontrak—atau *composite* hanya mendelegasikan ke anak yang relevan.

## How it works

1. Definisikan *interface* **Component** dengan operasi yang dipakai *leaf* dan *composite* (mis. `Draw()`, `GetPrice()`).
2. **Leaf** mengimplementasikan Component secara langsung dengan perilaku terminal.
3. **Composite** menyimpan koleksi *child* Component dan mengimplementasikan Component dengan mendelegasikan ke anak (sering rekursif).
4. *Client* hanya berinteraksi dengan *interface* Component, tanpa tahu apakah instance adalah *leaf* atau *composite*.

Opsional: *composite* mengekspos `Add`/`Remove` untuk membangun *tree*; beberapa desain memisahkan mutasi *tree* ke *builder* agar *interface* Component tetap minimal.

## When to use

- Domain secara alami hierarkis dan *client* harus mengabaikan perbedaan satu item vs kumpulan.
- Operasi harus berlaku rekursif (jumlah berat, *render tree*, validasi *subtree*).
- Anda ingin menambah tipe komponen baru tanpa mengubah kode traversal di *client*.

## When not to use

- *Leaf* dan *composite* butuh API yang sangat berbeda—memaksa *interface* bersama menghasilkan metode kosong atau menyesatkan.
- *Type safety* kritis dan Anda tidak bisa toleran terhadap `interface{}` atau pengecekan *runtime* untuk operasi yang tidak didukung.
- Struktur datar; *list* atau *map* sederhana sudah cukup.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Kode *client* seragam untuk *tree* | *Interface* bersama bisa terlalu luas atau bocor |
| Mudah menambah tipe *leaf*/*composite* | Sulit membatasi operasi hanya untuk *leaf* |
| Cocok untuk algoritma rekursif | *Tree* dalam bisa menyembunyikan biaya performa |

## Example

Editor grafis: *interface* `Shape` dengan `Draw()`. `Circle` dan `Rectangle` adalah *leaf*. `Group` adalah *composite* yang menyimpan `[]Shape` dan menggambar setiap anak. *Canvas* memanggil `root.Draw()` baik `root` satu bentuk maupun *group* bersarang.

```go
type Shape interface {
    Draw() string
}

type Group struct {
    children []Shape
}

func (g Group) Draw() string {
    var out string
    for _, c := range g.children {
        out += c.Draw()
    }
    return out
}
```

## Related

- [Decorator](../design/decorator_id.md) — membungkus satu objek; Composite mengagregasi banyak
- [Facade](../design/facade_id.md) — menyederhanakan *subsystem*; Composite memodelkan struktur
- [Iterator](https://en.wikipedia.org/wiki/Iterator_pattern) — sering dipakai untuk menelusuri *composite tree*

## References

- Gamma, Helm, Johnson, Vlissides — *Design Patterns* (GoF), bab Composite
- Umum di *framework* UI (*React component tree*, *scene graph*)
