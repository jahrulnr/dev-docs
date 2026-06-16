# Arsitektur Onion (Onion Architecture)

## Overview

Onion Architecture, dibuat oleh Jeffrey Palermo, mengorganisir kode ke dalam lapisan yang "mengupas" ke luar dari inti domain, menekankan Domain-Driven Design (DDD). Lapisan terdalam adalah logika bisnis murni, dan lapisan luar menangani infrastruktur. Ini mirip dengan Clean Architecture tetapi lebih fokus pada prinsip DDD.

Manfaat utama adalah pemeliharaan: Perubahan pada lapisan luar (seperti mengganti ORM) tidak memengaruhi inti. Ini mempromosikan prinsip SOLID dan pemisahan kepentingan, membuat sistem kuat untuk domain bisnis yang kompleks.

## Key components

- **Lapisan Domain**: Entitas bisnis inti, objek nilai, dan layanan. Ini adalah jantung aplikasi.
- **Lapisan Aplikasi**: Kasus penggunaan dan perintah yang mengorkestrasi logika domain. Ini bertindak sebagai jembatan.
- **Lapisan Infrastruktur**: Repositori, layanan eksternal, dan komponen UI. Ini menangani dependensi eksternal.

```text
+---------------------+
| Lapisan Infrastruktur|
| (UI, DB, Eksternal) |
+---------------------+
          |
+---------------------+
| Lapisan Aplikasi    |
| (Kasus Penggunaan,  |
|  Perintah)          |
+---------------------+
          |
+---------------------+
| Lapisan Domain      |
| (Entitas, Layanan)  |
+---------------------+
```

## When to use

Pilih Onion Architecture untuk:

- Proyek berfokus DDD dengan logika bisnis yang kompleks.
- Aplikasi yang membutuhkan skalabilitas dan independensi dari alat eksternal.
- Tim yang membangun microservices atau sistem enterprise.
- Hindari di aplikasi sederhana di mana struktur berlapis menambah kompleksitas.

## When not to use

- Aplikasi sederhana ketika kompleksitas domain rendah dan layering menambah overhead.
- Tim yang belum siap berinvestasi pada pemodelan domain (tanpa disiplin DDD, Onion Architecture seringnya runtuh jadi “sekadar folder”).

## Implementation guide

1. **Lapisan Kode dengan Domain di Pusat**: Struktur folder sebagai `domain/`, `application/`, `infrastructure/`.
2. **Gunakan Antarmuka untuk Komunikasi Lintas Lapisan**: Definisikan kontrak di lapisan dalam.
3. **Terapkan Inversi Dependensi**: Infrastruktur mengimplementasikan antarmuka domain.
4. **Uji Domain Pertama**: Pastikan logika inti diuji secara independen.
5. **Perluas Secara Bertahap**: Tambahkan lapisan seiring kompleksitas bisnis tumbuh.

## Trade-offs

- **Indirection tambahan**: Interface dan mapping code menambah kompleksitas di awal.
- **Biaya domain modeling**: Payoff bergantung pada apakah ada aturan bisnis yang bermakna di domain.
- **Risiko “infrastruktur bocor ke domain”**: Tanpa disiplin, anotasi ORM dan tipe framework ikut masuk ke core.

## Examples

Di aplikasi perbankan, domain menangani aturan "saldo akun". Lapisan aplikasi memproses "transfer uang". Infrastruktur menyimpan ke database.

## Related

- `docs/best-practices/architecture/patterns/clean-architecture_id.md`
- `docs/best-practices/architecture/patterns/hexagonal-architecture_id.md`
- `docs/best-practices/architecture/patterns/ddd_id.md`

## Links

Untuk detail DDD, lihat [Aturan Coding](../../principles/code-quality/clean-code_id.md). Untuk SOLID, periksa [Prinsip SOLID](../../principles/solid_id.md).

## References

- Jeffrey Palermo, “The Onion Architecture” (pengantar awal).
