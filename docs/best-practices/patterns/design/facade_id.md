# Facade

## Overview

**Facade** menyediakan *interface* terpadu dan disederhanakan ke *subsystem* kompleks yang terdiri dari banyak *class*, modul, atau *service*. Facade tidak sepenuhnya menyembunyikan *subsystem*—pemanggil tingkat lanjut masih bisa mengakses API bawah—tetapi sebagian besar *client* berinteraksi dengan satu titik masuk yang jelas alih-alih mengorkestrasi banyak dependensi.

Facade muncul di batas modul: `PaymentService` yang membungkus *gateway client*, *idempotency store*, dan *ledger writer*; `MediaTranscodeFacade` di atas FFmpeg, *storage*, dan *queue publisher*; atau API publik *library* di atas paket internal. Tujuannya **menurunkan beban kognitif** dan **kontrak yang stabil** sementara internal berkembang.

Facade sering disamakan dengan Adapter (menerjemahkan *interface* yang tidak kompatibel) dan Mediator (mengkoordinasikan objek sejajar). Intent Facade adalah **penyederhanaan subsystem**, bukan konversi protokol atau *routing* antar-objek.

## How it works

1. Identifikasi kumpulan tipe yang berkolaborasi dan saat ini di-*wire* manual oleh *client*.
2. Definisikan tipe **Facade** yang menyimpan referensi ke komponen *subsystem* (*constructor injection* atau *lazy init*).
3. Ekspos metode tingkat tinggi yang memetakan *use case* umum (`PlaceOrder`, `UploadAndProcess`).
4. Delegasikan ke *class* *subsystem*; simpan orkestrasi, *default*, dan pemetaan *error* di facade.

Facade bisa tipis atau menyertakan kebijakan (*retry*, *caching*, *feature flag*). Hindari aturan bisnis yang membengkak di dalam facade—itulah domain *service*.

## When to use

- *Client* berulang kali menjalankan interaksi multi-langkah yang sama dengan *subsystem*.
- Anda ingin memisahkan kode aplikasi dari struktur paket internal atau verbositas SDK pihak ketiga.
- Anda mendefinisikan permukaan publik *library* atau *bounded context*.

## When not to use

- *Subsystem* sudah mengekspos satu API yang jelas dan minimal.
- Setiap pemanggil butuh kontrol tingkat rendah yang berbeda—facade yang melayani semua kasus menjadi *god object*.
- Anda hanya butuh terjemahan *interface* antara dua API yang ada—pakai **Adapter**.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Kode *client* lebih sederhana | Facade bisa jadi tempat menumpuk logika |
| Melindungi *client* dari perubahan internal | Indireksi ekstra untuk *power user* |
| Mendokumentasikan jalur penggunaan yang dimaksud | Abstraksi salah menghalangi akses tingkat rendah yang sah |

## Example

Tanpa facade, *handler* mengimpor paket `auth`, `billing`, `email`, dan `audit`. Dengan `OnboardingFacade.CompleteSignup(user)`, satu panggilan memvalidasi kredensial, membuat langganan, mengirim *welcome mail*, dan menulis *audit event*—urutan dan penanganan *error* berada di satu tempat.

```go
type OnboardingFacade struct {
    auth    AuthService
    billing BillingService
    mail    Mailer
}

func (f OnboardingFacade) CompleteSignup(u User) error {
    if err := f.auth.Register(u); err != nil {
        return err
    }
    if err := f.billing.CreateTrial(u.ID); err != nil {
        return err
    }
    return f.mail.SendWelcome(u.Email)
}
```

## Related

- [Adapter](../design/adapter_id.md) — menyamakan satu *interface* dengan yang lain; intent berbeda
- [Mediator](../design/mediator_id.md) — mengkoordinasikan *peer*; Facade menghadap ke *client*
- [Law of Demeter](../../principles/law-of-demeter_id.md) — facade mengurangi rantai *reach-through*

## References

- Gamma et al. — *Design Patterns*, bab Facade
- Batas modul dalam Clean Architecture dan *hexagonal ports*
