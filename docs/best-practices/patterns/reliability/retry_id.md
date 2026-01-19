# Pola Retry

## Gambaran Umum

Pola Retry adalah pola desain ketahanan yang secara otomatis mencoba ulang operasi yang gagal, meningkatkan keandalan dalam lingkungan yang tidak dapat diandalkan. Ini menangani kegagalan sementara dengan mencoba operasi beberapa kali dengan strategi backoff.

Manfaat termasuk menangani kesalahan sementara (masalah jaringan, ketersediaan sementara), pengurangan intervensi manual, logika retry yang dapat dikonfigurasi, dan ketahanan sistem yang lebih baik.

## Komponen Utama

- **Logika Retry**: Mekanisme untuk mencoba operasi lagi.
- **Strategi Backoff**: Penundaan antara retry (tetap, eksponensial, jitter).
- **Max Retry**: Batas untuk mencegah loop tak terbatas.
- **Kondisi Retry**: Kriteria untuk apa yang merupakan kegagalan yang dapat di-retry.

```text
Operasi Gagal
       |
       v
+----------------+     Dapat di-Retry? +----------------+
| Periksa Jenis  |  --------------->  | Retry dengan    |
| Kegagalan      |                    | Backoff         |
+----------------+                     +----------------+
       |                                      |
       | Tidak Dapat di-Retry                 |
       v                                      v
+----------------+                     +----------------+
| Gagal Cepat    |  <--------------    | Max Retry      |
+----------------+                     | Terlampaui?    |
                                       +----------------+
                                                |
                                                v
                                       +----------------+
                                       | Kegagalan Akhir|
                                       +----------------+
```

## Kapan Menggunakan

Gunakan untuk kegagalan sementara (misalnya, timeout jaringan, overload layanan). Dalam sistem terdistribusi atau lingkungan cloud. Ketika operasi idempoten. Hindari untuk kesalahan non-sementara (misalnya, kegagalan autentikasi) atau operasi non-idempoten.

## Panduan Implementasi

1. Bungkus operasi dalam fungsi retry.
2. Definisikan pengecualian yang dapat di-retry (misalnya, timeout, kesalahan HTTP 5xx).
3. Implementasikan backoff: Mulai dengan penundaan pendek, tingkatkan secara eksponensial.
4. Tambahkan jitter untuk menghindari thundering herd.
5. Tetapkan max retry (misalnya, 3-5 percobaan).
6. Log retry untuk pemantauan.

## Contoh

Dalam sistem pesanan ecommerce, retry konfirmasi pembayaran yang gagal karena masalah jaringan, dengan backoff eksponensial.

```go
func Retry(operation func() error, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        err := operation()
        if err == nil {
            return nil
        }
        if !isRetryable(err) {
            return err
        }
        time.Sleep(time.Duration(i+1) * time.Second) // Backoff eksponensial
    }
    return errors.New("max retries exceeded")
}

func isRetryable(err error) bool {
    // Periksa kesalahan sementara
    return strings.Contains(err.Error(), "timeout") || strings.Contains(err.Error(), "temporary")
}
```

## Tautan

Untuk pola ketahanan terkait, lihat [Circuit Breaker](circuit-breaker_en.md). Untuk pola event-driven, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md).
