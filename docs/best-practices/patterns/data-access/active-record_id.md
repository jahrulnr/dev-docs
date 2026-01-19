# Active Record

## Gambaran Umum

Active Record adalah pola desain yang menggabungkan perilaku objek domain dengan logika akses data dalam satu kelas. Setiap objek Active Record mewakili satu baris dalam tabel database, dan merangkum baik data maupun perilaku, termasuk kemampuan untuk menyimpan, memperbarui, menghapus, dan meng-query dirinya sendiri dari database.

Pola ini dinamai berdasarkan komponen Active Record di Rails dan umumnya digunakan dalam framework Object-Relational Mapping (ORM). Ini menyediakan cara yang sederhana dan intuitif untuk bekerja dengan data di mana objek tahu cara mempertahankan dirinya sendiri.

## Konsep Inti

### Active Record vs Pola Lain

#### Perbandingan dengan Data Mapper
- **Active Record**: Objek domain menangani persistensinya sendiri
- **Data Mapper**: Lapisan terpisah memetakan objek domain ke database
- **Table Data Gateway**: Objek bertindak sebagai gateway ke satu tabel
- **Row Data Gateway**: Objek mewakili satu baris database

#### Karakteristik Utama
- **Objek Self-Persisting**: Objek tahu cara menyimpan dirinya sendiri
- **Operasi CRUD**: Metode bawaan create, read, update, delete
- **Metode Query**: Metode tingkat kelas untuk mencari objek
- **Tight Coupling**: Logika domain dan persistensi digabungkan

### Komponen Arsitektur

#### Kelas Base Active Record
```java
public abstract class ActiveRecord {
    protected Long id;
    protected LocalDateTime createdAt;
    protected LocalDateTime updatedAt;

    // Metode abstrak yang harus diimplementasikan subclass
    protected abstract String getTableName();
    protected abstract Map<String, Object> getColumnValues();

    // Operasi CRUD umum
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

    // Operasi database abstrak
    protected abstract Long executeInsert(String sql, Collection<Object> params);
    protected abstract int executeUpdate(String sql, Object... params);
}
```

#### Implementasi User Active Record
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

    // Metode bisnis
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        save();
    }

    public void deactivate() {
        this.active = false;
        save();
    }

    // Validasi
    public boolean isValid() {
        return username != null && !username.trim().isEmpty() &&
               email != null && email.contains("@") &&
               passwordHash != null && passwordHash.length() >= 8;
    }
}
```

## Pola Implementasi

### Ruby on Rails Active Record

#### Definisi Model Rails
```ruby
class User < ApplicationRecord
  # Validasi
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password_hash, presence: true

  # Asosiasi
  has_many :posts
  has_many :comments
  belongs_to :organization

  # Scopes
  scope :active, -> { where(active: true) }
  scope :admins, -> { where(role: 'admin') }

  # Callbacks
  before_save :downcase_email
  after_create :send_welcome_email

  # Metode instance
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

#### Contoh Penggunaan
```ruby
# Membuat dan menyimpan user baru
user = User.new(username: 'john_doe', email: 'john@example.com')
user.password_hash = BCrypt::Password.create('password123')
user.save!

# Mencari user
user = User.find(1)
active_users = User.active
admin_users = User.admins.where('created_at > ?', 1.month.ago)

# Memperbarui user
user.email = 'new_email@example.com'
user.save

# Menghapus user
user.destroy
```

### Java JPA dengan Pola Active Record

#### Entity JPA dengan Metode Active Record
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

    // Metode Active Record
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

    // Metode bisnis
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    // Injeksi repository (bisa static atau diinjeksi)
    @Autowired
    private static UserRepository userRepository;
}
```

### PHP Laravel Eloquent (Active Record)

#### Model Eloquent
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

    // Metode bisnis
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
            // Kirim email selamat datang
            $user->sendWelcomeEmail();
        });
    }

    private function sendWelcomeEmail()
    {
        // Implementasi pengiriman email selamat datang
    }
}
```

## Asosiasi dan Relasi

### Relasi One-to-Many
```java
public class Post extends ActiveRecord {
    private Long userId;
    private String title;
    private String content;
    private PostStatus status;

    // Metode relasi
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

### Relasi Many-to-Many
```java
public class User extends ActiveRecord {
    // ... field lainnya

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

## Metode Query dan Scopes

### Metode Finder
```java
public class User extends ActiveRecord {
    // Metode finder statis
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

    // Metode finder dinamis
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

### Scopes dan Query Objects
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

// Penggunaan
List<User> activeAdmins = new UserScope().active().role(UserRole.ADMIN).findAll();
User recentUser = new UserScope().active().orderByCreatedAtDesc().findFirst();
```

## Validasi dan Aturan Bisnis

### Validasi Bawaan
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

## Callbacks dan Lifecycle Hooks

### Lifecycle Hooks
```java
public abstract class ActiveRecord {
    // Metode hook yang bisa dioverride subclass
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
        // Set nilai default
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        // Hash password jika belum di-hash
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
        // Kirim email selamat datang
        sendWelcomeEmail();
    }

    @Override
    protected void beforeDelete() {
        // Bersihkan data terkait
        deleteUserSessions();
        deleteUserPosts();
    }

    private void sendWelcomeEmail() {
        // Logika pengiriman email
    }

    private void deleteUserSessions() {
        // Bersihkan sessions
    }

    private void deleteUserPosts() {
        // Tangani penghapusan atau reassignment posts
    }
}
```

## Praktik Terbaik

### Kapan Menggunakan Active Record

#### Skenario yang Cocok
- **Aplikasi CRUD Sederhana**: Di mana logika domain minimal
- **Rapid Prototyping**: Pengembangan dan iterasi cepat
- **Proyek Kecil hingga Menengah**: Di mana tight coupling dapat diterima
- **Integrasi Database Legacy**: Saat bekerja dengan skema yang ada

#### Kapan Menghindari
- **Logika Domain Kompleks**: Mengarah ke model domain anemia
- **Aplikasi Besar**: Tight coupling menjadi bermasalah
- **Kepedulian Testability**: Sulit menguji logika domain secara terpisah
- **Multiple Data Sources**: Persyaratan persistensi kompleks

### Panduan Implementasi

#### Jaga Domain Logic Tetap Rich
```java
public class Order extends ActiveRecord {
    private Long customerId;
    private List<OrderItem> items = new ArrayList<>();
    private OrderStatus status = OrderStatus.PENDING;

    // Metode domain (jaga agar tetap rich)
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

    // Aturan bisnis
    private boolean canBeConfirmed() {
        return status == OrderStatus.PENDING && hasItems() && customerHasCredit();
    }

    private boolean canBeCancelled() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }

    // Persistensi ditangani oleh kelas base Active Record
}
```

#### Pisahkan Concerns Saat Diperlukan
```java
public class User extends ActiveRecord {
    // Logika domain inti tetap di sini
    public boolean canAccessResource(Resource resource) {
        // Logika bisnis kompleks untuk kontrol akses
        return hasPermission(resource) && isAccountActive() && !isBlocked();
    }

    // Tapi ekstrak query kompleks ke kelas terpisah
    public static List<User> findUsersWithPermission(Permission permission) {
        return UserQueryService.findUsersWithPermission(permission);
    }
}

@Service
public class UserQueryService {
    public static List<User> findUsersWithPermission(Permission permission) {
        // Logika query kompleks dipisahkan dari kelas domain
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

## Tantangan Umum

### Testing Kelas Active Record

#### Unit Testing dengan Mocks
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

### Pertimbangan Performa

#### Masalah N+1 Query
```java
// Buruk: N+1 queries
public List<Post> getPostsWithAuthors() {
    List<Post> posts = Post.findAll();
    for (Post post : posts) {
        User author = post.getAuthor(); // Query terpisah untuk setiap post
    }
    return posts;
}

// Baik: Eager loading
public List<Post> getPostsWithAuthors() {
    String sql = """
        SELECT p.*, u.username, u.email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        """;
    return executeQueryWithJoin(sql, Post.class);
}
```

#### Manajemen Connection Pool
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

## Tools dan Teknologi

### Framework ORM dengan Active Record
- **Ruby on Rails ActiveRecord**: Implementasi asli
- **Eloquent (Laravel)**: Implementasi Active Record PHP
- **Entity Framework**: ORM .NET dengan dukungan Active Record
- **Django Models**: ORM Python dengan karakteristik Active Record

### Library Java
- **Spring Data JPA**: Repository berbasis JPA
- **Hibernate**: ORM dengan kemampuan Active Record
- **EclipseLink**: Implementasi JPA
- **jOOQ**: SQL type-safe dengan fitur Active Record

### Framework Testing
- **JUnit**: Unit testing untuk kelas Active Record
- **Testcontainers**: Integration testing dengan database nyata
- **Mockito**: Mocking operasi database
- **DBUnit**: Framework testing database

### Tools Migrasi Database
- **Flyway**: Manajemen migrasi database
- **Liquibase**: Manajemen perubahan database
- **Rails Migrations**: Evolusi skema di Rails
- **Alembic**: Tool migrasi database untuk SQLAlchemy

## Referensi

- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html) - Martin Fowler
- [Active Record Pattern](https://martinfowler.com/eaaCatalog/activeRecord.html)
- [Ruby on Rails Active Record](https://guides.rubyonrails.org/active_record_basics.html)
- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent)
- [Domain-Driven Design](https://dddcommunity.org/book/evans_2003/) - Eric Evans