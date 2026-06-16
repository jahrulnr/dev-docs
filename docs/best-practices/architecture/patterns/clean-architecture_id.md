# Arsitektur Bersih (Clean Architecture)

## Overview

Clean Architecture adalah filosofi desain perangkat lunak yang dipopulerkan oleh Robert C. Martin (Uncle Bob) dan menyusun kode dalam lapisan konsentris (circles) untuk memisahkan concern. Ide utamanya: business logic (domain) harus independen dari detail eksternal seperti database, framework, atau user interface. Dengan begitu, perubahan pada lapisan luar (misalnya mengganti database) tidak mengganggu inti.

Prinsip kuncinya adalah “dependency rule”: inner layers tidak boleh bergantung pada outer layers. Dependency harus mengarah ke dalam (inward), sehingga testability, maintainability, dan fleksibilitas meningkat. Pendekatan ini sering dipakai untuk aplikasi kompleks dan selaras dengan SOLID serta Domain-Driven Design (DDD).

## Key components

Clean Architecture membagi aplikasi menjadi empat lapisan utama:

- **Entities**: Aturan bisnis inti dan struktur data yang independen dari framework atau teknologi apa pun.
- **Use Cases (Application Layer)**: Logika bisnis spesifik aplikasi yang mengorkestrasi entities. Lapisan ini berisi workflow aplikasi.
- **Interface Adapters**: Controllers, gateways, dan presenters yang mengadaptasi data antara use cases dan pihak eksternal (web frameworks, database).
- **Frameworks & Drivers**: Tools eksternal, database, web frameworks, dan komponen UI. Ini lapisan terluar.

```text
+---------------------+
| Framework & Driver  |
| (UI, DB, Framework) |
+---------------------+
          |
+---------------------+
| Adapter Antarmuka   |
| (Kontroler, Gateway)|
+---------------------+
          |
+---------------------+
| Kasus Penggunaan   |
| (Logika Aplikasi)   |
+---------------------+
          |
+---------------------+
|     Entitas         |
| (Aturan Bisnis Inti)|
+---------------------+
```

## When to use

Pilih Clean Architecture untuk:

- Aplikasi kompleks dengan persyaratan yang berkembang, di mana Anda perlu menukar teknologi (misalnya, dari SQL ke NoSQL).
- Tim yang memprioritaskan pemeliharaan jangka panjang dan kemampuan pengujian.
- Proyek menggunakan DDD, di mana model domain adalah pusat.

## When not to use

- Aplikasi yang sangat kecil ketika tambahan lapisan/indirection memperlambat delivery.
- Tim yang tidak bisa menjaga disiplin boundary; pola ini mudah “setengah diterapkan” dan berakhir lebih rumit.
- Codebase yang “domain logic”-nya minim dan mayoritas pekerjaan adalah CRUD plumbing (boleh ambil idenya seperti dependency inversion, tapi struktur tetap ringan).

## Implementation guide

1. **Organisir Kode berdasarkan Lapisan**: Buat folder seperti `domain/` (entitas), `application/` (kasus penggunaan), `infrastructure/` (adapter dan driver).
2. **Terapkan Inversi Dependensi**: Gunakan antarmuka di lapisan dalam (misalnya, antarmuka `UserRepository` di domain, diimplementasikan di infrastruktur).
3. **Jaga Dependensi ke Dalam**: Lapisan dalam tidak mengimpor lapisan luar. Gunakan injeksi dependensi untuk menghubungkannya.
4. **Uji dari Dalam ke Luar**: Mulai menguji entitas dan kasus penggunaan dengan mock untuk lapisan luar.

## Trade-offs

- **Lebih banyak tipe dan wiring**: Biasanya muncul interface, DTO, dan mapping code tambahan.
- **Butuh disiplin boundary**: Jika dependency rule sering dilanggar (import arah luar), manfaatnya cepat hilang.
- **Friction dengan framework**: Beberapa framework mendorong anotasi/ORM entities di mana-mana; simpan concern framework di outer layers.

## Examples

Di aplikasi e-commerce, entitas `Order` (domain) menangani aturan inti seperti "pesanan harus memiliki item." Kasus penggunaan `PlaceOrder` (aplikasi) mengorkestrasi ini. `OrderController` (adapter) menangani permintaan HTTP, dan `OrderRepository` (infrastruktur) menyimpan ke database.

## Related

- `docs/best-practices/principles/solid_id.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_id.md`
- `docs/best-practices/architecture/patterns/onion-architecture_id.md`
- `docs/best-practices/architecture/patterns/ddd_id.md`

## Links

Untuk lebih lanjut tentang prinsip SOLID, lihat [Prinsip SOLID](../../principles/solid_id.md). Untuk contoh DDD, periksa [Aturan Coding](../../principles/code-quality/clean-code_id.md).

## References

- Robert C. Martin, “The Clean Architecture” (overview konsep dan dependency rule).
