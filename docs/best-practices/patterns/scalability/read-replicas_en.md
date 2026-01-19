# Read Replicas

## Overview

Read replicas are read-only copies of a primary database that help distribute read traffic and improve application performance. This pattern allows applications to scale read operations independently from write operations, providing better throughput and reduced latency for read-intensive workloads.

The primary database handles all write operations, while one or more read replicas serve read queries. Changes made to the primary are asynchronously replicated to the replicas, ensuring eventual consistency across the database cluster.

## Core Concepts

### How Read Replicas Work

#### Replication Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Primary DB    │────│   Read Replica  │
│  (Read/Write)   │    │   (Read-Only)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Replication Stream
```

#### Replication Types
- **Synchronous Replication**: Changes must be confirmed on replicas before commit
- **Asynchronous Replication**: Changes are applied to replicas after primary commit
- **Semi-Synchronous**: Some replicas must confirm before commit

### Connection Management

#### Read/Write Splitting
```java
public class ReadWriteDataSource implements DataSource {
    private final DataSource writeDataSource;
    private final List<DataSource> readDataSources;
    private final LoadBalancer loadBalancer;

    @Override
    public Connection getConnection() throws SQLException {
        // Return primary for writes, replica for reads
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

#### Load Balancing Strategies
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

## Implementation Patterns

### Repository Pattern with Read Replicas

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
        // Always write to primary
        String sql = "INSERT INTO users (id, name, email) VALUES (?, ?, ?)";
        writeTemplate.update(sql, user.getId(), user.getName(), user.getEmail());
        return user;
    }

    @Override
    public Optional<User> findById(String id) {
        // Read from replica
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
        // Read from replica
        String sql = "SELECT * FROM users";
        return readTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }
}
```

#### CQRS with Read Replicas
```java
// Command side - writes to primary
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

// Query side - reads from replicas
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

#### HikariCP Configuration
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
        dataSource.setMaximumPoolSize(50); // Higher for read replicas
        return dataSource;
    }
}
```

### Replication Lag Handling

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
            return lag != null ? lag * 1000 : 0; // Convert to milliseconds
        } catch (Exception e) {
            return Long.MAX_VALUE; // Consider replica unhealthy
        }
    }
}
```

## Monitoring and Observability

### Replication Metrics
```java
@Component
public class ReplicationMetricsCollector {
    private final MeterRegistry registry;
    private final ReplicationLagChecker lagChecker;

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void collectReplicationMetrics() {
        for (ReplicaInfo replica : replicas) {
            long lag = lagChecker.getReplicationLag(replica);

            // Record replication lag
            Gauge.builder("replication.lag.seconds", () -> lag / 1000.0)
                .tag("replica", replica.getName())
                .register(registry);

            // Alert if lag exceeds threshold
            if (lag > 300000) { // 5 minutes
                alertManager.sendAlert("High replication lag on " + replica.getName());
            }
        }
    }
}
```

### Query Performance Monitoring
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

            // Record query performance
            Timer timer = registry.timer("read.query.duration",
                "method", joinPoint.getSignature().getName(),
                "dataSource", getDataSourceType(joinPoint));

            timer.record(durationMs, TimeUnit.MILLISECONDS);

            return result;

        } catch (Exception e) {
            // Record failed queries
            Counter.builder("read.query.errors")
                .tag("method", joinPoint.getSignature().getName())
                .register(registry)
                .increment();

            throw e;
        }
    }
}
```

## Best Practices

### When to Use Read Replicas

#### Read-Heavy Workloads
```java
// Analytics and reporting queries
@Repository
public class AnalyticsRepository {
    private final JdbcTemplate readTemplate;

    public List<SalesReport> getSalesReport(LocalDate start, LocalDate end) {
        // Complex aggregation queries - perfect for replicas
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

#### Real-Time Requirements
```java
@Service
public class UserProfileService {
    private final UserRepository readRepository;
    private final ReplicationLagChecker lagChecker;

    public UserProfile getUserProfile(String userId) {
        // For user profiles, we might need fresh data
        long maxLag = 5000; // 5 seconds max lag

        if (lagChecker.getReplicationLag() > maxLag) {
            // Fall back to primary for critical reads
            return primaryRepository.findUserProfile(userId);
        }

        return readRepository.findUserProfile(userId);
    }
}
```

### Connection Management

#### Connection Pool Sizing
```properties
# Primary database - smaller pool for writes
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# Read replicas - larger pool for reads
spring.read-datasource.hikari.maximum-pool-size=50
spring.read-datasource.hikari.minimum-idle=10
```

#### Connection Routing
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

        // Check if current transaction is read-write
        if (TransactionSynchronizationManager.isActualTransactionActive() &&
            !TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            return primary.getConnection();
        }

        // Use replica for read-only operations
        return selectReplica().getConnection();
    }

    public void forcePrimaryForNextOperation() {
        forcePrimary.set(true);
    }
}
```

## Common Challenges

### Replication Lag Issues

#### Handling Stale Data
```java
@Service
public class OrderService {
    private final OrderRepository primaryRepo;
    private final OrderRepository replicaRepo;
    private final ReplicationLagChecker lagChecker;

    public Order getOrder(String orderId) {
        // For immediately created orders, check primary first
        Order order = primaryRepo.findById(orderId);

        if (order == null) {
            // Order not found on primary, check replica
            order = replicaRepo.findById(orderId);
        }

        return order;
    }

    public List<Order> getOrderHistory(String userId) {
        // Historical data can tolerate some lag
        return replicaRepo.findByUserId(userId);
    }
}
```

#### Cache Invalidation
```java
@Service
public class CacheInvalidationService {
    private final CacheManager cacheManager;
    private final EventPublisher eventPublisher;

    @Transactional
    public void updateUserProfile(User user) {
        // Update database
        userRepository.save(user);

        // Invalidate cache immediately
        cacheManager.evictUserProfile(user.getId());

        // Publish event for cache invalidation on other nodes
        eventPublisher.publish(new UserProfileUpdatedEvent(user.getId()));
    }
}
```

### Failover Scenarios

#### Replica Failure Handling
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

    @Scheduled(fixedRate = 10000) // Check every 10 seconds
    public void updateReplicaHealth() {
        for (ReplicaInfo replica : replicas) {
            boolean healthy = healthChecker.checkHealth(replica);
            replica.setHealthy(healthy);

            if (!healthy) {
                log.warn("Replica {} is unhealthy", replica.getName());
            }
        }
    }
}
```

## Tools and Technologies

### Database-Specific Solutions
- **MySQL Read Replicas**: Built-in replication with GTID
- **PostgreSQL Streaming Replication**: Synchronous and asynchronous options
- **Amazon RDS Read Replicas**: Managed read replicas with automatic failover
- **Google Cloud SQL Read Replicas**: Regional read replicas

### ORM and Framework Support
- **Spring Data**: Read replica support through routing datasources
- **Hibernate**: Multi-tenancy and read replica configuration
- **Entity Framework**: Read replica support in .NET
- **Prisma**: Database connection routing

### Monitoring Tools
- **Prometheus**: Replication lag and performance metrics
- **Grafana**: Dashboards for replication monitoring
- **DataDog**: Database performance monitoring
- **New Relic**: APM with database insights

## References

- [MySQL Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [PostgreSQL Streaming Replication](https://www.postgresql.org/docs/current/warm-standby.html)
- [AWS RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Google Cloud SQL Replication](https://cloud.google.com/sql/docs/mysql/replication)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Database Replication - Designing Data-Intensive Applications](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)