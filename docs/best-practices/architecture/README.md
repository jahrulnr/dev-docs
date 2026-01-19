# Architecture
## Overview

Folder ini berisi dokumentasi tentang architectural styles dan architectural patterns untuk membangun sistem yang scalable, maintainable, dan robust.

## Architectural Styles

Paradigma tingkat tinggi untuk mengorganisir komponen sistem:

- **[Monolithic Architecture](styles/monolithic-architecture_en.md)**: Aplikasi tunggal dengan semua komponen dalam satu codebase.
- **[Microservices Architecture](styles/microservices-architecture_en.md)**: Sistem terdiri dari layanan kecil yang independen.
- **[SOA (Service-Oriented Architecture)](styles/soa-architecture_en.md)**: Pendekatan berbasis layanan dengan kontrak yang jelas.
- **[Event-Driven Architecture](styles/event-driven-architecture_en.md)**: Sistem yang didorong oleh events dan messaging.
- **[Serverless Architecture](styles/serverless-architecture_en.md)**: Komputasi tanpa server dengan managed infrastructure.

## Architectural Patterns

Pola desain untuk mengorganisir kode dan komponen dalam aplikasi:

- **[Clean Architecture](patterns/clean-architecture_en.md)**: Separation of concerns dengan domain di pusat.
- **[Hexagonal Architecture](patterns/hexagonal-architecture_en.md)**: Ports and adapters untuk decoupling.
- **[Layered Architecture](patterns/layered-architecture_en.md)**: Struktur berlapis dengan dependencies satu arah.
- **[Onion Architecture](patterns/onion-architecture_en.md)**: Lapisan konsentris dengan domain sebagai core.
- **[MVC/MVP/MVVM](patterns/mvc_en.md)**: Patterns untuk UI separation.
- **[BFF (Backend for Frontend)](patterns/bff_en.md)**: Backend khusus untuk frontend tertentu.
- **[DDD (Domain-Driven Design)](patterns/ddd_en.md)**: Pendekatan berbasis domain business.

## Dokumentasi Bilingual

Semua dokumentasi tersedia dalam bahasa Inggris dan Indonesia dengan akhiran `_en.md` dan `_id.md`.

## Struktur Folder

```
architecture/
├── styles/          # Architectural styles
└── patterns/        # Architectural patterns
```

## Panduan Penggunaan

- Pilih architectural style berdasarkan ukuran tim, kompleksitas, dan requirements scalability.
- Gunakan patterns untuk implementasi detail dalam aplikasi.
- Referensi ke [Principles](../principles/) dan [Patterns](../patterns/) untuk best practices terkait.