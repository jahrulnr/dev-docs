# Anti-Pattern Distributed Monolith

## Gambaran Umum

Distributed Monolith terjadi ketika sistem dibagi menjadi beberapa layanan yang sangat terkait, berbagi database, memerlukan deployment terkoordinasi, dan kurang independensi sejati. Ini menggabungkan aspek terburuk dari arsitektur monolitik dan terdistribusi.

## Penyebab Utama

- **Dekomposisi Tidak Tepat**: Layanan dibagi berdasarkan lapisan teknis daripada domain bisnis.
- **Database Bersama**: Layanan mengakses tabel database yang sama secara langsung.
- **Keterkaitan Ketat**: Pola komunikasi sinkron antar layanan.
- **Kurang Domain-Driven Design**: Tidak mengidentifikasi bounded contexts yang tepat.

## Dampak

- **Kompleksitas Deployment**: Semua layanan harus dideploy bersama, kehilangan manfaat deployment independen.
- **Tantangan Scaling**: Tidak dapat menskalakan layanan individu berdasarkan permintaan.
- **Bottleneck Pengembangan**: Perubahan di satu layanan memerlukan koordinasi dengan yang lain.
- **Latensi Bertambah**: Panggilan jaringan antar layanan yang terkait erat menambah overhead.
- **Kesulitan Testing**: Testing end-to-end menjadi kompleks dan rapuh.

## Contoh

### Contoh Buruk (Database Bersama)

```javascript
// Layanan A - Order Service
class OrderService {
  createOrder(orderData) {
    // Akses database langsung
    const order = db.orders.insert(orderData);
    // Panggil Layanan B secara sinkron
    const inventoryUpdated = await inventoryService.reserveStock(order.items);
    if (!inventoryUpdated) throw new Error('Out of stock');
    return order;
  }
}

// Layanan B - Inventory Service
class InventoryService {
  reserveStock(items) {
    // Akses database sama
    return db.inventory.updateStock(items);
  }
}
```

### Contoh Baik (Microservices Tepat)

```javascript
// Layanan A - Order Service
class OrderService {
  constructor(eventBus, orderRepo) {
    this.eventBus = eventBus;
    this.orderRepo = orderRepo;
  }

  async createOrder(orderData) {
    const order = await this.orderRepo.save(orderData);
    // Publish event secara asinkron
    await this.eventBus.publish('OrderCreated', {
      orderId: order.id,
      items: order.items
    });
    return order;
  }
}

// Layanan B - Inventory Service
class InventoryService {
  constructor(eventBus, inventoryRepo) {
    this.eventBus = eventBus;
    this.inventoryRepo = inventoryRepo;
  }

  async handleOrderCreated(event) {
    try {
      await this.inventoryRepo.reserveStock(event.items);
      await this.eventBus.publish('StockReserved', {
        orderId: event.orderId
      });
    } catch (error) {
      await this.eventBus.publish('StockReservationFailed', {
        orderId: event.orderId,
        reason: error.message
      });
    }
  }
}
```

## Strategi Mitigasi

1. **Identifikasi Bounded Contexts**: Gunakan Domain-Driven Design untuk mendefinisikan batas layanan yang jelas.
2. **Implementasikan Event-Driven Architecture**: Gunakan komunikasi asinkron antar layanan.
3. **Database per Service**: Berikan setiap layanan database/skemanya sendiri.
4. **Versioning API**: Implementasikan versioning yang tepat untuk interface layanan.
5. **Deployment Independen**: Pastikan layanan dapat dideploy tanpa berkoordinasi dengan yang lain.

## Praktik Terbaik

- **Event Sourcing**: Gunakan event untuk mengkomunikasikan perubahan state antar layanan.
- **CQRS**: Pisahkan model read dan write untuk skalabilitas yang lebih baik.
- **Saga Pattern**: Tangani transaksi terdistribusi menggunakan saga.
- **Service Mesh**: Gunakan service mesh untuk observability dan manajemen traffic.
- **Contract Testing**: Test integrasi layanan dengan contract tests.

## Alat

- **Service Mesh**: Istio, Linkerd untuk komunikasi layanan-ke-layanan.
- **Event Streaming**: Apache Kafka, RabbitMQ untuk komunikasi event-driven.
- **API Gateway**: Kong, Traefik untuk manajemen API.
- **Container Orchestration**: Kubernetes untuk deployment layanan independen.

## Referensi

- [Building Microservices oleh Sam Newman](https://samnewman.io/books/building_microservices/)
- [Domain-Driven Design oleh Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Microservices Anti-Patterns](https://microservices.io/patterns/antipatterns.html)