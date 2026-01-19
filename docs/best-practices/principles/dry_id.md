# Prinsip DRY

## Gambaran Umum

DRY (Don't Repeat Yourself) berarti menghindari duplikasi pengetahuan atau kode. Diciptakan oleh Andy Hunt dan Dave Thomas di "The Pragmatic Programmer," ini memastikan perubahan dibuat di satu tempat.

Sumber kebenaran tunggal; gunakan abstraksi seperti fungsi, kelas, atau normalisasi untuk menghilangkan redundansi. Manfaat: Pemeliharaan lebih mudah, lebih sedikit bug dari pembaruan yang tidak konsisten, reusabilitas lebih baik.

## Kapan Menggunakan

Kapan pun repetisi kode muncul; di database, config, atau logika—terutama di tim untuk mencegah masalah sinkronisasi.

## Cara Implementasi

Ekstrak kode berulang ke dalam fungsi/metode (misalnya, logika validasi duplikat ke dalam fungsi `validateInput()`). Gunakan pewarisan atau komposisi. Jika Anda copy-paste kode, berhenti dan buat reusable.

```
Sebelum (Berulang):
[Blok Kode A]  [Blok Kode A]  [Blok Kode A]

Sesudah (DRY):
[Fungsi Bersama] --> [Blok Kode A] (Dipanggil 3 kali)
```

## Tautan

Untuk kode reusable, lihat [Aturan Coding](../../coding-rules.md).
