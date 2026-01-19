# Data Mapper

## Gambaran Umum

Data Mapper adalah pola desain yang memisahkan objek domain di memori dari skema database dengan menyediakan lapisan khusus yang memetakan di antara keduanya. Pola ini memungkinkan pemisahan tanggung jawab yang bersih antara logika bisnis dan persistensi data, sehingga objek domain dapat tetap sepenuhnya tidak menyadari bagaimana mereka disimpan.

Pola Data Mapper bertindak sebagai perantara yang menerjemahkan antara objek domain dan record database, menangani semua kompleksitas transformasi data, pembuatan SQL, dan interaksi database. Pendekatan ini mempromosikan batasan arsitektural yang jelas antara lapisan domain dan lapisan persistensi.

## Konsep Inti

### Data Mapper vs Pola Lain

#### Perbandingan dengan Active Record
- **Data Mapper**: Lapisan terpisah memetakan objek domain ke database
- **Active Record**: Objek domain menangani persistensinya sendiri
- **Table Data Gateway**: Objek bertindak sebagai gateway ke satu tabel
- **Row Data Gateway**: Objek mewakili satu baris database

#### Karakteristik Utama
- **Separation of Concerns**: Logika domain dan persistensi benar-benar terpisah
- **Persistence Ignorance**: Objek domain tidak tahu apa pun tentang penyimpanan
- **Complex Mappings**: Menangani pemetaan object-relational yang kompleks
- **Identity Map**: Sering menyertakan identity map untuk pelacakan objek

### Komponen Arsitektur

#### Interface Data Mapper
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

#### Implementasi Identity Map
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

#### Integrasi dengan Unit of Work
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
        // Implementasi akan mengembalikan mapper yang sesuai
        return null;
    }
}
```

## Pola Implementasi

### Domain Object dengan Data Mapper

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

    // Hanya logika bisnis - tidak ada kode persistensi
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
        // Logika bisnis kompleks
        return hasPermission(resource) && isAccountActive();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    // ... getter dan setter lainnya
}
```

#### Implementasi Data Mapper
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
        // Periksa identity map terlebih dahulu
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

### Repository Pattern dengan Data Mapper

#### Interface Repository
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

#### Implementasi Repository menggunakan Data Mapper
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

### Criteria dan Query Objects

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

## Pemetaan Objek Kompleks

### Pemetaan Inheritance

#### Single Table Inheritance
```java
public abstract class Employee {
    protected Long id;
    protected String name;
    protected String type; // Kolom discriminator

    // Metode umum
}

public class Manager extends Employee {
    private BigDecimal salary;
    private List<Employee> subordinates;

    // Metode khusus Manager
}

public class Developer extends Employee {
    private String programmingLanguage;
    private int yearsOfExperience;

    // Metode khusus Developer
}

public class EmployeeDataMapper implements DataMapper<Employee, Long> {
    @Override
    public Optional<Employee> findById(Long id) {
        String sql = "SELECT * FROM employees WHERE id = ?";
        // Eksekusi query dan map berdasarkan type
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
// Setiap kelas memiliki tabel sendiri
public class EmployeeDataMapper implements DataMapper<Employee, Long> {
    @Override
    public Optional<Employee> findById(Long id) {
        // Pertama periksa tabel base
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
        // Map ke objek Manager
    }
}
```

### Pemetaan Asosiasi

#### Relasi One-to-Many
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
        // Load order dengan lazy loading untuk asosiasi
        String sql = "SELECT * FROM orders WHERE id = ?";
        Order order = executeQuery(sql, id);

        // Lazy load customer dan items saat diakses
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
        // Map object graph lengkap
    }
}
```

#### Relasi Many-to-Many
```java
public class User {
    private Long id;
    private List<Role> roles;
}

public class UserDataMapper implements DataMapper<User, Long> {
    private final RoleDataMapper roleMapper;

    public User findByIdWithRoles(Long id) {
        User user = findById(id).orElseThrow();

        // Load roles melalui junction table
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

## Praktik Terbaik

### Kapan Menggunakan Data Mapper

#### Skenario yang Cocok
- **Model Domain Kompleks**: Saat logika domain kaya dan kompleks
- **Multiple Data Sources**: Saat objek perlu disimpan ke database berbeda
- **Sistem Legacy**: Saat bekerja dengan skema database yang ada
- **Testability**: Saat perlu menguji logika domain secara independen
- **Aplikasi Besar**: Di mana separation of concerns sangat penting

#### Kapan Menghindari
- **Aplikasi CRUD Sederhana**: Active Record mungkin lebih sederhana
- **Rapid Prototyping**: Data Mapper memerlukan lebih banyak boilerplate
- **Proyek Kecil**: Overhead mungkin tidak terjustifikasi

### Panduan Implementasi

#### Jaga Domain Objects Tetap Bersih
```java
public class Order {
    private Long id;
    private List<OrderItem> items;
    private OrderStatus status;

    // Perilaku domain yang kaya
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
            // Domain events, business rules, dll.
            domainEvents.add(new OrderConfirmedEvent(id));
        }
    }

    // Tidak ada kode persistensi sama sekali
}
```

#### Tangani Concurrency dengan Benar
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

#### Implementasikan Strategi Caching
```java
public class CachedDataMapper<T, ID> implements DataMapper<T, ID> {
    private final DataMapper<T, ID> delegate;
    private final Cache<ID, T> cache;

    @Override
    public Optional<T> findById(ID id) {
        // Periksa cache terlebih dahulu
        T cached = cache.getIfPresent(id);
        if (cached != null) {
            return Optional.of(cached);
        }

        // Load dari database
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

## Tantangan Umum

### Testing Data Mappers

#### Unit Testing dengan Mocks
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

        // Simulasi update konkuren
        executeSql("UPDATE users SET email = 'updated@example.com' WHERE id = " + user.getId());

        // Act & Assert
        user.setEmail("newemail@example.com");
        assertThrows(OptimisticLockException.class, () -> userDataMapper.save(user));
    }
}
```

### Pertimbangan Performa

#### Operasi Batch
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
        // Gunakan batch insert/update statements
        try (PreparedStatement stmt = connection.prepareStatement(getInsertSql())) {
            for (T entity : batch) {
                setParameters(stmt, entity);
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
        return batch; // Dengan generated IDs yang diset
    }
}
```

#### Manajemen Connection
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

## Tools dan Teknologi

### Framework ORM dengan Data Mapper
- **Hibernate**: ORM Java dengan kemampuan Data Mapper
- **Entity Framework**: ORM .NET dengan kemampuan mapping
- **Doctrine**: ORM PHP yang mengimplementasikan Data Mapper
- **SQLAlchemy**: ORM Python dengan pola Data Mapper

### Library Java
- **Spring Data JPA**: Abstraksi repository di atas Data Mapper
- **MyBatis**: Framework pemetaan SQL
- **jOOQ**: SQL type-safe dengan kemampuan mapping
- **EclipseLink**: Implementasi JPA dengan mapping canggih

### Teknologi .NET
- **Entity Framework Core**: Implementasi Data Mapper modern
- **Dapper**: Micro ORM dengan kemampuan mapping
- **NHibernate**: Port .NET dari Hibernate

### Framework Testing
- **JUnit**: Unit testing untuk kelas Data Mapper
- **Testcontainers**: Integration testing dengan database nyata
- **Mockito**: Mocking operasi database
- **DBUnit**: Framework testing database

### Tools Migrasi Database
- **Flyway**: Manajemen migrasi database
- **Liquibase**: Manajemen perubahan database
- **EF Core Migrations**: Migrasi berbasis kode di .NET

## Referensi

- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html) - Martin Fowler
- [Data Mapper Pattern](https://martinfowler.com/eaaCatalog/dataMapper.html)
- [Domain-Driven Design](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Hibernate Documentation](https://hibernate.org/)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)