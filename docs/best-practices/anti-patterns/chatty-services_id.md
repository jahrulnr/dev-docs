# Anti-Pattern Chatty Services

## Gambaran Umum

Chatty Services terjadi ketika microservices membuat panggilan API yang berlebihan dan terlalu detail satu sama lain untuk menyelesaikan satu operasi bisnis. Ini menghasilkan latensi jaringan tinggi, peningkatan coupling, dan performa buruk di sistem terdistribusi.

## Penyebab Utama

- **Over-Decomposition**: Layanan dibagi terlalu halus, memerlukan banyak panggilan untuk operasi sederhana.
- **Komunikasi Sinkron**: Ketergantungan pada pola request-response alih-alih messaging asinkron.
- **Kurang Agregasi**: Tidak ada lapisan layanan untuk menggabungkan beberapa panggilan detail.
- **Desain API Buruk**: API dirancang untuk penggunaan internal daripada komunikasi inter-service yang efisien.

## Dampak

- **Degradasi Performa**: Setiap panggilan jaringan menambah latensi (biasanya 10-100ms).
- **Peningkatan Coupling**: Layanan menjadi sangat tergantung pada interface satu sama lain.
- **Kongesti Jaringan**: Volume tinggi request kecil membebani infrastruktur jaringan.
- **Propagasi Error**: Kegagalan di satu layanan menyebar melalui beberapa panggilan dependen.
- **Testing Sulit**: Kompleks untuk mock dan test interaksi yang chatty.

## Contoh

### Contoh Buruk (Komunikasi Chatty)

```javascript
// Order Service - Membuat beberapa panggilan untuk pemrosesan pesanan
class OrderService {
  async processOrder(orderId) {
    // Panggilan 1: Dapatkan detail pesanan
    const order = await orderAPI.getOrder(orderId);

    // Panggilan 2: Periksa status pelanggan
    const customer = await customerAPI.getCustomer(order.customerId);

    // Panggilan 3: Validasi metode pembayaran
    const paymentValid = await paymentAPI.validatePayment(order.paymentId);

    // Panggilan 4: Periksa ketersediaan produk
    const availability = await inventoryAPI.checkAvailability(order.productId);

    // Panggilan 5: Hitung pengiriman
    const shipping = await shippingAPI.calculateShipping(order.address);

    // Panggilan 6: Proses pembayaran
    const paymentResult = await paymentAPI.processPayment(order.total);

    // Panggilan 7: Update inventori
    await inventoryAPI.updateStock(order.productId, -order.quantity);

    // Panggilan 8: Kirim konfirmasi
    await notificationAPI.sendConfirmation(order.customerId, orderId);

    return { success: true, orderId };
  }
}
```

### Contoh Baik (Panggilan Terkonsolidasi)

```javascript
// Order Service - Menggunakan operasi bulk dan event
class OrderService {
  constructor(orderProcessor) {
    this.orderProcessor = orderProcessor;
  }

  async processOrder(orderData) {
    // Panggilan tunggal dengan semua data yang diperlukan
    const result = await this.orderProcessor.processCompleteOrder({
      customerId: orderData.customerId,
      productId: orderData.productId,
      quantity: orderData.quantity,
      paymentId: orderData.paymentId,
      shippingAddress: orderData.address
    });

    // Publish event untuk pemrosesan async
    await eventBus.publish('OrderProcessed', {
      orderId: result.orderId,
      customerId: orderData.customerId
    });

    return result;
  }
}

// Order Processor - Menangani semua logika secara internal
class OrderProcessor {
  async processCompleteOrder(orderData) {
    // Validasi semua data di satu tempat
    const [customer, payment, inventory, shipping] = await Promise.all([
      this.customerRepo.get(orderData.customerId),
      this.paymentService.validate(orderData.paymentId),
      this.inventoryService.checkAndReserve(orderData.productId, orderData.quantity),
      this.shippingService.calculate(orderData.shippingAddress)
    ]);

    // Proses pembayaran dan update inventori secara atomik
    const paymentResult = await this.paymentService.charge(orderData.paymentId, shipping.total);
    if (paymentResult.success) {
      await this.inventoryService.confirmReservation(orderData.productId, orderData.quantity);
      const order = await this.orderRepo.create(orderData);
      return { success: true, orderId: order.id };
    }

    return { success: false, reason: 'Payment failed' };
  }
}
```

## Strategi Mitigasi

1. **Operasi Bulk**: Rancang API yang menerima beberapa item dalam satu panggilan.
2. **Data Transfer Objects**: Buat DTO yang membawa semua data yang diperlukan.
3. **Event-Driven Architecture**: Gunakan event untuk memicu pemrosesan async alih-alih panggilan sync.
4. **API Composition**: Perkenalkan lapisan komposisi API untuk mengagregasi panggilan.
5. **Caching**: Cache data yang sering diakses untuk mengurangi panggilan.

## Praktik Terbaik

- **Batch Processing**: Kelompokkan beberapa operasi ke dalam request tunggal.
- **GraphQL**: Gunakan GraphQL untuk fetching data yang fleksibel dan teragregasi.
- **CQRS**: Pisahkan model read/write untuk mengoptimalkan pola query.
- **Service Mesh**: Gunakan service mesh untuk komunikasi inter-service yang efisien.
- **Monitoring**: Track dan alert pada volume panggilan tinggi antar layanan.

## Alat

- **API Gateway**: Untuk agregasi request dan routing.
- **Service Mesh**: Istio, Linkerd untuk komunikasi layanan yang dioptimalkan.
- **GraphQL Servers**: Apollo, Graphene untuk API fleksibel.
- **Event Streaming**: Kafka, RabbitMQ untuk pola event-driven.
- **Monitoring Tools**: Prometheus, Grafana untuk tracking interaksi layanan.

## Referensi

- [Building Microservices oleh Sam Newman](https://samnewman.io/books/building_microservices/)
- [Designing Data-Intensive Applications oleh Martin Kleppmann](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)
- [Microservices Communication Patterns](https://microservices.io/patterns/communication.html)