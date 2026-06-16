# Prinsip Fail Fast

## Overview

**Fail fast** berarti mendeteksi *error* dan *state* tidak valid secepat mungkin—di waktu kompilasi, *startup*, validasi input, atau batas API pertama—dan berhenti segera dengan sinyal jelas alih-alalu melanjutkan dengan asumsi yang rusak. Tujuannya menampakkan cacat di tempat perbaikannya termurah dan diagnosisnya termudah.

Fail fast melengkapi **defensive programming** tetapi penekanannya berbeda: alih-alih pulih diam-diam atau mengembalikan *default* ambigu, fail fast menolak input buruk, konfigurasi hilang, atau invariant yang dilanggar dengan cepat. Di sistem terdistribusi, gabungkan fail fast lokal dengan *timeout* dan *circuit breaker* agar kegagalan tidak merambat tanpa terdeteksi.

"Fail closed" dalam keamanan (menolak saat ragu) adalah kerabat fail fast: lebih memilih memblokir daripada melanjutkan berisiko.

## Key ideas

- Validasi *precondition* di batas (*HTTP handler*, entri CLI, konsumen pesan).
- *Crash* atau *error* saat *startup* jika konfigurasi/*secret* wajib hilang—jangan meluncur setengah mati ke produksi.
- Gunakan tipe dan konstruktor yang tidak bisa merepresentasikan *state* tidak valid jika memungkinkan.
- Propagasi *error* dengan konteks; hindari menelan *exception*.

## When to use

- *Service* berbasis konfigurasi di mana salah konfigurasi menyebabkan kehilangan data atau lubang keamanan.
- *Library* dan API publik di mana argumen tidak valid menandakan kesalahan programmer.
- *Pipeline* di mana sukses sebagian menyembunyikan korupsi di hilir.

## When not to use

- Alur yang menghadap pengguna di mana degradasi halus meningkatkan UX (tampilkan pesan validasi, bukan *crash* proses).
- *Batch job* memproses jutaan baris—fail fast per baris mungkin butuh agregasi dan kebijakan *skip*.
- Pola ketahanan yang sengaja *retry* gangguan transien (*network blip*).

## Trade-offs

| Fail fast | Penanganan lebih lembut |
| --- | --- |
| Identifikasi akar masalah lebih cepat | Lebih ramah pengguna di beberapa jalur UX |
| Mencegah propagasi *state* korup | Bisa menambah noise jika ambang salah |
| Alert operasional jelas | Butuh pesan *error* yang matang |

## Example

Tolak jumlah transfer negatif di entri *service*; jangan biarkan sampai ke *ledger*.

```go
func Transfer(from, to AccountID, amount decimal.Decimal) error {
    if amount.Sign() <= 0 {
        return fmt.Errorf("transfer: amount must be positive: %s", amount)
    }
    // proceed
}
```

*Startup* aplikasi: jika `DATABASE_URL` kosong, `log.Fatal` atau kembalikan *error* dari `main`—jangan *default* ke DB in-memory di build produksi.

## Related

- [DRY](dry_id.md) — pusatkan aturan validasi sekali
- [Separation of Concerns](separation-of-concerns_id.md) — validasi di batas yang tepat
- [Defense in Depth](security/defense-in-depth_id.md) — lapisan pemeriksaan tanpa menyembunyikan kegagalan

## References

- Jim Shore — "Fail Fast" (artikel IEEE / praktik agile)
- Komunitas Go: pengembalian *error* eksplisit vs *panic* untuk kesalahan programmer
