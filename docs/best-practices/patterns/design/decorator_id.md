# Decorator

## Overview

**Decorator** menambahkan tanggung jawab ekstra ke objek secara dinamis. *Decorator* mengimplementasikan *interface* yang sama dengan komponen yang dibungkus dan meneruskan panggilan sambil menambah perilaku sebelum atau sesudah (*logging*, *caching*, kompresi, otorisasi). Komposisi menggantikan ledakan *subclass* untuk fitur opsional.

Decorator berbeda dari **Adapter** (terjemahan *interface*) dan **Proxy** (kontrol akses, *lazy loading*, sering tak terlihat). Intent Decorator adalah **perluasan perilaku transparan** berlapis: `BufferedStream` membungkus `FileStream`; `MetricsHandler` membungkus `BusinessHandler`.

Di banyak *codebase*, *middleware*, *wrapper*, dan rantai `io.Reader` di Go adalah struktur *decorator* meski tidak dinamai demikian.

## How it works

1. Definisikan *interface* **Component** dengan operasi inti.
2. **ConcreteComponent** mengimplementasikan perilaku dasar.
3. **Decorator** menyimpan referensi ke Component (atau *interface*), mengimplementasikan *interface* yang sama, dan mendelegasikan dengan tambahan.
4. Tumpuk beberapa *decorator*: `new Retry(new Metrics(new HTTPClient(base)))`.

Urutan penting: *caching* di luar *retry* berbeda dari *retry* di luar *caching*.

## When to use

- Tanggung jawab bisa dikombinasikan secara bebas dan tidak boleh ditetapkan di waktu kompilasi lewat pewarisan.
- Anda ingin menambah perilaku tanpa mengubah *class* asli (*Open/Closed*).
- Fitur adalah lapisan *cross-cutting* opsional (metrik, *tracing*, *rate limit*).

## When not to use

- Satu kombinasi perilaku yang stabil—*class* konkret atau *pipeline* fungsi dengan tahap bernama mungkin lebih jelas.
- Tumpukan *decorator* dalam dan sulit di-*debug*—dokumentasikan urutan dan pertimbangkan tipe *pipeline* eksplisit.
- *Interface* objek yang dibungkus besar—mendekorasi setiap metode melelahkan; *aspect-oriented* atau *middleware hook* mungkin lebih cocok.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Komposisi fitur fleksibel | Banyak tipe *wrapper* kecil |
| *Open/closed* untuk *decorator* baru | *Debugging* melalui lapisan |
| Penumpukan saat *runtime* | *Interface* harus konsisten |

## Example

*Interface* `DataSource`; `LoggingDecorator` mencatat log sebelum mendelegasikan; `CachingDecorator` mengembalikan hasil *cache* jika valid.

```go
type DataSource interface {
    Fetch(id string) ([]byte, error)
}

type LoggingDS struct{ next DataSource }

func (d LoggingDS) Fetch(id string) ([]byte, error) {
    log.Printf("fetch %s", id)
    return d.next.Fetch(id)
}
```

*HTTP middleware* yang membungkus `http.Handler` adalah ide struktural yang sama.

## Related

- [Adapter](../design/adapter_id.md) — mengubah *interface*; Decorator mempertahankannya
- [Chain of Responsibility](../design/chain-of-responsibility_id.md) — rantai serupa; *routing* vs enrichment
- [Proxy](../design/proxy_id.md) — sering mengontrol akses; Decorator menambah perilaku

## References

- Gamma et al. — *Design Patterns*, bab Decorator
- Pola *wrapper* paket `io` di Go; tumpukan *HTTP middleware*
