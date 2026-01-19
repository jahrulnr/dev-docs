# Pola Command
## Gambaran Umum

Command mengenkapsulasi permintaan sebagai objek, memisahkan pengirim dari penerima, dan mendukung antrian, penjadwalan, pencatatan, serta undo. Pola ini memberikan fleksibilitas dalam penanganan permintaan.

## Kapan digunakan
- Implementasi sistem undo/redo.
- Pengantrean tugas untuk pemrosesan asinkron.
- Parameterisasi aksi dan dukungan replay/audit.

## Panduan Implementasi
- Definisikan antarmuka Command dengan metode Execute() dan opsional Undo().
- Implementasikan command konkret yang menyimpan parameter dan referensi penerima.
- Gunakan Invoker untuk mengantri, menjalankan, atau menjadwalkan command.

## Contoh (Gaya Go)
```go
type Command interface { Execute() error; Undo() error }

type OrderCommand struct { orderID string }
func (c OrderCommand) Execute() error { /* apply order */ return nil }
func (c OrderCommand) Undo() error { /* revert order */ return nil }

type Invoker struct { queue []Command }
func (i *Invoker) Push(c Command) { i.queue = append(i.queue, c) }
func (i *Invoker) Run() { for _, c := range i.queue { c.Execute() } }
```

## Kelebihan / Kekurangan
- Kelebihan: Fleksibel, mudah diuji, dukungan replay dan audit.
- Kekurangan: Dapat menghasilkan banyak kelas kecil dan boilerplate.

## Perhatian
- Jangan taruh logika bisnis di Invoker; command harus bertanggung jawab penuh atas aksi yang diambil.

## Referensi
- Gamma dkk., "Design Patterns".