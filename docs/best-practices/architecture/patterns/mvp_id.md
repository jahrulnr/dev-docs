# MVP (Model-View-Presenter)

## Gambaran Umum

MVP (Model-View-Presenter) adalah pola arsitektur perangkat lunak yang memisahkan kepentingan aplikasi menjadi tiga komponen utama: Model, View, dan Presenter. Ini berasal dari pola MVC tetapi menekankan pemisahan yang lebih jelas dengan memiliki Presenter bertindak sebagai perantara yang menangani semua logika UI dan interaksi pengguna. Model mewakili data dan logika bisnis, View bertanggung jawab untuk menampilkan UI, dan Presenter mengelola komunikasi di antara mereka. Pola ini meningkatkan kemampuan pengujian dan pemeliharaan dengan memisahkan UI dari logika bisnis.

## Komponen Utama

- **Model**: Menangani data dan logika bisnis. Ini independen dari UI dan menyediakan metode untuk mengambil dan memperbarui data.
- **View**: Mewakili antarmuka pengguna. Ini menampilkan data dan menangkap input pengguna, tetapi tidak mengandung logika bisnis.
- **Presenter**: Bertindak sebagai jembatan antara Model dan View. Ini merespons tindakan pengguna dari View, memperbarui Model, dan menyegarkan View sesuai.

```text
+-------+     +-----------+     +-------+
| View  |<--->| Presenter |<--->| Model |
+-------+     +-----------+     +-------+
```

## Kapan Menggunakan

Gunakan MVP ketika:

- Membangun aplikasi intensif UI di mana Anda perlu memisahkan logika presentasi dari logika bisnis.
- Anda ingin meningkatkan kemampuan pengujian komponen UI dengan mocking View.
- Bekerja dengan framework yang mendukung View pasif, seperti Android atau aplikasi web.
- Hindari di aplikasi sederhana di mana kompleksitas tambahan tidak dibenarkan.

## Panduan Implementasi

1. **Definisikan Antarmuka**: Buat antarmuka untuk View dan Model untuk memungkinkan pengujian mudah dan injeksi dependensi.
2. **Implementasikan Presenter**: Presenter harus memegang referensi ke antarmuka View dan Model. Ini menangani event dari View dan memperbarui Model.
3. **Jaga View Pasif**: View harus hanya menampilkan data dan mendelegasikan tindakan pengguna ke Presenter.
4. **Gunakan Injeksi Dependensi**: Suntikkan Presenter dengan View dan Model untuk mempertahankan kopling longgar.

## Contoh

Berikut adalah contoh sederhana dalam Go untuk fitur login pengguna:

```go
// Antarmuka Model
type UserModel interface {
    ValidateCredentials(username, password string) bool
}

// Antarmuka View
type LoginView interface {
    ShowSuccess()
    ShowError(message string)
    GetUsername() string
    GetPassword() string
}

// Presenter
type LoginPresenter struct {
    model UserModel
    view  LoginView
}

func (p *LoginPresenter) OnLoginClicked() {
    username := p.view.GetUsername()
    password := p.view.GetPassword()
    if p.model.ValidateCredentials(username, password) {
        p.view.ShowSuccess()
    } else {
        p.view.ShowError("Invalid credentials")
    }
}
```

## Tautan

Untuk lebih lanjut tentang pemisahan kepentingan, lihat Pemisahan Kepentingan. Untuk pola terkait, periksa Pola Desain.
