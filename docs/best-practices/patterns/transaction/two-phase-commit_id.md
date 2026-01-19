# Pola Two-Phase Commit

## Gambaran Umum

Pola Two-Phase Commit adalah algoritma terdistribusi yang mengkoordinasikan semua proses yang berpartisipasi dalam transaksi atomik terdistribusi tentang apakah akan melakukan commit atau abort (roll back) transaksi. Ini memastikan atomicity di berbagai sumber daya atau layanan, menjamin bahwa semua peserta melakukan commit transaksi atau semua melakukan abort. Pola ini memberikan konsistensi kuat tetapi dapat memengaruhi performa dan ketersediaan karena sifatnya yang blocking.

Manfaat termasuk memastikan properti ACID dalam sistem terdistribusi, mencegah commit parsial, dan mempertahankan integritas data di berbagai database atau layanan.

## Komponen Utama

- **Koordinator**: Komponen pusat yang mengelola siklus hidup transaksi dan mengkoordinasikan dengan peserta.
- **Peserta**: Sumber daya atau layanan individu yang berpartisipasi dalam transaksi terdistribusi.
- **Manajer Transaksi**: Menangani fase prepare dan commit dari protokol.
- **Manajer Sumber Daya**: Mengelola sumber daya lokal dan menyediakan operasi prepare, commit, dan abort.

```text
Koordinator                     Peserta
     |                               |
     | 1. Permintaan Prepare         |
     +------------------------------>|
     |                               |
     | 2. Vote (Ya/Tidak)            |
     |<------------------------------+
     |                               |
     | 3. Permintaan Commit (jika semua Ya)|
     +------------------------------>|
     |                               |
     | 4. Pengakuan Commit           |
     |<------------------------------+
     |                               |
     | Atau Permintaan Abort (jika ada Tidak)|
     +------------------------------>|
     |                               |
     | 5. Pengakuan Abort            |
     |<------------------------------+
```

## Kapan Menggunakan

Gunakan Pola Two-Phase Commit saat membangun sistem terdistribusi yang memerlukan jaminan konsistensi kuat. Ketika transaksi mencakup beberapa database atau layanan dan kegagalan parsial harus dihindari. Untuk sistem keuangan, operasi perbankan, atau skenario apa pun di mana integritas data sangat penting. Ketika konsistensi eventual tidak dapat diterima dan konsistensi segera diperlukan. Hindari ketika ketersediaan tinggi lebih penting daripada konsistensi, atau dalam sistem dengan partisi jaringan yang sering.

## Panduan Implementasi

1. Desain koordinator yang andal yang dapat menangani kegagalan dan pemulihan.
2. Implementasikan peserta dengan operasi prepare, commit, dan abort.
3. Definisikan kebijakan timeout yang jelas untuk setiap fase untuk mencegah blocking tanpa batas.
4. Implementasikan logging dan persistensi untuk pemulihan status transaksi.
5. Tambahkan pemantauan untuk kemajuan transaksi dan deteksi kegagalan.
6. Uji secara menyeluruh dengan berbagai skenario kegagalan termasuk crash koordinator.
7. Pertimbangkan untuk mengimplementasikan optimasi seperti protokol presumed abort atau commit.

## Contoh

Dalam sistem transfer perbankan, 2PC memastikan uang didebit dari satu rekening dan dikredit ke rekening lain secara atomik.

```go
type Participant interface {
    Prepare(ctx context.Context, txID string) error
    Commit(ctx context.Context, txID string) error
    Abort(ctx context.Context, txID string) error
}

type Coordinator struct {
    participants []Participant
    txLog        map[string]string // Log status transaksi
}

func (c *Coordinator) ExecuteTransaction(ctx context.Context, txID string) error {
    // Fase 1: Prepare
    votes := make([]bool, len(c.participants))
    for i, p := range c.participants {
        if err := p.Prepare(ctx, txID); err != nil {
            votes[i] = false
        } else {
            votes[i] = true
        }
    }

    // Periksa apakah semua vote ya
    allYes := true
    for _, vote := range votes {
        if !vote {
            allYes = false
            break
        }
    }

    // Fase 2: Commit atau Abort
    if allYes {
        c.txLog[txID] = "committing"
        for _, p := range c.participants {
            if err := p.Commit(ctx, txID); err != nil {
                // Tangani kegagalan commit - mungkin perlu intervensi manual
                return err
            }
        }
        c.txLog[txID] = "committed"
        return nil
    } else {
        c.txLog[txID] = "aborting"
        for _, p := range c.participants {
            p.Abort(ctx, txID) // Abaikan error dalam abort
        }
        c.txLog[txID] = "aborted"
        return errors.New("transaksi dibatalkan")
    }
}

// Contoh penggunaan
func transferMoney(fromAccount, toAccount *BankAccount, amount float64) error {
    txID := generateTransactionID()
    
    coordinator := &Coordinator{
        participants: []Participant{fromAccount, toAccount},
        txLog: make(map[string]string),
    }
    
    return coordinator.ExecuteTransaction(context.Background(), txID)
}
```

## Tautan

Untuk pendekatan alternatif untuk transaksi terdistribusi, lihat [Pola Saga](saga_id.md). Untuk pola keandalan dalam sistem terdistribusi, lihat [Circuit Breaker](../reliability/circuit-breaker_id.md). Untuk konsep arsitektur event-driven, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_id.md).
