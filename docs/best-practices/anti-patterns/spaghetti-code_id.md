# Anti-Pattern Spaghetti Code

## Gambaran Umum

Spaghetti Code adalah anti-pattern di mana kode menjadi kusut dan tidak terstruktur, dengan pemisahan tanggung jawab yang buruk dan alur yang tidak jelas. Seperti sepiring spaghetti, sulit mengikuti untaian individu (jalur logika) melalui basis kode.

## Penyebab Utama

- **Kurang Perencanaan**: Kode ditulis tanpa desain atau arsitektur yang tepat.
- **Tekanan Waktu**: Pengembang mengambil jalan pintas untuk memenuhi tenggat waktu.
- **Pemrograman Copy-Paste**: Menduplikasi kode alih-alih membuat fungsi yang dapat digunakan ulang.
- **Tidak Ada Code Reviews**: Absennya review rekan memungkinkan praktik buruk bertahan.

## Dampak

- **Keputusasaan Pemeliharaan**: Perubahan kecil dapat merusak fungsionalitas yang tidak terkait.
- **Pengenalan Bug**: Kode yang sulit dipahami menyebabkan lebih banyak bug.
- **Keterujian Rendah**: Sulit menulis unit test untuk logika yang saling terkait.
- **Kesulitan Onboarding**: Pengembang baru kesulitan memahami basis kode.

## Contoh

### Contoh Buruk (JavaScript)

```javascript
function processOrder(orderId) {
  // Dapatkan data pesanan
  let order = database.query("SELECT * FROM orders WHERE id = " + orderId);

  // Periksa inventori
  let inventory = database.query("SELECT * FROM inventory WHERE product_id = " + order.product_id);
  if (inventory.quantity < order.quantity) {
    // Kirim email
    emailService.send("admin@company.com", "Out of stock: " + order.product_id);
    return false;
  }

  // Proses pembayaran
  let paymentResult = paymentGateway.charge(order.total);
  if (!paymentResult.success) {
    // Log error
    console.log("Payment failed for order " + orderId);
    return false;
  }

  // Update inventori
  database.query("UPDATE inventory SET quantity = quantity - " + order.quantity + " WHERE product_id = " + order.product_id);

  // Kirim konfirmasi
  emailService.send(order.customer_email, "Order confirmed: " + orderId);

  return true;
}
```

### Contoh Baik (Direfaktor)

```javascript
class OrderProcessor {
  constructor(orderRepo, inventoryService, paymentService, notificationService) {
    this.orderRepo = orderRepo;
    this.inventoryService = inventoryService;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
  }

  async processOrder(orderId) {
    const order = await this.orderRepo.getById(orderId);

    if (!await this.inventoryService.checkAvailability(order.productId, order.quantity)) {
      await this.notificationService.notifyAdminOutOfStock(order.productId);
      return false;
    }

    const paymentResult = await this.paymentService.charge(order.total);
    if (!paymentResult.success) {
      await this.notificationService.logPaymentFailure(orderId);
      return false;
    }

    await this.inventoryService.updateStock(order.productId, -order.quantity);
    await this.notificationService.sendOrderConfirmation(order.customerEmail, orderId);

    return true;
  }
}
```

## Strategi Mitigasi

1. **Perkenalkan Struktur**: Pecah fungsi besar menjadi fungsi yang lebih kecil dan fokus.
2. **Terapkan Design Patterns**: Gunakan pola yang sesuai seperti Strategy, Factory, atau Observer.
3. **Tingkatkan Separation of Concerns**: Kelompokkan fungsionalitas terkait ke dalam kelas/modul.
4. **Tambahkan Abstraksi**: Buat interface dan kelas abstrak untuk mendefinisikan kontrak yang jelas.
5. **Refactor Secara Bertahap**: Buat perubahan kecil dan aman dari waktu ke waktu.

## Praktik Terbaik

- **Tanggung Jawab Tunggal**: Setiap fungsi/metode harus melakukan satu hal.
- **Prinsip DRY**: Don't Repeat Yourself - eliminasi duplikasi kode.
- **Nama Bermakna**: Gunakan nama deskriptif untuk variabel, fungsi, dan kelas.
- **Code Reviews**: Review rekan reguler untuk menangkap spaghetti code secara dini.
- **Pengujian Otomatis**: Tulis test untuk memastikan refactoring tidak merusak fungsionalitas.

## Alat

- **Alat Analisis Statis**: ESLint, SonarQube untuk mendeteksi code smells.
- **Metrik Kode**: Alat untuk mengukur kompleksitas siklomatik dan panjang fungsi.
- **Alat Refactoring**: Fitur IDE untuk mengekstrak metode dan kelas.

## Referensi

- [Clean Code oleh Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
- [Code Complete oleh Steve McConnell](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)