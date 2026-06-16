# Command

## Overview

**Command** mengenkapsulasi sebuah *request* sebagai objek, sehingga Anda bisa memparameterisasi *client* dengan *request* berbeda, mengantrekan atau mencatat operasi, dan mendukung *undo*. *Invoker* menyimpan *interface* `Command` dan memanggil `Execute()` tanpa mengetahui detail aksi konkret; *receiver* mengimplementasikan pekerjaan sebenarnya.

Command menggerakkan *undo/redo* di editor, *job queue* (setiap *job* adalah *command*), makro transaksional, payload RPC, dan model tulis CQRS di mana *command* merepresentasikan intent (`PlaceOrder`, `UpdateProfile`). Memisahkan invokasi dari eksekusi memungkinkan *cross-cutting concern*: *logging*, otorisasi, *retry*, dan penjadwalan membungkus eksekusi secara seragam.

Pola ini berpasangan natural dengan tumpukan riwayat **Invoker** untuk *undo* dan dengan **Composite** untuk makro *command* (batch sub-command).

## How it works

1. Definisikan `Command` dengan `Execute()` (dan opsional `Undo()`).
2. **Concrete command** menyimpan parameter dan referensi ke **Receiver** (atau *closure* atas dependensi).
3. **Invoker** memicu `command.Execute()`; bisa menyimpan *command* di tumpukan untuk *undo*.
4. **Receiver** berisi logika domain; *command* adalah adaptor tipis.

Objek *command* yang *immutable* menyederhanakan *replay* dan audit. *Receiver* idempoten penting saat *command* bisa di-*retry*.

## When to use

- Anda perlu mengantrekan, menjadwalkan, atau mencatat *request* sebagai nilai kelas pertama.
- *Undo/redo* atau *rollback* transaksional diperlukan.
- *Invoker* yang sama harus menjalankan banyak tipe operasi lewat satu API.
- Anda memodelkan intent domain secara eksplisit (*CQRS command*).

## When not to use

- Panggilan fungsi sederhana tanpa kebutuhan audit, antrian, atau *undo*—tipe ekstra menambah noise.
- *Command* membawa *state* mutable besar—lebih baik *event* atau DTO dengan batas jelas.
- *Saga* terdistribusi butuh lebih dari objek Command dalam proses (*outbox*, *messaging*).

## Trade-offs

| Pros | Cons |
| --- | --- |
| Memisahkan *invoker* dari *receiver* | Proliferasi tipe *command* kecil |
| Mendukung *undo*, antrian, makro | Indireksi dan *boilerplate* |
| *Wrapper cross-cutting* (auth, metrik) | *Undo* harus didesain per operasi |

## Example

Editor teks menyimpan `InsertTextCommand` dengan offset dan string. *Invoker* mengeksekusi dan mendorong ke tumpukan *undo*. `Undo()` menghapus rentang yang disisipkan.

```go
type Command interface {
    Execute() error
    Undo() error
}

type InsertText struct {
    doc   *Document
    pos   int
    text  string
}

func (c InsertText) Execute() error {
    return c.doc.Insert(c.pos, c.text)
}
func (c InsertText) Undo() error {
    return c.doc.Delete(c.pos, len(c.text))
}
```

## Related

- [Chain of Responsibility](../design/chain-of-responsibility_id.md) — *pipeline handler*; Command adalah aksi terenkapsulasi
- [Strategy](../design/strategy_id.md) — algoritma yang dapat ditukar; Command adalah objek *request* dengan *lifecycle*
- [State](../design/state_id.md) — transisi bisa digerakkan oleh *command*

## References

- Gamma et al. — *Design Patterns*, bab Command
- *CQRS command handler* dalam praktik domain-driven design
