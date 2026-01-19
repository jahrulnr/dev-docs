# Unit of Work

## Gambaran Umum

Unit of Work adalah pola desain yang mempertahankan daftar objek yang terpengaruh oleh transaksi bisnis dan mengkoordinasikan penulisan perubahan serta penyelesaian masalah konkurensi. Pola ini memastikan konsistensi data dengan mengelompokkan operasi database terkait ke dalam satu transaksi, menjaga integritas data bahkan ketika beberapa objek terlibat.

Pola Unit of Work bertindak sebagai titik pusat untuk mengelola perubahan objek dan mengkoordinasikan persistensinya. Pola ini melacak objek mana yang telah dimodifikasi, dibuat, atau dihapus selama transaksi bisnis dan memastikan bahwa semua perubahan dilakukan secara atomik atau di-rollback jika ada bagian dari transaksi yang gagal.

## Konsep Inti

### Unit of Work vs Pola Lain

#### Perbandingan dengan Transaction Script
- **Unit of Work**: Mengelola perubahan status objek di berbagai operasi
- **Transaction Script**: Pendekatan prosedural untuk operasi database
- **Active Record**: Setiap objek mengelola persistensinya sendiri
- **Data Mapper**: Memisahkan objek domain dari logika persistensi

#### Karakteristik Utama
- **Change Tracking**: Memantau objek mana yang telah dimodifikasi
- **Transaction Coordination**: Memastikan commit atomik atau rollback
- **Identity Map Integration**: Sering bekerja dengan Identity Map untuk pelacakan objek
- **Lazy Loading Support**: Mengkoordinasikan pemuatan objek terkait

### Komponen Arsitektur

#### Interface Unit of Work
```java
public interface UnitOfWork {
    void registerNew(Object obj);
    void registerDirty(Object obj);
    void registerRemoved(Object obj);
    void registerClean(Object obj);
    boolean commit();
    void rollback();
    void clear();
}
```

#### Interface Domain Object
```java
public interface DomainObject {
    Long getId();
    void setId(Long id);
    boolean isNew();
    boolean isDirty();
    boolean isRemoved();
    void markNew();
    void markDirty();
    void markClean();
    void markRemoved();
}
```

#### Implementasi Unit of Work
```java
public class UnitOfWorkImpl implements UnitOfWork {
    private final Map<Class<?>, IdentityMap<?, ?>> identityMaps = new HashMap<>();
    private final List<DomainObject> newObjects = new ArrayList<>();
    private final List<DomainObject> dirtyObjects = new ArrayList<>();
    private final List<DomainObject> removedObjects = new ArrayList<>();
    private final DataSource dataSource;
    private Connection connection;
    private boolean inTransaction = false;

    public UnitOfWorkImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void registerNew(Object obj) {
        DomainObject domainObj = (DomainObject) obj;
        domainObj.markNew();
        newObjects.add(domainObj);
    }

    @Override
    public void registerDirty(Object obj) {
        DomainObject domainObj = (DomainObject) obj;
        if (!newObjects.contains(domainObj) && !dirtyObjects.contains(domainObj)) {
            domainObj.markDirty();
            dirtyObjects.add(domainObj);
        }
    }

    @Override
    public void registerRemoved(Object obj) {
        DomainObject domainObj = (DomainObject) obj;
        if (newObjects.remove(domainObj)) {
            domainObj.markClean();
        } else {
            domainObj.markRemoved();
            removedObjects.add(domainObj);
        }
    }

    @Override
    public void registerClean(Object obj) {
        // Object is clean, no action needed
    }

    @Override
    public boolean commit() {
        try {
            beginTransaction();
            insertNew();
            updateDirty();
            deleteRemoved();
            commitTransaction();
            clear();
            return true;
        } catch (Exception e) {
            rollbackTransaction();
            clear();
            throw new UnitOfWorkException("Failed to commit transaction", e);
        } finally {
            closeConnection();
        }
    }

    @Override
    public void rollback() {
        if (inTransaction) {
            try {
                connection.rollback();
            } catch (SQLException e) {
                throw new UnitOfWorkException("Failed to rollback transaction", e);
            }
        }
        clear();
        closeConnection();
    }

    @Override
    public void clear() {
        newObjects.clear();
        dirtyObjects.clear();
        removedObjects.clear();
        identityMaps.values().forEach(IdentityMap::clear);
    }

    @SuppressWarnings("unchecked")
    public <T, ID> IdentityMap<T, ID> getIdentityMap(Class<T> entityClass) {
        return (IdentityMap<T, ID>) identityMaps.computeIfAbsent(entityClass,
            k -> new IdentityMap<T, ID>());
    }

    private void beginTransaction() throws SQLException {
        connection = dataSource.getConnection();
        connection.setAutoCommit(false);
        inTransaction = true;
    }

    private void commitTransaction() throws SQLException {
        connection.commit();
        inTransaction = false;
    }

    private void rollbackTransaction() {
        if (inTransaction) {
            try {
                connection.rollback();
            } catch (SQLException e) {
                // Log error but don't throw
            }
        }
        inTransaction = false;
    }

    private void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                // Log error but don't throw
            }
        }
    }

    private void insertNew() {
        for (DomainObject obj : newObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.save(obj);
            obj.markClean();
        }
    }

    private void updateDirty() {
        for (DomainObject obj : dirtyObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.save(obj);
            obj.markClean();
        }
    }

    private void deleteRemoved() {
        for (DomainObject obj : removedObjects) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.delete(obj);
        }
    }

    private DataMapper getMapperFor(Class<?> entityClass) {
        // Implementation would return appropriate mapper
        // This could use a registry or dependency injection
        return null;
    }
}
```

## Pola Implementasi

### Domain Object dengan Change Tracking

#### Base Domain Object
```java
public abstract class BaseDomainObject implements DomainObject {
    protected Long id;
    protected ObjectState state = ObjectState.CLEAN;

    public enum ObjectState {
        NEW, CLEAN, DIRTY, REMOVED
    }

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public boolean isNew() {
        return state == ObjectState.NEW;
    }

    @Override
    public boolean isDirty() {
        return state == ObjectState.DIRTY;
    }

    @Override
    public boolean isRemoved() {
        return state == ObjectState.REMOVED;
    }

    @Override
    public void markNew() {
        state = ObjectState.NEW;
    }

    @Override
    public void markDirty() {
        if (state != ObjectState.NEW) {
            state = ObjectState.DIRTY;
        }
    }

    @Override
    public void markClean() {
        state = ObjectState.CLEAN;
    }

    @Override
    public void markRemoved() {
        state = ObjectState.REMOVED;
    }

    protected void markAsDirtyIfNotNew() {
        if (state != ObjectState.NEW) {
            markDirty();
        }
    }
}
```

#### User Domain Object
```java
public class User extends BaseDomainObject {
    private String username;
    private String email;
    private String passwordHash;
    private boolean active;
    private UserRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.active = true;
        this.role = UserRole.USER;
    }

    public User(String username, String email, String passwordHash) {
        this();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    // Business methods that mark object as dirty
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.updatedAt = LocalDateTime.now();
        markAsDirtyIfNotNew();
    }

    public void changeEmail(String newEmail) {
        this.email = newEmail;
        this.updatedAt = LocalDateTime.now();
        markAsDirtyIfNotNew();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = LocalDateTime.now();
        markAsDirtyIfNotNew();
    }

    public void promoteToAdmin() {
        this.role = UserRole.ADMIN;
        this.updatedAt = LocalDateTime.now();
        markAsDirtyIfNotNew();
    }

    // Getters and setters
    public String getUsername() { return username; }
    public void setUsername(String username) {
        this.username = username;
        markAsDirtyIfNotNew();
    }

    public String getEmail() { return email; }
    public void setEmail(String email) {
        this.email = email;
        markAsDirtyIfNotNew();
    }

    // ... other getters and setters
}
```

### Repository dengan Integrasi Unit of Work

#### Interface Repository
```java
public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    List<User> findAll();
    User save(User user);
    void delete(User user);
    void deleteById(Long id);
}
```

#### Implementasi Repository
```java
@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UnitOfWork unitOfWork;
    private final UserDataMapper userDataMapper;

    public UserRepositoryImpl(UnitOfWork unitOfWork, UserDataMapper userDataMapper) {
        this.unitOfWork = unitOfWork;
        this.userDataMapper = userDataMapper;
    }

    @Override
    public Optional<User> findById(Long id) {
        // Check identity map first
        IdentityMap<User, Long> identityMap = unitOfWork.getIdentityMap(User.class);
        Optional<User> cached = identityMap.get(id);
        if (cached.isPresent()) {
            return cached;
        }

        // Load from database
        Optional<User> user = userDataMapper.findById(id);
        user.ifPresent(u -> {
            u.markClean();
            identityMap.put(id, u);
        });
        return user;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userDataMapper.findByUsername(username)
            .map(user -> {
                user.markClean();
                IdentityMap<User, Long> identityMap = unitOfWork.getIdentityMap(User.class);
                identityMap.put(user.getId(), user);
                return user;
            });
    }

    @Override
    public List<User> findAll() {
        return userDataMapper.findAll().stream()
            .peek(user -> {
                user.markClean();
                IdentityMap<User, Long> identityMap = unitOfWork.getIdentityMap(User.class);
                identityMap.put(user.getId(), user);
            })
            .collect(Collectors.toList());
    }

    @Override
    public User save(User user) {
        if (user.isNew()) {
            unitOfWork.registerNew(user);
        } else if (user.isDirty()) {
            unitOfWork.registerDirty(user);
        }
        return user;
    }

    @Override
    public void delete(User user) {
        unitOfWork.registerRemoved(user);
    }

    @Override
    public void deleteById(Long id) {
        findById(id).ifPresent(this::delete);
    }
}
```

### Application Service dengan Unit of Work

#### Application Service
```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final UnitOfWork unitOfWork;

    public UserService(UserRepository userRepository, UnitOfWork unitOfWork) {
        this.userRepository = userRepository;
        this.unitOfWork = unitOfWork;
    }

    @Transactional
    public User createUser(String username, String email, String password) {
        // Validate input
        validateUsername(username);
        validateEmail(email);
        validatePassword(password);

        // Check for existing user
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UserAlreadyExistsException("Username already exists: " + username);
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new UserAlreadyExistsException("Email already exists: " + email);
        }

        // Create user
        User user = new User(username, email, password);
        userRepository.save(user);

        // Commit transaction
        if (!unitOfWork.commit()) {
            throw new UserCreationException("Failed to create user");
        }

        return user;
    }

    @Transactional
    public void updateUserProfile(Long userId, String newEmail, String newUsername) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Validate changes
        if (!newEmail.equals(user.getEmail()) &&
            userRepository.findByEmail(newEmail).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists: " + newEmail);
        }

        if (!newUsername.equals(user.getUsername()) &&
            userRepository.findByUsername(newUsername).isPresent()) {
            throw new UsernameAlreadyExistsException("Username already exists: " + newUsername);
        }

        // Update user
        user.setEmail(newEmail);
        user.setUsername(newUsername);
        userRepository.save(user);

        // Commit changes
        if (!unitOfWork.commit()) {
            throw new UserUpdateException("Failed to update user profile");
        }
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        userRepository.delete(user);

        // Commit deletion
        if (!unitOfWork.commit()) {
            throw new UserDeletionException("Failed to delete user");
        }
    }

    @Transactional
    public void bulkCreateUsers(List<UserCreationRequest> requests) {
        List<User> usersToCreate = new ArrayList<>();

        for (UserCreationRequest request : requests) {
            validateUsername(request.getUsername());
            validateEmail(request.getEmail());
            validatePassword(request.getPassword());

            // Check for conflicts within this batch
            boolean usernameExists = usersToCreate.stream()
                .anyMatch(u -> u.getUsername().equals(request.getUsername()));
            boolean emailExists = usersToCreate.stream()
                .anyMatch(u -> u.getEmail().equals(request.getEmail()));

            if (usernameExists || userRepository.findByUsername(request.getUsername()).isPresent()) {
                throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
            }
            if (emailExists || userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new EmailAlreadyExistsException("Email already exists: " + request.getEmail());
            }

            User user = new User(request.getUsername(), request.getEmail(), request.getPassword());
            usersToCreate.add(user);
            userRepository.save(user);
        }

        // Commit all users at once
        if (!unitOfWork.commit()) {
            throw new BulkOperationException("Failed to create users in bulk");
        }
    }

    private void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new ValidationException("Username is required");
        }
        if (username.length() < 3) {
            throw new ValidationException("Username must be at least 3 characters");
        }
    }

    private void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email is required");
        }
        if (!email.contains("@")) {
            throw new ValidationException("Invalid email format");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters");
        }
    }
}
```

## Manajemen Transaksi

### Lingkup Transaksi

#### Transaksi Tingkat Metode
```java
@Service
public class OrderService {
    private final UnitOfWork unitOfWork;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @Transactional
    public Order placeOrder(OrderRequest request) {
        // Start transaction scope
        try {
            // Validate order
            validateOrderRequest(request);

            // Create order
            Order order = createOrderFromRequest(request);
            orderRepository.save(order);

            // Reserve inventory
            inventoryService.reserveItems(order.getItems());

            // Process payment
            PaymentResult payment = paymentService.processPayment(order.getTotal());

            if (payment.isSuccessful()) {
                order.confirm();
                orderRepository.save(order);
            } else {
                throw new PaymentFailedException("Payment processing failed");
            }

            // Commit all changes
            unitOfWork.commit();
            return order;

        } catch (Exception e) {
            // Rollback on any error
            unitOfWork.rollback();
            throw new OrderPlacementException("Failed to place order", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOrderFulfillment(Long orderId) {
        // This runs in a separate transaction
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Process fulfillment
        fulfillmentService.fulfillOrder(order);

        // Update order status
        order.markAsFulfilled();
        orderRepository.save(order);

        unitOfWork.commit();
    }
}
```

#### Transaksi Bersarang
```java
@Service
public class ComplexBusinessService {
    private final UnitOfWork unitOfWork;

    @Transactional
    public void performComplexOperation() {
        try {
            // Phase 1: Initial setup
            performPhase1();
            unitOfWork.commit(); // Commit phase 1

            // Phase 2: Main processing
            performPhase2();

            // Phase 3: Finalization
            performPhase3();
            unitOfWork.commit(); // Commit all phases

        } catch (Exception e) {
            unitOfWork.rollback();
            throw e;
        }
    }

    @Transactional(propagation = Propagation.NESTED)
    private void performPhase1() {
        // This creates a savepoint
        // If this fails, only phase 1 rolls back
    }

    private void performPhase2() {
        // Part of the main transaction
    }

    private void performPhase3() {
        // Part of the main transaction
    }
}
```

### Kontrol Konkurensi

#### Optimistic Locking
```java
public class VersionedDomainObject extends BaseDomainObject {
    private Long version = 0L;

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public void incrementVersion() {
        this.version++;
        markAsDirtyIfNotNew();
    }
}

public class OptimisticLockingUnitOfWork extends UnitOfWorkImpl {
    @Override
    protected void updateDirty() {
        for (DomainObject obj : dirtyObjects) {
            if (obj instanceof VersionedDomainObject) {
                VersionedDomainObject versionedObj = (VersionedDomainObject) obj;
                DataMapper mapper = getMapperFor(obj.getClass());

                // Attempt update with version check
                int affectedRows = ((VersionedDataMapper) mapper)
                    .updateWithVersion(obj, versionedObj.getVersion());

                if (affectedRows == 0) {
                    throw new OptimisticLockException(
                        "Object was modified by another transaction: " + obj.getClass().getSimpleName() +
                        " with id " + obj.getId());
                }

                versionedObj.incrementVersion();
            } else {
                super.updateDirty();
            }
            obj.markClean();
        }
    }
}
```

#### Pessimistic Locking
```java
public class PessimisticLockingUnitOfWork extends UnitOfWorkImpl {
    private final Map<DomainObject, LockMode> lockedObjects = new HashMap<>();

    public void acquireLock(DomainObject obj, LockMode lockMode) {
        lockedObjects.put(obj, lockMode);
        // Implementation would acquire database locks
    }

    @Override
    public boolean commit() {
        try {
            // Acquire all necessary locks
            for (Map.Entry<DomainObject, LockMode> entry : lockedObjects.entrySet()) {
                acquireDatabaseLock(entry.getKey(), entry.getValue());
            }

            // Perform operations
            return super.commit();

        } finally {
            // Release locks
            releaseAllLocks();
        }
    }

    private void acquireDatabaseLock(DomainObject obj, LockMode lockMode) {
        // Implementation would execute SELECT ... FOR UPDATE or similar
    }

    private void releaseAllLocks() {
        lockedObjects.clear();
    }
}

public enum LockMode {
    READ, WRITE, EXCLUSIVE
}
```

## Praktik Terbaik

### Kapan Menggunakan Unit of Work

#### Skenario yang Cocok
- **Transaksi Bisnis Kompleks**: Beberapa perubahan terkait membutuhkan atomisitas
- **Operasi Batch**: Memproses beberapa entitas bersama-sama
- **Konsistensi Data**: Memastikan perubahan terkait berhasil atau gagal bersama
- **Optimasi Performa**: Mengurangi perjalanan bolak-balik database
- **Change Tracking**: Perlu memantau modifikasi objek

#### Kapan Menghindari
- **CRUD Sederhana**: Operasi entitas tunggal
- **Operasi Read-Only**: Tidak ada perubahan untuk disimpan
- **Sistem Real-time**: Di mana konsistensi segera diperlukan
- **Microservices**: Transaksi lintas layanan kompleks

### Panduan Implementasi

#### Jaga Unit of Work Tetap Ringan
```java
public class LightweightUnitOfWork implements UnitOfWork {
    private final ThreadLocal<UnitOfWorkContext> context = new ThreadLocal<>();

    @Override
    public void registerNew(Object obj) {
        getContext().newObjects.add(obj);
    }

    @Override
    public void registerDirty(Object obj) {
        getContext().dirtyObjects.add(obj);
    }

    @Override
    public void registerRemoved(Object obj) {
        getContext().removedObjects.add(obj);
    }

    @Override
    public boolean commit() {
        UnitOfWorkContext ctx = getContext();
        try {
            // Perform commit logic
            performCommit(ctx);
            return true;
        } finally {
            context.remove(); // Clean up thread-local
        }
    }

    private UnitOfWorkContext getContext() {
        UnitOfWorkContext ctx = context.get();
        if (ctx == null) {
            ctx = new UnitOfWorkContext();
            context.set(ctx);
        }
        return ctx;
    }

    private static class UnitOfWorkContext {
        final List<Object> newObjects = new ArrayList<>();
        final List<Object> dirtyObjects = new ArrayList<>();
        final List<Object> removedObjects = new ArrayList<>();
    }
}
```

#### Tangani Batas Transaksi dengan Benar
```java
@Service
public class TransactionBoundaryService {
    private final UnitOfWorkFactory unitOfWorkFactory;

    public <T> T executeInTransaction(Supplier<T> operation) {
        UnitOfWork unitOfWork = unitOfWorkFactory.create();
        try {
            T result = operation.get();
            unitOfWork.commit();
            return result;
        } catch (Exception e) {
            unitOfWork.rollback();
            throw new TransactionException("Transaction failed", e);
        }
    }

    public void executeInTransaction(Runnable operation) {
        executeInTransaction(() -> {
            operation.run();
            return null;
        });
    }
}

// Usage
transactionBoundaryService.executeInTransaction(() -> {
    userService.createUser(request);
    auditService.logUserCreation(user);
    emailService.sendWelcomeEmail(user);
});
```

#### Implementasikan Penanganan Error yang Tepat
```java
public class ResilientUnitOfWork extends UnitOfWorkImpl {
    private final int maxRetries = 3;
    private final List<Class<? extends Exception>> retryableExceptions =
        Arrays.asList(OptimisticLockException.class, SQLException.class);

    @Override
    public boolean commit() {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                return super.commit();
            } catch (Exception e) {
                attempts++;
                if (!isRetryable(e) || attempts >= maxRetries) {
                    throw e;
                }

                // Wait before retry with exponential backoff
                try {
                    Thread.sleep((long) (Math.pow(2, attempts) * 100));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new UnitOfWorkException("Interrupted during retry", ie);
                }

                // Refresh stale objects
                refreshDirtyObjects();
            }
        }
        return false;
    }

    private boolean isRetryable(Exception e) {
        return retryableExceptions.stream()
            .anyMatch(retryableClass -> retryableClass.isInstance(e));
    }

    private void refreshDirtyObjects() {
        // Re-load dirty objects from database to get latest versions
        for (DomainObject obj : dirtyObjects) {
            if (obj instanceof Refreshable) {
                ((Refreshable) obj).refresh();
            }
        }
    }
}
```

## Tantangan Umum

### Testing Unit of Work

#### Unit Testing
```java
@Test
public void shouldRegisterNewObject() {
    // Arrange
    UnitOfWork unitOfWork = new UnitOfWorkImpl(mockDataSource);
    User user = new User("testuser", "test@example.com", "password");

    // Act
    unitOfWork.registerNew(user);

    // Assert
    assertTrue(user.isNew());
    // Verify user is in new objects list
}

@Test
public void shouldCommitTransactionSuccessfully() {
    // Arrange
    UnitOfWork unitOfWork = new UnitOfWorkImpl(mockDataSource);
    User user = new User("testuser", "test@example.com", "password");
    unitOfWork.registerNew(user);

    when(mockConnection.commit()).thenReturn(true);

    // Act
    boolean result = unitOfWork.commit();

    // Assert
    assertTrue(result);
    assertTrue(user.isClean());
    verify(mockConnection).commit();
}

@Test
public void shouldRollbackOnCommitFailure() {
    // Arrange
    UnitOfWork unitOfWork = new UnitOfWorkImpl(mockDataSource);
    User user = new User("testuser", "test@example.com", "password");
    unitOfWork.registerNew(user);

    when(mockConnection.commit()).thenThrow(new SQLException("Commit failed"));

    // Act & Assert
    assertThrows(UnitOfWorkException.class, () -> unitOfWork.commit());
    verify(mockConnection).rollback();
}
```

#### Integration Testing
```java
@SpringBootTest
@Testcontainers
public class UnitOfWorkIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:13");

    @Autowired
    private UnitOfWork unitOfWork;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void shouldHandleComplexTransaction() {
        // Arrange
        User user1 = new User("user1", "user1@example.com", "password1");
        User user2 = new User("user2", "user2@example.com", "password2");

        // Act
        userRepository.save(user1);
        userRepository.save(user2);

        boolean committed = unitOfWork.commit();

        // Assert
        assertTrue(committed);
        assertNotNull(user1.getId());
        assertNotNull(user2.getId());

        // Verify both users were persisted
        Optional<User> retrieved1 = userRepository.findById(user1.getId());
        Optional<User> retrieved2 = userRepository.findById(user2.getId());

        assertTrue(retrieved1.isPresent());
        assertTrue(retrieved2.isPresent());
    }

    @Test
    public void shouldRollbackOnFailure() {
        // Arrange
        User user = new User("testuser", "test@example.com", "password");
        userRepository.save(user);

        // Simulate failure after save but before commit
        doThrow(new RuntimeException("Simulated failure"))
            .when(mockDataMapper).save(any());

        // Act & Assert
        assertThrows(UnitOfWorkException.class, () -> unitOfWork.commit());

        // Verify user was not persisted
        Optional<User> retrieved = userRepository.findById(user.getId());
        assertFalse(retrieved.isPresent());
    }
}
```

### Pertimbangan Performa

#### Manajemen Memori
```java
public class MemoryEfficientUnitOfWork extends UnitOfWorkImpl {
    private static final int MAX_TRACKED_OBJECTS = 10000;

    @Override
    public void registerNew(Object obj) {
        if (newObjects.size() >= MAX_TRACKED_OBJECTS) {
            throw new UnitOfWorkException("Too many objects registered for tracking");
        }
        super.registerNew(obj);
    }

    @Override
    public void registerDirty(Object obj) {
        if (dirtyObjects.size() >= MAX_TRACKED_OBJECTS) {
            // Auto-commit current batch
            commitCurrentBatch();
        }
        super.registerDirty(obj);
    }

    private void commitCurrentBatch() {
        List<DomainObject> currentBatch = new ArrayList<>(dirtyObjects);
        dirtyObjects.clear();

        // Commit current batch
        for (DomainObject obj : currentBatch) {
            DataMapper mapper = getMapperFor(obj.getClass());
            mapper.save(obj);
            obj.markClean();
        }
    }
}
```

#### Batch Processing
```java
public class BatchUnitOfWork extends UnitOfWorkImpl {
    private static final int BATCH_SIZE = 50;

    @Override
    public boolean commit() {
        try {
            beginTransaction();

            // Process in batches
            processBatch(newObjects, "insert");
            processBatch(dirtyObjects, "update");
            processBatch(removedObjects, "delete");

            commitTransaction();
            clear();
            return true;

        } catch (Exception e) {
            rollbackTransaction();
            clear();
            throw new UnitOfWorkException("Failed to commit batch transaction", e);
        }
    }

    private void processBatch(List<DomainObject> objects, String operation) {
        for (int i = 0; i < objects.size(); i += BATCH_SIZE) {
            int endIndex = Math.min(i + BATCH_SIZE, objects.size());
            List<DomainObject> batch = objects.subList(i, endIndex);

            switch (operation) {
                case "insert":
                    batchInsert(batch);
                    break;
                case "update":
                    batchUpdate(batch);
                    break;
                case "delete":
                    batchDelete(batch);
                    break;
            }
        }
    }

    private void batchInsert(List<DomainObject> batch) {
        // Implementation for batch insert
    }

    private void batchUpdate(List<DomainObject> batch) {
        // Implementation for batch update
    }

    private void batchDelete(List<DomainObject> batch) {
        // Implementation for batch delete
    }
}
```

## Alat dan Teknologi

### Framework ORM dengan Unit of Work
- **Entity Framework**: Built-in Unit of Work dengan DbContext
- **NHibernate**: ISession mengimplementasikan pola Unit of Work
- **Hibernate**: Session menyediakan fungsionalitas Unit of Work
- **Doctrine**: EntityManager dengan kemampuan Unit of Work

### Library Java
- **Spring Data JPA**: Manajemen transaksi dengan @Transactional
- **EclipseLink**: Implementasi JPA dengan change tracking
- **Hibernate ORM**: Implementasi Unit of Work yang komprehensif
- **Spring Transaction Management**: Dukungan transaksi deklaratif

### Teknologi .NET
- **Entity Framework Core**: DbContext sebagai Unit of Work
- **NHibernate**: Session dengan pola Unit of Work
- **Dapper**: Micro ORM dengan dukungan transaksi

### Framework Testing
- **JUnit**: Unit testing untuk kelas Unit of Work
- **Testcontainers**: Integration testing dengan database
- **Mockito**: Mocking operasi database dan koneksi
- **DBUnit**: Testing status database

### Transaction Manager
- **Spring Transaction Manager**: Dukungan transaksi yang komprehensif
- **Java Transaction API (JTA)**: Manajemen transaksi terdistribusi
- **Microsoft TransactionScope**: Manajemen transaksi .NET
- **Atomikos**: Transaction manager JTA

## Referensi

- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html) - Martin Fowler
- [Unit of Work Pattern](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [Domain-Driven Design](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/) - Gregor Hohpe dan Bobby Woolf
- [Hibernate Documentation](https://hibernate.org/)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)