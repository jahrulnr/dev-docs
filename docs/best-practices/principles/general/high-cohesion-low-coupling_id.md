# Kohesi Tinggi, Kopling Rendah (High Cohesion, Low Coupling)

## Gambaran Umum

Kohesi tinggi dan kopling rendah adalah prinsip fundamental desain perangkat lunak yang bekerja bersama untuk menciptakan sistem yang mudah dipelihara, fleksibel, dan kuat. Prinsip-prinsip ini memandu bagaimana kita mengorganisir kode menjadi modul, class, dan komponen untuk mencapai kualitas perangkat lunak yang lebih baik.

**Kohesi Tinggi** berarti bahwa elemen-elemen dalam sebuah modul atau class saling terkait erat dan bekerja bersama menuju satu tujuan yang terdefinisi dengan baik. Modul yang kohesif memiliki tanggung jawab yang jelas dan berisi semua yang diperlukan untuk memenuhi tanggung jawab tersebut.

**Kopling Rendah** berarti bahwa modul atau class memiliki dependensi minimal satu sama lain. Perubahan pada satu modul seharusnya tidak memerlukan perubahan pada modul lainnya. Kopling rendah dicapai melalui interface yang terdefinisi dengan baik dan abstraksi.

Bersama-sama, prinsip-prinsip ini membantu menciptakan sistem yang:
- Lebih mudah dipahami dan dipelihara
- Lebih dapat diuji dan andal
- Lebih fleksibel dan dapat beradaptasi dengan perubahan
- Lebih cocok untuk pengembangan paralel

## Konsep Inti

### Memahami Kohesi

#### Tipe-tipe Kohesi
- **Kohesi Fungsional**: Elemen-elemen bekerja bersama untuk melakukan satu fungsi
- **Kohesi Sekuensial**: Elemen-elemen melakukan operasi dalam urutan tertentu
- **Kohesi Komunikasional**: Elemen-elemen beroperasi pada data yang sama
- **Kohesi Prosedural**: Elemen-elemen merupakan bagian dari urutan operasi
- **Kohesi Temporal**: Elemen-elemen dieksekusi pada waktu yang sama
- **Kohesi Logikal**: Elemen-elemen saling terkait secara logikal tetapi tidak fungsional
- **Kohesi Kebetulan**: Elemen-elemen dikelompokkan secara sewenang-wenang (tipe terburuk)

#### Mengukur Kohesi
Kohesi dapat diukur dengan memeriksa:
- **Tanggung Jawab Tunggal**: Apakah modul memiliki satu tujuan yang jelas?
- **Keterkaitan**: Seberapa erat keterkaitan elemen-elemen?
- **Kelengkapan**: Apakah modul berisi semua elemen yang diperlukan?
- **Kegunaan Ulang**: Dapatkah modul digunakan ulang dalam konteks berbeda?

### Memahami Kopling

#### Tipe-tipe Kopling
- **Kopling Konten**: Satu modul memodifikasi data modul lain secara langsung
- **Kopling Umum**: Modul-modul berbagi data global
- **Kopling Eksternal**: Modul-modul bergantung pada format data eksternal
- **Kopling Kontrol**: Satu modul mengontrol perilaku modul lain
- **Kopling Stempel**: Modul-modul berbagi struktur data komposit
- **Kopling Data**: Modul-modul berkomunikasi melalui parameter sederhana
- **Kopling Pesan**: Modul-modul berkomunikasi melalui pesan (tipe terbaik)
- **Tidak Ada Kopling**: Modul-modul sepenuhnya independen

#### Metrik Kopling
- **Kopling Aferen (Ca)**: Jumlah modul yang bergantung pada modul ini
- **Kopling Eferen (Ce)**: Jumlah modul yang menjadi dependensi modul ini
- **Instabilitas (I)**: Ce / (Ca + Ce) - mengukur resistensi terhadap perubahan
- **Abstrakness (A)**: Rasio elemen abstrak terhadap total elemen

## Strategi Implementasi

### Mencapai Kohesi Tinggi

#### Prinsip Tanggung Jawab Tunggal (SRP)
```java
// Kohesi Rendah - Multiple tanggung jawab
public class UserManager {
    public void createUser(User user) { /* ... */ }
    public void validateUser(User user) { /* ... */ }
    public void sendWelcomeEmail(User user) { /* ... */ }
    public void generateUserReport() { /* ... */ }
    public void cleanupInactiveUsers() { /* ... */ }
}

// Kohesi Tinggi - Satu tanggung jawab per class
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest request) {
        validateUserData(request);
        User user = new User(request.getEmail(),
                           passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }
}

public class UserNotificationService {
    private final EmailSender emailSender;

    public void sendWelcomeEmail(User user) {
        String content = buildWelcomeEmail(user);
        emailSender.send(user.getEmail(), "Selamat Datang!", content);
    }
}

public class UserReportingService {
    private final UserRepository userRepository;

    public Report generateUserReport(DateRange period) {
        List<User> users = userRepository.findActiveUsers(period);
        return new UserReport(users, calculateStatistics(users));
    }
}
```

#### Prinsip Segregasi Interface (ISP)
```java
// Kohesi Rendah - Interface gemuk
public interface Worker {
    void work();
    void eat();
    void sleep();
    void manage();
    void code();
    void design();
}

// Kohesi Tinggi - Interface yang dipisahkan
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface Manageable {
    void manage();
}

public interface Codeable {
    void code();
}

// Implementasi dengan kohesi tinggi
public class Developer implements Workable, Eatable, Codeable {
    @Override
    public void work() { /* coding */ }

    @Override
    public void eat() { /* istirahat makan */ }

    @Override
    public void code() { /* menulis kode */ }
}

public class Manager implements Workable, Eatable, Manageable {
    @Override
    public void work() { /* mengelola */ }

    @Override
    public void eat() { /* istirahat makan */ }

    @Override
    public void manage() { /* manajemen tim */ }
}
```

### Mencapai Kopling Rendah

#### Prinsip Inversi Dependensi (DIP)
```java
// Kopling Tinggi - Dependensi konkret
public class OrderService {
    private final EmailNotificationService emailService;
    private final SmsNotificationService smsService;
    private final DatabaseLogger logger;

    public void processOrder(Order order) {
        // Logika proses order
        order.setStatus(OrderStatus.PROCESSING);

        // Kopling ketat ke implementasi spesifik
        emailService.sendOrderConfirmation(order);
        smsService.sendOrderNotification(order);
        logger.log("Order diproses: " + order.getId());
    }
}

// Kopling Rendah - Dependensi abstrak
public interface NotificationService {
    void sendNotification(String recipient, String message);
}

public interface Logger {
    void log(String message);
}

public class OrderService {
    private final NotificationService notificationService;
    private final Logger logger;

    public OrderService(NotificationService notificationService, Logger logger) {
        this.notificationService = notificationService;
        this.logger = logger;
    }

    public void processOrder(Order order) {
        order.setStatus(OrderStatus.PROCESSING);

        // Kopling longgar melalui abstraksi
        notificationService.sendNotification(
            order.getCustomerEmail(),
            "Order dikonfirmasi: " + order.getId()
        );

        logger.log("Order diproses: " + order.getId());
    }
}
```

#### Dependency Injection
```java
// Constructor injection untuk kopling rendah
@Service
public class PaymentProcessor {

    private final PaymentGateway paymentGateway;
    private final FraudDetectionService fraudService;
    private final TransactionRepository transactionRepository;

    public PaymentProcessor(
            PaymentGateway paymentGateway,
            FraudDetectionService fraudService,
            TransactionRepository transactionRepository) {
        this.paymentGateway = paymentGateway;
        this.fraudService = fraudService;
        this.transactionRepository = transactionRepository;
    }

    public PaymentResult processPayment(PaymentRequest request) {
        // Pengecekan fraud
        if (fraudService.isFraudulent(request)) {
            return PaymentResult.declined("Fraud terdeteksi");
        }

        // Proses pembayaran
        PaymentResult result = paymentGateway.charge(request);

        // Catat transaksi
        Transaction transaction = new Transaction(request, result);
        transactionRepository.save(transaction);

        return result;
    }
}
```

## Pola Desain untuk Kohesi dan Kopling

### Pola Facade
```java
// Subsistem kompleks dengan kohesi tinggi secara internal
public class OrderProcessingSubsystem {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notification;

    // Kohesi tinggi: semua logika pemrosesan order bersama
    public OrderResult processOrder(OrderRequest request) {
        // Reserve inventory
        inventory.reserveItems(request.getItems());

        // Proses pembayaran
        PaymentResult payment = payment.charge(request.getPaymentInfo(),
                                             calculateTotal(request));

        if (!payment.isSuccessful()) {
            inventory.releaseItems(request.getItems());
            return OrderResult.failed("Pembayaran gagal");
        }

        // Atur pengiriman
        ShippingLabel label = shipping.createLabel(request.getShippingAddress());

        // Kirim konfirmasi
        notification.sendOrderConfirmation(request.getCustomerEmail());

        return OrderResult.success(new Order(request, payment, label));
    }
}

// Facade menyediakan interface kopling rendah
public class OrderFacade {
    private final OrderProcessingSubsystem subsystem;

    public OrderResult placeOrder(OrderRequest request) {
        // Interface sederhana menyembunyikan kompleksitas
        return subsystem.processOrder(request);
    }
}
```

### Pola Observer
```java
// Sistem event dengan kopling rendah
public interface OrderEventListener {
    void onOrderCreated(Order order);
    void onOrderShipped(Order order);
    void onOrderDelivered(Order order);
}

@Service
public class OrderService {
    private final List<OrderEventListener> listeners = new ArrayList<>();
    private final OrderRepository orderRepository;

    public void addListener(OrderEventListener listener) {
        listeners.add(listener);
    }

    public Order createOrder(CreateOrderRequest request) {
        Order order = new Order(request.getCustomerId(), request.getItems());
        Order savedOrder = orderRepository.save(order);

        // Kopling rendah: notify listeners tanpa mengetahui detail implementasi
        listeners.forEach(listener -> listener.onOrderCreated(savedOrder));

        return savedOrder;
    }
}

// Kohesi tinggi: setiap listener menangani kepentingannya sendiri
@Service
public class InventoryUpdater implements OrderEventListener {
    private final InventoryService inventory;

    @Override
    public void onOrderCreated(Order order) {
        inventory.reserveItems(order.getItems());
    }
}

@Service
public class EmailNotifier implements OrderEventListener {
    private final EmailService emailService;

    @Override
    public void onOrderCreated(Order order) {
        emailService.sendOrderConfirmation(order.getCustomerEmail());
    }
}
```

### Pola Strategy
```java
// Kohesi tinggi: strategi pembayaran dikelompokkan bersama
public interface PaymentStrategy {
    PaymentResult pay(PaymentRequest request);
}

@Component
public class CreditCardPaymentStrategy implements PaymentStrategy {
    private final CreditCardProcessor processor;

    @Override
    public PaymentResult pay(PaymentRequest request) {
        return processor.charge(request.getCardDetails(), request.getAmount());
    }
}

@Component
public class PayPalPaymentStrategy implements PaymentStrategy {
    private final PayPalService payPalService;

    @Override
    public PaymentResult pay(PaymentRequest request) {
        return payPalService.makePayment(request.getPayPalToken(), request.getAmount());
    }
}

// Kopling rendah: payment service tidak mengetahui detail strategi
@Service
public class PaymentService {
    private final Map<PaymentMethod, PaymentStrategy> strategies;

    public PaymentService(List<PaymentStrategy> strategyList) {
        this.strategies = strategyList.stream()
            .collect(Collectors.toMap(
                strategy -> getPaymentMethod(strategy),
                strategy -> strategy
            ));
    }

    public PaymentResult processPayment(PaymentRequest request) {
        PaymentStrategy strategy = strategies.get(request.getMethod());
        if (strategy == null) {
            throw new UnsupportedPaymentMethodException();
        }
        return strategy.pay(request);
    }
}
```

## Pengukuran dan Monitoring

### Metrik Kode
```java
// Contoh perhitungan metrik kohesi dan kopling
public class ModuleMetrics {

    public double calculateCohesion(Class<?> clazz) {
        List<Method> methods = Arrays.asList(clazz.getDeclaredMethods());
        List<Field> fields = Arrays.asList(clazz.getDeclaredFields());

        // LCOM (Lack of Cohesion in Methods)
        // LCOM yang lebih rendah menunjukkan kohesi yang lebih tinggi
        return calculateLCOM(methods, fields);
    }

    public int calculateAfferentCoupling(Class<?> clazz) {
        // Hitung class yang bergantung pada class ini
        return findDependentClasses(clazz).size();
    }

    public int calculateEfferentCoupling(Class<?> clazz) {
        // Hitung class yang menjadi dependensi class ini
        return findDependencies(clazz).size();
    }

    public double calculateInstability(Class<?> clazz) {
        int ca = calculateAfferentCoupling(clazz);
        int ce = calculateEfferentCoupling(clazz);
        return ce / (double) (ca + ce);
    }
}
```

### Tools Analisis Statis
- **SonarQube**: Mengukur metrik kopling dan kohesi
- **JDepend**: Menganalisis dependensi package
- **Structure101**: Memvisualisasikan arsitektur dan kopling
- **Checkstyle/PMD**: Menerapkan standar coding yang mempromosikan kohesi

## Praktik Terbaik

### Panduan Desain

#### Desain Package
```java
// Struktur package yang baik mempromosikan kohesi dan kopling rendah
com.example.ecommerce
├── order/           // Kohesi tinggi: class terkait order
│   ├── Order.java
│   ├── OrderService.java
│   ├── OrderRepository.java
│   └── OrderController.java
├── payment/         // Kohesi tinggi: class terkait pembayaran
│   ├── PaymentService.java
│   ├── PaymentProcessor.java
│   └── PaymentRepository.java
├── inventory/       // Kohesi tinggi: class terkait inventory
│   ├── InventoryService.java
│   └── InventoryRepository.java
└── common/          // Abstraksi bersama (kopling rendah)
    ├── Money.java
    ├── DomainEvent.java
    └── Repository.java
```

#### Desain API
```java
// Desain API dengan kopling rendah
public interface ProductService {
    // Kopling data: parameter sederhana
    Optional<Product> findById(String id);

    // Kopling data: return tipe sederhana
    List<Product> findByCategory(String categoryId, Pageable pageable);

    // Kopling pesan: komunikasi event-driven
    void publishProductCreatedEvent(Product product);
}

// Implementasi internal dengan kohesi tinggi
@Service
public class ProductServiceImpl implements ProductService {
    private final ProductRepository repository;
    private final EventPublisher eventPublisher;
    private final ProductValidator validator;

    @Override
    public Optional<Product> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public List<Product> findByCategory(String categoryId, Pageable pageable) {
        return repository.findByCategory(categoryId, pageable);
    }

    @Override
    public void publishProductCreatedEvent(Product product) {
        validator.validate(product);
        repository.save(product);
        eventPublisher.publish(new ProductCreatedEvent(product.getId()));
    }
}
```

### Strategi Testing

#### Unit Testing untuk Kohesi
```java
@Test
public void shouldCreateProductWithHighCohesion() {
    // Arrange - semua data untuk tanggung jawab tunggal
    CreateProductRequest request = new CreateProductRequest(
        "Produk Test", Money.of(29.99), "Elektronik"
    );

    // Act - operasi tunggal
    Product product = productService.createProduct(request);

    // Assert - verifikasi tanggung jawab tunggal terpenuhi
    assertThat(product.getName()).isEqualTo("Produk Test");
    assertThat(product.getPrice()).isEqualTo(Money.of(29.99));
    assertThat(product.getCategory()).isEqualTo("Elektronik");
}
```

#### Integration Testing untuk Kopling
```java
@Test
public void shouldProcessOrderWithLowCoupling() {
    // Arrange - mock dependensi untuk test kopling
    OrderService orderService = new OrderService(
        mock(NotificationService.class),
        mock(Logger.class)
    );

    Order order = new Order("customer123", List.of(item1, item2));

    // Act - verifikasi kopling rendah melalui interface
    orderService.processOrder(order);

    // Assert - verifikasi interaksi melalui kontrak
    verify(notificationService).sendNotification(
        eq("customer@example.com"),
        contains("Order dikonfirmasi")
    );
}
```

## Anti-Pola Umum

### God Class/Object
```java
// Anti-pola: Kohesi rendah, kopling tinggi
public class GodClass {
    // Terlalu banyak tanggung jawab
    public void handleUserRegistration() { /* ... */ }
    public void processPayment() { /* ... */ }
    public void sendEmail() { /* ... */ }
    public void generateReport() { /* ... */ }
    public void manageInventory() { /* ... */ }
    // Banyak method lainnya...
}
```

### Kopling Ketat
```java
// Anti-pola: Kopling tinggi
public class OrderService {
    private final MySqlDatabase database;  // Dependensi konkret
    private final SmtpEmailService email;  // Dependensi konkret

    public void processOrder(Order order) {
        // Kopling langsung ke detail implementasi
        database.executeQuery("INSERT INTO orders ...");
        email.send("smtp.gmail.com", order.getEmail(), "Order diproses");
    }
}
```

### Feature Envy
```java
// Anti-pola: Kohesi rendah
public class OrderProcessor {
    public void process(Order order) {
        // Feature envy: mengakses terlalu banyak data orang lain
        if (order.getCustomer().getAddress().getCountry().equals("ID")) {
            // Logika spesifik Indonesia
        }
        // Logika lainnya mengakses data internal order...
    }
}
```

## Tools dan Framework

### Framework Dependency Injection
- **Spring Framework**: Dukungan DI dan AOP komprehensif
- **Google Guice**: Framework DI ringan
- **Dagger**: DI compile-time untuk Android/Java
- **CDI (Weld)**: Standar Jakarta EE untuk DI

### Tools Analisis Arsitektur
- **ArchUnit**: Gratis, sederhana dan dapat diperluas untuk testing arsitektur
- **jQAssistant**: Tool jaminan kualitas untuk perangkat lunak Java
- **SonarQube**: Inspeksi berkelanjutan kualitas kode
- **Checkstyle**: Pengecek gaya kode dan standar

### Tools Metrik
- **JDepend**: Menghitung metrik kualitas desain
- **CKJM**: Chidamber & Kemerer Java Metrics
- **MetricsReloaded**: Plugin Eclipse untuk perhitungan metrik
- **Eclipse Metrics**: Plugin untuk Eclipse IDE

## Referensi

- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Design Patterns - Gang of Four](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
- [Refactoring - Martin Fowler](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672)
- [Agile Software Development, Principles, Patterns, and Practices - Robert C. Martin](https://www.amazon.com/Software-Development-Principles-Patterns-Practices/dp/0135974445)
- [Object-Oriented Design Heuristics - Arthur Riel](https://www.amazon.com/Object-Oriented-Design-Heuristics-Arthur-Riel/dp/020163385X)
- [Code Complete - Steve McConnell](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0201485672)