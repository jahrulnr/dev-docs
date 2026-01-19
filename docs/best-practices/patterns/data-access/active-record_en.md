# Active Record

## Overview

Active Record is a design pattern that combines domain object behavior with data access logic in a single class. Each Active Record object represents a row in a database table, and encapsulates both data and behavior, including the ability to save, update, delete, and query itself from the database.

This pattern is named after the Active Record component in Rails and is commonly used in Object-Relational Mapping (ORM) frameworks. It provides a simple, intuitive way to work with data where objects know how to persist themselves.

## Core Concepts

### Active Record vs Other Patterns

#### Comparison with Data Mapper
- **Active Record**: Domain objects handle their own persistence
- **Data Mapper**: Separate layer maps domain objects to database
- **Table Data Gateway**: Object acts as a gateway to a single table
- **Row Data Gateway**: Object represents a single database row

#### Key Characteristics
- **Self-Persisting Objects**: Objects know how to save themselves
- **CRUD Operations**: Built-in create, read, update, delete methods
- **Query Methods**: Class-level methods for finding objects
- **Tight Coupling**: Domain logic and persistence logic are combined

### Architecture Components

#### Active Record Base Class
```java
public abstract class ActiveRecord {
    protected Long id;
    protected LocalDateTime createdAt;
    protected LocalDateTime updatedAt;

    // Abstract methods that subclasses must implement
    protected abstract String getTableName();
    protected abstract Map<String, Object> getColumnValues();

    // Common CRUD operations
    public void save() {
        if (id == null) {
            insert();
        } else {
            update();
        }
    }

    public void delete() {
        String sql = "DELETE FROM " + getTableName() + " WHERE id = ?";
        executeUpdate(sql, id);
        id = null;
    }

    protected void insert() {
        Map<String, Object> values = getColumnValues();
        String columns = String.join(", ", values.keySet());
        String placeholders = String.join(", ", Collections.nCopies(values.size(), "?"));
        String sql = "INSERT INTO " + getTableName() + " (" + columns + ") VALUES (" + placeholders + ")";

        id = executeInsert(sql, values.values());
        updatedAt = LocalDateTime.now();
    }

    protected void update() {
        Map<String, Object> values = getColumnValues();
        String setClause = values.keySet().stream()
            .map(col -> col + " = ?")
            .collect(Collectors.joining(", "));
        String sql = "UPDATE " + getTableName() + " SET " + setClause + ", updated_at = NOW() WHERE id = ?";

        List<Object> params = new ArrayList<>(values.values());
        params.add(id);
        executeUpdate(sql, params.toArray());
        updatedAt = LocalDateTime.now();
    }

    // Abstract database operations
    protected abstract Long executeInsert(String sql, Collection<Object> params);
    protected abstract int executeUpdate(String sql, Object... params);
}
```

#### User Active Record Implementation
```java
public class User extends ActiveRecord {
    private String username;
    private String email;
    private String passwordHash;
    private boolean active;
    private UserRole role;

    public User() {}

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.active = true;
        this.role = UserRole.USER;
    }

    @Override
    protected String getTableName() {
        return "users";
    }

    @Override
    protected Map<String, Object> getColumnValues() {
        Map<String, Object> values = new HashMap<>();
        values.put("username", username);
        values.put("email", email);
        values.put("password_hash", passwordHash);
        values.put("active", active);
        values.put("role", role.name());
        values.put("created_at", createdAt);
        values.put("updated_at", updatedAt);
        return values;
    }

    // Business methods
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        save();
    }

    public void deactivate() {
        this.active = false;
        save();
    }

    // Validation
    public boolean isValid() {
        return username != null && !username.trim().isEmpty() &&
               email != null && email.contains("@") &&
               passwordHash != null && passwordHash.length() >= 8;
    }
}
```

## Implementation Patterns

### Ruby on Rails Active Record

#### Rails Model Definition
```ruby
class User < ApplicationRecord
  # Validations
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password_hash, presence: true

  # Associations
  has_many :posts
  has_many :comments
  belongs_to :organization

  # Scopes
  scope :active, -> { where(active: true) }
  scope :admins, -> { where(role: 'admin') }

  # Callbacks
  before_save :downcase_email
  after_create :send_welcome_email

  # Instance methods
  def full_name
    "#{first_name} #{last_name}"
  end

  def admin?
    role == 'admin'
  end

  def activate!
    update(active: true)
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def send_welcome_email
    UserMailer.welcome_email(self).deliver_later
  end
end
```

#### Usage Examples
```ruby
# Create and save a new user
user = User.new(username: 'john_doe', email: 'john@example.com')
user.password_hash = BCrypt::Password.create('password123')
user.save!

# Find users
user = User.find(1)
active_users = User.active
admin_users = User.admins.where('created_at > ?', 1.month.ago)

# Update user
user.email = 'new_email@example.com'
user.save

# Delete user
user.destroy
```

### Java JPA with Active Record Pattern

#### JPA Entity with Active Record Methods
```java
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User implements Persistable<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Active Record methods
    public static User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public static List<User> findAll() {
        return userRepository.findAll();
    }

    public static User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public static List<User> findActiveUsers() {
        return userRepository.findByActiveTrue();
    }

    public void save() {
        if (isNew()) {
            userRepository.save(this);
        } else {
            userRepository.save(this);
        }
    }

    public void delete() {
        userRepository.delete(this);
    }

    @Override
    public boolean isNew() {
        return id == null;
    }

    // Business methods
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    // Repository injection (could be static or injected)
    @Autowired
    private static UserRepository userRepository;
}
```

### PHP Laravel Eloquent (Active Record)

#### Eloquent Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'active' => 'boolean',
    ];

    // Relationships
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    // Accessors & Mutators
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    // Business methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function activate()
    {
        $this->active = true;
        $this->save();
    }

    public function deactivate()
    {
        $this->active = false;
        $this->save();
    }

    // Events
    protected static function booted()
    {
        static::creating(function ($user) {
            $user->email = strtolower($user->email);
        });

        static::created(function ($user) {
            // Send welcome email
            $user->sendWelcomeEmail();
        });
    }

    private function sendWelcomeEmail()
    {
        // Implementation for sending welcome email
    }
}
```

## Associations and Relationships

### One-to-Many Relationships
```java
public class Post extends ActiveRecord {
    private Long userId;
    private String title;
    private String content;
    private PostStatus status;

    // Relationship methods
    public User getAuthor() {
        return User.findById(userId);
    }

    public List<Comment> getComments() {
        return Comment.findByPostId(id);
    }

    public void addComment(Comment comment) {
        comment.setPostId(id);
        comment.save();
    }
}

public class Comment extends ActiveRecord {
    private Long postId;
    private Long userId;
    private String content;

    public Post getPost() {
        return Post.findById(postId);
    }

    public User getAuthor() {
        return User.findById(userId);
    }
}
```

### Many-to-Many Relationships
```java
public class User extends ActiveRecord {
    // ... other fields

    public List<Role> getRoles() {
        return UserRoleAssociation.findRolesByUserId(id);
    }

    public void assignRole(Role role) {
        UserRoleAssociation association = new UserRoleAssociation(id, role.getId());
        association.save();
    }

    public void removeRole(Role role) {
        UserRoleAssociation association = UserRoleAssociation.findByUserIdAndRoleId(id, role.getId());
        if (association != null) {
            association.delete();
        }
    }
}
```

## Query Methods and Scopes

### Finder Methods
```java
public class User extends ActiveRecord {
    // Static finder methods
    public static User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
        return executeQuerySingle(sql, User.class, email);
    }

    public static List<User> findByRole(UserRole role) {
        String sql = "SELECT * FROM users WHERE role = ?";
        return executeQuery(sql, User.class, role.name());
    }

    public static List<User> findActiveUsers() {
        String sql = "SELECT * FROM users WHERE active = true ORDER BY created_at DESC";
        return executeQuery(sql, User.class);
    }

    public static List<User> findUsersCreatedAfter(LocalDateTime date) {
        String sql = "SELECT * FROM users WHERE created_at > ?";
        return executeQuery(sql, User.class, date);
    }

    // Dynamic finder methods
    public static List<User> findBy(String field, Object value) {
        String sql = "SELECT * FROM " + getTableName() + " WHERE " + field + " = ?";
        return executeQuery(sql, User.class, value);
    }

    public static User findFirstBy(String field, Object value) {
        String sql = "SELECT * FROM " + getTableName() + " WHERE " + field + " = ? LIMIT 1";
        List<User> results = executeQuery(sql, User.class, value);
        return results.isEmpty() ? null : results.get(0);
    }
}
```

### Scopes and Query Objects
```java
public class UserScope {
    private StringBuilder whereClause = new StringBuilder();
    private List<Object> parameters = new ArrayList<>();
    private String orderBy = "id ASC";
    private Integer limit;

    public UserScope active() {
        if (whereClause.length() > 0) whereClause.append(" AND ");
        whereClause.append("active = ?");
        parameters.add(true);
        return this;
    }

    public UserScope role(UserRole role) {
        if (whereClause.length() > 0) whereClause.append(" AND ");
        whereClause.append("role = ?");
        parameters.add(role.name());
        return this;
    }

    public UserScope emailLike(String pattern) {
        if (whereClause.length() > 0) whereClause.append(" AND ");
        whereClause.append("email LIKE ?");
        parameters.add("%" + pattern + "%");
        return this;
    }

    public UserScope orderByCreatedAtDesc() {
        this.orderBy = "created_at DESC";
        return this;
    }

    public UserScope limit(int limit) {
        this.limit = limit;
        return this;
    }

    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        if (whereClause.length() > 0) {
            sql += " WHERE " + whereClause.toString();
        }
        sql += " ORDER BY " + orderBy;
        if (limit != null) {
            sql += " LIMIT " + limit;
        }
        return executeQuery(sql, User.class, parameters.toArray());
    }

    public User findFirst() {
        limit(1);
        List<User> results = findAll();
        return results.isEmpty() ? null : results.get(0);
    }
}

// Usage
List<User> activeAdmins = new UserScope().active().role(UserRole.ADMIN).findAll();
User recentUser = new UserScope().active().orderByCreatedAtDesc().findFirst();
```

## Validation and Business Rules

### Built-in Validation
```java
public class User extends ActiveRecord {
    private String username;
    private String email;
    private String passwordHash;

    private List<String> validationErrors = new ArrayList<>();

    @Override
    public void save() {
        if (validate()) {
            super.save();
        } else {
            throw new ValidationException("Validation failed: " + String.join(", ", validationErrors));
        }
    }

    public boolean validate() {
        validationErrors.clear();

        if (username == null || username.trim().isEmpty()) {
            validationErrors.add("Username is required");
        } else if (username.length() < 3) {
            validationErrors.add("Username must be at least 3 characters");
        }

        if (email == null || email.trim().isEmpty()) {
            validationErrors.add("Email is required");
        } else if (!email.contains("@")) {
            validationErrors.add("Email must be valid");
        } else if (User.findByEmail(email) != null && !User.findByEmail(email).id.equals(this.id)) {
            validationErrors.add("Email already exists");
        }

        if (passwordHash == null || passwordHash.length() < 8) {
            validationErrors.add("Password must be at least 8 characters");
        }

        return validationErrors.isEmpty();
    }

    public List<String> getValidationErrors() {
        return new ArrayList<>(validationErrors);
    }
}
```

## Callbacks and Lifecycle Hooks

### Lifecycle Hooks
```java
public abstract class ActiveRecord {
    // Hook methods that subclasses can override
    protected void beforeSave() {}
    protected void afterSave() {}
    protected void beforeCreate() {}
    protected void afterCreate() {}
    protected void beforeUpdate() {}
    protected void afterUpdate() {}
    protected void beforeDelete() {}
    protected void afterDelete() {}

    @Override
    public void save() {
        beforeSave();
        if (id == null) {
            beforeCreate();
            insert();
            afterCreate();
        } else {
            beforeUpdate();
            update();
            afterUpdate();
        }
        afterSave();
    }

    @Override
    public void delete() {
        beforeDelete();
        super.delete();
        afterDelete();
    }
}

public class User extends ActiveRecord {
    @Override
    protected void beforeCreate() {
        // Set default values
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        // Hash password if not already hashed
        if (passwordHash != null && !passwordHash.startsWith("$2a$")) {
            passwordHash = BCrypt.hashpw(passwordHash, BCrypt.gensalt());
        }
    }

    @Override
    protected void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    protected void afterCreate() {
        // Send welcome email
        sendWelcomeEmail();
    }

    @Override
    protected void beforeDelete() {
        // Clean up related data
        deleteUserSessions();
        deleteUserPosts();
    }

    private void sendWelcomeEmail() {
        // Email sending logic
    }

    private void deleteUserSessions() {
        // Clean up sessions
    }

    private void deleteUserPosts() {
        // Handle post deletion or reassignment
    }
}
```

## Best Practices

### When to Use Active Record

#### Suitable Scenarios
- **Simple CRUD Applications**: Where domain logic is minimal
- **Rapid Prototyping**: Quick development and iteration
- **Small to Medium Projects**: Where tight coupling is acceptable
- **Legacy Database Integration**: When working with existing schemas

#### When to Avoid
- **Complex Domain Logic**: Leads to anemic domain models
- **Large Applications**: Tight coupling becomes problematic
- **Testability Concerns**: Hard to test domain logic in isolation
- **Multiple Data Sources**: Complex persistence requirements

### Implementation Guidelines

#### Keep Domain Logic Rich
```java
public class Order extends ActiveRecord {
    private Long customerId;
    private List<OrderItem> items = new ArrayList<>();
    private OrderStatus status = OrderStatus.PENDING;

    // Domain methods (keep these rich)
    public void addItem(Product product, int quantity) {
        OrderItem item = new OrderItem(product, quantity);
        items.add(item);
        recalculateTotal();
    }

    public void confirm() {
        if (canBeConfirmed()) {
            status = OrderStatus.CONFIRMED;
            reserveInventory();
            save();
        }
    }

    public void cancel() {
        if (canBeCancelled()) {
            status = OrderStatus.CANCELLED;
            releaseInventory();
            save();
        }
    }

    // Business rules
    private boolean canBeConfirmed() {
        return status == OrderStatus.PENDING && hasItems() && customerHasCredit();
    }

    private boolean canBeCancelled() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }

    // Persistence is handled by Active Record base class
}
```

#### Separate Concerns When Needed
```java
public class User extends ActiveRecord {
    // Core domain logic stays here
    public boolean canAccessResource(Resource resource) {
        // Complex business logic for access control
        return hasPermission(resource) && isAccountActive() && !isBlocked();
    }

    // But extract complex queries to separate classes
    public static List<User> findUsersWithPermission(Permission permission) {
        return UserQueryService.findUsersWithPermission(permission);
    }
}

@Service
public class UserQueryService {
    public static List<User> findUsersWithPermission(Permission permission) {
        // Complex query logic separated from domain class
        String sql = """
            SELECT DISTINCT u.* FROM users u
            JOIN user_permissions up ON u.id = up.user_id
            JOIN permissions p ON up.permission_id = p.id
            WHERE p.name = ? AND u.active = true
            """;
        return executeQuery(sql, User.class, permission.getName());
    }
}
```

## Common Challenges

### Testing Active Record Classes

#### Unit Testing with Mocks
```java
@Test
public void shouldSaveNewUser() {
    // Arrange
    User user = new User("john_doe", "john@example.com", "password123");
    when(mockDatabase.executeInsert(anyString(), any())).thenReturn(1L);

    // Act
    user.save();

    // Assert
    assertNotNull(user.getId());
    assertEquals(1L, user.getId().longValue());
    verify(mockDatabase).executeInsert(
        eq("INSERT INTO users (username, email, password_hash, active, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"),
        any(Collection.class)
    );
}

@Test
public void shouldValidateUserData() {
    // Arrange
    User user = new User("", "invalid-email", "123");

    // Act
    boolean isValid = user.validate();

    // Assert
    assertFalse(isValid);
    assertTrue(user.getValidationErrors().contains("Username is required"));
    assertTrue(user.getValidationErrors().contains("Email must be valid"));
    assertTrue(user.getValidationErrors().contains("Password must be at least 8 characters"));
}
```

#### Integration Testing
```java
@SpringBootTest
@Testcontainers
public class UserActiveRecordIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:13");

    @Autowired
    private UserRepository userRepository;

    @Test
    public void shouldPersistAndRetrieveUser() {
        // Arrange
        User user = new User("testuser", "test@example.com", "password123");

        // Act
        user.save();
        User retrieved = User.findById(user.getId());

        // Assert
        assertNotNull(retrieved);
        assertEquals("testuser", retrieved.getUsername());
        assertEquals("test@example.com", retrieved.getEmail());
    }

    @Test
    public void shouldUpdateUser() {
        // Arrange
        User user = new User("testuser", "test@example.com", "password123");
        user.save();

        // Act
        user.setEmail("newemail@example.com");
        user.save();
        User updated = User.findById(user.getId());

        // Assert
        assertEquals("newemail@example.com", updated.getEmail());
    }
}
```

### Performance Considerations

#### N+1 Query Problem
```java
// Bad: N+1 queries
public List<Post> getPostsWithAuthors() {
    List<Post> posts = Post.findAll();
    for (Post post : posts) {
        User author = post.getAuthor(); // Separate query for each post
    }
    return posts;
}

// Good: Eager loading
public List<Post> getPostsWithAuthors() {
    String sql = """
        SELECT p.*, u.username, u.email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        """;
    return executeQueryWithJoin(sql, Post.class);
}
```

#### Connection Pool Management
```java
@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/myapp");
        config.setUsername("user");
        config.setPassword("password");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        return new HikariDataSource(config);
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

## Tools and Technologies

### ORM Frameworks with Active Record
- **Ruby on Rails ActiveRecord**: Original implementation
- **Eloquent (Laravel)**: PHP Active Record implementation
- **Entity Framework**: .NET ORM with Active Record support
- **Django Models**: Python ORM with Active Record characteristics

### Java Libraries
- **Spring Data JPA**: JPA-based repositories
- **Hibernate**: ORM with Active Record capabilities
- **EclipseLink**: JPA implementation
- **jOOQ**: Type-safe SQL with Active Record features

### Testing Frameworks
- **JUnit**: Unit testing for Active Record classes
- **Testcontainers**: Integration testing with real databases
- **Mockito**: Mocking database operations
- **DBUnit**: Database testing framework

### Database Migration Tools
- **Flyway**: Database migration management
- **Liquibase**: Database change management
- **Rails Migrations**: Schema evolution in Rails
- **Alembic**: Database migration tool for SQLAlchemy

## References

- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html) - Martin Fowler
- [Active Record Pattern](https://martinfowler.com/eaaCatalog/activeRecord.html)
- [Ruby on Rails Active Record](https://guides.rubyonrails.org/active_record_basics.html)
- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent)
- [Domain-Driven Design](https://dddcommunity.org/book/evans_2003/) - Eric Evans