# Builder

## Overview

Pola **Builder** memisahkan konstruksi objek kompleks dari representasinya. Builder mengekspos konfigurasi step-by-step (sering fluent methods) dan `Build()` final yang menghasilkan product. Proses konstruksi yang sama bisa menghasilkan representasi berbeda dengan menukar concrete builder.

Builder umum di query API, HTTP client configurator, test data builder, dan protobuf/grpc message builder. Pola ini mengatasi **telescoping constructor**—constructor dengan banyak parameter opsional yang sulit dibaca dan rawan salah urutan.

## How it works

1. Definisikan interface `Builder` (atau abstract builder) dengan method konfigurasi dan `Build()`.
2. Implementasikan satu atau lebih concrete builder untuk varian product berbeda.
3. Opsional: **Director** yang mengorkestrasi urutan build tetap (jarang di application code).

Builder sering return `this` dari setter untuk chaining. Immutability product akhir adalah motivasi umum.

## When to use

- Banyak field opsional atau langkah konstruksi untuk satu tipe product.
- Ingin kode assembly yang readable, self-documenting, bukan constructor panjang.
- Algoritma konstruksi harus reusable dengan representasi berbeda (mis. JSON vs SQL query).

## When not to use

- Struct sederhana dengan sedikit field—constructor atau struct literal cukup.
- Objek yang harus valid di setiap langkah intermediate (pertimbangkan factory atau validated constructor).
- Saat pola functional options di Go (`WithTimeout`, `WithRetry`) sudah idiomatik dan cukup.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Konstruksi readable, menyembunyikan complexity | Lebih banyak tipe dan boilerplate |
| Mudah menambah step opsional tanpa break caller | Risiko partial state invalid sebelum `Build()` |
| Mendukung banyak representasi | Overkill untuk objek kecil |

## Example

`HTTPClientBuilder` set timeout, retry policy, dan TLS config, lalu `Build()` return immutable client:

```go
client := NewHTTPClientBuilder().
    WithTimeout(5 * time.Second).
    WithRetry(3).
    Build()
```

`QueryBuilder` menyusun `WHERE`, `ORDER BY`, dan `LIMIT` menjadi parameterized SQL string.

## Related

- [Factory Method](../design/factory-method_id.md)
- [Abstract Factory](../design/abstract-factory_id.md)

## References

- Gamma dkk. — *Design Patterns* (GoF), bab Builder
