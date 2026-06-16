# Mediator

## Overview

**Mediator** mendefinisikan objek yang mengenkapsulasi cara sekumpulan objek berinteraksi. Alih-alih *peer* saling mereferensikan langsung (*dense coupling*), mereka berkomunikasi hanya melalui *mediator*. Ini memusatkan aturan interaksi dan memudahkan perubahan perilaku kolaborasi tanpa mengedit setiap partisipan.

Mediator muncul di *chat room* (pengguna mengirim pesan lewat ruangan, bukan langsung ke satu sama lain), *air-traffic control* (pesawat berbicara ke menara), koordinator dialog UI (*widget* memberi tahu *controller*; *controller* memperbarui *widget* lain), dan alur domain di mana banyak *aggregate* harus bereaksi pada *event* yang sama.

Trade-off yang familiar: Anda mengurangi **referensi spaghetti** tetapi memperkenalkan **hub** yang bisa tumbuh kompleks. Mediator yang disiplin mengekspos protokol sempit (*command*/*event*) alih-alih membuka seluruh internal partisipan.

## How it works

1. Definisikan *interface* **Mediator** dengan metode untuk setiap interaksi yang didukung (`Notify(sender, event)` atau *handler* bertipe).
2. Objek **Colleague** menyimpan referensi ke *mediator* dan memanggilnya saat butuh efek samping ke objek lain.
3. *Mediator* mengimplementasikan *routing*: dari *event*, memanggil *colleague* yang tepat dalam urutan yang tepat.
4. *Colleague* tidak menyimpan referensi langsung satu sama lain (atau hanya lemah, untuk tampilan).

*Event bus* dan *message broker* adalah *mediator* arsitektural pada skala lebih besar; pola GoF adalah bentuk OO dalam proses.

## When to use

- Banyak objek punya pola interaksi rumit *many-to-many*.
- Menggunakan ulang *colleague* di konteks lain akan menyeret dependensi yang tidak diinginkan.
- Aturan interaksi sering berubah dan harus berada di satu tempat.

## When not to use

- Hanya dua objek berinteraksi—referensi langsung lebih sederhana.
- *Mediator* menjadi *god object* dengan seluruh logika bisnis; pertimbangkan *domain service* atau batas *event-driven*.
- Sistem terdistribusi butuh *messaging* yang tahan lama—*mediator* in-memory saja tidak cukup.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Coupling lebih longgar antar *colleague* | Kompleksitas *mediator* bisa memusatkan risiko |
| Lebih mudah memahami aturan interaksi | Titik tunggal yang bisa jadi hambatan pengujian |
| Mendukung reuse *colleague* | Bisa menyembunyikan alur data jika terlalu diabstraksikan |

## Example

Form dengan `NameField`, `EmailField`, dan `SubmitButton`. Field memanggil `formMediator.OnChange()`. *Mediator* mengaktifkan Submit hanya jika kedua field valid, tanpa field saling tahu.

```go
type FormMediator interface {
    FieldChanged(name string, value string)
}

type LoginForm struct {
    emailValid, nameValid bool
}

func (m *LoginForm) FieldChanged(name, value string) {
    switch name {
    case "email":
        m.emailValid = strings.Contains(value, "@")
    case "name":
        m.nameValid = len(value) > 0
    }
    // enable submit UI based on m.emailValid && m.nameValid
}
```

## Related

- [Observer](../design/observer_id.md) — notifikasi satu-ke-banyak; Mediator mengkoordinasikan banyak-ke-banyak
- [Facade](../design/facade_id.md) — menyederhanakan *subsystem* untuk luar; Mediator mengatur komunikasi *peer*
- [Event-Driven Architecture](../../architecture/styles/event-driven-architecture_id.md) — mediasi skala *broker*

## References

- Gamma et al. — *Design Patterns*, bab Mediator
- *Controller* MVC/MVP sebagai *mediator* UI (praktik komunitas)
