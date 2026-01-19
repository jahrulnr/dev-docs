# Database Sharding

## Gambaran Umum

Database sharding adalah strategi partisi horizontal yang memecah database besar menjadi bagian yang lebih kecil dan mudah dikelola yang disebut shard. Setiap shard berisi subset dari total data dan dapat di-host pada server database terpisah, memungkinkan skalabilitas horizontal dan peningkatan performa untuk aplikasi berskala besar.

Tujuan utama sharding adalah mendistribusikan data di beberapa database fisik untuk mengatasi keterbatasan skalabilitas vertikal (menambah lebih banyak resource ke satu server) dan menangani dataset masif yang melebihi kapasitas satu instance database.

## Konsep Inti

### Apa itu Sharding?

#### Definisi
Sharding melibatkan pembagian database menjadi bagian yang lebih kecil dan independen yang disebut shard, di mana setiap shard:
- Berisi subset dari total data
- Dapat di-host pada server database terpisah
- Beroperasi sebagai instance database independen
- Memiliki index, constraint, dan schema sendiri

#### Shard vs Partition
- **Partition**: Pembagian logikal dalam database fisik yang sama
- **Shard**: Pembagian fisikal di seluruh instance database terpisah

### Strategi Sharding

#### Range-Based Sharding
```sql
-- Shard berdasarkan range tanggal
CREATE TABLE orders_2023 (
    order_id BIGINT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    amount DECIMAL(10,2)
);

CREATE TABLE orders_2024 (
    order_id BIGINT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    amount DECIMAL(10,2)
);
```

**Kelebihan**: Sederhana, mendukung query range
**Kekurangan**: Dapat menyebabkan distribusi data tidak merata (hotspot)

#### Hash-Based Sharding
```java
// Seleksi shard berbasis hash
public class ShardResolver {
    private static final int SHARD_COUNT = 4;

    public int getShardId(String key) {
        return Math.abs(key.hashCode()) % SHARD_COUNT;
    }
}

// Penggunaan
String userId = "user123";
int shardId = shardResolver.getShardId(userId);
// Route ke shard_0, shard_1, shard_2, atau shard_3
```

**Kelebihan**: Distribusi data merata
**Kekurangan**: Query range sulit, rebalancing kompleks

#### Directory-Based Sharding
```java
// Pendekatan lookup table
public class ShardDirectory {
    private final Map<String, Integer> entityShardMap;

    public ShardDirectory() {
        this.entityShardMap = new HashMap<>();
        // Mapping yang dikonfigurasi sebelumnya
        entityShardMap.put("customer", 0);
        entityShardMap.put("order", 1);
        entityShardMap.put("product", 2);
    }

    public int getShardForEntity(String entityType) {
        return entityShardMap.getOrDefault(entityType, 0);
    }
}
```

**Kelebihan**: Fleksibel, mudah mengubah mapping
**Kekurangan**: Single point of failure, overhead lookup tambahan

## Pola Implementasi

### Seleksi Shard Key

#### Memilih Shard Key yang Tepat
```java
// Shard key yang baik: Kardinalitas tinggi, distribusi seragam
public class UserShardKey {
    private final UUID userId; // Kardinalitas tinggi

    public UserShardKey(UUID userId) {
        this.userId = userId;
    }

    public int getShardId(int totalShards) {
        return Math.abs(userId.hashCode()) % totalShards;
    }
}

// Shard key yang buruk: Kardinalitas rendah, distribusi tidak merata
public class CountryShardKey {
    private final String country; // Kardinalitas rendah

    public CountryShardKey(String country) {
        this.country = country;
    }
    // Kebanyakan user dari beberapa negara = shard tidak merata
}
```

#### Composite Shard Keys
```java
// Shard key multi-kolom untuk distribusi lebih baik
public class CompositeShardKey {
    private final String tenantId;
    private final String entityType;
    private final UUID entityId;

    public int getShardId(int totalShards) {
        String compositeKey = tenantId + ":" + entityType + ":" + entityId.toString();
        return Math.abs(compositeKey.hashCode()) % totalShards;
    }
}
```

### Manajemen Shard

#### Metadata Shard
```java
public class ShardMetadata {
    private final int shardId;
    private final String connectionString;
    private final ShardStatus status;
    private final Range shardRange;

    public enum ShardStatus {
        ACTIVE, READ_ONLY, INACTIVE
    }

    public boolean containsKey(String key) {
        return shardRange.contains(hashKey(key));
    }
}
```

#### Routing Koneksi
```java
public class ShardRouter {
    private final Map<Integer, DataSource> shardDataSources;
    private final ShardResolver shardResolver;

    public Connection getConnection(String shardKey) {
        int shardId = shardResolver.resolveShard(shardKey);
        DataSource dataSource = shardDataSources.get(shardId);

        if (dataSource == null) {
            throw new ShardNotFoundException("Tidak ada datasource untuk shard: " + shardId);
        }

        return dataSource.getConnection();
    }
}
```

### Operasi Cross-Shard

#### Transaksi Terdistribusi
```java
// Two-phase commit di seluruh shard
public class DistributedTransactionManager {
    private final List<ShardConnection> participants;

    public void executeDistributedTransaction(TransactionCallback callback) {
        try {
            // Phase 1: Prepare
            for (ShardConnection conn : participants) {
                conn.prepare();
            }

            // Phase 2: Commit
            for (ShardConnection conn : participants) {
                conn.commit();
            }

        } catch (Exception e) {
            // Rollback semua participants
            for (ShardConnection conn : participants) {
                try {
                    conn.rollback();
                } catch (Exception rollbackEx) {
                    // Log kegagalan rollback
                }
            }
            throw new DistributedTransactionException(e);
        }
    }
}
```

#### Query Scatter-Gather
```java
// Query di seluruh multiple shard
public class ScatterGatherQueryExecutor {
    private final ShardRouter shardRouter;
    private final ExecutorService executor;

    public <T> List<T> executeQueryAcrossShards(String sql, RowMapper<T> mapper) {
        List<Future<List<T>>> futures = new ArrayList<>();

        // Submit query ke semua shard
        for (int shardId : getAllShardIds()) {
            Future<List<T>> future = executor.submit(() -> {
                Connection conn = shardRouter.getConnectionForShard(shardId);
                return executeQueryOnShard(conn, sql, mapper);
            });
            futures.add(future);
        }

        // Kumpulkan hasil
        List<T> allResults = new ArrayList<>();
        for (Future<List<T>> future : futures) {
            allResults.addAll(future.get());
        }

        return allResults;
    }
}
```

## Pola Arsitektur

### Middleware Sharding

#### Proxy-Based Sharding
```
┌─────────────┐    ┌─────────────────┐
│   Client    │────│  Sharding Proxy  │
└─────────────┘    └─────────────────┘
                          │
                    ┌─────┼─────┐
                    │     │     │
               ┌────▼───┐┌▼───┐┌▼───┐
               │Shard 0 ││Shrd││Shrd│
               └────────┘└────┘└────┘
```

```java
// Implementasi sharding proxy
public class ShardingProxy implements DataSource {
    private final ShardRouter router;
    private final QueryParser parser;

    @Override
    public Connection getConnection() throws SQLException {
        return new ShardingConnection(router, parser);
    }

    private static class ShardingConnection implements Connection {
        @Override
        public PreparedStatement prepareStatement(String sql) {
            ParsedQuery query = parser.parse(sql);
            int shardId = router.resolveShard(query.getShardKey());
            Connection shardConn = router.getConnection(shardId);
            return shardConn.prepareStatement(query.getRewrittenSql());
        }
    }
}
```

#### Application-Level Sharding
```java
// Aplikasi mengelola logika sharding
@Service
public class ShardedUserService {
    private final ShardRouter shardRouter;
    private final UserRepositoryFactory repositoryFactory;

    public User getUser(String userId) {
        int shardId = shardRouter.resolveShard(userId);
        UserRepository repository = repositoryFactory.getRepository(shardId);
        return repository.findById(userId);
    }

    public void saveUser(User user) {
        int shardId = shardRouter.resolveShard(user.getId());
        UserRepository repository = repositoryFactory.getRepository(shardId);
        repository.save(user);
    }
}
```

### Rebalancing Shard

#### Online Rebalancing
```java
public class ShardRebalancer {
    private final ShardManager shardManager;

    public void rebalanceShard(int sourceShardId, int targetShardId) {
        // 1. Set source shard ke read-only
        shardManager.setShardStatus(sourceShardId, ShardStatus.READ_ONLY);

        // 2. Copy data ke target shard
        copyDataToTargetShard(sourceShardId, targetShardId);

        // 3. Update routing table
        shardManager.updateShardRange(targetShardId, newRange);

        // 4. Switch routing
        shardManager.switchShardRouting(sourceShardId, targetShardId);

        // 5. Remove old shard
        shardManager.removeShard(sourceShardId);
    }

    private void copyDataToTargetShard(int sourceId, int targetId) {
        // Implementasi logika migrasi data
        // Gunakan batch processing untuk dataset besar
    }
}
```

## Praktik Terbaik

### Desain Shard Key

#### Kardinalitas dan Distribusi
- Pilih key dengan kardinalitas tinggi untuk menghindari hotspot
- Pastikan distribusi merata di seluruh shard
- Pertimbangkan pertumbuhan masa depan saat memilih jumlah shard

#### Pola Query
```java
// Desain untuk pola query umum
public class OptimizedShardResolver {

    // Baik: Shard berdasarkan tenant untuk aplikasi multi-tenant
    public int resolveByTenant(String tenantId, int shardCount) {
        return Math.abs(tenantId.hashCode()) % shardCount;
    }

    // Baik: Shard berdasarkan time range untuk data time-series
    public int resolveByTimeRange(LocalDateTime timestamp, int shardCount) {
        int year = timestamp.getYear();
        return year % shardCount;
    }
}
```

### Monitoring dan Maintenance

#### Health Checks
```java
public class ShardHealthChecker {
    private final ShardRouter router;

    public ShardHealth checkShardHealth(int shardId) {
        try {
            Connection conn = router.getConnectionForShard(shardId);
            // Eksekusi query health check sederhana
            ResultSet rs = conn.createStatement()
                              .executeQuery("SELECT 1");
            rs.close();
            conn.close();

            return ShardHealth.HEALTHY;

        } catch (Exception e) {
            return ShardHealth.UNHEALTHY;
        }
    }
}
```

#### Monitoring Performa
```java
public class ShardMetricsCollector {
    private final MeterRegistry registry;

    public void recordShardQueryMetrics(int shardId, long queryTimeMs) {
        Timer timer = registry.timer("shard.query.duration",
            "shard", String.valueOf(shardId));
        timer.record(queryTimeMs, TimeUnit.MILLISECONDS);

        // Record utilisasi shard
        Gauge gauge = registry.gauge("shard.connection.count",
            "shard", String.valueOf(shardId));
        // Update dengan jumlah koneksi saat ini
    }
}
```

## Tantangan Umum

### Query Cross-Shard
```java
// Masalah: JOIN di seluruh shard
public class CrossShardJoinHandler {
    public Result<OrderWithCustomer> getOrdersWithCustomers() {
        // Tidak dapat melakukan JOIN langsung di seluruh shard
        // Solusi: Join di level aplikasi

        List<Order> orders = getOrdersFromAllShards();
        List<Customer> customers = getCustomersFromAllShards();

        // Lakukan join di memori aplikasi
        return joinOrdersWithCustomers(orders, customers);
    }
}
```

### Konsistensi Data
```java
// Eventual consistency di seluruh shard
@Service
public class EventDrivenConsistencyManager {
    private final EventPublisher eventPublisher;

    @Transactional
    public void updateUserAndOrders(User user, List<Order> orders) {
        // Update user di user shard
        userShardRepository.save(user);

        // Update orders di order shard(s)
        for (Order order : orders) {
            orderShardRepository.save(order);
        }

        // Publish event konsistensi
        eventPublisher.publish(new UserOrdersUpdatedEvent(user.getId()));
    }
}
```

### Perubahan Schema
```java
// Rolling schema updates di seluruh shard
public class SchemaMigrationManager {
    private final ShardManager shardManager;

    public void migrateSchema(String migrationScript) {
        List<Integer> shardIds = shardManager.getAllShardIds();

        for (int shardId : shardIds) {
            // Set shard ke mode maintenance
            shardManager.setShardStatus(shardId, ShardStatus.MAINTENANCE);

            try {
                // Apply migration
                applyMigrationToShard(shardId, migrationScript);

                // Validasi migration
                validateMigration(shardId);

            } finally {
                // Return shard ke active
                shardManager.setShardStatus(shardId, ShardStatus.ACTIVE);
            }
        }
    }
}
```

## Tools dan Teknologi

### Framework Sharding
- **Vitess**: Framework sharding MySQL oleh YouTube
- **Citus**: Ekstensi PostgreSQL untuk database terdistribusi
- **MongoDB Sharding**: Sharding built-in untuk MongoDB
- **Apache ShardingSphere**: Middleware database terdistribusi

### Layanan Cloud
- **AWS RDS Aurora**: Database relasional terkelola dengan sharding
- **Google Cloud Spanner**: Database relasional terdistribusi global
- **Azure SQL Database**: Opsi Hyperscale untuk skala masif
- **PlanetScale**: Database serverless kompatibel MySQL

### Tools Monitoring
- **Prometheus**: Koleksi metrik dan alerting
- **Grafana**: Dashboard visualisasi
- **DataDog**: Application performance monitoring
- **New Relic**: APM dengan monitoring database

## Referensi

- [Database Sharding - MongoDB Documentation](https://docs.mongodb.com/manual/sharding/)
- [Vitess Sharding](https://vitess.io/docs/concepts/sharding/)
- [Citus Data Architecture](https://docs.citusdata.com/en/v10.2/architecture/)
- [Google Cloud Spanner](https://cloud.google.com/spanner/docs)
- [AWS Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [Designing Data-Intensive Applications - Martin Kleppmann](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)