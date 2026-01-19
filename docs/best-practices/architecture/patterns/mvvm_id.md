# MVVM (Model-View-ViewModel)

## Gambaran Umum

MVVM (Model-View-ViewModel) adalah pola arsitektur yang memisahkan pengembangan antarmuka pengguna grafis dari logika bisnis atau logika back-end. Ini diperkenalkan oleh Microsoft untuk aplikasi WPF dan Silverlight. Pola ini membagi aplikasi menjadi tiga lapisan: Model (data), View (UI), dan ViewModel (logika presentasi), mempromosikan pemisahan kepentingan, kemampuan pengujian, dan pemeliharaan. Pengikatan data adalah fitur kunci, memungkinkan sinkronisasi otomatis antara View dan ViewModel.

## Komponen Utama

MVVM terdiri dari tiga komponen utama:

- **Model**: Mewakili data dan logika bisnis. Ini menangani akses data, validasi, dan manipulasi, independen dari UI.
- **View**: Antarmuka pengguna yang menampilkan data dan menangkap input pengguna. Ini terikat ke ViewModel dan tetap sesederhana mungkin.
- **ViewModel**: Bertindak sebagai perantara antara Model dan View. Ini mengekspos properti data dan perintah untuk View, menangani logika presentasi dan interaksi pengguna.

```text
+--------+
|  View  |
| (UI)   |
+--------+
    |
+--------+
|ViewModel|
|(Logic) |
+--------+
    |
+--------+
| Model  |
| (Data) |
+--------+
```

## Kapan Menggunakan

Pilih MVVM untuk:

- Aplikasi intensif UI, terutama yang menggunakan framework pengikatan data seperti WPF, Angular, Vue.js, atau React dengan manajemen state.
- Proyek yang memerlukan pemisahan UI dari logika bisnis untuk meningkatkan kemampuan pengujian dan penggunaan kembali.
- Aplikasi lintas platform atau multi-perangkat di mana ViewModel yang sama dapat digunakan kembali dengan View berbeda.
- Hindari di aplikasi sederhana tanpa interaksi UI kompleks, di mana pola menambah overhead yang tidak perlu.

## Panduan Implementasi

1. **Definisikan Model**: Buat kelas atau struct untuk entitas data dan aturan bisnis, memastikan mereka independen dari kepentingan UI.
2. **Buat ViewModel**: Implementasikan ViewModel yang mengekspos data Model sebagai properti dan menangani perintah atau peristiwa untuk tindakan pengguna. Gunakan pengikatan data untuk terhubung ke View.
3. **Desain View**: Bangun UI untuk terikat ke properti ViewModel. Jaga logika minimal; gunakan pengikatan deklaratif.
4. **Implementasikan Pengikatan Data**: Gunakan fitur framework (misalnya, INotifyPropertyChanged WPF) untuk memberitahu View tentang perubahan.
5. **Uji ViewModel**: Fokus pengujian unit pada ViewModel, mocking Model jika diperlukan.

## Contoh

Di aplikasi profil pengguna sederhana, Model mengelola data pengguna, ViewModel memformatnya untuk tampilan, dan View menampilkannya.

```go
// Model
type User struct {
    Name string
    Age  int
}

func (u *User) Validate() error {
    if u.Age < 0 {
        return errors.New("age cannot be negative")
    }
    return nil
}

// ViewModel (konseptual, menggunakan channel untuk simulasi pengikatan)
type UserViewModel struct {
    user       *User
    nameChange chan string
}

func NewUserViewModel(user *User) *UserViewModel {
    return &UserViewModel{
        user:       user,
        nameChange: make(chan string),
    }
}

func (vm *UserViewModel) GetName() string {
    return vm.user.Name
}

func (vm *UserViewModel) SetName(name string) {
    vm.user.Name = name
    vm.nameChange <- name // Simulasi notifikasi perubahan properti
}

func (vm *UserViewModel) GetDisplayText() string {
    return fmt.Sprintf("User: %s, Age: %d", vm.user.Name, vm.user.Age)
}

// View (output konsol konseptual)
func display(vm *UserViewModel) {
    go func() {
        for name := range vm.nameChange {
            fmt.Printf("Name updated to: %s\n", name)
        }
    }()
    fmt.Println(vm.GetDisplayText())
}
```

## Tautan

Untuk lebih lanjut tentang prinsip SOLID, lihat Prinsip SOLID. Untuk pemisahan kepentingan, periksa Pemisahan Kepentingan.
