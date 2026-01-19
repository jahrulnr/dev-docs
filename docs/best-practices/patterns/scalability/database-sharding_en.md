# Database Sharding

## Overview

Database sharding is a horizontal partitioning strategy that splits a large database into smaller, more manageable pieces called shards. Each shard contains a subset of the total data and can be hosted on separate database servers, enabling horizontal scaling and improved performance for large-scale applications.

The primary goal of sharding is to distribute data across multiple physical databases to overcome the limitations of vertical scaling (adding more resources to a single server) and handle massive datasets that exceed the capacity of a single database instance.

## Core Concepts

### What is Sharding?

#### Definition
Sharding involves dividing a database into smaller, independent pieces called shards, where each shard:
- Contains a subset of the total data
- Can be hosted on separate database servers
- Operates as an independent database instance
- Has its own indexes, constraints, and schema

#### Shard vs Partition
- **Partition**: Logical division within the same physical database
- **Shard**: Physical division across separate database instances

### Sharding Strategies

#### Range-Based Sharding
```sql
-- Shard by date ranges
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

**Pros**: Simple, supports range queries
**Cons**: Can lead to uneven data distribution (hotspots)

#### Hash-Based Sharding
```java
// Hash-based shard selection
public class ShardResolver {
    private static final int SHARD_COUNT = 4;

    public int getShardId(String key) {
        return Math.abs(key.hashCode()) % SHARD_COUNT;
    }
}

// Usage
String userId = "user123";
int shardId = shardResolver.getShardId(userId);
// Routes to shard_0, shard_1, shard_2, or shard_3
```

**Pros**: Even data distribution
**Cons**: Difficult range queries, complex rebalancing

#### Directory-Based Sharding
```java
// Lookup table approach
public class ShardDirectory {
    private final Map<String, Integer> entityShardMap;

    public ShardDirectory() {
        this.entityShardMap = new HashMap<>();
        // Pre-configured mappings
        entityShardMap.put("customer", 0);
        entityShardMap.put("order", 1);
        entityShardMap.put("product", 2);
    }

    public int getShardForEntity(String entityType) {
        return entityShardMap.getOrDefault(entityType, 0);
    }
}
```

**Pros**: Flexible, easy to change mappings
**Cons**: Single point of failure, additional lookup overhead

## Implementation Patterns

### Shard Key Selection

#### Choosing the Right Shard Key
```java
// Good shard key: High cardinality, uniform distribution
public class UserShardKey {
    private final UUID userId; // High cardinality

    public UserShardKey(UUID userId) {
        this.userId = userId;
    }

    public int getShardId(int totalShards) {
        return Math.abs(userId.hashCode()) % totalShards;
    }
}

// Bad shard key: Low cardinality, uneven distribution
public class CountryShardKey {
    private final String country; // Low cardinality

    public CountryShardKey(String country) {
        this.country = country;
    }
    // Most users from few countries = uneven shards
}
```

#### Composite Shard Keys
```java
// Multi-column shard key for better distribution
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

### Shard Management

#### Shard Metadata
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

#### Connection Routing
```java
public class ShardRouter {
    private final Map<Integer, DataSource> shardDataSources;
    private final ShardResolver shardResolver;

    public Connection getConnection(String shardKey) {
        int shardId = shardResolver.resolveShard(shardKey);
        DataSource dataSource = shardDataSources.get(shardId);

        if (dataSource == null) {
            throw new ShardNotFoundException("No datasource for shard: " + shardId);
        }

        return dataSource.getConnection();
    }
}
```

### Cross-Shard Operations

#### Distributed Transactions
```java
// Two-phase commit across shards
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
            // Rollback all participants
            for (ShardConnection conn : participants) {
                try {
                    conn.rollback();
                } catch (Exception rollbackEx) {
                    // Log rollback failure
                }
            }
            throw new DistributedTransactionException(e);
        }
    }
}
```

#### Scatter-Gather Queries
```java
// Query across multiple shards
public class ScatterGatherQueryExecutor {
    private final ShardRouter shardRouter;
    private final ExecutorService executor;

    public <T> List<T> executeQueryAcrossShards(String sql, RowMapper<T> mapper) {
        List<Future<List<T>>> futures = new ArrayList<>();

        // Submit query to all shards
        for (int shardId : getAllShardIds()) {
            Future<List<T>> future = executor.submit(() -> {
                Connection conn = shardRouter.getConnectionForShard(shardId);
                return executeQueryOnShard(conn, sql, mapper);
            });
            futures.add(future);
        }

        // Gather results
        List<T> allResults = new ArrayList<>();
        for (Future<List<T>> future : futures) {
            allResults.addAll(future.get());
        }

        return allResults;
    }
}
```

## Architecture Patterns

### Sharding Middleware

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
// Sharding proxy implementation
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
// Application manages sharding logic
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

### Shard Rebalancing

#### Online Rebalancing
```java
public class ShardRebalancer {
    private final ShardManager shardManager;

    public void rebalanceShard(int sourceShardId, int targetShardId) {
        // 1. Set source shard to read-only
        shardManager.setShardStatus(sourceShardId, ShardStatus.READ_ONLY);

        // 2. Copy data to target shard
        copyDataToTargetShard(sourceShardId, targetShardId);

        // 3. Update routing table
        shardManager.updateShardRange(targetShardId, newRange);

        // 4. Switch routing
        shardManager.switchShardRouting(sourceShardId, targetShardId);

        // 5. Remove old shard
        shardManager.removeShard(sourceShardId);
    }

    private void copyDataToTargetShard(int sourceId, int targetId) {
        // Implement data migration logic
        // Use batch processing for large datasets
    }
}
```

## Best Practices

### Shard Key Design

#### Cardinality and Distribution
- Choose keys with high cardinality to avoid hotspots
- Ensure even distribution across shards
- Consider future growth when selecting shard count

#### Query Patterns
```java
// Design for common query patterns
public class OptimizedShardResolver {

    // Good: Shard by tenant for multi-tenant apps
    public int resolveByTenant(String tenantId, int shardCount) {
        return Math.abs(tenantId.hashCode()) % shardCount;
    }

    // Good: Shard by time ranges for time-series data
    public int resolveByTimeRange(LocalDateTime timestamp, int shardCount) {
        int year = timestamp.getYear();
        return year % shardCount;
    }
}
```

### Monitoring and Maintenance

#### Health Checks
```java
public class ShardHealthChecker {
    private final ShardRouter router;

    public ShardHealth checkShardHealth(int shardId) {
        try {
            Connection conn = router.getConnectionForShard(shardId);
            // Execute simple health check query
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

#### Performance Monitoring
```java
public class ShardMetricsCollector {
    private final MeterRegistry registry;

    public void recordShardQueryMetrics(int shardId, long queryTimeMs) {
        Timer timer = registry.timer("shard.query.duration",
            "shard", String.valueOf(shardId));
        timer.record(queryTimeMs, TimeUnit.MILLISECONDS);

        // Record shard utilization
        Gauge gauge = registry.gauge("shard.connection.count",
            "shard", String.valueOf(shardId));
        // Update with current connection count
    }
}
```

## Common Challenges

### Cross-Shard Queries
```java
// Problem: JOIN across shards
public class CrossShardJoinHandler {
    public Result<OrderWithCustomer> getOrdersWithCustomers() {
        // Cannot perform direct JOIN across shards
        // Solution: Application-level join

        List<Order> orders = getOrdersFromAllShards();
        List<Customer> customers = getCustomersFromAllShards();

        // Perform join in application memory
        return joinOrdersWithCustomers(orders, customers);
    }
}
```

### Data Consistency
```java
// Eventual consistency across shards
@Service
public class EventDrivenConsistencyManager {
    private final EventPublisher eventPublisher;

    @Transactional
    public void updateUserAndOrders(User user, List<Order> orders) {
        // Update user in user shard
        userShardRepository.save(user);

        // Update orders in order shard(s)
        for (Order order : orders) {
            orderShardRepository.save(order);
        }

        // Publish consistency event
        eventPublisher.publish(new UserOrdersUpdatedEvent(user.getId()));
    }
}
```

### Schema Changes
```java
// Rolling schema updates across shards
public class SchemaMigrationManager {
    private final ShardManager shardManager;

    public void migrateSchema(String migrationScript) {
        List<Integer> shardIds = shardManager.getAllShardIds();

        for (int shardId : shardIds) {
            // Set shard to maintenance mode
            shardManager.setShardStatus(shardId, ShardStatus.MAINTENANCE);

            try {
                // Apply migration
                applyMigrationToShard(shardId, migrationScript);

                // Validate migration
                validateMigration(shardId);

            } finally {
                // Return shard to active
                shardManager.setShardStatus(shardId, ShardStatus.ACTIVE);
            }
        }
    }
}
```

## Tools and Technologies

### Sharding Frameworks
- **Vitess**: MySQL sharding framework by YouTube
- **Citus**: PostgreSQL extension for distributed databases
- **MongoDB Sharding**: Built-in sharding for MongoDB
- **Apache ShardingSphere**: Distributed database middleware

### Cloud Services
- **AWS RDS Aurora**: Managed relational database with sharding
- **Google Cloud Spanner**: Globally distributed relational database
- **Azure SQL Database**: Hyperscale option for massive scale
- **PlanetScale**: MySQL-compatible serverless database

### Monitoring Tools
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **DataDog**: Application performance monitoring
- **New Relic**: APM with database monitoring

## References

- [Database Sharding - MongoDB Documentation](https://docs.mongodb.com/manual/sharding/)
- [Vitess Sharding](https://vitess.io/docs/concepts/sharding/)
- [Citus Data Architecture](https://docs.citusdata.com/en/v10.2/architecture/)
- [Google Cloud Spanner](https://cloud.google.com/spanner/docs)
- [AWS Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [Designing Data-Intensive Applications - Martin Kleppmann](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)