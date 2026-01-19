# Composition over Inheritance

## Overview

Composition over inheritance is a fundamental object-oriented design principle that favors combining simple, reusable components to build complex behavior rather than relying on deep class inheritance hierarchies. This approach leads to more maintainable, flexible, and testable code by promoting loose coupling and runtime adaptability.

The principle encourages thinking in terms of "has-a" relationships rather than "is-a" relationships. Instead of creating complex inheritance trees, we compose objects by combining smaller, focused components that work together through well-defined interfaces.

## Core Concepts

### Inheritance vs Composition

#### Inheritance Problems
- **Tight Coupling**: Subclasses are tightly coupled to parent class implementations
- **Fragile Base Class**: Changes to base class can break subclasses unexpectedly
- **Inflexibility**: Inheritance hierarchies are fixed at compile time
- **Multiple Inheritance Issues**: Diamond problem and complexity in languages that support it

#### Composition Benefits
- **Loose Coupling**: Components can be swapped or modified independently
- **Flexibility**: Behavior can be changed at runtime
- **Testability**: Individual components can be tested in isolation
- **Reusability**: Components can be reused across different contexts

### "Has-A" vs "Is-A"

#### Is-A Relationship (Inheritance)
```java
// Problematic inheritance hierarchy
public class Bird {
    public void fly() { /* implementation */ }
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins can't fly!");
    }
}
```

#### Has-A Relationship (Composition)
```java
// Composition-based design
public interface Flyable {
    void fly();
}

public class FlyingBehavior implements Flyable {
    @Override
    public void fly() {
        System.out.println("Flying with wings");
    }
}

public class Bird {
    private final Flyable flyingBehavior;

    public Bird(Flyable flyingBehavior) {
        this.flyingBehavior = flyingBehavior;
    }

    public void performFlight() {
        flyingBehavior.fly();
    }
}

// Different birds can have different flying behaviors
Bird eagle = new Bird(new FlyingBehavior());
Bird penguin = new Bird(() -> System.out.println("I can't fly, but I can swim!"));
```

## Implementation Strategies

### Strategy Pattern
```java
// Payment strategies using composition
public interface PaymentStrategy {
    PaymentResult pay(PaymentRequest request);
}

public class CreditCardPayment implements PaymentStrategy {
    @Override
    public PaymentResult pay(PaymentRequest request) {
        // Credit card payment logic
        return new PaymentResult(true, "Credit card payment successful");
    }
}

public class PayPalPayment implements PaymentStrategy {
    @Override
    public PaymentResult pay(PaymentRequest request) {
        // PayPal payment logic
        return new PaymentResult(true, "PayPal payment successful");
    }
}

public class ShoppingCart {
    private final List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void setPaymentStrategy(PaymentStrategy paymentStrategy) {
        this.paymentStrategy = paymentStrategy;
    }

    public void checkout() {
        double total = calculateTotal();
        PaymentRequest request = new PaymentRequest(total);

        if (paymentStrategy != null) {
            PaymentResult result = paymentStrategy.pay(request);
            if (result.isSuccessful()) {
                System.out.println("Payment successful!");
            }
        }
    }
}
```

### Decorator Pattern
```java
// Composing behaviors with decorators
public interface DataSource {
    String readData();
    void writeData(String data);
}

public class FileDataSource implements DataSource {
    private final String filename;

    public FileDataSource(String filename) {
        this.filename = filename;
    }

    @Override
    public String readData() {
        // Read from file
        return "data from file";
    }

    @Override
    public void writeData(String data) {
        // Write to file
        System.out.println("Writing to file: " + data);
    }
}

// Base decorator
public abstract class DataSourceDecorator implements DataSource {
    protected DataSource wrappee;

    public DataSourceDecorator(DataSource source) {
        this.wrappee = source;
    }
}

// Compression decorator
public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public String readData() {
        String data = wrappee.readData();
        return decompress(data);
    }

    @Override
    public void writeData(String data) {
        String compressed = compress(data);
        wrappee.writeData(compressed);
    }

    private String compress(String data) { return data + " (compressed)"; }
    private String decompress(String data) { return data.replace(" (compressed)", ""); }
}

// Encryption decorator
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public String readData() {
        String data = wrappee.readData();
        return decrypt(data);
    }

    @Override
    public void writeData(String data) {
        String encrypted = encrypt(data);
        wrappee.writeData(encrypted);
    }

    private String encrypt(String data) { return data + " (encrypted)"; }
    private String decrypt(String data) { return data.replace(" (encrypted)", ""); }
}

// Usage: compose multiple behaviors
DataSource source = new FileDataSource("data.txt");
DataSource compressedSource = new CompressionDecorator(source);
DataSource secureSource = new EncryptionDecorator(compressedSource);
```

### Dependency Injection
```java
// Constructor injection for composition
public class EmailService {
    private final EmailSender emailSender;
    private final TemplateEngine templateEngine;
    private final UserRepository userRepository;

    public EmailService(EmailSender emailSender,
                       TemplateEngine templateEngine,
                       UserRepository userRepository) {
        this.emailSender = emailSender;
        this.templateEngine = templateEngine;
        this.userRepository = userRepository;
    }

    public void sendWelcomeEmail(String userId) {
        User user = userRepository.findById(userId);
        String template = templateEngine.render("welcome.html",
            Map.of("user", user));
        emailSender.send(user.getEmail(), "Welcome!", template);
    }
}

// Configuration class
@Configuration
public class AppConfig {
    @Bean
    public EmailService emailService(EmailSender emailSender,
                                   TemplateEngine templateEngine,
                                   UserRepository userRepository) {
        return new EmailService(emailSender, templateEngine, userRepository);
    }
}
```

## Design Patterns Using Composition

### Composite Pattern
```java
// Building tree structures through composition
public interface Component {
    void operation();
    void add(Component component);
    void remove(Component component);
    Component getChild(int index);
}

public class Leaf implements Component {
    private final String name;

    public Leaf(String name) {
        this.name = name;
    }

    @Override
    public void operation() {
        System.out.println("Leaf " + name + " operation");
    }

    @Override
    public void add(Component component) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void remove(Component component) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Component getChild(int index) {
        throw new UnsupportedOperationException();
    }
}

public class Composite implements Component {
    private final List<Component> children = new ArrayList<>();
    private final String name;

    public Composite(String name) {
        this.name = name;
    }

    @Override
    public void operation() {
        System.out.println("Composite " + name + " operation");
        for (Component child : children) {
            child.operation();
        }
    }

    @Override
    public void add(Component component) {
        children.add(component);
    }

    @Override
    public void remove(Component component) {
        children.remove(component);
    }

    @Override
    public Component getChild(int index) {
        return children.get(index);
    }
}
```

### Builder Pattern with Composition
```java
// Composing complex objects step by step
public class Computer {
    private final String cpu;
    private final String ram;
    private final String storage;
    private final String graphics;
    private final String motherboard;

    private Computer(Builder builder) {
        this.cpu = builder.cpu;
        this.ram = builder.ram;
        this.storage = builder.storage;
        this.graphics = builder.graphics;
        this.motherboard = builder.motherboard;
    }

    public static class Builder {
        private String cpu;
        private String ram;
        private String storage;
        private String graphics;
        private String motherboard;

        public Builder cpu(String cpu) {
            this.cpu = cpu;
            return this;
        }

        public Builder ram(String ram) {
            this.ram = ram;
            return this;
        }

        public Builder storage(String storage) {
            this.storage = storage;
            return this;
        }

        public Builder graphics(String graphics) {
            this.graphics = graphics;
            return this;
        }

        public Builder motherboard(String motherboard) {
            this.motherboard = motherboard;
            return this;
        }

        public Computer build() {
            return new Computer(this);
        }
    }
}

// Usage
Computer gamingPC = new Computer.Builder()
    .cpu("Intel i9")
    .ram("32GB DDR4")
    .storage("1TB SSD")
    .graphics("RTX 3080")
    .motherboard("ASUS ROG")
    .build();
```

## Functional Composition

### Function Composition in Java
```java
// Composing functions using functional interfaces
@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);

    default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
        return (V v) -> apply(before.apply(v));
    }

    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
        return (T t) -> after.apply(apply(t));
    }
}

// Example: composing data processing pipeline
public class DataProcessor {
    public static void main(String[] args) {
        Function<String, String> trim = String::trim;
        Function<String, String> toLower = String::toLowerCase;
        Function<String, Integer> length = String::length;

        // Compose: trim -> toLower -> length
        Function<String, Integer> pipeline = trim.andThen(toLower).andThen(length);

        String result = "  HELLO WORLD  ";
        int processedLength = pipeline.apply(result); // Result: 11
    }
}
```

### Method Chaining with Fluent Interfaces
```java
// Fluent interface using composition
public class QueryBuilder {
    private final List<String> conditions = new ArrayList<>();
    private final DatabaseConnection connection;

    public QueryBuilder(DatabaseConnection connection) {
        this.connection = connection;
    }

    public QueryBuilder where(String condition) {
        conditions.add(condition);
        return this;
    }

    public QueryBuilder and(String condition) {
        if (!conditions.isEmpty()) {
            conditions.add("AND " + condition);
        }
        return this;
    }

    public QueryBuilder or(String condition) {
        if (!conditions.isEmpty()) {
            conditions.add("OR " + condition);
        }
        return this;
    }

    public ResultSet execute() {
        String sql = "SELECT * FROM users WHERE " + String.join(" ", conditions);
        return connection.executeQuery(sql);
    }
}

// Usage: fluent composition
QueryBuilder query = new QueryBuilder(connection)
    .where("age > 18")
    .and("status = 'active'")
    .or("role = 'admin'");

ResultSet results = query.execute();
```

## Best Practices

### When to Use Composition

#### Favor Composition Over Inheritance
- When you need to change behavior at runtime
- When inheritance would create deep hierarchies
- When you want to avoid tight coupling
- When components need to be reused across different contexts

#### Guidelines for Effective Composition
- **Define Clear Interfaces**: Use interfaces or abstract classes to define contracts
- **Use Dependency Injection**: Inject dependencies rather than creating them
- **Favor Small Components**: Keep individual components focused and testable
- **Document Composition**: Clearly document how components work together

### Testing Composed Objects

#### Unit Testing Components
```java
@Test
public void shouldComposePaymentWithMockedDependencies() {
    // Arrange
    PaymentStrategy mockStrategy = mock(PaymentStrategy.class);
    ShoppingCart cart = new ShoppingCart();
    cart.setPaymentStrategy(mockStrategy);

    when(mockStrategy.pay(any())).thenReturn(new PaymentResult(true, "Success"));

    // Act
    cart.checkout();

    // Assert
    verify(mockStrategy).pay(any(PaymentRequest.class));
}
```

#### Integration Testing Composition
```java
@Test
public void shouldComposeDecoratorsCorrectly() {
    // Arrange
    DataSource fileSource = new FileDataSource("test.txt");
    DataSource compressed = new CompressionDecorator(fileSource);
    DataSource encrypted = new EncryptionDecorator(compressed);

    // Act
    encrypted.writeData("Hello World");
    String result = encrypted.readData();

    // Assert
    assertEquals("Hello World", result);
}
```

## Common Anti-Patterns

### Inheritance Abuse
```java
// Anti-pattern: Deep inheritance hierarchy
public class Animal {
    public void eat() { /* ... */ }
}

public class Mammal extends Animal {
    public void giveBirth() { /* ... */ }
}

public class Dog extends Mammal {
    public void bark() { /* ... */ }
}

public class GoldenRetriever extends Dog {
    public void fetch() { /* ... */ }
}

// Better: Use composition
public class Animal {
    private final EatingBehavior eatingBehavior;

    public Animal(EatingBehavior eatingBehavior) {
        this.eatingBehavior = eatingBehavior;
    }

    public void eat() {
        eatingBehavior.eat();
    }
}
```

### God Object
```java
// Anti-pattern: Single class doing everything
public class GodObject {
    private Database db;
    private EmailService email;
    private FileSystem fs;
    private Logger logger;

    public void doEverything() {
        // Too many responsibilities
        db.saveData();
        email.sendNotification();
        fs.writeFile();
        logger.logEvent();
    }
}

// Better: Compose focused objects
public class DataProcessor {
    private final Database db;
    private final Notifier notifier;

    public DataProcessor(Database db, Notifier notifier) {
        this.db = db;
        this.notifier = notifier;
    }

    public void process() {
        db.saveData();
        notifier.notify("Processing complete");
    }
}
```

## Tools and Frameworks

### Dependency Injection Frameworks
- **Spring Framework**: Comprehensive DI support
- **Google Guice**: Lightweight DI framework
- **Dagger**: Compile-time DI for Android
- **CDI (Weld)**: Jakarta EE standard

### Functional Programming Libraries
- **Vavr**: Functional programming for Java
- **Functional Java**: Functional programming constructs
- **Cyclops**: Integration of reactive and functional programming

### Testing Frameworks
- **Mockito**: Mocking framework for testing composition
- **TestNG/JUnit**: Unit testing frameworks
- **ArchUnit**: Architecture testing

## References

- [Design Patterns - Gang of Four](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
- [Effective Java - Joshua Bloch](https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997)
- [Head First Design Patterns - Eric Freeman](https://www.amazon.com/Head-First-Design-Patterns-Freeman/dp/0596007124)
- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring - Martin Fowler](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672)
- [Composition over Inheritance - Wikipedia](https://en.wikipedia.org/wiki/Composition_over_inheritance)