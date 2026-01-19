# Data Mapper

## Overview

Data Mapper is a design pattern that separates in-memory domain objects from the database schema by providing a dedicated layer that maps between them. This pattern enables clean separation of concerns between business logic and data persistence, allowing domain objects to remain completely unaware of how they are stored.

The Data Mapper pattern acts as an intermediary that translates between domain objects and database records, handling all the complexities of data transformation, SQL generation, and database interactions. This approach promotes a clear architectural boundary between the domain layer and the persistence layer.

## Core Concepts

### Data Mapper vs Other Patterns

#### Comparison with Active Record
- **Data Mapper**: Separate layer maps domain objects to database
- **Active Record**: Domain objects handle their own persistence
- **Table Data Gateway**: Object acts as a gateway to a single table
- **Row Data Gateway**: Object represents a single database row

#### Key Characteristics
- **Separation of Concerns**: Domain logic and persistence logic are completely separate
- **Persistence Ignorance**: Domain objects know nothing about storage
- **Complex Mappings**: Handles complex object-relational mappings
- **Identity Map**: Often includes identity map for object tracking

### Architecture Components

#### Data Mapper Interface
```java
public interface DataMapper<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    List<T> findByCriteria(Criteria criteria);
    T save(T entity);
    void delete(T entity);
    void deleteById(ID id);
    boolean existsById(ID id);
    long count();
}
```

#### Identity Map Implementation
```java
public class IdentityMap<T, ID> {
    private final Map<ID, T> entities = new ConcurrentHashMap<>();

    public Optional<T> get(ID id) {
        return Optional.ofNullable(entities.get(id));
    }

    public void put(ID id, T entity) {
        entities.put(id, entity);
    }

    public void remove(ID id) {
        entities.remove(id);
    }

    public boolean contains(ID id) {
        return entities.containsKey(id);
    }

    public void clear() {
        entities.clear();
    }

    public Collection<T> getAll() {
        return new ArrayList<>(entities.values());
    }
}
```

#### Unit of Work Pattern Integration
```java
public class UnitOfWork {
    private final Map<Class<?>, IdentityMap<?, ?>> identityMaps = new HashMap<>();
    private final List<DomainObject> newObjects = new ArrayList<>();
    private final List<DomainObject> dirtyObjects = new ArrayList<>();
    private final List<DomainObject> removedObjects = new ArrayList<>();

    @SuppressWarnings("unchecked")
    public <T, ID> IdentityMap<T, ID> getIdentityMap(Class<T> entityClass) {
        return (IdentityMap<T, ID>) identityMaps.computeIfAbsent(entityClass,
            k -> new IdentityMap<T, ID>());
    }

    public void registerNew(DomainObject obj) {
        obj.markNew();
        newObjects.add(obj);
    }

    public void registerDirty(DomainObject obj) {
        if (!newObjects.contains(obj) && !dirtyObjects.contains(obj)) {
            obj.markDirty();
            dirtyObjects.add(obj);
        }
    }

    public void registerRemoved(DomainObject obj) {
        if (newObjects.remove(obj)) {
            obj.markClean();
        } else {
            obj.markRemoved();
            removedObjects.add(obj);
        }
    }

    public void commit() {
        insertNew();
        updateDirty();
        deleteRemoved();
    }

    private void insertNew() {
        for (DomainObject obj : newObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.save(obj);
            obj.markClean();
        }
        newObjects.clear();
    }

    private void updateDirty() {
        for (DomainObject obj : dirtyObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.save(obj);
            obj.markClean();
        }
        dirtyObjects.clear();
    }

    private void deleteRemoved() {
        for (DomainObject obj : removedObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.delete(obj);
        }
        removedObjects.clear();
    }

    private DataMapper getMapperFor(Class<?> entityClass) {
        // Implementation would return appropriate mapper
        return null;
    }
}
```

## Implementation Patterns

### Domain Object with Data Mapper

#### Domain Entity
```java
public class User {
    private Long id;
    private String username;
    private String email;
    private String passwordHash;
    private boolean active;
    private UserRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Business logic only - no persistence code
    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.active = true;
        this.role = UserRole.USER;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean canAccessResource(Resource resource) {
        // Complex business logic
        return hasPermission(resource) && isAccountActive();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    // ... other getters and setters
}
```

#### Data Mapper Implementation
```java
public class UserDataMapper implements DataMapper<User, Long> {
    private final DataSource dataSource;
    private final IdentityMap<User, Long> identityMap;

    public UserDataMapper(DataSource dataSource, IdentityMap<User, Long> identityMap) {
        this.dataSource = dataSource;
        this.identityMap = identityMap;
    }

    @Override
    public Optional<User> findById(Long id) {
        // Check identity map first
        Optional<User> cached = identityMap.get(id);
        if (cached.isPresent()) {
            return cached;
        }

        String sql = "SELECT id, username, email, password_hash, active, role, created_at, updated_at FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User user = mapResultSetToUser(rs);
                    identityMap.put(id, user);
                    return Optional.of(user);
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException("Failed to find user by id", e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT id, username, email, password_hash, active, role, created_at, updated_at FROM users ORDER BY created_at DESC";
        List<User> users = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Long id = rs.getLong("id");
                Optional<User> cached = identityMap.get(id);
                if (cached.isPresent()) {
                    users.add(cached.get());
                } else {
                    User user = mapResultSetToUser(rs);
                    identityMap.put(id, user);
                    users.add(user);
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException("Failed to find all users", e);
        }
        return users;
    }

    @Override
    public User save(User user) {
        if (user.getId() == null) {
            return insert(user);
        } else {
            return update(user);
        }
    }

    private User insert(User user) {
        String sql = "INSERT INTO users (username, email, password_hash, active, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPasswordHash());
            stmt.setBoolean(4, user.isActive());
            stmt.setString(5, user.getRole().name());
            stmt.setTimestamp(6, Timestamp.valueOf(user.getCreatedAt()));
            stmt.setTimestamp(7, Timestamp.valueOf(user.getUpdatedAt()));

            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new DataAccessException("Creating user failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getLong(1));
                    identityMap.put(user.getId(), user);
                } else {
                    throw new DataAccessException("Creating user failed, no ID obtained.");
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException("Failed to insert user", e);
        }
        return user;
    }

    private User update(User user) {
        String sql = "UPDATE users SET username = ?, email = ?, password_hash = ?, active = ?, role = ?, updated_at = ? WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPasswordHash());
            stmt.setBoolean(4, user.isActive());
            stmt.setString(5, user.getRole().name());
            stmt.setTimestamp(6, Timestamp.valueOf(user.getUpdatedAt()));
            stmt.setLong(7, user.getId());

            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new DataAccessException("Updating user failed, no rows affected.");
            }
        } catch (SQLException e) {
            throw new DataAccessException("Failed to update user", e);
        }
        return user;
    }

    @Override
    public void delete(User user) {
        String sql = "DELETE FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, user.getId());
            stmt.executeUpdate();
            identityMap.remove(user.getId());
        } catch (SQLException e) {
            throw new DataAccessException("Failed to delete user", e);
        }
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User(
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("password_hash")
        );

        user.setId(rs.getLong("id"));
        user.setActive(rs.getBoolean("active"));
        user.setRole(UserRole.valueOf(rs.getString("role")));
        user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        user.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());

        return user;
    }
}
```

### Repository Pattern with Data Mapper

#### Repository Interface
```java
public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAll();
    List<User> findActiveUsers();
    List<User> findUsersByRole(UserRole role);
    User save(User user);
    void delete(User user);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long count();
}
```

#### Repository Implementation using Data Mapper
```java
@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UserDataMapper userDataMapper;

    public UserRepositoryImpl(UserDataMapper userDataMapper) {
        this.userDataMapper = userDataMapper;
    }

    @Override
    public Optional<User> findById(Long id) {
        return userDataMapper.findById(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("username", username));
        List<User> users = userDataMapper.findByCriteria(criteria);
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    @Override
    public Optional<User> findByEmail(String email) {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("email", email));
        List<User> users = userDataMapper.findByCriteria(criteria);
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    @Override
    public List<User> findAll() {
        return userDataMapper.findAll();
    }

    @Override
    public List<User> findActiveUsers() {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("active", true));
        return userDataMapper.findByCriteria(criteria);
    }

    @Override
    public List<User> findUsersByRole(UserRole role) {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("role", role.name()));
        return userDataMapper.findByCriteria(criteria);
    }

    @Override
    public User save(User user) {
        return userDataMapper.save(user);
    }

    @Override
    public void delete(User user) {
        userDataMapper.delete(user);
    }

    @Override
    public boolean existsByUsername(String username) {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("username", username));
        return !userDataMapper.findByCriteria(criteria).isEmpty();
    }

    @Override
    public boolean existsByEmail(String email) {
        Criteria criteria = new Criteria()
            .add(Restrictions.eq("email", email));
        return !userDataMapper.findByCriteria(criteria).isEmpty();
    }

    @Override
    public long count() {
        return userDataMapper.count();
    }
}
```

### Criteria and Query Objects

#### Criteria API
```java
public class Criteria {
    private final List<Criterion> criteria = new ArrayList<>();
    private final List<Order> orders = new ArrayList<>();
    private Integer firstResult;
    private Integer maxResults;

    public Criteria add(Criterion criterion) {
        criteria.add(criterion);
        return this;
    }

    public Criteria addOrder(Order order) {
        orders.add(order);
        return this;
    }

    public Criteria setFirstResult(int firstResult) {
        this.firstResult = firstResult;
        return this;
    }

    public Criteria setMaxResults(int maxResults) {
        this.maxResults = maxResults;
        return this;
    }

    public String toSql(String tableName) {
        StringBuilder sql = new StringBuilder("SELECT * FROM ").append(tableName);

        if (!criteria.isEmpty()) {
            sql.append(" WHERE ");
            sql.append(criteria.stream()
                .map(Criterion::toSql)
                .collect(Collectors.joining(" AND ")));
        }

        if (!orders.isEmpty()) {
            sql.append(" ORDER BY ");
            sql.append(orders.stream()
                .map(Order::toSql)
                .collect(Collectors.joining(", ")));
        }

        if (maxResults != null) {
            sql.append(" LIMIT ").append(maxResults);
        }

        if (firstResult != null) {
            sql.append(" OFFSET ").append(firstResult);
        }

        return sql.toString();
    }

    public List<Object> getParameters() {
        return criteria.stream()
            .flatMap(c -> c.getParameters().stream())
            .collect(Collectors.toList());
    }
}

public interface Criterion {
    String toSql();
    List<Object> getParameters();
}

public class Restrictions {
    public static Criterion eq(String property, Object value) {
        return new SimpleExpression(property, "=", value);
    }

    public static Criterion ne(String property, Object value) {
        return new SimpleExpression(property, "!=", value);
    }

    public static Criterion like(String property, String value) {
        return new SimpleExpression(property, "LIKE", value);
    }

    public static Criterion gt(String property, Object value) {
        return new SimpleExpression(property, ">", value);
    }

    public static Criterion lt(String property, Object value) {
        return new SimpleExpression(property, "<", value);
    }

    public static Criterion between(String property, Object low, Object high) {
        return new BetweenExpression(property, low, high);
    }

    public static Criterion in(String property, Collection<?> values) {
        return new InExpression(property, values);
    }
}

public class SimpleExpression implements Criterion {
    private final String property;
    private final String operator;
    private final Object value;

    public SimpleExpression(String property, String operator, Object value) {
        this.property = property;
        this.operator = operator;
        this.value = value;
    }

    @Override
    public String toSql() {
        return property + " " + operator + " ?";
    }

    @Override
    public List<Object> getParameters() {
        return Collections.singletonList(value);
    }
}
```

## Complex Object Mapping

### Inheritance Mapping

#### Single Table Inheritance
```java
public abstract class Employee {
    protected Long id;
    protected String name;
    protected String type; // Discriminator column

    // Common methods
}

public class Manager extends Employee {
    private BigDecimal salary;
    private List<Employee> subordinates;

    // Manager-specific methods
}

public class Developer extends Employee {
    private String programmingLanguage;
    private int yearsOfExperience;

    // Developer-specific methods
}

public class EmployeeDataMapper implements DataMapper<Employee, Long> {
    @Override
    public Optional<Employee> findById(Long id) {
        String sql = "SELECT * FROM employees WHERE id = ?";
        // Execute query and map based on type
        return Optional.of(mapResultSetToEmployee(rs));
    }

    private Employee mapResultSetToEmployee(ResultSet rs) throws SQLException {
        String type = rs.getString("type");
        switch (type) {
            case "MANAGER":
                Manager manager = new Manager();
                manager.setId(rs.getLong("id"));
                manager.setName(rs.getString("name"));
                manager.setSalary(rs.getBigDecimal("salary"));
                // Load subordinates
                return manager;
            case "DEVELOPER":
                Developer developer = new Developer();
                developer.setId(rs.getLong("id"));
                developer.setName(rs.getString("name"));
                developer.setProgrammingLanguage(rs.getString("programming_language"));
                developer.setYearsOfExperience(rs.getInt("years_of_experience"));
                return developer;
            default:
                throw new IllegalArgumentException("Unknown employee type: " + type);
        }
    }
}
```

#### Class Table Inheritance
```java
// Each class has its own table
public class EmployeeDataMapper implements DataMapper<Employee, Long> {
    @Override
    public Optional<Employee> findById(Long id) {
        // First check base table
        String baseSql = "SELECT type FROM employees WHERE id = ?";
        String type = executeQueryForType(baseSql, id);

        switch (type) {
            case "MANAGER":
                return findManagerById(id);
            case "DEVELOPER":
                return findDeveloperById(id);
            default:
                return Optional.empty();
        }
    }

    private Optional<Employee> findManagerById(Long id) {
        String sql = """
            SELECT e.id, e.name, e.type, m.salary
            FROM employees e
            JOIN managers m ON e.id = m.employee_id
            WHERE e.id = ?
            """;
        // Map to Manager object
    }
}
```

### Association Mapping

#### One-to-Many Relationships
```java
public class Order {
    private Long id;
    private Customer customer;
    private List<OrderItem> items;
    private OrderStatus status;
}

public class OrderDataMapper implements DataMapper<Order, Long> {
    private final CustomerDataMapper customerMapper;
    private final OrderItemDataMapper itemMapper;

    @Override
    public Optional<Order> findById(Long id) {
        // Load order with lazy loading for associations
        String sql = "SELECT * FROM orders WHERE id = ?";
        Order order = executeQuery(sql, id);

        // Lazy load customer and items when accessed
        return Optional.of(order);
    }

    public Order findByIdWithAssociations(Long id) {
        // Eager loading
        String sql = """
            SELECT o.*, c.name as customer_name, oi.*
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            """;
        // Map complete object graph
    }
}
```

#### Many-to-Many Relationships
```java
public class User {
    private Long id;
    private List<Role> roles;
}

public class UserDataMapper implements DataMapper<User, Long> {
    private final RoleDataMapper roleMapper;

    public User findByIdWithRoles(Long id) {
        User user = findById(id).orElseThrow();

        // Load roles through junction table
        String sql = """
            SELECT r.* FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
            """;

        List<Role> roles = roleMapper.findBySql(sql, id);
        user.setRoles(roles);
        return user;
    }
}
```

## Best Practices

### When to Use Data Mapper

#### Suitable Scenarios
- **Complex Domain Models**: When domain logic is rich and complex
- **Multiple Data Sources**: When objects need to be persisted to different databases
- **Legacy Systems**: When working with existing database schemas
- **Testability**: When you need to test domain logic independently
- **Large Applications**: Where separation of concerns is critical

#### When to Avoid
- **Simple CRUD Applications**: Active Record might be simpler
- **Rapid Prototyping**: Data Mapper requires more boilerplate
- **Small Projects**: Overhead might not be justified

### Implementation Guidelines

#### Keep Domain Objects Clean
```java
public class Order {
    private Long id;
    private List<OrderItem> items;
    private OrderStatus status;

    // Rich domain behavior
    public void addItem(Product product, int quantity) {
        validateProduct(product);
        validateQuantity(quantity);

        OrderItem item = new OrderItem(product, quantity);
        items.add(item);
        recalculateTotal();
    }

    public void confirm() {
        if (canBeConfirmed()) {
            status = OrderStatus.CONFIRMED;
            // Domain events, business rules, etc.
            domainEvents.add(new OrderConfirmedEvent(id));
        }
    }

    // No persistence code whatsoever
}
```

#### Handle Concurrency Properly
```java
public class OptimisticLockingDataMapper<T, ID> extends AbstractDataMapper<T, ID> {
    @Override
    public T save(T entity) {
        VersionedEntity versioned = (VersionedEntity) entity;
        String sql = "UPDATE " + getTableName() +
                    " SET ... WHERE id = ? AND version = ?";

        int affectedRows = executeUpdate(sql, entity, versioned.getVersion());
        if (affectedRows == 0) {
            throw new OptimisticLockException("Entity was modified by another transaction");
        }

        versioned.incrementVersion();
        return entity;
    }
}
```

#### Implement Caching Strategies
```java
public class CachedDataMapper<T, ID> implements DataMapper<T, ID> {
    private final DataMapper<T, ID> delegate;
    private final Cache<ID, T> cache;

    @Override
    public Optional<T> findById(ID id) {
        // Check cache first
        T cached = cache.getIfPresent(id);
        if (cached != null) {
            return Optional.of(cached);
        }

        // Load from database
        Optional<T> entity = delegate.findById(id);
        entity.ifPresent(e -> cache.put(id, e));
        return entity;
    }

    @Override
    public T save(T entity) {
        T saved = delegate.save(entity);
        // Update cache
        ID id = getId(saved);
        cache.put(id, saved);
        return saved;
    }
}
```

## Common Challenges

### Testing Data Mappers

#### Unit Testing with Mocks
```java
@Test
public void shouldFindUserById() {
    // Arrange
    Long userId = 1L;
    User expectedUser = new User("john_doe", "john@example.com", "hash");
    expectedUser.setId(userId);

    when(mockResultSet.getLong("id")).thenReturn(userId);
    when(mockResultSet.getString("username")).thenReturn("john_doe");
    when(mockResultSet.getString("email")).thenReturn("john@example.com");
    when(mockResultSet.getString("password_hash")).thenReturn("hash");
    when(mockResultSet.next()).thenReturn(true, false);

    // Act
    Optional<User> result = userDataMapper.findById(userId);

    // Assert
    assertTrue(result.isPresent());
    assertEquals(expectedUser.getUsername(), result.get().getUsername());
    verify(mockPreparedStatement).setLong(1, userId);
}
```

#### Integration Testing
```java
@SpringBootTest
@Testcontainers
public class UserDataMapperIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:13");

    @Autowired
    private UserDataMapper userDataMapper;

    @Test
    public void shouldPersistAndRetrieveUser() {
        // Arrange
        User user = new User("testuser", "test@example.com", "password123");

        // Act
        User saved = userDataMapper.save(user);
        Optional<User> retrieved = userDataMapper.findById(saved.getId());

        // Assert
        assertTrue(retrieved.isPresent());
        assertEquals("testuser", retrieved.get().getUsername());
    }

    @Test
    public void shouldHandleConcurrentUpdates() {
        // Arrange
        User user = new User("testuser", "test@example.com", "password123");
        userDataMapper.save(user);

        // Simulate concurrent update
        executeSql("UPDATE users SET email = 'updated@example.com' WHERE id = " + user.getId());

        // Act & Assert
        user.setEmail("newemail@example.com");
        assertThrows(OptimisticLockException.class, () -> userDataMapper.save(user));
    }
}
```

### Performance Considerations

#### Batch Operations
```java
public class BatchDataMapper<T, ID> implements DataMapper<T, ID> {
    private static final int BATCH_SIZE = 1000;

    public List<T> saveAll(List<T> entities) {
        List<T> saved = new ArrayList<>();
        for (int i = 0; i < entities.size(); i += BATCH_SIZE) {
            int endIndex = Math.min(i + BATCH_SIZE, entities.size());
            List<T> batch = entities.subList(i, endIndex);
            saved.addAll(saveBatch(batch));
        }
        return saved;
    }

    private List<T> saveBatch(List<T> batch) {
        // Use batch insert/update statements
        try (PreparedStatement stmt = connection.prepareStatement(getInsertSql())) {
            for (T entity : batch) {
                setParameters(stmt, entity);
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
        return batch; // With generated IDs set
    }
}
```

#### Connection Management
```java
@Configuration
public class DataMapperConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/myapp");
        config.setUsername("user");
        config.setPassword("password");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        return new HikariDataSource(config);
    }

    @Bean
    public UserDataMapper userDataMapper(DataSource dataSource) {
        IdentityMap<User, Long> identityMap = new IdentityMap<>();
        return new UserDataMapper(dataSource, identityMap);
    }
}
```

## Tools and Technologies

### ORM Frameworks with Data Mapper
- **Hibernate**: Java ORM with Data Mapper capabilities
- **Entity Framework**: .NET ORM with mapping capabilities
- **Doctrine**: PHP ORM implementing Data Mapper
- **SQLAlchemy**: Python ORM with Data Mapper pattern

### Java Libraries
- **Spring Data JPA**: Repository abstraction over Data Mapper
- **MyBatis**: SQL mapping framework
- **jOOQ**: Type-safe SQL with mapping capabilities
- **EclipseLink**: JPA implementation with advanced mapping

### .NET Technologies
- **Entity Framework Core**: Modern Data Mapper implementation
- **Dapper**: Micro ORM with mapping capabilities
- **NHibernate**: .NET port of Hibernate

### Testing Frameworks
- **JUnit**: Unit testing for Data Mapper classes
- **Testcontainers**: Integration testing with real databases
- **Mockito**: Mocking database operations
- **DBUnit**: Database testing framework

### Database Migration Tools
- **Flyway**: Database migration management
- **Liquibase**: Database change management
- **EF Core Migrations**: Code-based migrations in .NET

## References

- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html) - Martin Fowler
- [Data Mapper Pattern](https://martinfowler.com/eaaCatalog/dataMapper.html)
- [Domain-Driven Design](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Hibernate Documentation](https://hibernate.org/)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)