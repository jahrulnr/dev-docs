# High Cohesion, Low Coupling

## Overview

High cohesion and low coupling are fundamental principles of software design that work together to create maintainable, flexible, and robust systems. These principles guide how we organize code into modules, classes, and components to achieve better software quality.

**High Cohesion** means that elements within a module or class are closely related and work together toward a single, well-defined purpose. A cohesive module has a clear responsibility and contains everything needed to fulfill that responsibility.

**Low Coupling** means that modules or classes have minimal dependencies on each other. Changes in one module should not require changes in other modules. Low coupling is achieved through well-defined interfaces and abstraction.

Together, these principles help create systems that are:
- Easier to understand and maintain
- More testable and reliable
- More flexible and adaptable to change
- Better suited for parallel development

## Core Concepts

### Understanding Cohesion

#### Types of Cohesion
- **Functional Cohesion**: Elements work together to perform a single function
- **Sequential Cohesion**: Elements perform operations in a specific order
- **Communicational Cohesion**: Elements operate on the same data
- **Procedural Cohesion**: Elements are part of a sequence of operations
- **Temporal Cohesion**: Elements are executed at the same time
- **Logical Cohesion**: Elements are logically related but not functionally
- **Coincidental Cohesion**: Elements are grouped arbitrarily (worst type)

#### Measuring Cohesion
Cohesion can be measured by examining:
- **Single Responsibility**: Does the module have one clear purpose?
- **Relatedness**: How closely related are the elements?
- **Completeness**: Does the module contain all necessary elements?
- **Reusability**: Can the module be reused in different contexts?

### Understanding Coupling

#### Types of Coupling
- **Content Coupling**: One module modifies another's data directly
- **Common Coupling**: Modules share global data
- **External Coupling**: Modules depend on external data formats
- **Control Coupling**: One module controls another's behavior
- **Stamp Coupling**: Modules share composite data structures
- **Data Coupling**: Modules communicate through simple parameters
- **Message Coupling**: Modules communicate through messages (best type)
- **No Coupling**: Modules are completely independent

#### Coupling Metrics
- **Afferent Coupling (Ca)**: Number of modules that depend on this module
- **Efferent Coupling (Ce)**: Number of modules this module depends on
- **Instability (I)**: Ce / (Ca + Ce) - measures resistance to change
- **Abstractness (A)**: Ratio of abstract elements to total elements

## Implementation Strategies

### Achieving High Cohesion

#### Single Responsibility Principle (SRP)
```java
// Low Cohesion - Multiple responsibilities
public class UserManager {
    public void createUser(User user) { /* ... */ }
    public void validateUser(User user) { /* ... */ }
    public void sendWelcomeEmail(User user) { /* ... */ }
    public void generateUserReport() { /* ... */ }
    public void cleanupInactiveUsers() { /* ... */ }
}

// High Cohesion - Single responsibility per class
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
        emailSender.send(user.getEmail(), "Welcome!", content);
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

#### Interface Segregation Principle (ISP)
```java
// Low Cohesion - Fat interface
public interface Worker {
    void work();
    void eat();
    void sleep();
    void manage();
    void code();
    void design();
}

// High Cohesion - Segregated interfaces
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

// Implementation with high cohesion
public class Developer implements Workable, Eatable, Codeable {
    @Override
    public void work() { /* coding */ }

    @Override
    public void eat() { /* lunch break */ }

    @Override
    public void code() { /* write code */ }
}

public class Manager implements Workable, Eatable, Manageable {
    @Override
    public void work() { /* managing */ }

    @Override
    public void eat() { /* lunch break */ }

    @Override
    public void manage() { /* team management */ }
}
```

### Achieving Low Coupling

#### Dependency Inversion Principle (DIP)
```java
// High Coupling - Concrete dependencies
public class OrderService {
    private final EmailNotificationService emailService;
    private final SmsNotificationService smsService;
    private final DatabaseLogger logger;

    public void processOrder(Order order) {
        // Process order logic
        order.setStatus(OrderStatus.PROCESSING);

        // Tight coupling to specific implementations
        emailService.sendOrderConfirmation(order);
        smsService.sendOrderNotification(order);
        logger.log("Order processed: " + order.getId());
    }
}

// Low Coupling - Abstract dependencies
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

        // Loose coupling through abstractions
        notificationService.sendNotification(
            order.getCustomerEmail(),
            "Order confirmed: " + order.getId()
        );

        logger.log("Order processed: " + order.getId());
    }
}
```

#### Dependency Injection
```java
// Constructor injection for low coupling
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
        // Fraud check
        if (fraudService.isFraudulent(request)) {
            return PaymentResult.declined("Fraud detected");
        }

        // Process payment
        PaymentResult result = paymentGateway.charge(request);

        // Record transaction
        Transaction transaction = new Transaction(request, result);
        transactionRepository.save(transaction);

        return result;
    }
}
```

## Design Patterns for Cohesion and Coupling

### Facade Pattern
```java
// Complex subsystem with high cohesion internally
public class OrderProcessingSubsystem {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notification;

    // High cohesion: all order processing logic together
    public OrderResult processOrder(OrderRequest request) {
        // Reserve inventory
        inventory.reserveItems(request.getItems());

        // Process payment
        PaymentResult payment = payment.charge(request.getPaymentInfo(),
                                             calculateTotal(request));

        if (!payment.isSuccessful()) {
            inventory.releaseItems(request.getItems());
            return OrderResult.failed("Payment failed");
        }

        // Arrange shipping
        ShippingLabel label = shipping.createLabel(request.getShippingAddress());

        // Send confirmation
        notification.sendOrderConfirmation(request.getCustomerEmail());

        return OrderResult.success(new Order(request, payment, label));
    }
}

// Facade provides low coupling interface
public class OrderFacade {
    private final OrderProcessingSubsystem subsystem;

    public OrderResult placeOrder(OrderRequest request) {
        // Simple interface hides complexity
        return subsystem.processOrder(request);
    }
}
```

### Observer Pattern
```java
// Low coupling event system
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

        // Low coupling: notify listeners without knowing implementation details
        listeners.forEach(listener -> listener.onOrderCreated(savedOrder));

        return savedOrder;
    }
}

// High cohesion: each listener handles its own concern
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

### Strategy Pattern
```java
// High cohesion: payment strategies grouped together
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

// Low coupling: payment service doesn't know strategy details
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

## Measuring and Monitoring

### Code Metrics
```java
// Example cohesion and coupling metrics calculation
public class ModuleMetrics {

    public double calculateCohesion(Class<?> clazz) {
        List<Method> methods = Arrays.asList(clazz.getDeclaredMethods());
        List<Field> fields = Arrays.asList(clazz.getDeclaredFields());

        // LCOM (Lack of Cohesion in Methods)
        // Lower LCOM indicates higher cohesion
        return calculateLCOM(methods, fields);
    }

    public int calculateAfferentCoupling(Class<?> clazz) {
        // Count classes that depend on this class
        return findDependentClasses(clazz).size();
    }

    public int calculateEfferentCoupling(Class<?> clazz) {
        // Count classes this class depends on
        return findDependencies(clazz).size();
    }

    public double calculateInstability(Class<?> clazz) {
        int ca = calculateAfferentCoupling(clazz);
        int ce = calculateEfferentCoupling(clazz);
        return ce / (double) (ca + ce);
    }
}
```

### Static Analysis Tools
- **SonarQube**: Measures coupling and cohesion metrics
- **JDepend**: Analyzes package dependencies
- **Structure101**: Visualizes architecture and coupling
- **Checkstyle/PMD**: Enforces coding standards that promote cohesion

## Best Practices

### Design Guidelines

#### Package Design
```java
// Good package structure promoting cohesion and low coupling
com.example.ecommerce
├── order/           // High cohesion: order-related classes
│   ├── Order.java
│   ├── OrderService.java
│   ├── OrderRepository.java
│   └── OrderController.java
├── payment/         // High cohesion: payment-related classes
│   ├── PaymentService.java
│   ├── PaymentProcessor.java
│   └── PaymentRepository.java
├── inventory/       // High cohesion: inventory-related classes
│   ├── InventoryService.java
│   └── InventoryRepository.java
└── common/          // Shared abstractions (low coupling)
    ├── Money.java
    ├── DomainEvent.java
    └── Repository.java
```

#### API Design
```java
// Low coupling API design
public interface ProductService {
    // Data coupling: simple parameters
    Optional<Product> findById(String id);

    // Data coupling: return simple types
    List<Product> findByCategory(String categoryId, Pageable pageable);

    // Message coupling: event-driven communication
    void publishProductCreatedEvent(Product product);
}

// High cohesion internal implementation
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

### Testing Strategies

#### Unit Testing for Cohesion
```java
@Test
public void shouldCreateProductWithHighCohesion() {
    // Arrange - all data for single responsibility
    CreateProductRequest request = new CreateProductRequest(
        "Test Product", Money.of(29.99), "Electronics"
    );

    // Act - single operation
    Product product = productService.createProduct(request);

    // Assert - verify single responsibility fulfilled
    assertThat(product.getName()).isEqualTo("Test Product");
    assertThat(product.getPrice()).isEqualTo(Money.of(29.99));
    assertThat(product.getCategory()).isEqualTo("Electronics");
}
```

#### Integration Testing for Coupling
```java
@Test
public void shouldProcessOrderWithLowCoupling() {
    // Arrange - mock dependencies to test coupling
    OrderService orderService = new OrderService(
        mock(NotificationService.class),
        mock(Logger.class)
    );

    Order order = new Order("customer123", List.of(item1, item2));

    // Act - verify low coupling through interface
    orderService.processOrder(order);

    // Assert - verify interactions through contracts
    verify(notificationService).sendNotification(
        eq("customer@example.com"),
        contains("Order confirmed")
    );
}
```

## Common Anti-Patterns

### God Class/Object
```java
// Anti-pattern: Low cohesion, high coupling
public class GodClass {
    // Too many responsibilities
    public void handleUserRegistration() { /* ... */ }
    public void processPayment() { /* ... */ }
    public void sendEmail() { /* ... */ }
    public void generateReport() { /* ... */ }
    public void manageInventory() { /* ... */ }
    // Many more methods...
}
```

### Tight Coupling
```java
// Anti-pattern: High coupling
public class OrderService {
    private final MySqlDatabase database;  // Concrete dependency
    private final SmtpEmailService email;  // Concrete dependency

    public void processOrder(Order order) {
        // Direct coupling to implementation details
        database.executeQuery("INSERT INTO orders ...");
        email.send("smtp.gmail.com", order.getEmail(), "Order processed");
    }
}
```

### Feature Envy
```java
// Anti-pattern: Low cohesion
public class OrderProcessor {
    public void process(Order order) {
        // Feature envy: accessing too much of another's data
        if (order.getCustomer().getAddress().getCountry().equals("US")) {
            // US-specific logic
        }
        // More logic accessing order's internal data...
    }
}
```

## Tools and Frameworks

### Dependency Injection Frameworks
- **Spring Framework**: Comprehensive DI and AOP support
- **Google Guice**: Lightweight DI framework
- **Dagger**: Compile-time DI for Android/Java
- **CDI (Weld)**: Jakarta EE standard for DI

### Architecture Analysis Tools
- **ArchUnit**: Free, simple and extensible free architecture testing
- **jQAssistant**: Quality assurance tool for Java software
- **SonarQube**: Continuous inspection of code quality
- **Checkstyle**: Code style and standards checker

### Metrics Tools
- **JDepend**: Calculates design quality metrics
- **CKJM**: Chidamber & Kemerer Java Metrics
- **MetricsReloaded**: Eclipse plugin for metrics calculation
- **Eclipse Metrics**: Plugin for Eclipse IDE

## References

- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Design Patterns - Gang of Four](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
- [Refactoring - Martin Fowler](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672)
- [Agile Software Development, Principles, Patterns, and Practices - Robert C. Martin](https://www.amazon.com/Software-Development-Principles-Patterns-Practices/dp/0135974445)
- [Object-Oriented Design Heuristics - Arthur Riel](https://www.amazon.com/Object-Oriented-Design-Heuristics-Arthur-Riel/dp/020163385X)
- [Code Complete - Steve McConnell](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)