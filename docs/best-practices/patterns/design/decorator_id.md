# Pola Decorator
## Gambaran Umum

Decorator menambahkan tanggung jawab tambahan ke suatu objek pada runtime dengan membungkusnya, menjadi alternatif fleksibel terhadap pewarisan untuk memperluas perilaku. Ini memungkinkan komposisi perilaku secara dinamis tanpa memodifikasi kelas asli, menjadikannya ideal untuk menambahkan fitur seperti logging atau caching.

## Kapan digunakan
- Menambahkan concern lintas-cutting (logging, metrik, autentikasi) ke objek tertentu.
- Menggabungkan perilaku secara dinamis tanpa mengubah implementasi inti.

## Panduan Implementasi
- Implementasikan antarmuka yang sama seperti objek yang dibungkus dan teruskan pemanggilan setelah pre-/post-processing.
- Jaga decorator fokus pada satu concern dan izinkan penumpukan decorator.

## Contoh (Gaya Go)
```go
type Service interface { Do(ctx context.Context) error }

type LoggingDecorator struct { inner Service }
func (d LoggingDecorator) Do(ctx context.Context) error {
    log.Println("call start")
    err := d.inner.Do(ctx)
    log.Println("call end", err)
    return err
}
```

## Kelebihan / Kekurangan
- Kelebihan: Fleksibilitas tinggi, pemisahan concern yang baik.
- Kekurangan: Banyak wrapper dapat mempersulit debugging dan pelacakan stack.

## Perhatian
- Hindari rantai decorator yang dalam; gunakan penamaan jelas dan monitoring.

## Pola Terkait
Proxy, Adapter, Chain of Responsibility

## Referensi
- Gamma dkk., "Design Patterns".