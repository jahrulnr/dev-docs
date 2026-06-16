# SOLID Principles

## Overview

SOLID adalah sekumpulan lima prinsip desain untuk pemrograman berorientasi objek (OOP) yang membantu membuat kode lebih mudah dipahami, fleksibel, dan mudah dirawat. Prinsip ini dipopulerkan oleh Robert C. Martin (Uncle Bob) untuk mengurangi “code rot” dengan mendorong tipe yang kecil, fokus, dan boundary yang lebih stabil.

Lima prinsipnya adalah: Single Responsibility (SRP), Open-Closed (OCP), Liskov Substitution (LSP), Interface Segregation (ISP), dan Dependency Inversion (DIP). Jika diterapkan dengan tepat, SOLID biasanya meningkatkan testability, mempermudah perubahan inkremental, dan mengurangi coupling yang tidak disengaja.

## Key ideas

- Mengutamakan **cohesion** (tanggung jawab yang fokus) dibanding “god object”.
- Menjaga behavior tetap **extensible** tanpa sering mengubah code path yang sudah stabil.
- Membuat relasi subtype **aman secara perilaku** (kontrak itu penting).
- Menjaga interface tetap **kecil dan spesifik per-klien**.
- Mendorong dependency **ke arah abstraksi** (loose coupling), sering lewat **dependency injection**.

## When to use

- Codebase yang akan terus berkembang (fitur bertambah, tim berganti, banyak maintainer).
- Domain yang butuh correctness dan testability (business rules, pricing, authorization, workflow).
- Sistem yang butuh seam yang jelas untuk penggantian/integrasi (adapters, persistence, external APIs).

## When not to use

- One-off script, prototype, atau glue code yang lebih mengejar kecepatan dibanding longevity.
- Program kecil yang manfaatnya belum sebanding dengan tambahan indirection.
- Hot path yang sangat sensitif performa ketika allocation/virtual dispatch menjadi bottleneck utama (terapkan selektif).

## Trade-offs

- **Biaya indirection**: lebih banyak tipe/interface bisa membuat kode lebih sulit dinavigasi tanpa naming dan struktur yang baik.
- **Risiko over-engineering**: mengejar “SOLID sempurna” bisa memperlambat delivery dan menyembunyikan logic sederhana di balik abstraksi.
- **Sangat bergantung konteks**: SOLID adalah heuristic; terapkan di area yang tekanan perubahan dan kompleksitasnya memang tinggi.

## Single Responsibility Principle (SRP)

Satu class sebaiknya punya satu “reason to change” (satu job). Ini membuat class tetap fokus dan mencegah satu tipe mengurus terlalu banyak hal.

**When to use**: Saat sebuah tipe mencampur concern yang berbeda (misalnya business rules + I/O + formatting).

**How to implement**: Pisahkan responsibility ke tipe terpisah (contoh: entity `User` menyimpan state, sedangkan `EmailService` menangani pengiriman email).

**Common pitfall**: Memecah terlalu dini menjadi banyak tipe kecil tanpa boundary yang jelas.

## Open-Closed Principle (OCP)

Software entities sebaiknya “open for extension” tetapi “closed for modification”. Tambah fitur baru tanpa perlu mengedit kode yang sudah stabil.

**When to use**: Saat menambah variant baru di code path yang stabil (payment method baru, export format baru, rule baru).

**How to implement**: Lebih aman memilih composition dengan interface/strategy; gunakan inheritance hanya jika relasi subtype-nya valid dan stabil.

**Common pitfall**: Menyalahgunakan inheritance sebagai pengganti konfigurasi (fragile base class).

## Liskov Substitution Principle (LSP)

Subtype harus bisa menggantikan base type tanpa merusak behavior. Artinya, class turunan tidak boleh melanggar kontrak yang dijanjikan oleh base type.

**When to use**: Setiap kali Anda mengandalkan polymorphism (inheritance atau implementasi interface) di core flow.

**How to implement**: Jaga preconditions/postconditions dan invariants; hindari memperketat input atau melemahkan jaminan di subtype.

**Common pitfall**: Subtype yang melempar “not supported” saat runtime untuk method yang seharusnya didukung.

## Interface Segregation Principle (ISP)

Client tidak seharusnya dipaksa bergantung pada method yang tidak dipakai. Interface idealnya kecil dan spesifik.

**When to use**: Saat sebuah interface membesar dan berbagai client hanya membutuhkan subset yang berbeda.

**How to implement**: Pecah menjadi beberapa interface yang fokus; desain interface dari perspektif client.

**Common pitfall**: Membuat terlalu banyak micro-interface tanpa pemakaian yang jelas (menurunkan discoverability).

## Dependency Inversion Principle (DIP)

Bergantung pada abstraksi, bukan concrete implementation. High-level module sebaiknya tidak bergantung pada low-level module secara langsung. Ini mendorong loose coupling.

**When to use**: Saat Anda perlu mengganti infrastruktur (DB, HTTP client) atau mengisolasi business logic agar mudah diuji.

**How to implement**: Buat interface yang stabil di boundary lalu wire implementasinya lewat dependency injection (constructor injection sering jadi default yang aman).

```text
Without DIP (Tight Coupling):
[High-Level Module] --> [Low-Level Module]

With DIP (Loose Coupling):
[High-Level Module] --> [Abstraction (Interface)] <-- [Low-Level Module]
```

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_id.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_id.md`
- `docs/best-practices/architecture/patterns/layered-architecture_id.md`

## Links

Untuk contoh, lihat [Coding Rules](../../principles/code-quality/clean-code_id.md).

## References

- Robert C. Martin, *Agile Software Development: Principles, Patterns, and Practices*.
