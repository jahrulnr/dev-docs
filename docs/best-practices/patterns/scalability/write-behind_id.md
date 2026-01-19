# Write-Behind Cache

## Gambaran Umum

Write-Behind Cache (juga dikenal sebagai Write-Back Cache) adalah pola caching di mana operasi tulis dilakukan segera ke cache, dan perubahan disimpan secara asinkron ke penyimpanan utama pada waktu kemudian. Pola ini secara signifikan meningkatkan performa tulis dengan memisahkan operasi tulis dari penyimpanan persistent yang lebih lambat, memungkinkan aplikasi untuk melanjutkan pemrosesan tanpa menunggu I/O disk.

Namun, peningkatan performa ini datang dengan trade-off, khususnya seputar durability dan konsistensi data. Write-Behind Cache cocok untuk skenario di mana eventual consistency dapat diterima dan beberapa risiko kehilangan data dapat ditoleransi.

## Konsep Inti

### Write-Behind vs Pola Caching Lain

#### Perbandingan dengan Write-Through
- **Write-Through**: Setiap tulis pergi ke cache dan penyimpanan persistent secara sinkron
- **Write-Behind**: Tulis pergi ke cache segera, persistensi terjadi secara asinkron
- **Write-Around**: Tulis bypass cache dan pergi langsung ke penyimpanan persistent

#### Karakteristik Utama
- **Persistensi Asinkron**: Tulis diantrekan dan di-flush dalam batch
- **Eventual Consistency**: Data di cache dan penyimpanan persistent mungkin berbeda sementara
- **Optimisasi Batch**: Multiple tulis dapat dikombinasikan untuk efisiensi
- **Risiko Kehilangan Data**: Data yang belum dipersist dapat hilang jika cache gagal

### Komponen Arsitektur

#### Write Queue
```java
public class WriteBehindQueue {
    private final BlockingQueue<WriteOperation> queue;
    private final ExecutorService executor;
    private final BatchProcessor batchProcessor;

    public WriteBehindQueue(int queueCapacity, BatchProcessor batchProcessor) {
        this.queue = new ArrayBlockingQueue<>(queueCapacity);
        this.batchProcessor = batchProcessor;
        this.executor = Executors.newSingleThreadExecutor();
        startProcessor();
    }

    public void enqueue(WriteOperation operation) {
        try {
            queue.put(operation); // Blocking put
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to enqueue write operation", e);
        }
    }

    private void startProcessor() {
        executor.submit(() -> {
            List<WriteOperation> batch = new ArrayList<>();
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    // Tunggu operasi pertama dengan timeout
                    WriteOperation firstOp = queue.poll(1, TimeUnit.SECONDS);
                    if (firstOp != null) {
                        batch.add(firstOp);

                        // Kumpulkan lebih banyak operasi dalam time window
                        queue.drainTo(batch, 99); // Max batch size 100

                        // Proses batch
                        batchProcessor.process(batch);
                        batch.clear();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }
}
```

#### Batch Processor
```java
public interface BatchProcessor {
    void process(List<WriteOperation> operations);
}

public class DatabaseBatchProcessor implements BatchProcessor {
    private final DataSource dataSource;
    private final int batchSize;

    @Override
    public void process(List<WriteOperation> operations) {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement stmt = conn.prepareStatement(
                    "INSERT INTO cache_writes (key, value, operation, timestamp) VALUES (?, ?, ?, ?)")) {

                for (WriteOperation op : operations) {
                    stmt.setString(1, op.getKey());
                    stmt.setString(2, op.getValue());
                    stmt.setString(3, op.getOperation().name());
                    stmt.setTimestamp(4, new Timestamp(op.getTimestamp()));
                    stmt.addBatch();
                }

                stmt.executeBatch();
                conn.commit();

            } catch (SQLException e) {
                conn.rollback();
                throw new RuntimeException("Failed to batch write operations", e);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database connection error", e);
        }
    }
}
```

## Pola Implementasi

### Cache dengan Write-Behind

#### Implementasi Redis Write-Behind
```java
@Service
public class RedisWriteBehindCache {
    private final RedisTemplate<String, Object> redisTemplate;
    private final WriteBehindQueue writeQueue;
    private final CacheMetrics metrics;

    public void put(String key, Object value) {
        // Tulis ke cache segera
        redisTemplate.opsForValue().set(key, value);

        // Antre untuk persistensi async
        WriteOperation operation = new WriteOperation(key, value, Operation.PUT);
        writeQueue.enqueue(operation);

        metrics.recordWrite();
    }

    public void delete(String key) {
        // Hapus dari cache segera
        redisTemplate.delete(key);

        // Antre operasi delete
        WriteOperation operation = new WriteOperation(key, null, Operation.DELETE);
        writeQueue.enqueue(operation);

        metrics.recordDelete();
    }
}
```

#### Konfigurasi Ehcache Write-Behind
```xml
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="ehcache.xsd">

    <cache name="writeBehindCache"
           maxEntriesLocalHeap="10000"
           eternal="false"
           timeToLiveSeconds="3600">

        <persistence strategy="localTempSwap"/>

        <cacheWriter>
            <writeBehind concurrency="3" maxQueueSize="1000">
                <cacheWriterFactory class="com.example.DatabaseCacheWriterFactory"
                                  properties="connectionPool=pool1"/>
            </writeBehind>
        </cacheWriter>

    </cache>
</ehcache>
```

### Integrasi Database

#### MySQL Write-Behind Handler
```java
public class MySQLWriteBehindHandler implements BatchProcessor {
    private final DataSource dataSource;

    @Override
    public void process(List<WriteOperation> operations) {
        String sql = "INSERT INTO cache_updates (cache_key, data, operation_type, created_at) " +
                    "VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE data = VALUES(data)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (WriteOperation op : operations) {
                stmt.setString(1, op.getKey());
                stmt.setString(2, op.getValue());
                stmt.setString(3, op.getOperation().name());
                stmt.addBatch();
            }

            int[] results = stmt.executeBatch();

            // Log batch yang berhasil
            logger.info("Processed {} write operations in batch", operations.size());

        } catch (SQLException e) {
            // Implement retry logic atau dead letter queue
            handleBatchFailure(operations, e);
        }
    }

    private void handleBatchFailure(List<WriteOperation> operations, SQLException e) {
        logger.error("Batch write failed, queuing for retry", e);

        // Kirim ke retry queue atau dead letter queue
        retryQueue.addAll(operations);
    }
}
```

#### PostgreSQL dengan Dukungan JSON
```java
public class PostgreSQLJsonWriteHandler implements BatchProcessor {
    private final DataSource dataSource;

    @Override
    public void process(List<WriteOperation> operations) {
        String sql = "INSERT INTO cache_entries (key, data, metadata, updated_at) " +
                    "VALUES (?, ?::jsonb, ?::jsonb, NOW()) " +
                    "ON CONFLICT (key) DO UPDATE SET " +
                    "data = EXCLUDED.data, " +
                    "metadata = EXCLUDED.metadata, " +
                    "updated_at = NOW()";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (WriteOperation op : operations) {
                stmt.setString(1, op.getKey());
                stmt.setString(2, toJson(op.getValue()));
                stmt.setString(3, createMetadata(op));
                stmt.addBatch();
            }

            stmt.executeBatch();

        } catch (SQLException e) {
            handleFailure(operations, e);
        }
    }
}
```

### Distributed Write-Behind

#### Kafka-Based Write-Behind
```java
@Service
public class KafkaWriteBehindCache {
    private final KafkaTemplate<String, WriteOperation> kafkaTemplate;
    private final String topic = "cache-writes";

    public void writeBehind(String key, Object value) {
        WriteOperation operation = new WriteOperation(key, value, Operation.WRITE);

        // Kirim ke Kafka untuk pemrosesan async
        kafkaTemplate.send(topic, key, operation);

        // Update local cache segera
        localCache.put(key, value);
    }
}

@Component
public class KafkaWriteConsumer {
    private final DatabaseService databaseService;

    @KafkaListener(topics = "cache-writes", groupId = "write-behind-group")
    public void processWriteOperation(WriteOperation operation) {
        try {
            switch (operation.getOperation()) {
                case WRITE:
                    databaseService.save(operation.getKey(), operation.getValue());
                    break;
                case DELETE:
                    databaseService.delete(operation.getKey());
                    break;
            }
        } catch (Exception e) {
            // Kirim ke dead letter queue
            deadLetterQueue.send(operation);
        }
    }
}
```

## Pola Reliabilitas

### Penanganan Kegagalan

#### Circuit Breaker untuk Persistensi
```java
public class ResilientWriteBehindQueue {
    private final CircuitBreaker circuitBreaker;
    private final WriteBehindQueue primaryQueue;
    private final WriteBehindQueue fallbackQueue;

    public void enqueue(WriteOperation operation) {
        try {
            circuitBreaker.decorateRunnable(() ->
                primaryQueue.enqueue(operation)
            ).run();
        } catch (Exception e) {
            logger.warn("Primary queue failed, using fallback", e);
            fallbackQueue.enqueue(operation);
        }
    }
}
```

#### Dead Letter Queue
```java
public class DeadLetterQueue {
    private final BlockingQueue<WriteOperation> dlq;
    private final ScheduledExecutorService retryExecutor;

    public DeadLetterQueue() {
        this.dlq = new LinkedBlockingQueue<>();
        this.retryExecutor = Executors.newScheduledThreadPool(2);

        // Retry operasi yang gagal secara periodik
        retryExecutor.scheduleWithFixedDelay(this::retryFailedOperations,
                                           5, 5, TimeUnit.MINUTES);
    }

    public void add(WriteOperation operation) {
        dlq.offer(operation);
    }

    private void retryFailedOperations() {
        List<WriteOperation> toRetry = new ArrayList<>();
        dlq.drainTo(toRetry, 100); // Proses dalam batch

        for (WriteOperation op : toRetry) {
            try {
                primaryQueue.enqueue(op);
            } catch (Exception e) {
                // Jika masih gagal, bisa implement exponential backoff
                // atau kirim ke sistem monitoring/alerting
                logger.error("Operation failed permanently", e);
            }
        }
    }
}
```

### Konsistensi Data

#### Write-Ahead Logging
```java
public class WALWriteBehindCache {
    private final WriteAheadLog wal;
    private final WriteBehindQueue queue;

    public void put(String key, Object value) {
        // Tulis ke WAL terlebih dahulu untuk durability
        WALEntry entry = new WALEntry(key, value, Operation.PUT);
        wal.append(entry);

        // Kemudian update cache
        cache.put(key, value);

        // Antre untuk persistensi async
        queue.enqueue(new WriteOperation(key, value, Operation.PUT));
    }

    public void recover() {
        // Pada startup, replay WAL untuk restore state
        List<WALEntry> entries = wal.readAll();
        for (WALEntry entry : entries) {
            cache.put(entry.getKey(), entry.getValue());
        }
    }
}
```

## Monitoring dan Observabilitas

### Metrik Write-Behind
```java
@Component
public class WriteBehindMetrics {
    private final MeterRegistry registry;

    public void recordQueueSize(int size) {
        Gauge.builder("write_behind.queue.size", size)
            .register(registry);
    }

    public void recordBatchProcessed(int batchSize, long durationMs) {
        Counter.builder("write_behind.batch.processed")
            .tag("batch_size", String.valueOf(batchSize))
            .register(registry)
            .increment();

        Timer.builder("write_behind.batch.duration")
            .register(registry)
            .record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordPersistenceFailure() {
        Counter.builder("write_behind.persistence.failure")
            .register(registry)
            .increment();
    }
}
```

### Health Checks
```java
@Component
public class WriteBehindHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        int queueSize = writeBehindQueue.size();
        long lastSuccessfulBatch = getLastSuccessfulBatchTime();

        if (queueSize > MAX_QUEUE_SIZE) {
            return Health.down()
                .withDetail("queueSize", queueSize)
                .withDetail("maxQueueSize", MAX_QUEUE_SIZE)
                .build();
        }

        if (System.currentTimeMillis() - lastSuccessfulBatch > MAX_BATCH_DELAY_MS) {
            return Health.down()
                .withDetail("lastSuccessfulBatch", lastSuccessfulBatch)
                .build();
        }

        return Health.up()
            .withDetail("queueSize", queueSize)
            .withDetail("lastSuccessfulBatch", lastSuccessfulBatch)
            .build();
    }
}
```

## Praktik Terbaik

### Panduan Konfigurasi

#### Queue Sizing
```yaml
write_behind:
  queue:
    max_size: 10000
    batch_size: 100
    flush_interval_ms: 5000
  retry:
    max_attempts: 3
    backoff_multiplier: 2.0
    initial_delay_ms: 1000
```

#### Manajemen Memori
```java
@Configuration
public class WriteBehindConfig {
    @Bean
    public WriteBehindQueue writeBehindQueue() {
        return new WriteBehindQueue(
            maxQueueSize: 5000,  // Cegah penggunaan memori berlebihan
            batchSize: 50,       // Seimbangkan latency vs throughput
            flushInterval: Duration.ofSeconds(2)
        );
    }
}
```

### Optimisasi Performa

#### Tuning Batch Size
```java
public class AdaptiveBatchProcessor implements BatchProcessor {
    private final DataSource dataSource;
    private volatile int optimalBatchSize = 100;

    @Override
    public void process(List<WriteOperation> operations) {
        long startTime = System.nanoTime();

        // Proses batch
        executeBatch(operations);

        long durationMs = (System.nanoTime() - startTime) / 1_000_000;

        // Sesuaikan batch size berdasarkan performa
        adjustBatchSize(durationMs, operations.size());
    }

    private void adjustBatchSize(long durationMs, int batchSize) {
        if (durationMs > 1000) { // Terlalu lambat
            optimalBatchSize = Math.max(10, optimalBatchSize / 2);
        } else if (durationMs < 100) { // Cukup cepat
            optimalBatchSize = Math.min(1000, optimalBatchSize * 2);
        }
    }
}
```

## Tantangan Umum

### Pencegahan Kehilangan Data

#### Pendekatan Hybrid
```java
public class HybridWriteCache {
    private final Cache writeThroughCache;  // Untuk data kritis
    private final Cache writeBehindCache;   // Untuk data non-kritis

    public void put(String key, Object value, boolean critical) {
        if (critical) {
            writeThroughCache.put(key, value);
        } else {
            writeBehindCache.put(key, value);
        }
    }
}
```

### Masalah Konsistensi

#### Strategi Cache Invalidation
```java
public class ConsistentWriteBehindCache {
    private final Cache cache;
    private final DistributedLock lock;

    public void put(String key, Object value) {
        // Acquire lock untuk mencegah modifikasi konkuren
        lock.acquire(key);

        try {
            // Update cache
            cache.put(key, value);

            // Antre write operation dengan version
            WriteOperation op = new WriteOperation(key, value, getVersion(key));
            writeQueue.enqueue(op);

        } finally {
            lock.release(key);
        }
    }

    private long getVersion(String key) {
        // Implement versioning untuk conflict resolution
        return versionMap.getOrDefault(key, 0L) + 1;
    }
}
```

## Tools dan Teknologi

### Framework Caching
- **Ehcache**: Dukungan write-behind built-in
- **Caffeine**: Caching high-performance dengan ekstensi
- **Redis**: Pub/Sub untuk distributed write-behind
- **Hazelcast**: Distributed caching dengan write-behind

### Message Queues
- **Apache Kafka**: Reliable message delivery
- **RabbitMQ**: Message queuing untuk write operations
- **AWS SQS**: Managed queue service
- **Apache Pulsar**: Unified messaging dan streaming

### Databases
- **MySQL**: Optimisasi batch insert
- **PostgreSQL**: Dukungan JSON untuk data kompleks
- **MongoDB**: Bulk write operations
- **Cassandra**: Asynchronous writes

### Tools Monitoring
- **Prometheus**: Koleksi metrik
- **Grafana**: Dashboard visualisasi
- **DataDog**: Application monitoring
- **New Relic**: Performance insights

## Referensi

- [Write-Behind Caching Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/write-behind)
- [Ehcache Write-Behind](https://www.ehcache.org/documentation/3.0/write-behind.html)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Database Bulk Operations](https://dev.mysql.com/doc/refman/8.0/en/insert-optimization.html)
- [Circuit Breaker Pattern](https://microservices.io/patterns/reliability/circuit-breaker.html)