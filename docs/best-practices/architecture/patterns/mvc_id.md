# MVC (Model-View-Controller)

## Gambaran Umum

MVC (Model-View-Controller) adalah pola arsitektur perangkat lunak yang memisahkan aplikasi menjadi tiga komponen yang saling terhubung: Model, View, dan Controller. Pemisahan ini membantu mengelola kompleksitas dengan membagi tanggung jawab, membuat kode lebih modular, dapat diuji, dan dapat dipelihara. Model mewakili data dan logika bisnis, View menangani lapisan presentasi, dan Controller mengelola input pengguna dan memperbarui Model dan View sesuai. Berasal dari Smalltalk pada tahun 1970-an, MVC banyak digunakan dalam framework pengembangan web seperti Ruby on Rails, ASP.NET, dan Express.js, mempromosikan pemisahan kepentingan yang jelas.

## Komponen Utama

MVC terdiri dari tiga komponen utama:

- **Model**: Mengelola data, logika bisnis, dan status aplikasi. Ini independen dari antarmuka pengguna dan menangani pengambilan data, validasi, dan manipulasi.
- **View**: Bertanggung jawab untuk merender antarmuka pengguna dan menampilkan data dari Model. Ini menerima pembaruan dari Controller dan menyajikan informasi kepada pengguna.
- **Controller**: Bertindak sebagai perantara antara Model dan View. Ini memproses input pengguna, memperbarui Model, dan memilih View yang sesuai untuk ditampilkan.

```text
+-----------+     +-----------+     +-----------+
|   View    | <-- | Controller| --> |   Model   |
| (UI)      |     | (Logic)   |     | (Data)    |
+-----------+     +-----------+     +-----------+
       |                 |
       +-----------------+
          User Interaction
```

## Kapan Menggunakan

Pilih MVC untuk:

- Aplikasi web di mana Anda perlu memisahkan logika bisnis dari presentasi.
- Proyek yang memerlukan komponen yang dapat digunakan kembali dan pemeliharaan yang mudah.
- Framework yang mendukung pengembangan cepat, seperti dalam aplikasi web full-stack.
- Hindari dalam skrip sederhana atau ketika kopling ketat antara UI dan logika dapat diterima.

## Panduan Implementasi

1. **Definisikan Model**: Buat struct atau kelas untuk entitas data dan metode untuk logika bisnis. Pastikan Model independen dari View dan Controller.
2. **Buat View**: Implementasikan template atau komponen untuk rendering UI. View harus hanya menampilkan data dan tidak mengandung logika.
3. **Bangun Controller**: Tulis handler untuk permintaan pengguna. Controller memperbarui Model dan memilih View berdasarkan status aplikasi.
4. **Hubungkan Komponen**: Gunakan routing untuk menghubungkan Controller ke endpoint, dan pastikan Controller menyuntikkan data ke View dari Model.
5. **Uji Secara Terpisah**: Uji unit Model untuk logika, Controller untuk perilaku, dan View untuk rendering.

## Contoh

Berikut adalah contoh Go sederhana menggunakan framework Gin untuk aplikasi web:

```go
// Model
type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

// View (disederhanakan sebagai respons JSON)
func renderUser(w http.ResponseWriter, user User) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

// Controller
func getUser(c *gin.Context) {
    id := c.Param("id")
    // Simulasi pengambilan dari Model
    user := User{ID: 1, Name: "John Doe"}
    renderUser(c.Writer, user)
}

func main() {
    r := gin.Default()
    r.GET("/user/:id", getUser)
    r.Run()
}
```

## Tautan

Untuk lebih lanjut tentang pemisahan kepentingan, lihat Pemisahan Kepentingan. Untuk deployment web, periksa Deployment AWS.
