# Pola Observer

## Gambaran Umum

Pola Observer adalah pola desain perilaku yang mendefinisikan ketergantungan satu-ke-banyak antara objek sehingga ketika satu objek (subjek) mengubah keadaan, semua dependensinya (observer) diberitahu dan diperbarui secara otomatis. Pola ini mempromosikan loose coupling antara subjek dan observer-nya, memungkinkan penambahan dan penghapusan observer secara dinamis pada runtime.

Manfaat termasuk decoupling dari subjek dan observer, dukungan untuk komunikasi broadcast, dan kepatuhan terhadap prinsip open-closed dengan memungkinkan observer baru tanpa memodifikasi subjek.

## Komponen Utama

- **Subject (Observable)**: Antarmuka atau kelas abstrak yang mendefinisikan metode untuk melampirkan, melepaskan, dan memberitahu observer.
- **Observer**: Antarmuka yang mendefinisikan metode update yang dipanggil subjek ketika keadaan mereka berubah.
- **Concrete Subject**: Mengimplementasikan antarmuka Subject dan mempertahankan keadaan yang menarik bagi observer.
- **Concrete Observer**: Mengimplementasikan antarmuka Observer dan mempertahankan referensi ke Concrete Subject.

```text
         Subject
        /      \
       /        \
Observer1    Observer2
      \        /
       \      /
     Concrete Subject
```

## Kapan Menggunakan

Gunakan ketika perubahan pada satu objek memerlukan perubahan pada objek lain, dan Anda tidak tahu berapa banyak objek yang perlu diubah. Ketika Anda perlu menyiarkan informasi ke beberapa penerima. Dalam sistem berbasis event, arsitektur MVC, atau model publish-subscribe. Hindari ketika observer terikat erat atau ketika subjek memiliki banyak observer yang menyebabkan masalah performa.

## Panduan Implementasi

1. Definisikan antarmuka Observer dengan metode update.
2. Definisikan antarmuka Subject dengan metode untuk melampirkan, melepaskan, dan memberitahu observer.
3. Buat kelas Concrete Subject yang mengimplementasikan Subject dan mempertahankan keadaan.
4. Implementasikan kelas Concrete Observer yang mengimplementasikan Observer dan bereaksi terhadap update.
5. Dalam Concrete Subject, beritahu semua observer yang dilampirkan ketika keadaan berubah.
6. Izinkan klien untuk secara dinamis melampirkan/melepaskan observer sesuai kebutuhan.

## Contoh

Dalam sistem pemantauan cuaca, WeatherStation (subjek) memberitahu beberapa display (observer) ketika data cuaca berubah.

```go
// Antarmuka Observer
type Observer interface {
    Update(temperature, humidity, pressure float64)
}

// Antarmuka Subject
type Subject interface {
    Attach(observer Observer)
    Detach(observer Observer)
    Notify()
}

// Concrete Subject
type WeatherStation struct {
    observers   []Observer
    temperature float64
    humidity    float64
    pressure    float64
}

func (w *WeatherStation) Attach(observer Observer) {
    w.observers = append(w.observers, observer)
}

func (w *WeatherStation) Detach(observer Observer) {
    // Implementasi untuk menghapus observer
}

func (w *WeatherStation) Notify() {
    for _, observer := range w.observers {
        observer.Update(w.temperature, w.humidity, w.pressure)
    }
}

func (w *WeatherStation) SetMeasurements(temp, hum, pres float64) {
    w.temperature = temp
    w.humidity = hum
    w.pressure = pres
    w.Notify()
}

// Concrete Observer
type CurrentConditionsDisplay struct {
    subject *WeatherStation
}

func (c *CurrentConditionsDisplay) Update(temp, hum, pres float64) {
    fmt.Printf("Kondisi saat ini: %.1f°C, %.1f%% kelembaban, %.1f hPa\n", temp, hum, pres)
}
```

## Tautan

Untuk pola arsitektural terkait, lihat [Clean Architecture](../../architecture/patterns/clean-architecture_id.md). Untuk pola berbasis event, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md). Untuk prinsip coding, lihat [SOLID Principles](../../principles/solid_en.md).