# Pola Bulkhead

## Gambaran Umum

Pola Bulkhead adalah pola desain ketahanan yang mengisolasi bagian-bagian berbeda dari sistem ke dalam kompartemen terpisah, mencegah kegagalan di satu bagian menyebar ke bagian lain. Dinamai setelah kompartemen kedap air di kapal yang menahan banjir, ini memastikan stabilitas sistem dengan membatasi dampak kegagalan.

Manfaat termasuk isolasi kegagalan (mencegah kelelahan sumber daya di satu area mempengaruhi yang lain), toleransi kesalahan yang lebih baik, pemanfaatan sumber daya yang lebih baik, dan degradasi yang anggun di bawah beban.

## Komponen Utama

- **Bulkhead**: Kompartemen terisolasi atau kumpulan sumber daya.
- **Batas Sumber Daya**: Sumber daya maksimum yang dialokasikan per bulkhead.
- **Isolasi Kegagalan**: Kegagalan terkandung dalam bulkhead mereka.
- **Mekanisme Fallback**: Perilaku alternatif ketika bulkhead penuh.

```text
Sumber Daya Sistem
+-------------------+
| Bulkhead A        |  <- Operasi Layanan A
| [Pool: 10 thread] |
+-------------------+
| Bulkhead B        |  <- Operasi Layanan B
| [Pool: 5 thread]  |
+-------------------+
| Bulkhead C        |  <- Operasi Layanan C
| [Pool: 8 thread]  |
+-------------------+
Kegagalan di A tidak mempengaruhi B atau C
```

## Kapan Menggunakan

Gunakan ketika komponen sistem yang berbeda memiliki tingkat kegagalan atau kebutuhan sumber daya yang bervariasi. Dalam microservices dengan beban kerja campuran. Ketika Anda ingin mencegah layanan yang gagal mengkonsumsi semua sumber daya. Untuk koneksi database, kumpulan thread, atau batas tarif API. Hindari ketika komponen terikat erat atau ketika overhead isolasi melebihi manfaat.

## Panduan Implementasi

1. Identifikasi komponen sistem yang dapat gagal secara independen.
2. Buat kumpulan sumber daya terpisah (thread, koneksi) untuk setiap komponen.
3. Tetapkan batas yang sesuai untuk setiap kumpulan berdasarkan beban yang diharapkan.
4. Implementasikan antrian atau penolakan ketika batas kumpulan tercapai.
5. Pantau pemanfaatan kumpulan dan sesuaikan batas sesuai kebutuhan.
6. Gunakan circuit breaker dalam bulkhead untuk perlindungan tambahan.

## Contoh

Dalam aplikasi web dengan beberapa panggilan API eksternal, Bulkhead mencegah satu API lambat memblokir yang lain.

```go
type Bulkhead struct {
    semaphore chan struct{}
}

func NewBulkhead(limit int) *Bulkhead {
    return &Bulkhead{
        semaphore: make(chan struct{}, limit),
    }
}

func (b *Bulkhead) Execute(fn func() error) error {
    b.semaphore <- struct{}{} // Acquire
    defer func() { <-b.semaphore }() // Release
    
    return fn()
}

// Penggunaan
apiBulkhead := NewBulkhead(10) // Batasi ke 10 panggilan bersamaan
paymentBulkhead := NewBulkhead(5) // Batasi ke 5 panggilan bersamaan

err := apiBulkhead.Execute(func() error {
    // Panggil API eksternal
    return callExternalAPI()
})
```

## Tautan

Untuk pola keandalan terkait, lihat [Circuit Breaker](circuit-breaker_id.md) dan [Retry](retry_id.md). Untuk pola arsitektural, periksa [Microservices](../architecture/microservices_en.md) (coming soon).