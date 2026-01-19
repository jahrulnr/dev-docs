# Prinsip Idempotency

## Gambaran Umum

Prinsip Idempotency memastikan bahwa melakukan operasi berkali-kali memiliki efek yang sama seperti melakukan sekali. Properti ini sangat penting untuk membangun sistem terdistribusi yang andal dimana kegagalan jaringan, retry, dan permintaan duplikat umum terjadi. Dengan membuat operasi idempoten, sistem menjadi lebih tangguh terhadap kegagalan dan dapat melakukan retry operasi dengan aman tanpa menyebabkan efek samping yang tidak diinginkan.

## Konsep Inti

### Operasi Idempoten
- **Hasil Sama**: Eksekusi berganda menghasilkan outcome identik
- **Retry Aman**: Operasi dapat diulang tanpa efek buruk
- **Konsistensi State**: State sistem tetap konsisten di seluruh retry

### Tipe Idempotency
- **Idempotency Natural**: Operasi secara inheren idempoten (GET, PUT, DELETE)
- **Idempotency Sintetik**: Operasi dibuat idempoten melalui desain (POST dengan key)
- **Idempotency Kondisional**: Operasi idempoten di bawah kondisi tertentu

## Strategi Implementasi

### API Idempotency Keys
```javascript
// Implementasi idempotency key untuk REST APIs
const express = require('express');
const crypto = require('crypto');

class IdempotencyService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.keyPrefix = 'idempotency:';
    this.ttl = 24 * 60 * 60; // 24 jam
  }

  async checkAndStoreKey(idempotencyKey, operation) {
    const key = this.keyPrefix + idempotencyKey;

    // Periksa apakah key ada
    const existingResult = await this.redis.get(key);
    if (existingResult) {
      return JSON.parse(existingResult);
    }

    // Simpan hasil operasi dengan TTL
    const result = await operation();
    await this.redis.setex(key, this.ttl, JSON.stringify(result));

    return result;
  }
}

// Penggunaan di endpoint API
app.post('/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Header Idempotency-Key diperlukan' });
  }

  try {
    const result = await idempotencyService.checkAndStoreKey(
      idempotencyKey,
      async () => {
        // Logika pemrosesan pembayaran aktual
        return await processPayment(req.body);
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Idempotency Level Database
```sql
-- Operasi database idempoten menggunakan UPSERT
CREATE OR REPLACE FUNCTION process_payment_idempotent(
  p_payment_id UUID,
  p_amount DECIMAL,
  p_idempotency_key TEXT
) RETURNS JSON AS $$
DECLARE
  v_existing_payment payments%ROWTYPE;
  v_result JSON;
BEGIN
  -- Periksa idempotency key yang ada
  SELECT * INTO v_existing_payment
  FROM payments
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    -- Return hasil yang ada
    v_result := json_build_object(
      'payment_id', v_existing_payment.id,
      'status', v_existing_payment.status,
      'cached', true
    );
    RETURN v_result;
  END IF;

  -- Proses pembayaran baru
  INSERT INTO payments (id, amount, idempotency_key, status, created_at)
  VALUES (p_payment_id, p_amount, p_idempotency_key, 'processing', NOW())
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id, status INTO v_existing_payment;

  -- Jika konflik terjadi, ambil record yang ada
  IF NOT FOUND THEN
    SELECT * INTO v_existing_payment
    FROM payments
    WHERE idempotency_key = p_idempotency_key;
  END IF;

  v_result := json_build_object(
    'payment_id', v_existing_payment.id,
    'status', v_existing_payment.status,
    'cached', false
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### Idempotency Message Queue
```java
// Pemrosesan pesan idempoten dengan deduplikasi
public class IdempotentMessageProcessor {

    private final RedisTemplate<String, String> redisTemplate;
    private final MessageHandler messageHandler;

    public IdempotentMessageProcessor(RedisTemplate<String, String> redisTemplate,
                                    MessageHandler messageHandler) {
        this.redisTemplate = redisTemplate;
        this.messageHandler = messageHandler;
    }

    public void processMessage(Message message) throws Exception {
        String messageId = message.getId();
        String deduplicationKey = "processed:" + messageId;

        // Periksa apakah pesan sudah diproses
        Boolean alreadyProcessed = redisTemplate.hasKey(deduplicationKey);

        if (Boolean.TRUE.equals(alreadyProcessed)) {
            log.info("Pesan {} sudah diproses, dilewati", messageId);
            return;
        }

        try {
            // Proses pesan
            messageHandler.handle(message);

            // Tandai sebagai diproses dengan TTL
            redisTemplate.opsForValue().set(deduplicationKey, "true",
                Duration.ofHours(24));

        } catch (Exception e) {
            log.error("Gagal memproses pesan {}", messageId, e);
            throw e;
        }
    }
}
```

### Idempotency Transaksi Terdistribusi
```java
// Saga pattern dengan kompensasi idempoten
public class OrderSaga implements Saga {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;
    private final SagaLog sagaLog;

    @Override
    public SagaResult execute(OrderRequest request) {
        String sagaId = UUID.randomUUID().toString();

        try {
            // Step 1: Buat order (idempotent)
            Order order = orderService.createOrderIdempotent(request, sagaId);

            // Step 2: Proses pembayaran (idempotent)
            Payment payment = paymentService.processPaymentIdempotent(
                order.getTotal(), sagaId);

            // Step 3: Reserve inventory (idempotent)
            inventoryService.reserveInventoryIdempotent(
                order.getItems(), sagaId);

            sagaLog.markCompleted(sagaId);
            return SagaResult.success(order);

        } catch (Exception e) {
            // Kompensasi dengan operasi idempoten
            compensate(sagaId, e);
            return SagaResult.failure(e);
        }
    }

    private void compensate(String sagaId, Exception cause) {
        try {
            inventoryService.releaseInventoryIdempotent(sagaId);
            paymentService.refundPaymentIdempotent(sagaId);
            orderService.cancelOrderIdempotent(sagaId);
        } catch (Exception compensationError) {
            log.error("Kompensasi gagal untuk saga {}", sagaId, compensationError);
        }
    }
}
```

## Manajemen Idempotency Key

### Strategi Generasi Key
```javascript
// Pola generasi idempotency key
class IdempotencyKeyGenerator {

  // Key yang dihasilkan client (direkomendasikan)
  static generateClientKey() {
    return crypto.randomUUID();
  }

  // Key yang dihasilkan server untuk operasi sensitif
  static generateServerKey(requestData) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(requestData));
    return hash.digest('hex');
  }

  // Key komposit untuk operasi kompleks
  static generateCompositeKey(userId, operation, timestamp) {
    return `${userId}:${operation}:${Math.floor(timestamp / 60000)}`; // Per menit
  }

  // Key berbasis waktu dengan kadaluarsa
  static generateTimeBoundedKey(operation, ttlMinutes = 5) {
    const timestamp = Date.now();
    const expiryTime = timestamp + (ttlMinutes * 60 * 1000);
    return `${operation}:${timestamp}:${expiryTime}`;
  }
}
```

### Penyimpanan dan Cleanup Key
```java
// Penyimpanan idempotency key dengan cleanup otomatis
@Service
public class IdempotencyKeyStore {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ScheduledExecutorService cleanupExecutor;

    public IdempotencyKeyStore(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.cleanupExecutor = Executors.newScheduledThreadPool(1);

        // Schedule cleanup setiap jam
        cleanupExecutor.scheduleAtFixedRate(
            this::cleanupExpiredKeys,
            1, 1, TimeUnit.HOURS
        );
    }

    public <T> T getOrCompute(String key, Supplier<T> operation, Duration ttl) {
        String redisKey = "idempotency:" + key;

        // Coba ambil hasil cache
        T cachedResult = (T) redisTemplate.opsForValue().get(redisKey);
        if (cachedResult != null) {
            return cachedResult;
        }

        // Hitung dan cache hasil
        T result = operation.get();
        redisTemplate.opsForValue().set(redisKey, result, ttl);

        return result;
    }

    private void cleanupExpiredKeys() {
        // Redis secara otomatis expire keys, tapi kita bisa tambah cleanup custom
        log.info("Cleanup idempotency key selesai");
    }
}
```

## Penanganan Error dan Edge Cases

### Penanganan Permintaan Concurrent
```java
// Penanganan permintaan idempoten concurrent
public class ConcurrentIdempotencyHandler {

    private final LockProvider lockProvider;

    public <T> T executeIdempotent(String key, Supplier<T> operation) {
        String lockKey = "lock:" + key;

        try {
            // Acquire distributed lock
            if (!lockProvider.acquireLock(lockKey, Duration.ofSeconds(30))) {
                throw new ConcurrentRequestException("Permintaan lain sedang berlangsung");
            }

            // Periksa hasil yang ada
            T existingResult = getCachedResult(key);
            if (existingResult != null) {
                return existingResult;
            }

            // Eksekusi operasi
            T result = operation.get();
            cacheResult(key, result, Duration.ofHours(24));

            return result;

        } finally {
            lockProvider.releaseLock(lockKey);
        }
    }
}
```

### Skenario Kegagalan Parsial
```javascript
// Penanganan kegagalan parsial dalam operasi terdistribusi
class PartialFailureHandler {

  async executeWithPartialFailureHandling(operation, idempotencyKey) {
    const steps = operation.getSteps();
    const completedSteps = await this.getCompletedSteps(idempotencyKey);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (completedSteps.includes(step.id)) {
        continue; // Lewati step yang sudah selesai
      }

      try {
        await step.execute();
        await this.markStepCompleted(idempotencyKey, step.id);
      } catch (error) {
        // Log kegagalan dan izinkan retry
        await this.logPartialFailure(idempotencyKey, step.id, error);

        // Tentukan apakah operasi dapat dilanjutkan
        if (step.critical) {
          throw error; // Stop pada kegagalan kritis
        }
      }
    }
  }

  async getCompletedSteps(idempotencyKey) {
    // Ambil dari penyimpanan persistent
    return await redis.smembers(`completed:${idempotencyKey}`);
  }

  async markStepCompleted(idempotencyKey, stepId) {
    await redis.sadd(`completed:${idempotencyKey}`, stepId);
    await redis.expire(`completed:${idempotencyKey}`, 24 * 60 * 60);
  }
}
```

## Monitoring dan Observability

### Metrik Idempotency
```javascript
// Monitoring operasi idempotency
const idempotencyMetrics = {
  counters: {
    totalRequests: 0,
    cachedRequests: 0,
    newRequests: 0,
    conflicts: 0,
    errors: 0
  },

  histograms: {
    processingTime: [],
    cacheHitRatio: [],
    keyCollisionRate: []
  },

  gauges: {
    activeKeys: 0,
    expiredKeys: 0,
    storageUsage: 0
  }
};

// Metrik Prometheus
const prometheusMetrics = `
# HELP idempotency_requests_total Total permintaan idempotent
# TYPE idempotency_requests_total counter
idempotency_requests_total{type="cached"} 1234
idempotency_requests_total{type="new"} 5678

# HELP idempotency_processing_duration_seconds Durasi pemrosesan permintaan
# TYPE idempotency_processing_duration_seconds histogram
idempotency_processing_duration_seconds_bucket{le="0.1"} 1234
`;
```

### Aturan Alerting
```yaml
# Aturan alerting untuk masalah idempotency
groups:
  - name: idempotency_alerts
    rules:
      - alert: HighIdempotencyCacheMissRate
        expr: rate(idempotency_requests_total{type="new"}[5m]) / rate(idempotency_requests_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tingkat cache miss idempotency tinggi"
          description: "Cache miss rate adalah {{ $value }}%, menunjukkan potensi masalah"

      - alert: IdempotencyKeyConflicts
        expr: rate(idempotency_conflicts_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Tingkat konflik idempotency key tinggi"
          description: "Konflik terdeteksi pada {{ $value }} req/min"
```

## Testing Idempotency

### Unit Testing
```java
// Unit tests untuk idempotency
@Test
public void testIdempotentOperation() {
    // Given
    String idempotencyKey = "test-key-123";
    PaymentRequest request = createPaymentRequest();

    // When - Eksekusi pertama
    PaymentResult result1 = paymentService.processPayment(request, idempotencyKey);

    // When - Eksekusi kedua dengan key sama
    PaymentResult result2 = paymentService.processPayment(request, idempotencyKey);

    // Then - Hasil harus identik
    assertEquals(result1.getPaymentId(), result2.getPaymentId());
    assertEquals(result1.getStatus(), result2.getStatus());
    assertEquals(result1.getAmount(), result2.getAmount());
}

@Test
public void testConcurrentIdempotentRequests() throws Exception {
    // Given
    String idempotencyKey = "concurrent-test-key";
    PaymentRequest request = createPaymentRequest();

    // When - Eksekusi multiple concurrent requests
    CompletableFuture<PaymentResult> future1 = CompletableFuture
        .supplyAsync(() -> paymentService.processPayment(request, idempotencyKey));

    CompletableFuture<PaymentResult> future2 = CompletableFuture
        .supplyAsync(() -> paymentService.processPayment(request, idempotencyKey));

    PaymentResult result1 = future1.get();
    PaymentResult result2 = future2.get();

    // Then - Kedua harus berhasil dengan hasil sama
    assertEquals(result1.getPaymentId(), result2.getPaymentId());
}
```

### Integration Testing
```javascript
// Integration tests untuk idempotency terdistribusi
describe('Idempotency Integration Tests', () => {
  let redisClient;
  let paymentService;

  beforeAll(async () => {
    redisClient = await createRedisClient();
    paymentService = new PaymentService(redisClient);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  test('should handle network failures gracefully', async () => {
    const idempotencyKey = 'network-failure-test';

    // Simulasi kegagalan jaringan pada attempt pertama
    mockNetworkFailure();

    await expect(
      paymentService.processPayment(paymentData, idempotencyKey)
    ).rejects.toThrow('NetworkError');

    // Restore jaringan dan retry
    restoreNetwork();

    const result = await paymentService.processPayment(paymentData, idempotencyKey);
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
  });

  test('should maintain idempotency across service restarts', async () => {
    const idempotencyKey = 'restart-test';

    // Permintaan pertama
    const result1 = await paymentService.processPayment(paymentData, idempotencyKey);

    // Simulasi restart service
    await paymentService.restart();

    // Permintaan kedua dengan key sama
    const result2 = await paymentService.processPayment(paymentData, idempotencyKey);

    expect(result1.paymentId).toBe(result2.paymentId);
  });
});
```

## Pola Umum dan Anti-Patterns

### Pola yang Direkomendasikan
- **Key yang Dihasilkan Client**: Biarkan client menyediakan idempotency key untuk transparansi
- **Key Terbatas Waktu**: Implementasikan TTL untuk mencegah penyimpanan indefinite
- **Key Komposit**: Gunakan multiple faktor untuk uniqueness
- **Result Caching**: Cache hasil operasi yang berhasil

### Anti-Patterns yang Harus Dihindari
- **Key yang Dihasilkan Server Saja**: Client tidak bisa kontrol retry behavior
- **Tidak Ada Kadaluarsa Key**: Mengarah pada pertumbuhan penyimpanan indefinite
- **Generasi Key Lemah**: Meningkatkan probabilitas collision
- **Mengabaikan Kegagalan Parsial**: Dapat mengarah pada state tidak konsisten

## Tools dan Frameworks

### Library Idempotency
- **Stripe API**: Implementasi referensi untuk idempotency pembayaran
- **AWS SDK**: Built-in idempotency untuk operasi AWS
- **Spring Retry**: Declarative retry dengan dukungan idempotency
- **Resilience4j**: Fault tolerance dengan operasi idempotent

### Solusi Penyimpanan
- **Redis**: Fast key-value store untuk idempotency keys
- **DynamoDB**: Penyimpanan konsisten dengan conditional writes
- **PostgreSQL**: Transaksi ACID untuk idempotency kompleks
- **Kafka**: Deduplikasi pesan untuk sistem event-driven

### Tools Monitoring
- **Prometheus**: Koleksi metrik dan alerting
- **Grafana**: Dashboard untuk monitoring idempotency
- **DataDog**: Application performance monitoring
- **New Relic**: Distributed tracing dan error tracking

## Referensi

- [Stripe API Idempotency](https://stripe.com/docs/api/idempotent_requests)
- [AWS Service Idempotency](https://docs.aws.amazon.com/whitepapers/latest/serverless-architectures-lambda/idempotency.html)
- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231)
- [Designing Data-Intensive Applications - Martin Kleppmann](https://dataintensive.net/)
- [Enterprise Integration Patterns - Gregor Hohpe](https://www.enterpriseintegrationpatterns.com/)