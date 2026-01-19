# Anti-patterns
## Overview

Daftar anti-patterns yang perlu dihindari dan strategi mitigasinya. Anti-patterns adalah praktik buruk yang sering terjadi dalam pengembangan software yang dapat menyebabkan masalah maintainability, scalability, dan reliability.

## Daftar Anti-patterns

- **[Big Ball of Mud](big-ball-of-mud_en.md)**: Sistem yang tidak terstruktur dengan dependencies yang kompleks dan sulit dipahami.
- **[God Object](god-object_en.md)**: Class atau object yang melakukan terlalu banyak hal, melanggar Single Responsibility Principle.
- **[Spaghetti Code](spaghetti-code_en.md)**: Kode yang tidak terorganisir dengan flow control yang rumit dan sulit diikuti.
- **[Distributed Monolith](distributed-monolith_en.md)**: Aplikasi yang di-deploy sebagai microservices tapi masih memiliki coupling yang ketat.
- **[Shared Database in Microservices](shared-database-in-microservices_en.md)**: Microservices yang berbagi database, menyebabkan tight coupling.
- **[Chatty Services](chatty-services_en.md)**: Layanan yang melakukan terlalu banyak network calls kecil, mengurangi performance.

## Dokumentasi Bilingual

Semua anti-patterns tersedia dalam versi bahasa Indonesia:
- [Big Ball of Mud (ID)](big-ball-of-mud_id.md)
- [God Object (ID)](god-object_id.md)
- [Spaghetti Code (ID)](spaghetti-code_id.md)
- [Distributed Monolith (ID)](distributed-monolith_id.md)
- [Shared Database in Microservices (ID)](shared-database-in-microservices_id.md)
- [Chatty Services (ID)](chatty-services_id.md)

## Cara Menggunakan

Setiap dokumentasi anti-pattern mencakup:
- Deskripsi masalah
- Dampak negatif
- Penyebab umum
- Solusi dan best practices
- Contoh implementasi