# Pola Saga

## Gambaran Umum

Pola Saga adalah pola desain untuk mengelola transaksi terdistribusi dalam arsitektur microservices. Ini mengkoordinasikan serangkaian transaksi lokal di berbagai layanan, memastikan konsistensi data melalui tindakan kompensasi ketika kegagalan terjadi. Alih-alih menggunakan transaksi terdistribusi dengan two-phase commit, saga memberikan cara untuk mempertahankan konsistensi eventual dalam proses bisnis yang kompleks.

Manfaat termasuk memungkinkan transaksi terdistribusi tanpa kopling ketat, meningkatkan toleransi kesalahan dengan memungkinkan rollback parsial, mendukung proses yang berjalan lama, dan memfasilitasi konsistensi eventual dalam lingkungan microservices.

## Komponen Utama

- **Orkestrator Saga**: Koordinator pusat yang mengelola urutan langkah saga dan menangani kegagalan (pada pendekatan orkestrasi).
- **Peserta Saga**: Layanan yang mengeksekusi transaksi lokal sebagai bagian dari saga.
- **Transaksi Kompensasi**: Tindakan untuk membalikkan efek langkah sebelumnya jika terjadi kegagalan.
- **Log Saga**: Mencatat status dan kemajuan saga untuk pemulihan, audit, dan debugging.

## Orkestrasi vs Koreografi
- **Orkestrasi**: Koordinator pusat memberitahu peserta apa yang harus dilakukan dan kapan. Lebih mudah diamati dan dikontrol tetapi menempatkan logika terpusat.
- **Koreografi**: Peserta memancarkan dan merespon event; tidak ada koordinator pusat. Lebih terlepas (decoupled) tetapi lebih sulit ditelusuri end-to-end.

## Panduan Implementasi
- Definisikan transaksi lokal idempoten dan aksi kompensasi.
- Persist status saga untuk pemulihan dan audit.
- Pantau kemajuan dan kegagalan saga; buat alert untuk kompensasi berulang.

## Tips & Perangkap
- Pastikan aksi kompensasi aman dan dapat di-retry.
- Hindari lock jangka panjang antar layanan; desain untuk konsistensi eventual.
- Uji skenario kegagalan dan pemulihan secara menyeluruh.

```text
Mulai Saga
     |
     v
+------------+     Berhasil    +------------+
| Eksekusi   |  ------------>  | Eksekusi   |
| Langkah 1  |                 | Langkah 2  |
+------------+                 +------------+
     |                               |
     | Kegagalan                     | Berhasil
     v                               v
+------------+                 +------------+
| Kompensasi |  <------------  | Eksekusi   |
| Langkah 1  |                 | Langkah 3  |
+------------+                 +------------+
     |                               |
     |                               | Kegagalan
     v                               v
+------------+                 +------------+
| Saga       |                 | Kompensasi |
| Gagal      |  <------------  | Langkah 2 & 1 |
+------------+                 +------------+
                                     |
                                     v
                                +------------+
                                | Saga       |
                                | Selesai    |
                                +------------+
```

## Kapan Menggunakan

Gunakan Pola Saga saat membangun arsitektur microservices yang memerlukan transaksi terdistribusi. Ketika operasi mencakup beberapa layanan dan konsistensi kuat diperlukan. Untuk proses bisnis yang berjalan lama seperti pemenuhan pesanan, sistem pemesanan, atau transfer keuangan. Ketika protokol two-phase commit tidak diinginkan karena masalah performa atau ketersediaan. Hindari ketika transaksi sederhana dan terkandung dalam satu layanan.

## Panduan Implementasi

1. Identifikasi proses bisnis dan pecah menjadi langkah atomik.
2. Definisikan tindakan kompensasi untuk setiap langkah yang dapat membalikkan efeknya.
3. Pilih antara orkestrasi (koordinator pusat) atau koreografi (event-driven).
4. Implementasikan manajemen status saga dan persistensi untuk pemulihan.
5. Definisikan penanganan kegagalan dan kebijakan timeout yang jelas.
6. Tambahkan pemantauan dan logging untuk eksekusi saga.
7. Uji skenario kegagalan dan tindakan kompensasi secara menyeluruh.

## Contoh

Dalam sistem pesanan ecommerce, saga mengelola pembuatan pesanan, pemrosesan pembayaran, dan reservasi inventaris dengan tindakan kompensasi untuk setiap langkah.

```go
type SagaStep struct {
    Execute    func(ctx context.Context) error
    Compensate func(ctx context.Context) error
}

type Saga struct {
    steps []SagaStep
    log   []int // Lacak langkah yang dieksekusi
}

func (s *Saga) Execute(ctx context.Context) error {
    for i, step := range s.steps {
        if err := step.Execute(ctx); err != nil {
            // Kompensasi dalam urutan terbalik
            for j := i; j >= 0; j-- {
                if compErr := s.steps[j].Compensate(ctx); compErr != nil {
                    // Log kegagalan kompensasi
                }
            }
            return err
        }
        s.log = append(s.log, i)
    }
    return nil
}

// Contoh penggunaan
func createOrderSaga() *Saga {
    return &Saga{
        steps: []SagaStep{
            {
                Execute: func(ctx context.Context) error {
                    // Buat pesanan di database
                    return createOrder(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Hapus pesanan
                    return deleteOrder(ctx)
                },
            },
            {
                Execute: func(ctx context.Context) error {
                    // Proses pembayaran
                    return processPayment(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Refund pembayaran
                    return refundPayment(ctx)
                },
            },
            {
                Execute: func(ctx context.Context) error {
                    // Reservasi inventaris
                    return reserveInventory(ctx)
                },
                Compensate: func(ctx context.Context) error {
                    // Lepaskan inventaris
                    return releaseInventory(ctx)
                },
            },
        },
    }
}
```

## Tautan

Untuk pola integrasi terkait, lihat [CQRS](../integration/cqrs_en.md). Untuk konsep arsitektur event-driven, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md). Untuk pola keandalan dalam sistem terdistribusi, lihat [Circuit Breaker](../reliability/circuit-breaker_en.md).
