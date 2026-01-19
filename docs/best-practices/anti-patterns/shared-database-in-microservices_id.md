# Shared Database in Microservices

## Gambaran Umum

Shared Database in Microservices adalah anti-pattern di mana beberapa microservices berbagi satu database fisik atau skema database yang sama. Meskipun terlihat efisien untuk berbagi data, pendekatan ini menciptakan tight coupling antara layanan, mencegah evolusi independen dan meningkatkan risiko kegagalan sistemik.

## Mengapa Bermasalah

### Penyebab Utama
- **Persepsi Efisiensi**: Berbagi database tampak lebih sederhana daripada mengelola multiple databases.
- **Legacy Migration**: Transisi dari monolithic ke microservices tanpa refactor data layer.
- **Kurang Pemahaman**: Tidak memahami prinsip bounded context dalam Domain-Driven Design.

### Dampak Negatif
- **Tight Coupling**: Perubahan skema di satu layanan mempengaruhi layanan lain.
- **Deployment Coordination**: Sulit deploy layanan secara independen karena dependencies database.
- **Scalability Issues**: Database menjadi bottleneck untuk semua layanan.
- **Data Consistency**: Sulit maintain consistency tanpa distributed transactions.
- **Evolutionary Lock**: Sulit evolve data model per domain needs.

## Mitigasi dan Solusi

### Database per Service
- Setiap microservice memiliki database sendiri (dedicated instance atau schema).
- Menggunakan teknologi database yang sesuai dengan kebutuhan layanan.

### Bounded Contexts
- Definisikan domain boundaries yang jelas.
- Setiap bounded context memiliki model data sendiri.

### Data Sharing Patterns
- **Event-Driven Communication**: Publish events untuk data changes.
- **API Composition**: Layanan memanggil API layanan lain untuk data.
- **CQRS**: Separate read/write models untuk complex queries.

### Contoh Implementasi

#### Sebelum (Anti-pattern)
```sql
-- Satu database untuk semua services
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  -- Fields untuk order service
  last_order_date DATE,
  -- Fields untuk payment service
  credit_limit DECIMAL
);
```

#### Sesudah (Best Practice)
```sql
-- User Service Database
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

-- Order Service Database
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  order_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) -- Via API call
);
```

#### Event-Driven Approach
```javascript
// User Service publishes event
eventBus.publish('user.updated', {
  userId: 123,
  newEmail: 'new@example.com'
});

// Order Service subscribes
eventBus.subscribe('user.updated', (event) => {
  updateOrderContact(event.userId, event.newEmail);
});
```

## Best Practices

- **Domain-Driven Design**: Gunakan bounded contexts untuk define data ownership.
- **Event Sourcing**: Track data changes sebagai events untuk consistency.
- **Saga Pattern**: Handle distributed transactions tanpa 2PC.
- **API Gateway**: Centralized access untuk cross-service data needs.

## Tools dan Technologies

- **Database**: PostgreSQL, MongoDB per service
- **Message Broker**: Apache Kafka, RabbitMQ untuk events
- **API Gateway**: Kong, Traefik untuk service communication
- **Service Mesh**: Istio untuk observability

## Common Mistakes

- **Shared Tables**: Berbagi tables dalam satu database.
- **Cross-Service Queries**: Layanan query database layanan lain langsung.
- **Schema Coupling**: Perubahan schema mempengaruhi multiple services.
- **Transactional Boundaries**: ACID transactions across services.

## Referensi

- "Building Microservices" oleh Sam Newman
- "Domain-Driven Design" oleh Eric Evans
- Microsoft Microservices Architecture guidance
- Martin Fowler's blog on Microservices
- Confluent documentation on Event Streaming