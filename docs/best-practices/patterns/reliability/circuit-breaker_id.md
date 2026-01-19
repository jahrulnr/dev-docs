# Pola Circuit Breaker
## Gambaran Umum

Circuit Breaker melindungi layanan dari kegagalan berulang dengan memutuskan panggilan ke dependensi yang tidak stabil ketika metrik kegagalan melampaui ambang yang dikonfigurasi. Hal ini meningkatkan stabilitas sistem dan mencegah kegagalan berantai.

## Status dan Parameter
- **Tertutup**: Operasi normal; metrik dicatat.
- **Terbuka**: Panggilan gagal cepat untuk periode timeout yang dikonfigurasi.
- **Setengah-Terbuka**: Mengizinkan sejumlah panggilan uji untuk menentukan apakah dependensi pulih.
- **Parameter**: ambang kegagalan, reset timeout, ambang keberhasilan untuk setengah-terbuka.

## Panduan Implementasi
- Lacak error rate dan latency; gunakan sliding window dan threshold persentase daripada hitungan tetap.
- Ekspos metrik: failure_count, request_count, circuit_open_duration, half_open_attempts.
- Gabungkan dengan strategi retry/backoff dan fallback untuk perilaku tangguh.

## Contoh Konfigurasi
- failure_threshold: 50% selama 2 menit terakhir
- reset_timeout: 30s
- half_open_success_threshold: 5

## Library & Alat
- Java: resilience4j; .NET: Polly; Go: github.com/sony/gobreaker.

## Observabilitas & Pengujian
- Simulasikan kegagalan dan validasi transisi status; pantau metrik dan state circuit.
- Log perubahan status dan alasan untuk mempermudah debug.

## Catatan
- Threshold yang terlalu agresif dapat merusak availability; tuning berdasarkan trafik nyata diperlukan.
- Circuit Breaker bukan solusi tunggal: kombinasikan dengan capacity planning dan desain yang baik.

## Referensi
- Pola resilience dan dokumentasi resilience4j/Polly.

```text
Permintaan
   |
   v
+--------+     Kegagalan > Ambang     +--------+
| Tertutup|  ------------------------> | Terbuka|
| (Lewat) |                             | (Gagal |
+--------+                             | Cepat) |
   ^                                    +--------+
   | Pemulihan OK                        |
   |                                      |
   v                                      v
+--------+     Timeout Berakhir      +--------+
| Setengah|  <-----------------------  | (Tunggu)|
| Terbuka |                             +--------+
| (Uji)   |
+--------+
```

## Kapan Menggunakan

Gunakan untuk panggilan layanan eksternal (API, database) yang rentan terhadap kegagalan. Dalam arsitektur microservices. Ketika Anda ingin menghindari pemborosan sumber daya pada layanan yang gagal. Hindari untuk operasi lokal atau ketika kegagalan jarang terjadi.

## Panduan Implementasi

1. Bungkus panggilan layanan dalam kelas Circuit Breaker.
2. Lacak hitungan sukses/kegagalan.
3. Buka sirkuit ketika kegagalan melebihi ambang.
4. Setelah timeout, masuk setengah terbuka dan uji dengan satu permintaan.
5. Tutup jika uji berhasil; buka kembali jika gagal.
6. Gunakan pustaka seperti Hystrix (Java) atau Polly (.NET) untuk implementasi.

## Contoh

Dalam sistem pembayaran ecommerce, Circuit Breaker melindungi terhadap API gateway pembayaran yang gagal dengan gagal cepat dan menampilkan pesan "coba lagi nanti".

```go
type CircuitBreaker struct {
    state string
    failureCount int
    threshold int
    timeout time.Time
}

func (cb *CircuitBreaker) Call(service func() error) error {
    if cb.state == "open" && time.Now().Before(cb.timeout) {
        return errors.New("circuit open")
    }
    err := service()
    if err != nil {
        cb.failureCount++
        if cb.failureCount > cb.threshold {
            cb.state = "open"
            cb.timeout = time.Now().Add(30 * time.Second)
        }
    } else {
        cb.failureCount = 0
        cb.state = "closed"
    }
    return err
}
```

## Tautan

Untuk pola arsitektural terkait, lihat [Microservices](../architecture/microservices_en.md) (coming soon). Untuk pola event-driven, periksa [Event-Driven Architecture](../ecosystem/aws/event-driven_en.md).
