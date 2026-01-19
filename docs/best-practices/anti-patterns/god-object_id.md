# Anti-Pattern God Object

## Gambaran Umum

Anti-pattern God Object terjadi ketika satu kelas, modul, atau objek mengumpulkan terlalu banyak tanggung jawab, menjadi titik sentral yang menangani terlalu banyak kepentingan. Ini melanggar Prinsip Tanggung Jawab Tunggal dan menyebabkan kode yang erat terkait dan sulit dipelihara.

## Penyebab Utama

- **Pengembangan Bertahap**: Seiring waktu, pengembang menambahkan fungsionalitas ke kelas yang ada tanpa refactoring yang tepat.
- **Kurang Perencanaan Desain**: Arsitektur awal yang buruk memungkinkan tanggung jawab terkumpul di satu tempat.
- **Takut Perubahan**: Pengembang menghindari memecah kelas besar karena kompleksitas yang dirasakan.

## Dampak

- **Kesulitan Pemeliharaan**: Perubahan di satu area memengaruhi banyak fungsionalitas yang tidak terkait.
- **Tantangan Pengujian**: Objek besar memerlukan setup pengujian yang ekstensif dan rentan terhadap pengujian yang rapuh.
- **Keterpakai Ulang Kode**: Sulit menggunakan kembali komponen individu tanpa menarik dependensi yang tidak perlu.
- **Masalah Skalabilitas**: Bottleneck performa ketika objek menangani terlalu banyak operasi.

## Contoh

### Contoh Buruk (JavaScript)

```javascript
class UserManager {
  constructor() {
    this.users = [];
    this.notifications = [];
    this.payments = [];
  }

  // Manajemen pengguna
  addUser(user) { /* ... */ }
  removeUser(id) { /* ... */ }
  findUser(id) { /* ... */ }

  // Penanganan notifikasi
  sendEmail(userId, message) { /* ... */ }
  sendSMS(userId, message) { /* ... */ }

  // Pemrosesan pembayaran
  processPayment(userId, amount) { /* ... */ }
  refundPayment(paymentId) { /* ... */ }

  // Persistensi data
  saveToDatabase() { /* ... */ }
  loadFromDatabase() { /* ... */ }

  // Pelaporan
  generateUserReport() { /* ... */ }
  generatePaymentReport() { /* ... */ }
}
```

### Contoh Baik (Direfaktor)

```javascript
class UserRepository {
  addUser(user) { /* ... */ }
  removeUser(id) { /* ... */ }
  findUser(id) { /* ... */ }
  save() { /* ... */ }
}

class NotificationService {
  sendEmail(userId, message) { /* ... */ }
  sendSMS(userId, message) { /* ... */ }
}

class PaymentService {
  processPayment(userId, amount) { /* ... */ }
  refundPayment(paymentId) { /* ... */ }
}

class ReportGenerator {
  generateUserReport() { /* ... */ }
  generatePaymentReport() { /* ... */ }
}
```

## Strategi Mitigasi

1. **Terapkan Prinsip Tanggung Jawab Tunggal**: Pastikan setiap kelas memiliki satu alasan untuk berubah.
2. **Ekstrak Kelas**: Pecah kelas besar menjadi komponen yang lebih kecil dan fokus.
3. **Gunakan Komposisi**: Gabungkan objek yang lebih kecil daripada mewarisi semuanya.
4. **Implementasikan Interface**: Definisikan kontrak yang jelas antara komponen.
5. **Refactoring Reguler**: Jadwalkan waktu untuk pembersihan dan restrukturisasi kode.

## Praktik Terbaik

- **Batasi Ukuran Kelas**: Jaga kelas di bawah 200-300 baris.
- **Dependency Injection**: Gunakan DI untuk memisahkan komponen.
- **Prinsip SOLID**: Ikuti semua prinsip SOLID, terutama Tanggung Jawab Tunggal.
- **Code Reviews**: Review reguler untuk menangkap akumulasi tanggung jawab secara dini.

## Alat

- **Analisis Statis**: Alat seperti SonarQube dapat mendeteksi kelas besar.
- **Alat Metrik**: Alat metrik kode untuk memantau kompleksitas kelas.
- **Alat Refactoring**: Fitur IDE untuk mengekstrak metode/kelas.

## Referensi

- [Clean Code oleh Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
- [Prinsip SOLID](https://en.wikipedia.org/wiki/SOLID)