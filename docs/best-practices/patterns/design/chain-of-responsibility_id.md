# Chain of Responsibility

## Overview

**Chain of Responsibility** meneruskan request sepanjang rantai handler. Setiap handler memproses request atau meneruskannya ke link berikutnya. Sender tidak tahu handler mana yang akhirnya bertindak—memisahkan producer dari consumer.

Pola ini muncul di HTTP middleware stack, logging pipeline (filter by level), eskalasi tiket support, dan UI event bubbling. Fleksibilitas komposisi ditukar dengan routing yang kurang eksplisit.

## How it works

1. Definisikan interface `Handler`: `Handle(request)` return handled atau pass-to-next.
2. Hubungkan handler berurutan (linked list, slice, atau middleware wrapper).
3. Chain berhenti saat handler memproses request atau chain habis (kasus unhandled harus didefinisikan).

Di web framework, middleware adalah bentuk dominan: setiap layer membungkus `http.Handler` berikutnya.

## When to use

- Banyak objek mungkin menangani request dan set-nya bisa berubah di runtime.
- Ingin menambah/menghapus processing step tanpa mengedit sender.
- Tahap processing opsional atau berurutan (validation → auth → business logic).

## When not to use

- Tepat satu handler harus selalu jalan—pakai direct dispatch.
- Urutan sulit dilacak dan debugging chain mahal untuk tim Anda.
- Chain dalam dengan logic berat—pertimbangkan pipeline dengan nama stage eksplisit dan observability.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Loose coupling, open for extension | Flow sulit ditrace dan di-debug |
| Stage composable (middleware) | Request bisa sampai akhir chain tanpa ditangani |
| Single Responsibility per handler | Overhead performa jika chain panjang |

## Example

HTTP middleware: CORS → authentication → rate limit → handler. Setiap middleware menulis response atau memanggil `next.ServeHTTP(w, r)`.

Logging: pesan masuk ke `DebugHandler`; jika level terlalu rendah, diteruskan ke `InfoHandler`, lalu `Warn`, lalu `Error`.

## Related

- [Decorator](../design/decorator_id.md)
- Middleware di stack `net/http`, Gin, Echo, Chi

## References

- Gamma dkk. — *Design Patterns*, Chain of Responsibility
