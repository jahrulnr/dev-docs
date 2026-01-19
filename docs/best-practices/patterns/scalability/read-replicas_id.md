# Read Replicas

## Gambaran Umum

Read replicas adalah salinan read-only dari database utama yang membantu mendistribusikan trafik baca dan meningkatkan performa aplikasi. Pola ini memungkinkan aplikasi untuk menskalakan operasi baca secara independen dari operasi tulis, memberikan throughput yang lebih baik dan latency yang lebih rendah untuk workload yang intensif baca.

Database utama menangani semua operasi tulis, sementara satu atau lebih read replicas melayani query baca. Perubahan yang dibuat pada primary direplikasi secara asinkron ke replicas, memastikan eventual consistency di seluruh cluster database.

## Konsep Inti

### Cara Kerja Read Replicas

#### Arsitektur Replikasi
```
┌─────────────────┐    ┌─────────────────┐
│   Primary DB    │────│   Read Replica  │
│  (Read/Write)   │    │   (Read-Only)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Replication Stream
```

#### Tipe Replikasi
- **Synchronous Replication**: Perubahan harus dikonfirmasi pada replicas sebelum commit
- **Asynchronous Replication**: Perubahan diterapkan pada replicas setelah primary commit
- **Semi-Synchronous**: Beberapa replicas harus mengkonfirmasi sebelum commit

### Manajemen Koneksi

#### Read/Write Splitting
```java
public class ReadWriteDataSource implements DataSource {
    private final DataSource writeDataSource;
    private final List<DataSource> readDataSources;
    private final LoadBalancer loadBalancer;

    @Override
    public Connection getConnection() throws SQLException {
        // Return primary untuk writes, replica untuk reads
        return getConnectionBasedOnQueryType();
    }

    public Connection getReadConnection() {
        return loadBalancer.selectReplica().getConnection();
    }

    public Connection getWriteConnection() {
        return writeDataSource.getConnection();
    }
}
```

#### Strategi Load Balancing
```java
public class ReplicaLoadBalancer {
    private final List<Replica> replicas;
    private final LoadBalancingStrategy strategy;

    public enum LoadBalancingStrategy {
        ROUND_ROBIN, LEAST_CONNECTIONS, RANDOM, WEIGHTED
    }

    public DataSource selectReplica() {
        switch (strategy) {
            case ROUND_ROBIN:
                return getNextReplicaRoundRobin();
            case LEAST_CONNECTIONS:
                return getReplicaWithLeastConnections();
            case RANDOM:
                return getRandomReplica();
            default:
                return replicas.get(0);
        }
    }
}
```

## Pola Implementasi

### Repository Pattern dengan Read Replicas

#### Read/Write Repository
```java
@Repository
public class UserRepositoryImpl implements UserRepository {

    private final JdbcTemplate writeTemplate;
    private final JdbcTemplate readTemplate;

    public UserRepositoryImpl(
            @Qualifier("writeDataSource") DataSource writeDs,
            @Qualifier("readDataSource") DataSource readDs) {
        this.writeTemplate = new JdbcTemplate(writeDs);
        this.readTemplate = new JdbcTemplate(readDs);
    }

    @Override
    public User save(User user) {
        // Selalu tulis ke primary
        String sql = "INSERT INTO users (id, name, email) VALUES (?, ?, ?)";
        writeTemplate.update(sql, user.getId(), user.getName(), user.getEmail());
        return user;
    }

    @Override
    public Optional<User> findById(String id) {
        // Baca dari replica
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            return Optional.ofNullable(readTemplate.queryForObject(sql,
                new BeanPropertyRowMapper<>(User.class), id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<User> findAll() {
        // Baca dari replica
        String sql = "SELECT * FROM users";
        return readTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }
}
```

#### CQRS dengan Read Replicas
```java
// Command side - tulis ke primary
@Service
public class UserCommandService {
    private final UserRepository writeRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public User createUser(CreateUserCommand command) {
        User user = new User(command.getName(), command.getEmail());
        User saved = writeRepository.save(user);
        eventPublisher.publish(new UserCreatedEvent(saved.getId()));
        return saved;
    }
}

// Query side - baca dari replicas
@Service
public class UserQueryService {
    private final UserReadRepository readRepository;

    public List<UserDto> getAllUsers() {
        return readRepository.findAllUsers();
    }

    public UserDetailsDto getUserDetails(String userId) {
        return readRepository.findUserDetails(userId);
    }
}
```

### Connection Pooling

#### Konfigurasi HikariCP
```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource writeDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:mysql://primary-db:3306/mydb");
        dataSource.setUsername("user");
        dataSource.setPassword("password");
        dataSource.setMaximumPoolSize(10);
        return dataSource;
    }

    @Bean
    public DataSource readDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:mysql://read-replica-1:3306/mydb");
        dataSource.setUsername("user");
        dataSource.setPassword("password");
        dataSource.setMaximumPoolSize(50); // Lebih tinggi untuk read replicas
        return dataSource;
    }
}
```

### Penanganan Replication Lag

#### Lag-Aware Routing
```java
public class LagAwareLoadBalancer {
    private final List<ReplicaInfo> replicas;
    private final ReplicationLagChecker lagChecker;

    public DataSource selectReplicaWithAcceptableLag(long maxAcceptableLagMs) {
        return replicas.stream()
            .filter(replica -> lagChecker.getReplicationLag(replica) <= maxAcceptableLagMs)
            .findFirst()
            .map(ReplicaInfo::getDataSource)
            .orElse(getPrimaryDataSource());
    }
}

@Component
public class ReplicationLagChecker {
    private final JdbcTemplate template;

    public long getReplicationLag(ReplicaInfo replica) {
        try {
            // MySQL: SHOW SLAVE STATUS
            // PostgreSQL: SELECT extract(epoch from now() - pg_last_xact_replay_timestamp())
            Long lag = template.queryForObject(
                "SELECT Seconds_Behind_Master FROM information_schema.processlist WHERE Id = CONNECTION_ID()",
                Long.class);
            return lag != null ? lag * 1000 : 0; // Konversi ke milliseconds
        } catch (Exception e) {
            return Long.MAX_VALUE; // Anggap replica tidak sehat
        }
    }
}
```

## Monitoring dan Observability

### Metrik Replikasi
```java
@Component
public class ReplicationMetricsCollector {
    private final MeterRegistry registry;
    private final ReplicationLagChecker lagChecker;

    @Scheduled(fixedRate = 30000) // Setiap 30 detik
    public void collectReplicationMetrics() {
        for (ReplicaInfo replica : replicas) {
            long lag = lagChecker.getReplicationLag(replica);

            // Record replication lag
            Gauge.builder("replication.lag.seconds", () -> lag / 1000.0)
                .tag("replica", replica.getName())
                .register(registry);

            // Alert jika lag melebihi threshold
            if (lag > 300000) { // 5 menit
                alertManager.sendAlert("Replication lag tinggi pada " + replica.getName());
            }
        }
    }
}
```

### Monitoring Performa Query
```java
@Aspect
@Component
public class QueryPerformanceAspect {

    private final MeterRegistry registry;

    @Around("execution(* com.example.repository.*.find*(..))")
    public Object monitorReadQuery(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.nanoTime();

        try {
            Object result = joinPoint.proceed();

            long durationMs = (System.nanoTime() - startTime) / 1_000_000;

            // Record performa query
            Timer timer = registry.timer("read.query.duration",
                "method", joinPoint.getSignature().getName(),
                "dataSource", getDataSourceType(joinPoint));

            timer.record(durationMs, TimeUnit.MILLISECONDS);

            return result;

        } catch (Exception e) {
            // Record query yang gagal
            Counter.builder("read.query.errors")
                .tag("method", joinPoint.getSignature().getName())
                .register(registry)
                .increment();

            throw e;
        }
    }
}
```

## Praktik Terbaik

### Kapan Menggunakan Read Replicas

#### Workload Intensif Baca
```java
// Query analytics dan reporting
@Repository
public class AnalyticsRepository {
    private final JdbcTemplate readTemplate;

    public List<SalesReport> getSalesReport(LocalDate start, LocalDate end) {
        // Query agregasi kompleks - sempurna untuk replicas
        String sql = """
            SELECT DATE(order_date) as date,
                   SUM(amount) as total_sales,
                   COUNT(*) as order_count
            FROM orders
            WHERE order_date BETWEEN ? AND ?
            GROUP BY DATE(order_date)
            ORDER BY date
            """;

        return readTemplate.query(sql, new BeanPropertyRowMapper<>(SalesReport.class),
                                start, end);
    }
}
```

#### Kebutuhan Real-Time
```java
@Service
public class UserProfileService {
    private final UserRepository readRepository;
    private final ReplicationLagChecker lagChecker;

    public UserProfile getUserProfile(String userId) {
        // Untuk user profiles, mungkin butuh data fresh
        long maxLag = 5000; // 5 detik max lag

        if (lagChecker.getReplicationLag() > maxAcceptableLagMs) {
            // Fall back ke primary untuk critical reads
            return primaryRepository.findUserProfile(userId);
        }

        return readRepository.findUserProfile(userId);
    }
}
```

### Manajemen Koneksi

#### Sizing Connection Pool
```properties
# Primary database - pool lebih kecil untuk writes
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# Read replicas - pool lebih besar untuk reads
spring.read-datasource.hikari.maximum-pool-size=50
spring.read-datasource.hikari.minimum-idle=10
```

#### Routing Koneksi
```java
public class SmartConnectionRouter {
    private final DataSource primary;
    private final List<DataSource> replicas;
    private final ThreadLocal<Boolean> forcePrimary = new ThreadLocal<>();

    public Connection getConnection() {
        if (Boolean.TRUE.equals(forcePrimary.get())) {
            forcePrimary.remove();
            return primary.getConnection();
        }

        // Check jika transaksi saat ini read-write
        if (TransactionSynchronizationManager.isActualTransactionActive() &&
            !TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            return primary.getConnection();
        }

        // Gunakan replica untuk operasi read-only
        return selectReplica().getConnection();
    }

    public void forcePrimaryForNextOperation() {
        forcePrimary.set(true);
    }
}
```

## Tantangan Umum

### Masalah Replication Lag

#### Penanganan Data Usang
```java
@Service
public class OrderService {
    private final OrderRepository primaryRepo;
    private final OrderRepository replicaRepo;
    private final ReplicationLagChecker lagChecker;

    public Order getOrder(String orderId) {
        // Untuk order yang baru dibuat, check primary dulu
        Order order = primaryRepo.findById(orderId);

        if (order == null) {
            // Order tidak ditemukan di primary, check replica
            order = replicaRepo.findById(orderId);
        }

        return order;
    }

    public List<Order> getOrderHistory(String userId) {
        // Data historis dapat mentolerir lag
        return replicaRepo.findByUserId(userId);
    }
}
```

#### Invalidation Cache
```java
@Service
public class CacheInvalidationService {
    private final CacheManager cacheManager;
    private final EventPublisher eventPublisher;

    @Transactional
    public void updateUserProfile(User user) {
        // Update database
        userRepository.save(user);

        // Invalidate cache segera
        cacheManager.evictUserProfile(user.getId());

        // Publish event untuk invalidation cache di node lain
        eventPublisher.publish(new UserProfileUpdatedEvent(user.getId()));
    }
}
```

### Skenario Failover

#### Penanganan Kegagalan Replica
```java
public class FailoverAwareLoadBalancer {
    private final List<ReplicaInfo> replicas;
    private final HealthChecker healthChecker;

    public DataSource selectHealthyReplica() {
        return replicas.stream()
            .filter(replica -> healthChecker.isHealthy(replica))
            .findFirst()
            .orElseThrow(() -> new NoHealthyReplicaException());
    }

    @Scheduled(fixedRate = 10000) // Check setiap 10 detik
    public void updateReplicaHealth() {
        for (ReplicaInfo replica : replicas) {
            boolean healthy = healthChecker.checkHealth(replica);
            replica.setHealthy(healthy);

            if (!healthy) {
                log.warn("Replica {} tidak sehat", replica.getName());
            }
        }
    }
}
```

## Tools dan Teknologi

### Solusi Database Spesifik
- **MySQL Read Replicas**: Built-in replication dengan GTID
- **PostgreSQL Streaming Replication**: Opsi synchronous dan asynchronous
- **Amazon RDS Read Replicas**: Managed read replicas dengan automatic failover
- **Google Cloud SQL Read Replicas**: Regional read replicas

### Dukungan ORM dan Framework
- **Spring Data**: Dukungan read replica melalui routing datasources
- **Hibernate**: Multi-tenancy dan konfigurasi read replica
- **Entity Framework**: Dukungan read replica di .NET
- **Prisma**: Routing koneksi database

### Tools Monitoring
- **Prometheus**: Metrik replication lag dan performa
- **Grafana**: Dashboard untuk monitoring replikasi
- **DataDog**: Database performance monitoring
- **New Relic**: APM dengan database insights

## Referensi

- [MySQL Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [PostgreSQL Streaming Replication](https://www.postgresql.org/docs/current/warm-standby.html)
- [AWS RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Google Cloud SQL Replication](https://cloud.google.com/sql/docs/mysql/replication)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Database Replication - Designing Data-Intensive Applications](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)