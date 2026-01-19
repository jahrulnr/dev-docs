# Pola Adapter
## Gambaran Umum

Adapter mengubah antarmuka suatu kelas menjadi antarmuka yang diharapkan klien, memungkinkan interoperabilitas antar antarmuka yang tidak kompatibel tanpa memodifikasi kode yang ada. Pola ini memungkinkan integrasi yang fleksibel dengan komponen eksternal.

## Kapan digunakan
- Mengintegrasikan sistem legacy atau pustaka pihak ketiga dengan API berbeda.
- Menyediakan antarmuka internal stabil sambil mengadaptasi berbagai implementasi vendor.

## Panduan Implementasi
- Implementasikan antarmuka target dan pegang referensi ke adaptee.
- Buat adapter tipis: terjemahkan pemanggilan dan adaptasi struktur data.
- Pisahkan adapter per titik integrasi untuk menjaga tanggung jawab jelas.

## Contoh (Gaya Go)
```go
// Target interface
type PaymentProcessor interface {
    Charge(amount int) error
}

// Adaptee
type LegacyGateway struct{}
func (LegacyGateway) SendPayment(cents int) error { /*...*/ return nil }

// Adapter
type LegacyAdapter struct{ g LegacyGateway }
func (a LegacyAdapter) Charge(amount int) error {
    return a.g.SendPayment(amount)
}
```

## Kelebihan / Kekurangan
- Kelebihan: Mendukung reuse, mengisolasi logika integrasi.
- Kekurangan: Menambah kelas dan overhead translasi.

## Pola Terkait
Facade, Proxy

## Referensi
- Gamma dkk., "Design Patterns".