# Pola Proxy

## Gambaran Umum

Pola Proxy menyediakan penampung atau perantara untuk objek lain untuk mengendalikan akses, menambah caching atau logging, atau menunda inisialisasi mahal tanpa mengubah objek asli. Pola ini penting untuk mengimplementasikan lazy loading, kontrol akses, dan komunikasi remote dengan cara yang bersih dan terpisah. Ini memungkinkan klien berinteraksi dengan proxy seolah-olah itu objek asli, sementara proxy menangani tanggung jawab tambahan secara transparan.

Pola proxy datang dalam beberapa jenis:

- **Virtual Proxy**: Menunda pembuatan dan inisialisasi objek mahal hingga diperlukan.
- **Protection Proxy**: Mengontrol akses ke objek asli berdasarkan izin.
- **Remote Proxy**: Mewakili objek di ruang alamat yang berbeda, menangani komunikasi jaringan.
- **Caching Proxy**: Menambah caching untuk meningkatkan performa dengan menyimpan hasil operasi mahal.

Pola ini mendorong pemisahan tanggung jawab dan meningkatkan fleksibilitas dalam desain sistem.

## Kapan digunakan
- Tambahkan lapisan kontrol akses (protection proxy).
- Tunda inisialisasi sumber daya yang mahal (virtual proxy).
- Bungkus layanan jarak jauh dan sembunyikan detail jaringan (remote proxy).
- Tambahkan caching, logging, atau pengukuran.

## Panduan Implementasi
- Terapkan antarmuka yang sama seperti subjek asli dan teruskan pemanggilan.
- Jaga agar logika proxy ringan; jangan masukkan aturan bisnis di sini.
- Untuk proxy jarak jauh, tangani serialisasi, timeout, dan retry di boundary proxy.

## Contoh (Gaya Go)
```go
type Service interface {
    DoWork(ctx context.Context, r Request) (Response, error)
}

type RemoteProxy struct {
    client RemoteClient
}

func (p *RemoteProxy) DoWork(ctx context.Context, r Request) (Response, error) {
    // auth, logging, short-circuit, retries
    return p.client.Call(ctx, r)
}
```

## Kelebihan / Kekurangan
- Kelebihan: Menyediakan pusat untuk concern lintas-cutting, mendukung lazy-loading dan kontrol akses.
- Kekurangan: Menambah indirection dan potensi masalah latensi.

## Perhatian
- Jangan menggandakan logika bisnis di proxy; gunakan hanya untuk orkestrasi dan kontrol.
- Ekspose metrik latensi dan error agar masalah performa tidak tersembunyi.

## Pola Terkait
Adapter, Decorator, Facade

## Referensi
- Gamma dkk., "Design Patterns".