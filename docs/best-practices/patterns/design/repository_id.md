# Pola Repository

## Gambaran Umum

Pola Repository adalah pola desain yang mengabstraksi logika akses data, menyediakan antarmuka seperti koleksi untuk mengakses objek domain. Ini memisahkan logika bisnis dari teknologi akses data, membuat kode lebih dapat diuji dan dipelihara.

Manfaat termasuk pemisahan tanggung jawab (logika bisnis vs. akses data), pengujian unit yang lebih mudah (mock repositories), independensi teknologi (ganti database tanpa mengubah kode bisnis), dan logika akses data terpusat.

## Komponen Utama

- **Antarmuka Repository**: Mendefinisikan metode untuk operasi CRUD (Create, Read, Update, Delete).
- **Repository Konkret**: Mengimplementasikan antarmuka menggunakan penyimpanan data spesifik (misalnya, SQL, NoSQL).
- **Entitas Domain**: Objek bisnis yang disimpan/diambil.
- **Unit of Work (Opsional)**: Mengelola transaksi di seluruh repository.

```text
Klien (Logika Bisnis)
          |
          v
+----------------+       Akses       +----------------+
| Antarmuka      |  --------------->  | Penyimpanan    |
| Repository     |                     | Data (DB, API, |
+----------------+                     | dll.)          |
          ^
          |
     Repository Konkret
```

## Kapan Menggunakan

Gunakan dalam domain-driven design untuk mengabstraksi persistensi data. Ketika Anda perlu mock akses data untuk pengujian. Dalam aplikasi dengan query kompleks atau sumber data ganda. Hindari untuk CRUD sederhana tanpa kebutuhan abstraksi.

## Panduan Implementasi

1. Definisikan antarmuka Repository dengan metode seperti Save, FindById, FindAll, Delete.
2. Implementasikan kelas Repository Konkret untuk setiap penyimpanan data (misalnya, SqlUserRepository).
3. Suntikkan repository ke dalam layanan domain atau use cases.
4. Gunakan dependency injection untuk mengganti implementasi (misalnya, untuk pengujian).
5. Opsional, implementasikan Unit of Work untuk manajemen transaksi.

## Contoh

Dalam sistem ecommerce, UserRepository mengabstraksi akses data pengguna, memungkinkan logika bisnis bekerja dengan entitas User tanpa mengetahui detail database.

```go
// Antarmuka Repository
type UserRepository interface {
    Save(user User) error
    FindById(id int) (User, error)
    FindAll() ([]User, error)
    Delete(id int) error
}

// Repository Konkret
type SqlUserRepository struct {
    db *sql.DB
}

func (r SqlUserRepository) Save(user User) error {
    // Implementasi SQL
}
```

## Tautan

Untuk pola arsitektural terkait, lihat [CQRS](../integration/cqrs_id.md). Untuk model domain, periksa [Coding Rules](../../principles/code-quality/clean-code_id.md).
