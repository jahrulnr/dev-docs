# Arsitektur Berlapis (Layered Architecture)

## Overview

Layered Architecture (juga dikenal sebagai multitier atau n-tier) mengorganisir aplikasi ke dalam lapisan horizontal, masing-masing dengan tanggung jawab spesifik dan berkomunikasi hanya dengan lapisan yang berdekatan. Ini menciptakan pemisahan kepentingan yang jelas, membuat sistem modular dan lebih mudah dipelihara.

Manfaat termasuk pemisahan kepentingan, pemeliharaan, kemampuan pengujian, skalabilitas, dan reusabilitas. Lapisan dapat diperbarui atau diuji secara independen, dan lapisan bawah dapat digunakan kembali di berbagai presentasi.

## Key components

- **Lapisan Presentasi**: Menangani antarmuka pengguna dan interaksi (misalnya, halaman web, API, aplikasi mobile). Ini menampilkan data dan menangkap input pengguna.
- **Lapisan Aplikasi/Layanan**: Berisi alur kerja logika bisnis, mengorkestrasi operasi, dan bertindak sebagai jembatan antara presentasi dan lapisan domain.
- **Lapisan Domain/Bisnis**: Merangkum aturan bisnis inti, entitas, dan logika independen dari kepentingan eksternal.
- **Lapisan Infrastruktur/Data**: Mengelola persistensi data, layanan eksternal, dan operasi tingkat rendah (misalnya, database, sistem file, API).

```text
+---------------------+
| Lapisan Presentasi  |
| (UI, API)           |
+---------------------+
          |
+---------------------+
| Lapisan Aplikasi    |
| (Alur Kerja Bisnis) |
+---------------------+
          |
+---------------------+
| Lapisan Domain      |
| (Aturan Bisnis)     |
+---------------------+
          |
+---------------------+
| Lapisan Infrastruktur|
| (Data, Eksternal)   |
+---------------------+
```

## When to use

Gunakan untuk aplikasi kompleks dengan banyak pemangku kepentingan, membutuhkan evolusi independen UI, logika, dan data. Mendukung banyak frontend yang berbagi backend yang sama. Hindari di aplikasi sederhana di mana lapisan menambah kompleksitas yang tidak perlu.

## When not to use

- Service yang sangat kecil ketika layering memaksa indirection tambahan tanpa manfaat yang jelas.
- Tim yang sering “melompati” layer (presentation langsung memanggil data layer), sehingga boundary menjadi membingungkan dan coupling tersembunyi.
- Domain yang butuh modularitas kuat yang lebih cocok memakai Clean Architecture / Ports and Adapters (layering saja kadang tidak cukup melindungi domain).

## Implementation guide

1. Organisir kode ke dalam folder seperti `presentation/`, `application/`, `domain/`, `infrastructure/`.
2. Definisikan antarmuka di lapisan yang lebih tinggi untuk lapisan yang lebih rendah untuk diimplementasikan (misalnya, `UserRepository` di domain, diimplementasikan di infrastruktur).
3. Pastikan dependensi mengalir ke bawah: Presentasi bergantung pada Aplikasi, yang bergantung pada Domain, yang bergantung pada Infrastruktur. Gunakan injeksi dependensi.
4. Uji setiap lapisan secara isolasi (misalnya, mock lapisan data saat menguji logika bisnis).
5. Mulai kecil: Untuk aplikasi sederhana, mulai dengan Presentasi dan Domain, tambahkan lapisan seiring kompleksitas tumbuh.

## Trade-offs

- **Risiko layer leakage**: Tanpa disiplin, layer hanya jadi konvensi nama, bukan boundary.
- **Middle layer yang “anemic”**: “service layer” mudah berubah jadi kode penerus (pass-through) kalau aturan bisnis tidak dimodelkan dengan baik.
- **Cross-cutting concerns**: Logging/auth/transactions bisa menyebar di banyak layer tanpa pendekatan yang sistematis.

## Examples

Di aplikasi web, presentasi menangani rendering HTML, aplikasi memproses permintaan pengguna, domain memvalidasi aturan bisnis, infrastruktur menanyakan database.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_id.md`
- `docs/best-practices/architecture/patterns/onion-architecture_id.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_id.md`

## Links

Untuk pemisahan kepentingan, lihat [Aturan Coding](../../principles/code-quality/clean-code_id.md). Untuk pengujian lapisan, periksa [Infrastructure README](../../practices/integration/test-driven-development_id.md).

## References

- Martin Fowler, “PresentationDomainDataLayering” (overview layering dan variannya).
