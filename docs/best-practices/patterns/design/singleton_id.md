# Singleton

## Overview

**Singleton** memastikan sebuah *class* hanya punya satu instance dan menyediakan titik akses global ke instance tersebut. Motivasi umum: mengoordinasikan akses ke sumber daya bersama (*configuration registry*, fasad *connection pool*, perangkat keras) atau mengamortisasi inisialisasi yang mahal.

Singleton termasuk pola yang paling **disalahgunakan**. *Global mutable state* mempersulit pengujian, menyembunyikan dependensi, dan mendorong *coupling* implisit. Panduan modern sering lebih memilih **dependency injection** dari satu instance bersama yang dikonfigurasi saat *startup* aplikasi alih-alih panggilan `GetInstance()` tersebar di *codebase*.

Saat Singleton tepat, perlakukan sebagai **scoped singleton** (satu instance per proses atau per *request context*), buat inisialisasi *thread-safe*, dan hindari logika bisnis di dalam tipe *singleton*.

## How it works

1. Sembunyikan konstruktor (*private* atau tingkat paket) agar kode eksternal tidak bisa `new` instance sembarangan.
2. Ekspos aksesor statis/global (`Instance()`, `sync.Once` di Go) yang membuat instance tunggal secara *lazy* atau *eager*.
3. Opsional: bungkus dengan *subclass* atau *interface* untuk pengujian (*reset hook* hanya di tes).

Di Go, `var` tingkat paket dengan `sync.Once` idiomatik saat benar-benar butuh satu instance. Banyak tim malah meneruskan *interface* lewat konstruktor dan memakai `wire`/`fx` di *composition root*.

## When to use

- Secara kebijakan harus ada tepat satu instance (*OS resource*, pemuat konfigurasi global).
- Biaya membuat objek tinggi dan reuse selalu diinginkan.
- Anda butuh *registry* global sempit yang terdokumentasi tanpa mutasi tersembunyi.

## When not to use

- Demi kemudahan—untuk menghindari meneruskan dependensi (pakai DI).
- Saat unit test butuh implementasi alternatif (*interface* + injeksi).
- Di sistem terdistribusi—setiap proses punya instance sendiri; *singleton* cluster-wide butuh koordinasi eksternal (*DB lock*, *leader election*).

## Trade-offs

| Pros | Cons |
| --- | --- |
| Instance tunggal terkontrol | Dependensi global tersembunyi |
| *Lazy init* bisa menunda biaya | Kompleksitas *thread-safety* dan *lifecycle* |
| Pola familiar di *legacy codebase* | Sulit diuji secara terisolasi |

## Example

Inisialisasi *lazy* *thread-safe* di Go:

```go
var (
    instance *Config
    once     sync.Once
)

func ConfigInstance() *Config {
    once.Do(func() {
        instance = loadConfig()
    })
    return instance
}
```

Lebih disarankan: `func NewServer(cfg Config, db DB) *Server` dengan `cfg` dibangun sekali di `main()`.

## Related

- [Factory Method](../design/factory-method_id.md) — pola pembuatan; Singleton membatasi kardinalitas
- [Abstract Factory](../design/abstract-factory_id.md) — keluarga objek; hindari *factory singleton* tanpa kebutuhan
- [Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) — alternatif yang disukai untuk testability

## References

- Gamma et al. — *Design Patterns*, bab Singleton
- Pandangan kritis: "Singleton considered harmful" dalam literatur pengujian; preferensi komunitas Go untuk *wiring* eksplisit
