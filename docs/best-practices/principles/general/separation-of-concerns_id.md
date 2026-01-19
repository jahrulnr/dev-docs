# Pemisahan Kepentingan (Separation of Concerns)

## Gambaran Umum

Pemisahan Kepentingan (Separation of Concerns - SoC) adalah prinsip desain fundamental yang menganjurkan membagi program komputer menjadi bagian-bagian terpisah, di mana setiap bagian menangani kepentingan yang berbeda. Kepentingan adalah sekumpulan informasi yang mempengaruhi kode program komputer, seperti logika bisnis, persistensi data, antarmuka pengguna, penanganan error, dan lainnya.

Prinsip ini bertujuan untuk menciptakan sistem yang lebih modular, mudah dipelihara, dan dipahami dengan memastikan bahwa setiap komponen memiliki satu tanggung jawab yang terdefinisi dengan baik. Ketika kepentingan dipisahkan dengan benar, perubahan pada satu aspek sistem berdampak minimal pada aspek lainnya, membuat codebase lebih robust dan mudah berkembang.

## Konsep Inti

### Apa itu Kepentingan?

#### Definisi
Kepentingan adalah setiap bagian yang menarik perhatian atau fokus dalam program. Kepentingan dapat berupa:
- **Fungsional**: Logika bisnis, pemrosesan data, interaksi pengguna
- **Non-fungsional**: Logging, keamanan, performa, penanganan error
- **Development**: Testing, deployment, konfigurasi
- **Cross-cutting**: Aspek yang mencakup multiple komponen

#### Tipe Kepentingan
- **Kepentingan Bisnis**: Aturan dan logika bisnis inti
- **Kepentingan Teknis**: Infrastruktur, framework, library
- **Kepentingan Kualitas**: Keamanan, performa, reliabilitas
- **Kepentingan Operasional**: Monitoring, logging, deployment

### Prinsip SoC

#### Tanggung Jawab Tunggal
Setiap modul, class, atau fungsi harus memiliki satu alasan untuk berubah
- **Kohesi**: Fungsi terkait tetap bersama
- **Kopling**: Fungsi tidak terkait tetap terpisah
- **Modularitas**: Komponen dapat dikembangkan dan diuji secara independen

#### Manfaat Pemisahan
- **Maintainability**: Perubahan dilokalisasi ke kepentingan spesifik
- **Testability**: Setiap kepentingan dapat diuji secara isolasi
- **Reusability**: Kepentingan yang dipisahkan dapat digunakan ulang di konteks berbeda
- **Understandability**: Kode lebih mudah dipahami dan dianalisis

## Strategi Implementasi

### Arsitektur Berlapis

#### Arsitektur Three-Tier Tradisional
```
┌─────────────────┐
│   Presentation  │  ← Antarmuka pengguna, endpoint API
├─────────────────┤
│   Business      │  ← Logika bisnis, aturan domain
├─────────────────┤
│   Data Access   │  ← Operasi database, persistensi
└─────────────────┘
```

```java
// Presentation Layer - Menangani HTTP request/response
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.created(URI.create("/api/users/" + user.getId()))
                           .body(UserDto.from(user));
    }
}

// Business Layer - Berisi logika bisnis
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest request) {
        // Aturan bisnis: Email harus unik
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException();
        }

        // Aturan bisnis: Password harus memenuhi kompleksitas
        validatePasswordComplexity(request.getPassword());

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        return userRepository.save(user);
    }
}

// Data Access Layer - Menangani operasi database
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}
```

### Arsitektur Hexagonal (Ports & Adapters)

#### Gambaran Arsitektur
```
┌─────────────────────────────────────┐
│            Application Core         │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  Business   │  │  Domain     │   │
│  │  Logic      │  │  Entities   │   │
│  └─────────────┘  └─────────────┘   │
└─────────┬─────────┬─────────┬───────┘
          │         │         │
    ┌─────┴─────┐ ┌─┴───────┐ ┌┴──────┐
    │ Primary   │ │Secondary│ │Driving│
    │Adapters   │ │Adapters │ │Ports  │
    │(UI, API)  │ │(DB, Ext)│ │       │
    └───────────┘ └─────────┘ └───────┘
```

```java
// Domain Entity - Logika bisnis murni
public class Order {
    private final OrderId id;
    private final CustomerId customerId;
    private final List<OrderItem> items;
    private OrderStatus status;

    public Order(CustomerId customerId, List<OrderItem> items) {
        this.id = new OrderId();
        this.customerId = customerId;
        this.items = new ArrayList<>(items);
        this.status = OrderStatus.PENDING;
    }

    public Money calculateTotal() {
        return items.stream()
                   .map(OrderItem::getTotal)
                   .reduce(Money.ZERO, Money::add);
    }

    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new InvalidOrderStateException();
        }
        this.status = OrderStatus.CONFIRMED;
    }
}

// Port Interface - Mendefinisikan apa yang dibutuhkan aplikasi
public interface OrderRepository {
    Order findById(OrderId id);
    void save(Order order);
    List<Order> findByCustomerId(CustomerId customerId);
}

// Application Service - Mengorkestrasi operasi bisnis
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final PaymentService paymentService;

    public Order createOrder(CreateOrderCommand command) {
        // Verifikasi customer ada
        Customer customer = customerService.findById(command.getCustomerId());

        // Buat order
        Order order = new Order(command.getCustomerId(), command.getItems());

        // Proses pembayaran
        paymentService.processPayment(order.calculateTotal());

        // Simpan order
        orderRepository.save(order);

        return order;
    }
}

// Adapter Implementation - Implementasi konkret dari port
@Repository
public class JpaOrderRepository implements OrderRepository {

    private final OrderJpaRepository jpaRepository;
    private final OrderMapper mapper;

    @Override
    public Order findById(OrderId id) {
        OrderEntity entity = jpaRepository.findById(id.getValue())
                                        .orElseThrow(OrderNotFoundException::new);
        return mapper.toDomain(entity);
    }

    @Override
    public void save(Order order) {
        OrderEntity entity = mapper.toEntity(order);
        jpaRepository.save(entity);
    }
}
```

### Clean Architecture

#### Lapisan Arsitektur
```
┌─────────────────────────────────────┐
│             Use Cases               │
├─────────────────────────────────────┤
│         Entities (Business)         │
├─────────────────────────────────────┤
│         Interface Adapters          │
│  (Controllers, Gateways, Presenters)│
├─────────────────────────────────────┤
│        Frameworks & Drivers         │
│  (Web, DB, External Interfaces)     │
└─────────────────────────────────────┘
```

```java
// Entity - Aturan bisnis enterprise
public class User {
    private UserId id;
    private Email email;
    private Password password;
    private UserRole role;

    public void changePassword(Password newPassword) {
        // Aturan bisnis: Password harus berbeda dari yang sekarang
        if (password.equals(newPassword)) {
            throw new InvalidPasswordException("Password baru harus berbeda");
        }

        // Aturan bisnis: Password harus memenuhi requirement keamanan
        if (!newPassword.meetsSecurityRequirements()) {
            throw new WeakPasswordException();
        }

        this.password = newPassword;
    }

    public boolean canAccess(Feature feature) {
        return role.hasPermission(feature);
    }
}

// Use Case - Aturan bisnis aplikasi
public class ChangePasswordUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final SecurityService securityService;

    public void execute(ChangePasswordRequest request) {
        // Aturan aplikasi: User harus terautentikasi
        User currentUser = securityService.getCurrentUser();

        // Aturan aplikasi: Hanya bisa ubah password sendiri (kecuali admin)
        if (!currentUser.getId().equals(request.getUserId()) &&
            !currentUser.canAccess(Feature.ADMIN_USERS)) {
            throw new AccessDeniedException();
        }

        User user = userRepository.findById(request.getUserId());
        user.changePassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

// Interface Adapter - Mengkonversi data antar lapisan
@RestController
public class UserController {

    private final ChangePasswordUseCase changePasswordUseCase;
    private final UserPresenter presenter;

    @PostMapping("/users/{userId}/password")
    public ResponseEntity<ChangePasswordResponse> changePassword(
            @PathVariable String userId,
            @RequestBody ChangePasswordHttpRequest request) {

        try {
            ChangePasswordRequest useCaseRequest = new ChangePasswordRequest(
                UserId.of(userId),
                Password.of(request.getNewPassword())
            );

            changePasswordUseCase.execute(useCaseRequest);

            return ResponseEntity.ok(presenter.success());

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                               .body(presenter.error(e.getMessage()));
        }
    }
}
```

## Pemisahan Kepentingan dalam Praktik

### Contoh Aplikasi Web

#### Implementasi MVC Pattern
```java
// Model - Data dan logika bisnis
public class Product {
    private String id;
    private String name;
    private Money price;
    private Category category;

    // Logika bisnis
    public boolean isAvailable() {
        return category.isActive() && price.isPositive();
    }

    public Money calculateDiscountedPrice(Discount discount) {
        return discount.applyTo(price);
    }
}

// View - Logika presentasi
@Component
public class ProductViewModel {

    public ProductDto toDto(Product product) {
        return new ProductDto(
            product.getId(),
            product.getName(),
            product.getPrice().toString(),
            product.getCategory().getName(),
            product.isAvailable()
        );
    }

    public List<ProductDto> toDtoList(List<Product> products) {
        return products.stream()
                      .map(this::toDto)
                      .collect(Collectors.toList());
    }
}

// Controller - Penanganan request
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductViewModel viewModel;

    @GetMapping
    public List<ProductDto> getProducts(@RequestParam Optional<String> category) {
        List<Product> products = category.isPresent()
            ? productService.findByCategory(category.get())
            : productService.findAll();

        return viewModel.toDtoList(products);
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@RequestBody CreateProductRequest request) {
        Product product = productService.createProduct(request);
        return ResponseEntity.created(URI.create("/api/products/" + product.getId()))
                           .body(viewModel.toDto(product));
    }
}

// Service - Operasi bisnis
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final EventPublisher eventPublisher;

    @Transactional
    public Product createProduct(CreateProductRequest request) {
        // Logika bisnis: Validasi kategori ada
        Category category = categoryService.findById(request.getCategoryId());

        // Logika bisnis: Periksa duplikasi nama
        if (productRepository.existsByNameAndCategory(request.getName(), category)) {
            throw new DuplicateProductException();
        }

        Product product = new Product(request.getName(), request.getPrice(), category);
        Product savedProduct = productRepository.save(product);

        // Logika bisnis: Publish domain event
        eventPublisher.publish(new ProductCreatedEvent(savedProduct.getId()));

        return savedProduct;
    }
}
```

### Arsitektur Microservices

#### Batas Service
```java
// User Service - Menangani manajemen user
@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final EventPublisher eventPublisher;

    public User createUser(CreateUserCommand command) {
        // Logika bisnis spesifik user
        validateUserData(command);

        User user = new User(command.getEmail(), encoder.encode(command.getPassword()));
        User savedUser = userRepository.save(user);

        eventPublisher.publish(new UserCreatedEvent(savedUser.getId()));

        return savedUser;
    }
}

// Order Service - Menangani pemrosesan order
@Service
public class OrderProcessingService {

    private final OrderRepository orderRepository;
    private final UserServiceClient userService;
    private final PaymentServiceClient paymentService;
    private final InventoryServiceClient inventoryService;

    @Transactional
    public Order placeOrder(PlaceOrderCommand command) {
        // Logika bisnis spesifik order
        User user = userService.getUser(command.getUserId());
        validateOrderItems(command.getItems());

        // Reserve inventory
        inventoryService.reserveItems(command.getItems());

        // Proses pembayaran
        PaymentResult payment = paymentService.charge(
            user.getPaymentMethod(),
            calculateTotal(command.getItems())
        );

        if (!payment.isSuccessful()) {
            inventoryService.releaseItems(command.getItems());
            throw new PaymentFailedException();
        }

        Order order = new Order(user.getId(), command.getItems());
        return orderRepository.save(order);
    }
}

// Notification Service - Menangani komunikasi
@Service
public class NotificationService {

    private final EmailSender emailSender;
    private final SmsSender smsSender;
    private final TemplateEngine templateEngine;

    public void sendOrderConfirmation(Order order) {
        // Logika spesifik notifikasi
        User user = getUserFromOrder(order);

        String emailContent = templateEngine.render("order-confirmation.html",
            Map.of("order", order, "user", user));

        emailSender.send(user.getEmail(), "Konfirmasi Order", emailContent);

        if (user.hasSmsEnabled()) {
            String smsContent = templateEngine.render("order-confirmation.txt",
                Map.of("order", order));
            smsSender.send(user.getPhone(), smsContent);
        }
    }
}
```

### Cross-Cutting Concerns

#### Aspect-Oriented Programming
```java
// Logging concern
@Aspect
@Component
public class LoggingAspect {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Around("execution(* com.example.service.*.*(..))")
    public Object logServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();

        logger.info("Entering {}.{}", className, methodName);

        try {
            Object result = joinPoint.proceed();
            logger.info("Exiting {}.{} with result", className, methodName);
            return result;
        } catch (Exception e) {
            logger.error("Exception in {}.{}: {}", className, methodName, e.getMessage());
            throw e;
        }
    }
}

// Security concern
@Aspect
@Component
public class SecurityAspect {

    private final SecurityContext securityContext;

    @Before("@annotation(com.example.annotation.RequiresRole)")
    public void checkAuthorization(JoinPoint joinPoint) {
        RequiresRole annotation = getAnnotation(joinPoint);
        User currentUser = securityContext.getCurrentUser();

        if (!currentUser.hasRole(annotation.value())) {
            throw new AccessDeniedException();
        }
    }
}

// Transaction concern
@Aspect
@Component
public class TransactionAspect {

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object manageTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        // Logika manajemen transaksi
        return joinPoint.proceed();
    }
}
```

## Praktik Terbaik

### Mengidentifikasi Kepentingan

#### Dekomposisi Fungsional
- **Fungsi Bisnis**: Kelompokkan operasi bisnis terkait
- **Fungsi Teknis**: Pisahkan kepentingan infrastruktur
- **Atribut Kualitas**: Isolasi requirement non-fungsional
- **Pola Perubahan**: Kelompokkan kode yang berubah karena alasan serupa

#### Interface Segregation
```java
// Buruk: Single interface dengan multiple kepentingan
public interface UserService {
    User findById(Long id);
    void save(User user);
    void sendWelcomeEmail(User user);
    void generateReport();
    void cleanupInactiveUsers();
}

// Baik: Interface yang dipisahkan berdasarkan kepentingan
public interface UserRepository {
    User findById(Long id);
    void save(User user);
}

public interface UserNotificationService {
    void sendWelcomeEmail(User user);
}

public interface UserReportingService {
    void generateReport();
}

public interface UserMaintenanceService {
    void cleanupInactiveUsers();
}
```

### Panduan Implementasi

#### Arah Dependency
- **Depend pada Abstraksi**: Modul high-level tidak boleh depend pada modul low-level
- **Stable Dependencies**: Depend ke arah stabilitas
- **Interface Segregation**: Client tidak boleh depend pada method yang tidak digunakan

#### Testing Pemisahan
```java
// Unit test fokus pada single concern
@Test
public void shouldCalculateOrderTotal() {
    // Arrange
    Order order = new Order();
    order.addItem(new OrderItem("Widget", Money.of(10.00), 2));
    order.addItem(new OrderItem("Gadget", Money.of(5.00), 1));

    // Act
    Money total = order.calculateTotal();

    // Assert
    assertThat(total).isEqualTo(Money.of(25.00));
}

// Integration test verifikasi interaksi concern
@Test
public void shouldCreateOrderEndToEnd() {
    // Test interaksi antar kepentingan
    // - Controller menerima request
    // - Service memproses logika bisnis
    // - Repository mempersist data
    // - Events dipublish
}
```

### Kesalahan Umum

#### Over-Separation
- **Nano-Services**: Service yang terlalu kecil dan menambah overhead komunikasi
- **Interface Explosion**: Terlalu banyak interface membuat sistem kompleks
- **Unnecessary Abstraction**: Mengabstraksi kode yang tidak berubah

#### Under-Separation
- **God Classes**: Class yang menangani multiple kepentingan
- **Tight Coupling**: Perubahan di satu kepentingan mempengaruhi yang lain
- **Mixed Responsibilities**: Logika UI tercampur dengan logika bisnis

## Tools dan Framework

### Framework Arsitektur
- **Spring Framework**: Dukungan arsitektur berlapis
- **ASP.NET Core**: Implementasi MVC pattern
- **Django**: Arsitektur MTV (Model-Template-View)
- **Express.js**: Pemisahan berbasis middleware

### Framework AOP
- **AspectJ**: Dukungan AOP komprehensif
- **Spring AOP**: Implementasi aspect berbasis proxy
- **PostSharp**: Compile-time weaving untuk .NET

### Tools Microservices
- **Spring Cloud**: Dukungan arsitektur microservices
- **Kubernetes**: Orkestrasi container untuk pemisahan service
- **Istio**: Service mesh untuk cross-cutting concerns

## Anti-Pola

### Anti-Pola Separation of Concerns
- **Big Ball of Mud**: Tidak ada pemisahan yang jelas, semuanya tercampur
- **Stovepipe Systems**: Pemisahan kaku yang mencegah komunikasi yang diperlukan
- **Anemic Domain Model**: Logika bisnis dipisahkan dari data, meninggalkan objek kosong
- **God Object**: Single object yang menangani semua kepentingan

### Kapan Tidak Menerapkan SoC
- **Simple Scripts**: Program kecil, single-purpose
- **Prototypes**: Implementasi quick-and-dirty
- **Legacy Migration**: Ketika refactoring terlalu mahal
- **Performance Critical**: Ketika pemisahan menambah overhead yang tidak dapat diterima

## Referensi

- [Separation of Concerns - Edsger W. Dijkstra](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Clean Architecture - Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Patterns of Enterprise Application Architecture - Martin Fowler](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [SOLID Principles - Robert C. Martin](https://en.wikipedia.org/wiki/SOLID)