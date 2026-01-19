# Pola Transaksi Kompensasi

## Gambaran Umum

Pola Transaksi Kompensasi adalah pola desain untuk menangani kegagalan dalam sistem terdistribusi dengan menyediakan tindakan kompensasi yang dapat membatalkan efek operasi yang telah dieksekusi sebelumnya. Pola ini memastikan konsistensi data dan keandalan sistem dalam skenario di mana mekanisme rollback tradisional tidak tersedia atau praktis, seperti dalam arsitektur microservices, proses bisnis yang berjalan lama, atau sistem event-driven.

Manfaat termasuk memungkinkan pemulihan kegagalan yang graceful tanpa penguncian terdistribusi, mendukung konsistensi eventual, mengurangi kompleksitas penanganan kesalahan, dan memungkinkan sistem mempertahankan integritas bahkan ketika operasi individu gagal.

## Komponen Utama

- **Koordinator Transaksi**: Komponen pusat yang mengelola eksekusi transaksi dan mengkoordinasikan kompensasi ketika kegagalan terjadi.
- **Tindakan Kompensasi**: Operasi yang dapat dibalik yang membatalkan efek transaksi yang berhasil, mengembalikan sistem ke keadaan konsisten.
- **Log Transaksi**: Catatan persisten dari transaksi yang dieksekusi dan status terkini mereka untuk pelacakan dan pemulihan.
- **Detektor Kegagalan**: Mekanisme yang mengidentifikasi kegagalan transaksi dan memicu proses kompensasi.

```text
Eksekusi Transaksi
         |
         v
    +------------+     Berhasil    +------------+
    | Transaksi  |  ------------>  | Transaksi   |
    | Langkah 1  |                 | Langkah 2   |
    +------------+                 +------------+
         |                               |
         | Kegagalan                     | Berhasil
         v                               v
    +------------+                 +------------+
    | Kompensasi |  <------------  | Transaksi  |
    | Langkah 1  |                 | Langkah 3   |
    +------------+                 +------------+
         |                               |
         |                               | Kegagalan
         v                               v
    +------------+                 +------------+
    | Pemulihan  |                 | Kompensasi |
    | Selesai    |  <------------  | Langkah 2&1 |
    +------------+                 +------------+
                                     |
                                     v
                                +------------+
                                | Semua      |
                                | Langkah    |
                                | Selesai    |
                                +------------+
```

## Kapan Menggunakan

Gunakan Pola Transaksi Kompensasi saat membangun sistem terdistribusi yang memerlukan penanganan kegagalan yang andal. Ketika operasi mencakup beberapa layanan atau sistem dan transaksi ACID tradisional tidak layak. Untuk proses bisnis yang berjalan lama seperti transfer keuangan, pemrosesan pesanan, atau sistem pemesanan. Saat mengimplementasikan arsitektur event-driven di mana operasi tidak dapat dengan mudah di-rollback. Ketika Anda perlu mempertahankan konsistensi data di seluruh sistem heterogen. Hindari ketika transaksi sederhana dan dapat ditangani dengan transaksi database tradisional.

## Panduan Implementasi

1. Identifikasi semua operasi yang memerlukan kompensasi dan definisikan tindakan kompensasi yang jelas untuk masing-masing.
2. Implementasikan koordinator transaksi untuk mengelola alur eksekusi dan penanganan kegagalan.
3. Buat log transaksi persisten untuk melacak status setiap operasi.
4. Definisikan mekanisme deteksi kegagalan dan pemicu kompensasi.
5. Implementasikan tindakan kompensasi idempoten untuk menangani eksekusi berulang dengan aman.
6. Tambahkan pemantauan dan peringatan untuk eksekusi kompensasi dan kegagalan.
7. Uji skenario kompensasi secara menyeluruh, termasuk kegagalan parsial dan masalah jaringan.

## Contoh

Dalam sistem perbankan, kompensasi menangani transfer uang yang gagal dengan membalikkan debit dan kredit.

```go
type CompensableTransaction struct {
    Execute    func(ctx context.Context) error
    Compensate func(ctx context.Context) error
    ID         string
}

type CompensationManager struct {
    transactions []CompensableTransaction
    executed     map[string]bool
    log          []string
}

func (cm *CompensationManager) ExecuteTransaction(ctx context.Context, tx CompensableTransaction) error {
    // Execute the transaction
    if err := tx.Execute(ctx); err != nil {
        return err
    }
    
    // Mark as executed
    cm.executed[tx.ID] = true
    cm.log = append(cm.log, "Executed: "+tx.ID)
    
    return nil
}

func (cm *CompensationManager) Compensate(ctx context.Context) error {
    // Compensate in reverse order
    for i := len(cm.transactions) - 1; i >= 0; i-- {
        tx := cm.transactions[i]
        if cm.executed[tx.ID] {
            if err := tx.Compensate(ctx); err != nil {
                // Log compensation failure but continue
                cm.log = append(cm.log, "Compensation failed for: "+tx.ID)
            } else {
                cm.log = append(cm.log, "Compensated: "+tx.ID)
            }
        }
    }
    return nil
}

// Usage example
func transferMoneySaga() *CompensationManager {
    return &CompensationManager{
        executed: make(map[string]bool),
        transactions: []CompensableTransaction{
            {
                ID: "debit",
                Execute: func(ctx context.Context) error {
                    // Debit source account
                    return debitAccount(ctx, "source", 100)
                },
                Compensate: func(ctx context.Context) error {
                    // Credit back to source
                    return creditAccount(ctx, "source", 100)
                },
            },
            {
                ID: "credit",
                Execute: func(ctx context.Context) error {
                    // Credit destination account
                    return creditAccount(ctx, "dest", 100)
                },
                Compensate: func(ctx context.Context) error {
                    // Debit from destination
                    return debitAccount(ctx, "dest", 100)
                },
            },
        },
    }
}
```

## Tautan

Untuk pola transaksi terkait, lihat [Pola Saga](saga_id.md) dan [Pola Two-Phase Commit](two-phase-commit_id.md). Untuk pola keandalan, periksa [Circuit Breaker](../reliability/circuit-breaker_id.md). Untuk konsep event-driven, lihat [Arsitektur Event-Driven](../../ecosystem/aws/event-driven_id.md).