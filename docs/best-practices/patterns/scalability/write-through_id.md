# Write-Through Cache

## Gambaran Umum

Write-Through Cache adalah pola caching di mana data ditulis ke cache dan penyimpanan utama secara sinkron selama operasi update. Ini memastikan bahwa cache dan penyimpanan persistent selalu konsisten, memberikan jaminan integritas data yang kuat. Meskipun pola ini meningkatkan latensi tulis karena sifat sinkron dari operasi, namun menghilangkan kompleksitas invalidasi cache dan memastikan bahwa data di cache tidak pernah stale.

Write-Through Cache ideal untuk skenario di mana konsistensi data sangat penting dan aplikasi dapat mentolerir latensi tambahan dari tulis sinkron. Ini umum digunakan dalam sistem finansial, manajemen inventori, dan aplikasi apa pun yang memerlukan jaminan konsistensi yang kuat.

## Konsep Inti

### Write-Through vs Pola Caching Lain

#### Perbandingan dengan Write-Behind
- **Write-Through**: Tulis sinkron ke cache dan penyimpanan
- **Write-Behind**: Tulis asinkron, cache diupdate segera, penyimpanan kemudian
- **Write-Around**: Tulis bypass cache, langsung ke penyimpanan

#### Karakteristik Utama
- **Konsistensi Sinkron**: Cache dan penyimpanan selalu sinkron
- **Tidak Ada Invalidation Cache**: Data di cache selalu fresh
- **Latensi Tulis Lebih Tinggi**: Setiap tulis menunggu cache dan penyimpanan
- **Logika Sederhana**: Tidak perlu protokol coherence cache yang kompleks

### Komponen Arsitektur

#### Cache Manager
```java
public class WriteThroughCacheManager {
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;
    private final WriteMetrics metrics;

    public void put(String key, Object value) {
        // Tulis ke penyimpanan persistent terlebih dahulu
        persistenceService.save(key, value);

        // Kemudian update cache
        cache.put(key, value);

        metrics.recordWrite();
    }

    public Object get(String key) {
        // Selalu coba cache terlebih dahulu
        Object value = cache.getIfPresent(key);
        if (value != null) {
            metrics.recordCacheHit();
            return value;
        }

        // Cache miss - load dari penyimpanan dan update cache
        value = persistenceService.load(key);
        if (value != null) {
            cache.put(key, value);
            metrics.recordCacheMiss();
        }

        return value;
    }

    public void delete(String key) {
        // Hapus dari penyimpanan terlebih dahulu
        persistenceService.delete(key);

        // Kemudian hapus dari cache
        cache.invalidate(key);

        metrics.recordDelete();
    }
}
```

#### Persistence Service Interface
```java
public interface PersistenceService {
    void save(String key, Object value);
    Object load(String key);
    void delete(String key);
    boolean exists(String key);
}

public class DatabasePersistenceService implements PersistenceService {
    private final DataSource dataSource;

    @Override
    public void save(String key, Object value) {
        String sql = "INSERT INTO cache_data (key, data, updated_at) VALUES (?, ?, NOW()) " +
                    "ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, key);
            stmt.setString(2, serialize(value));
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new PersistenceException("Failed to save data", e);
        }
    }

    @Override
    public Object load(String key) {
        String sql = "SELECT data FROM cache_data WHERE key = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, key);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return deserialize(rs.getString("data"));
                }
            }
        } catch (SQLException e) {
            throw new PersistenceException("Failed to load data", e);
        }

        return null;
    }
}
```

## Pola Implementasi

### Spring Boot Write-Through Cache

#### Konfigurasi Cache
```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(Duration.ofHours(1))
            .recordStats());
        return cacheManager;
    }

    @Bean
    public KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName());
            sb.append(".");
            sb.append(method.getName());
            for (Object param : params) {
                sb.append(".").append(param);
            }
            return sb.toString();
        };
    }
}
```

#### Repository dengan Write-Through
```java
@Repository
@CacheConfig(cacheNames = "users")
public class UserRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Cacheable(key = "#id")
    public User findById(Long id) {
        return entityManager.find(User.class, id);
    }

    @CachePut(key = "#user.id")
    public User save(User user) {
        if (user.getId() == null) {
            entityManager.persist(user);
        } else {
            user = entityManager.merge(user);
        }
        return user;
    }

    @CacheEvict(key = "#id")
    public void deleteById(Long id) {
        User user = entityManager.find(User.class, id);
        if (user != null) {
            entityManager.remove(user);
        }
    }
}
```

### Distributed Write-Through Cache

#### Implementasi Redis Write-Through
```java
@Service
public class RedisWriteThroughCache {
    private final RedisTemplate<String, Object> redisTemplate;
    private final PersistenceService persistenceService;

    public void set(String key, Object value) {
        // Tulis ke database terlebih dahulu
        persistenceService.save(key, value);

        // Kemudian tulis ke Redis
        redisTemplate.opsForValue().set(key, value);

        // Set expiration jika diperlukan
        redisTemplate.expire(key, Duration.ofHours(1));
    }

    public Object get(String key) {
        // Coba Redis terlebih dahulu
        Object value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            return value;
        }

        // Cache miss - load dari database
        value = persistenceService.load(key);
        if (value != null) {
            // Populate cache
            redisTemplate.opsForValue().set(key, value);
            redisTemplate.expire(key, Duration.ofHours(1));
        }

        return value;
    }

    public void delete(String key) {
        // Hapus dari database terlebih dahulu
        persistenceService.delete(key);

        // Kemudian hapus dari Redis
        redisTemplate.delete(key);
    }
}
```

#### Hazelcast Write-Through MapStore
```java
public class UserMapStore implements MapStore<Long, User> {
    private final UserRepository userRepository;

    @Override
    public void store(Long key, User value) {
        // Ini dipanggil ketika data ditulis ke Hazelcast
        // Tapi kita ingin memastikan database diupdate terlebih dahulu
        userRepository.save(value);
    }

    @Override
    public void storeAll(Map<Long, User> map) {
        for (Map.Entry<Long, User> entry : map.entrySet()) {
            store(entry.getKey(), entry.getValue());
        }
    }

    @Override
    public void delete(Long key) {
        userRepository.deleteById(key);
    }

    @Override
    public void deleteAll(Collection<Long> keys) {
        for (Long key : keys) {
            delete(key);
        }
    }

    @Override
    public User load(Long key) {
        return userRepository.findById(key);
    }

    @Override
    public Map<Long, User> loadAll(Collection<Long> keys) {
        Map<Long, User> result = new HashMap<>();
        for (Long key : keys) {
            User user = load(key);
            if (user != null) {
                result.put(key, user);
            }
        }
        return result;
    }

    @Override
    public Iterable<Long> loadAllKeys() {
        return userRepository.findAllIds();
    }
}
```

### Transactional Write-Through

#### Dukungan Transaksi JTA
```java
@Service
@Transactional
public class TransactionalWriteThroughService {
    private final Cache<String, Object> cache;
    private final JpaRepository<Entity, String> repository;

    public void saveWithTransaction(String key, Entity entity) {
        // Simpan ke database dalam transaksi
        Entity savedEntity = repository.save(entity);

        // Update cache hanya setelah commit berhasil
        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    cache.put(key, savedEntity);
                }
            });
    }

    public Entity findWithCache(String key) {
        // Periksa cache terlebih dahulu
        Entity cached = (Entity) cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        // Load dari database
        Optional<Entity> entity = repository.findById(key);
        if (entity.isPresent()) {
            cache.put(key, entity.get());
            return entity.get();
        }

        return null;
    }
}
```

## Pola Reliabilitas

### Penanganan Error

#### Strategi Fallback
```java
public class ResilientWriteThroughCache {
    private final Cache<String, Object> primaryCache;
    private final Cache<String, Object> fallbackCache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value) {
        try {
            // Coba persistensi primer
            persistenceService.save(key, value);

            // Update cache primer
            primaryCache.put(key, value);

        } catch (PersistenceException e) {
            logger.warn("Primary persistence failed, using fallback", e);

            // Fallback: tulis ke penyimpanan sekunder
            fallbackPersistenceService.save(key, value);

            // Update cache fallback
            fallbackCache.put(key, value);
        }
    }

    public Object get(String key) {
        // Coba cache primer
        Object value = primaryCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Coba cache fallback
        value = fallbackCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Load dari persistensi
        return persistenceService.load(key);
    }
}
```

#### Integrasi Circuit Breaker
```java
@Service
public class CircuitBreakerWriteThroughCache {
    private final CircuitBreaker persistenceCircuitBreaker;
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value) {
        try {
            // Gunakan circuit breaker untuk panggilan persistensi
            persistenceCircuitBreaker.decorateSupplier(() -> {
                persistenceService.save(key, value);
                return null;
            }).call();

            // Update cache hanya jika persistensi berhasil
            cache.put(key, value);

        } catch (Exception e) {
            // Jika persistensi gagal, kita tidak update cache
            // Ini menjaga konsistensi (cache tidak akan memiliki data yang belum dipersist)
            throw new CacheException("Failed to persist data", e);
        }
    }
}
```

### Konsistensi Data

#### Kontrol Concurrency Berbasis Version
```java
public class VersionedWriteThroughCache {
    private final Cache<String, VersionedData> cache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value, long expectedVersion) {
        // Load versi saat ini dari persistensi
        VersionedData current = (VersionedData) persistenceService.load(key);
        if (current != null && current.getVersion() != expectedVersion) {
            throw new OptimisticLockException("Data has been modified");
        }

        // Buat versi baru
        VersionedData newData = new VersionedData(value, expectedVersion + 1);

        // Simpan ke persistensi
        persistenceService.save(key, newData);

        // Update cache
        cache.put(key, newData);
    }

    public VersionedData get(String key) {
        VersionedData cached = cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        // Load dari persistensi dan cache it
        VersionedData data = (VersionedData) persistenceService.load(key);
        if (data != null) {
            cache.put(key, data);
        }
        return data;
    }
}
```

## Monitoring dan Observabilitas

### Metrik Write-Through
```java
@Component
public class WriteThroughMetrics {
    private final MeterRegistry registry;

    public void recordWriteOperation(long durationMs, boolean success) {
        Timer.builder("write_through.write.duration")
            .tag("success", String.valueOf(success))
            .register(registry)
            .record(durationMs, TimeUnit.MILLISECONDS);

        Counter.builder("write_through.write.total")
            .tag("success", String.valueOf(success))
            .register(registry)
            .increment();
    }

    public void recordReadOperation(boolean cacheHit, long durationMs) {
        Counter.builder("write_through.read.total")
            .tag("cache_hit", String.valueOf(cacheHit))
            .register(registry)
            .increment();

        if (cacheHit) {
            Timer.builder("write_through.cache_hit.duration")
                .register(registry)
                .record(durationMs, TimeUnit.MILLISECONDS);
        } else {
            Timer.builder("write_through.cache_miss.duration")
                .register(registry)
                .record(durationMs, TimeUnit.MILLISECONDS);
        }
    }

    public void recordConsistencyCheck() {
        Counter.builder("write_through.consistency.check")
            .register(registry)
            .increment();
    }
}
```

### Health Checks
```java
@Component
public class WriteThroughHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            // Test operasi cache dasar
            String testKey = "health_check_" + System.currentTimeMillis();
            cache.put(testKey, "test_value");

            // Test persistensi
            persistenceService.save(testKey, "test_value");

            // Verifikasi konsistensi
            Object cachedValue = cache.getIfPresent(testKey);
            Object persistedValue = persistenceService.load(testKey);

            if (!Objects.equals(cachedValue, persistedValue)) {
                return Health.down()
                    .withDetail("consistency", "Cache and persistence out of sync")
                    .build();
            }

            // Cleanup
            cache.invalidate(testKey);
            persistenceService.delete(testKey);

            return Health.up()
                .withDetail("cache", "operational")
                .withDetail("persistence", "operational")
                .build();

        } catch (Exception e) {
            return Health.down(e)
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

## Praktik Terbaik

### Panduan Konfigurasi

#### Cache Sizing dan TTL
```yaml
write_through:
  cache:
    maximum_size: 10000
    ttl_hours: 24
    tti_hours: 12
  persistence:
    timeout_seconds: 30
    retry_attempts: 3
    circuit_breaker:
      failure_threshold: 5
      recovery_timeout_seconds: 60
```

#### Performance Tuning
```java
@Configuration
public class WriteThroughTuningConfig {

    @Bean
    public Cache<String, Object> tunedCache() {
        return Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(Duration.ofHours(24))
            .expireAfterAccess(Duration.ofHours(12))
            .recordStats()
            .build();
    }

    @Bean
    public ThreadPoolTaskExecutor persistenceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("write-through-");
        return executor;
    }
}
```

### Validasi Konsistensi

#### Pemeriksaan Konsistensi Periodik
```java
@Component
public class ConsistencyValidator {
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;

    @Scheduled(fixedRate = 300000) // Setiap 5 menit
    public void validateConsistency() {
        // Sample subset dari keys untuk validasi
        Set<String> sampleKeys = getSampleKeys();

        int inconsistencies = 0;
        for (String key : sampleKeys) {
            Object cachedValue = cache.getIfPresent(key);
            Object persistedValue = persistenceService.load(key);

            if (!Objects.equals(cachedValue, persistedValue)) {
                inconsistencies++;
                logger.warn("Consistency violation for key: {}", key);

                // Auto-correct dengan reload dari persistensi
                if (persistedValue != null) {
                    cache.put(key, persistedValue);
                } else {
                    cache.invalidate(key);
                }
            }
        }

        if (inconsistencies > 0) {
            logger.info("Fixed {} consistency violations", inconsistencies);
        }
    }
}
```

## Tantangan Umum

### Bottleneck Performa

#### Optimisasi Latensi Tulis
```java
public class OptimizedWriteThroughCache {
    private final Cache<String, Object> cache;
    private final AsyncPersistenceService asyncPersistence;

    public CompletableFuture<Void> putAsync(String key, Object value) {
        // Update cache segera
        cache.put(key, value);

        // Return future untuk penyelesaian persistensi
        return asyncPersistence.saveAsync(key, value)
            .exceptionally(throwable -> {
                // Jika persistensi gagal, hapus dari cache untuk menjaga konsistensi
                cache.invalidate(key);
                throw new CompletionException(throwable);
            });
    }

    public Object get(String key) {
        // Standard cache-first lookup
        return cache.getIfPresent(key);
    }
}
```

### High Availability

#### Multi-Region Write-Through
```java
@Service
public class MultiRegionWriteThroughCache {
    private final Cache<String, Object> localCache;
    private final List<PersistenceService> regionServices;
    private final LoadBalancer loadBalancer;

    public void put(String key, Object value) {
        // Tulis ke semua region
        List<CompletableFuture<Void>> futures = regionServices.stream()
            .map(service -> CompletableFuture.runAsync(() ->
                service.save(key, value)))
            .collect(Collectors.toList());

        // Tunggu semua region mengakui
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .join();

        // Update local cache
        localCache.put(key, value);
    }

    public Object get(String key) {
        // Coba local cache terlebih dahulu
        Object value = localCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Load dari region terdekat
        PersistenceService nearestService = loadBalancer.selectNearest();
        value = nearestService.load(key);

        if (value != null) {
            localCache.put(key, value);
        }

        return value;
    }
}
```

## Tools dan Teknologi

### Framework Caching
- **Ehcache**: Enterprise caching dengan dukungan write-through
- **Caffeine**: High-performance local caching
- **Redis**: Distributed caching dengan persistensi
- **Hazelcast**: Distributed caching dengan write-through map stores

### Teknologi Persistensi
- **JPA/Hibernate**: ORM dengan second-level caching
- **Spring Data**: Abstraksi repository dengan caching
- **MySQL/PostgreSQL**: Relational databases dengan transaksi
- **MongoDB**: Document database dengan write concerns

### Tools Monitoring
- **Micrometer**: Koleksi metrik untuk Spring Boot
- **Prometheus**: Database metrik time-series
- **Grafana**: Dashboard visualisasi dan alerting
- **Zipkin**: Distributed tracing untuk operasi cache

### Layanan Cloud
- **AWS ElastiCache**: Managed Redis dengan persistensi
- **Azure Cache for Redis**: Enterprise-grade Redis
- **Google Cloud Memorystore**: Managed Redis service
- **AWS DynamoDB**: NoSQL dengan DAX caching

## Referensi

- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Write-Through Caching](https://redis.io/topics/persistence)
- [Spring Cache Abstraction](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)
- [JSR-107 Caching](https://jcp.org/en/jsr/detail?id=107)
- [Caffeine Cache](https://github.com/ben-manes/caffeine)