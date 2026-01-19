# Write-Through Cache

## Overview

Write-Through Cache is a caching pattern where data is written to both the cache and the backing store synchronously during update operations. This ensures that the cache and persistent storage are always consistent, providing strong data integrity guarantees. While this pattern increases write latency due to the synchronous nature of operations, it eliminates the complexity of cache invalidation and ensures that data is never stale in the cache.

Write-Through Cache is ideal for scenarios where data consistency is critical and the application can tolerate the additional latency of synchronous writes. It's commonly used in financial systems, inventory management, and any application requiring strong consistency guarantees.

## Core Concepts

### Write-Through vs Other Caching Patterns

#### Comparison with Write-Behind
- **Write-Through**: Synchronous writes to cache and storage
- **Write-Behind**: Asynchronous writes, cache updated immediately, storage later
- **Write-Around**: Writes bypass cache, go directly to storage

#### Key Characteristics
- **Synchronous Consistency**: Cache and storage always in sync
- **No Cache Invalidation**: Data in cache is always fresh
- **Higher Write Latency**: Each write waits for both cache and storage
- **Simplified Logic**: No complex cache coherence protocols needed

### Architecture Components

#### Cache Manager
```java
public class WriteThroughCacheManager {
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;
    private final WriteMetrics metrics;

    public void put(String key, Object value) {
        // Write to persistent storage first
        persistenceService.save(key, value);

        // Then update cache
        cache.put(key, value);

        metrics.recordWrite();
    }

    public Object get(String key) {
        // Always try cache first
        Object value = cache.getIfPresent(key);
        if (value != null) {
            metrics.recordCacheHit();
            return value;
        }

        // Cache miss - load from storage and update cache
        value = persistenceService.load(key);
        if (value != null) {
            cache.put(key, value);
            metrics.recordCacheMiss();
        }

        return value;
    }

    public void delete(String key) {
        // Delete from storage first
        persistenceService.delete(key);

        // Then remove from cache
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

## Implementation Patterns

### Spring Boot Write-Through Cache

#### Cache Configuration
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

#### Repository with Write-Through
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

#### Redis Write-Through Implementation
```java
@Service
public class RedisWriteThroughCache {
    private final RedisTemplate<String, Object> redisTemplate;
    private final PersistenceService persistenceService;

    public void set(String key, Object value) {
        // Write to database first
        persistenceService.save(key, value);

        // Then write to Redis
        redisTemplate.opsForValue().set(key, value);

        // Set expiration if needed
        redisTemplate.expire(key, Duration.ofHours(1));
    }

    public Object get(String key) {
        // Try Redis first
        Object value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            return value;
        }

        // Cache miss - load from database
        value = persistenceService.load(key);
        if (value != null) {
            // Populate cache
            redisTemplate.opsForValue().set(key, value);
            redisTemplate.expire(key, Duration.ofHours(1));
        }

        return value;
    }

    public void delete(String key) {
        // Delete from database first
        persistenceService.delete(key);

        // Then delete from Redis
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
        // This is called when data is written to Hazelcast
        // But we want to ensure database is updated first
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

#### JTA Transaction Support
```java
@Service
@Transactional
public class TransactionalWriteThroughService {
    private final Cache<String, Object> cache;
    private final JpaRepository<Entity, String> repository;

    public void saveWithTransaction(String key, Entity entity) {
        // Save to database within transaction
        Entity savedEntity = repository.save(entity);

        // Update cache only after successful commit
        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    cache.put(key, savedEntity);
                }
            });
    }

    public Entity findWithCache(String key) {
        // Check cache first
        Entity cached = (Entity) cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        // Load from database
        Optional<Entity> entity = repository.findById(key);
        if (entity.isPresent()) {
            cache.put(key, entity.get());
            return entity.get();
        }

        return null;
    }
}
```

## Reliability Patterns

### Error Handling

#### Fallback Strategies
```java
public class ResilientWriteThroughCache {
    private final Cache<String, Object> primaryCache;
    private final Cache<String, Object> fallbackCache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value) {
        try {
            // Attempt primary persistence
            persistenceService.save(key, value);

            // Update primary cache
            primaryCache.put(key, value);

        } catch (PersistenceException e) {
            logger.warn("Primary persistence failed, using fallback", e);

            // Fallback: write to secondary storage
            fallbackPersistenceService.save(key, value);

            // Update fallback cache
            fallbackCache.put(key, value);
        }
    }

    public Object get(String key) {
        // Try primary cache
        Object value = primaryCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Try fallback cache
        value = fallbackCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Load from persistence
        return persistenceService.load(key);
    }
}
```

#### Circuit Breaker Integration
```java
@Service
public class CircuitBreakerWriteThroughCache {
    private final CircuitBreaker persistenceCircuitBreaker;
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value) {
        try {
            // Use circuit breaker for persistence calls
            persistenceCircuitBreaker.decorateSupplier(() -> {
                persistenceService.save(key, value);
                return null;
            }).call();

            // Update cache only if persistence succeeds
            cache.put(key, value);

        } catch (Exception e) {
            // If persistence fails, we don't update cache
            // This maintains consistency (cache won't have unpersisted data)
            throw new CacheException("Failed to persist data", e);
        }
    }
}
```

### Data Consistency

#### Version-Based Concurrency Control
```java
public class VersionedWriteThroughCache {
    private final Cache<String, VersionedData> cache;
    private final PersistenceService persistenceService;

    public void put(String key, Object value, long expectedVersion) {
        // Load current version from persistence
        VersionedData current = (VersionedData) persistenceService.load(key);
        if (current != null && current.getVersion() != expectedVersion) {
            throw new OptimisticLockException("Data has been modified");
        }

        // Create new version
        VersionedData newData = new VersionedData(value, expectedVersion + 1);

        // Save to persistence
        persistenceService.save(key, newData);

        // Update cache
        cache.put(key, newData);
    }

    public VersionedData get(String key) {
        VersionedData cached = cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        // Load from persistence and cache it
        VersionedData data = (VersionedData) persistenceService.load(key);
        if (data != null) {
            cache.put(key, data);
        }
        return data;
    }
}
```

## Monitoring and Observability

### Write-Through Metrics
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
            // Test basic cache operation
            String testKey = "health_check_" + System.currentTimeMillis();
            cache.put(testKey, "test_value");

            // Test persistence
            persistenceService.save(testKey, "test_value");

            // Verify consistency
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

## Best Practices

### Configuration Guidelines

#### Cache Sizing and TTL
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

### Consistency Validation

#### Periodic Consistency Checks
```java
@Component
public class ConsistencyValidator {
    private final Cache<String, Object> cache;
    private final PersistenceService persistenceService;

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void validateConsistency() {
        // Sample a subset of keys for validation
        Set<String> sampleKeys = getSampleKeys();

        int inconsistencies = 0;
        for (String key : sampleKeys) {
            Object cachedValue = cache.getIfPresent(key);
            Object persistedValue = persistenceService.load(key);

            if (!Objects.equals(cachedValue, persistedValue)) {
                inconsistencies++;
                logger.warn("Consistency violation for key: {}", key);

                // Auto-correct by reloading from persistence
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

## Common Challenges

### Performance Bottlenecks

#### Write Latency Optimization
```java
public class OptimizedWriteThroughCache {
    private final Cache<String, Object> cache;
    private final AsyncPersistenceService asyncPersistence;

    public CompletableFuture<Void> putAsync(String key, Object value) {
        // Update cache immediately
        cache.put(key, value);

        // Return future for persistence completion
        return asyncPersistence.saveAsync(key, value)
            .exceptionally(throwable -> {
                // If persistence fails, remove from cache to maintain consistency
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
        // Write to all regions
        List<CompletableFuture<Void>> futures = regionServices.stream()
            .map(service -> CompletableFuture.runAsync(() ->
                service.save(key, value)))
            .collect(Collectors.toList());

        // Wait for all regions to acknowledge
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .join();

        // Update local cache
        localCache.put(key, value);
    }

    public Object get(String key) {
        // Try local cache first
        Object value = localCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Load from nearest region
        PersistenceService nearestService = loadBalancer.selectNearest();
        value = nearestService.load(key);

        if (value != null) {
            localCache.put(key, value);
        }

        return value;
    }
}
```

## Tools and Technologies

### Caching Frameworks
- **Ehcache**: Enterprise caching with write-through support
- **Caffeine**: High-performance local caching
- **Redis**: Distributed caching with persistence
- **Hazelcast**: Distributed caching with write-through map stores

### Persistence Technologies
- **JPA/Hibernate**: ORM with second-level caching
- **Spring Data**: Repository abstraction with caching
- **MySQL/PostgreSQL**: Relational databases with transactions
- **MongoDB**: Document database with write concerns

### Monitoring Tools
- **Micrometer**: Metrics collection for Spring Boot
- **Prometheus**: Time-series metrics database
- **Grafana**: Visualization and alerting dashboards
- **Zipkin**: Distributed tracing for cache operations

### Cloud Services
- **AWS ElastiCache**: Managed Redis with persistence
- **Azure Cache for Redis**: Enterprise-grade Redis
- **Google Cloud Memorystore**: Managed Redis service
- **AWS DynamoDB**: NoSQL with DAX caching

## References

- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Write-Through Caching](https://redis.io/topics/persistence)
- [Spring Cache Abstraction](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)
- [JSR-107 Caching](https://jcp.org/en/jsr/detail?id=107)
- [Caffeine Cache](https://github.com/ben-manes/caffeine)