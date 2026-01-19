# Event Sourcing

## Gambaran Umum

Event Sourcing adalah pola arsitektur yang menyimpan perubahan status sebagai urutan event yang tidak dapat diubah daripada memperbarui status saat ini secara langsung. Status saat ini direkonstruksi dengan memutar ulang event-event ini dari awal. Pendekatan ini memberikan jejak audit lengkap, memungkinkan query temporal, dan mendukung logika bisnis kompleks di sistem event-driven.

Manfaat termasuk sejarah audit lengkap (setiap perubahan dicatat), query temporal (rekonstruksi status pada titik waktu apa pun), decoupling model tulis dan baca, skalabilitas melalui stream event, dan dukungan alami untuk arsitektur event-driven.

## Komponen Utama

- **Event**: Rekaman tak dapat diubah yang mewakili perubahan status (mis., `UserRegistered`, `OrderShipped`) dengan tipe, data, timestamp, dan ID agregat.
- **Event Store**: Penyimpanan hanya-append untuk event. Mendukung append efisien, baca per-aggregate, dan replay stream.
- **Aggregate**: Memuat state dengan replay event dan menerapkan event baru ketika command dieksekusi.
- **Proyeksi / Event Handler**: Membangun serta memelihara model baca atau memicu side-effect secara asinkron.
- **Snapshot**: Simpan snapshot agregat berkala untuk mempercepat pemuatan histori event panjang.

## Panduan Implementasi
- Gunakan optimistic concurrency dengan nomor versi event.
- Terapkan snapshot untuk agregat dengan histori panjang.
- Versioning event dan strategi migrasi (upcasters) untuk evolusi skema.
- Pastikan processor event idempoten dan melacak offset yang sudah diproses.

## Operasional
- Pilih event store: Kafka (stream), event store khusus, atau tabel append-only.
- Pantau lag proyeksi dan sediakan tooling untuk replay proyeksi.
- Rencanakan retensi dan strategi arsip event.

## Perangkap
- Jangan memakai Event Sourcing untuk domain sederhana.
- Evolusi skema event kompleks tanpa versioning/upcaster.

## Referensi
- Literatur Event Sourcing dan contoh implementasi.

```text
Command (mis., CreateOrder)
          |
          v
+----------------+     Events      +----------------+
|   Aggregate    |  ----------->   |  Event Store   |
| (Apply Events) |                 | (Append-Only)  |
+----------------+                 +----------------+
          ^                                |
          |                                v
          |                       +----------------+
          |                       |  Projections  |
          |                       | (Build Views)  |
          +-----------------------+----------------+
```

## Kapan Menggunakan

Gunakan Event Sourcing ketika jejak audit kritis (misalnya, sistem keuangan, kesehatan). Untuk aplikasi yang memerlukan query temporal (misalnya, "saldo rekening bulan lalu"). Di domain dengan aturan bisnis kompleks yang mendapat manfaat dari replay event. Ketika dipasangkan dengan CQRS untuk baca yang dioptimalkan. Hindari di aplikasi CRUD sederhana di mana pembaruan status langsung cukup, atau ketika biaya penyimpanan untuk event mahal.

## Panduan Implementasi

1. Definisikan event sebagai struct yang tidak dapat diubah dengan dukungan versioning (misalnya, sertakan field versi untuk evolusi skema).
2. Implementasikan interface event store: `Append(events []Event)`, `Load(aggregateID string) []Event`.
3. Buat agregat: Muat event untuk merekonstruksi status, validasi command, dan hasilkan event baru.
4. Gunakan proyeksi untuk membangun model baca: Berlangganan stream event dan perbarui tampilan denormalisasi secara asinkron.
5. Tangani konkurensi: Gunakan optimistic locking dengan versi agregat untuk mencegah konflik.
6. Pastikan idempotensi: Command harus idempoten untuk menangani retry.
7. Mulai kecil: Implementasikan untuk satu bounded context, lalu perluas.

## Contoh

Di sistem e-commerce, pesanan dikelola melalui event seperti `OrderCreated`, `ItemAdded`, `PaymentProcessed`.

```go
// Definisi Event
type Event struct {
    AggregateID string
    Type        string
    Data        interface{}
    Timestamp   time.Time
    Version     int
}

// Contoh Aggregate
type Order struct {
    ID       string
    Items    []OrderItem
    Status   string
    Version  int
}

func (o *Order) Load(events []Event) {
    for _, event := range events {
        o.apply(event)
        o.Version = event.Version
    }
}

func (o *Order) apply(event Event) {
    switch event.Type {
    case "OrderCreated":
        data := event.Data.(OrderCreatedData)
        o.ID = data.OrderID
        o.Status = "Created"
    case "ItemAdded":
        data := event.Data.(ItemAddedData)
        o.Items = append(o.Items, data.Item)
    // ... lebih banyak kasus
    }
}

func (o *Order) AddItem(item OrderItem) []Event {
    event := Event{
        AggregateID: o.ID,
        Type:        "ItemAdded",
        Data: ItemAddedData{Item: item},
        Timestamp:   time.Now(),
        Version:     o.Version + 1,
    }
    o.apply(event)
    return []Event{event}
}

// Interface Event Store
type EventStore interface {
    Append(events []Event) error
    Load(aggregateID string) ([]Event, error)
}
```

## Tautan

Untuk menggabungkan dengan CQRS, lihat [CQRS](../integration/cqrs_id.md). Untuk arsitektur event-driven, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_id.md). Untuk pemodelan domain, lihat [Clean Architecture](../../architecture/clean-architecture_id.md).