# GRASP Principles

## Overview

GRASP (General Responsibility Assignment Software Patterns) is a set of nine fundamental principles that guide the assignment of responsibilities to classes and objects in object-oriented design. These patterns help developers create more maintainable, understandable, and flexible software systems by providing clear guidelines for distributing responsibilities.

## Core GRASP Principles

### 1. Information Expert
**Problem**: Which class should be responsible for knowing or doing certain things?

**Solution**: Assign responsibility to the class that has the information necessary to fulfill it.

**Example**: In an e-commerce system, the `Order` class should calculate its total because it contains the line items and their prices.

```java
public class Order {
    private List<OrderItem> items;

    public Money calculateTotal() {
        return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(Money.zero(), Money::add);
    }
}
```

### 2. Creator
**Problem**: Who should be responsible for creating instances of a class?

**Solution**: Assign class B the responsibility to create instances of class A if:
- B contains or aggregates A
- B records instances of A
- B closely uses A
- B has the data needed to initialize A

**Example**: An `Order` creates `OrderItem` instances since it contains them.

```java
public class Order {
    private List<OrderItem> items = new ArrayList<>();

    public OrderItem addItem(Product product, int quantity) {
        OrderItem item = new OrderItem(product, quantity, this);
        items.add(item);
        return item;
    }
}
```

### 3. Controller
**Problem**: What object receives and coordinates a system operation?

**Solution**: Assign the responsibility to a controller class that represents:
- The overall system
- A use case scenario
- A session or transaction

**Example**: Use case controllers handle business operations.

```java
public class PlaceOrderController {
    private OrderRepository orderRepository;
    private ProductRepository productRepository;

    public Order placeOrder(PlaceOrderRequest request) {
        // Validate request
        // Check product availability
        // Create order
        // Save to repository
        // Return result
    }
}
```

### 4. Low Coupling
**Problem**: How to reduce dependencies between classes?

**Solution**: Assign responsibilities to minimize coupling between classes.

**Benefits**:
- Changes are localized
- System is more maintainable
- Classes are more reusable

**Example**: Use interfaces and dependency injection to reduce coupling.

```java
public class OrderProcessor {
    private PaymentService paymentService; // Interface, not concrete class

    public OrderProcessor(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

### 5. High Cohesion
**Problem**: How to keep objects focused and understandable?

**Solution**: Assign responsibilities so that cohesion remains high.

**Characteristics of High Cohesion**:
- Class has focused responsibilities
- Methods are related to the class purpose
- Changes affect only related functionality

**Example**: Separate concerns into different classes.

```java
// High cohesion - each class has single responsibility
public class OrderValidator {
    public ValidationResult validate(Order order) { /* ... */ }
}

public class OrderCalculator {
    public Money calculateTotal(Order order) { /* ... */ }
}

public class OrderRepository {
    public void save(Order order) { /* ... */ }
}
```

### 6. Polymorphism
**Problem**: How to handle alternatives based on type?

**Solution**: Use polymorphic operations when behavior varies by type.

**Example**: Different payment methods implement the same interface.

```java
public interface PaymentProcessor {
    PaymentResult process(Payment payment);
}

public class CreditCardProcessor implements PaymentProcessor {
    public PaymentResult process(Payment payment) {
        // Credit card specific logic
    }
}

public class PayPalProcessor implements PaymentProcessor {
    public PaymentResult process(Payment payment) {
        // PayPal specific logic
    }
}
```

### 7. Pure Fabrication
**Problem**: What to do when Information Expert doesn't lead to high cohesion or low coupling?

**Solution**: Create artificial classes to achieve better design.

**Example**: Repository pattern for data access.

```java
public class OrderRepository {
    // Pure fabrication - doesn't represent domain concept
    // but provides high cohesion and low coupling

    public Order findById(Long id) { /* ... */ }
    public void save(Order order) { /* ... */ }
    public List<Order> findByCustomer(Customer customer) { /* ... */ }
}
```

### 8. Indirection
**Problem**: How to decouple objects?

**Solution**: Assign responsibility to an intermediate object to mediate between others.

**Example**: MVC pattern where Controller mediates between View and Model.

```java
public class OrderController {
    private OrderService orderService;
    private OrderView orderView;

    public void handleOrderRequest(HttpRequest request) {
        // Controller acts as intermediary
        Order order = orderService.getOrder(request.getOrderId());
        orderView.render(order);
    }
}
```

### 9. Protected Variations
**Problem**: How to design for change?

**Solution**: Identify variation points and create stable interfaces around them.

**Example**: Abstract factory pattern for different database implementations.

```java
public interface DatabaseFactory {
    UserRepository createUserRepository();
    OrderRepository createOrderRepository();
}

public class MySQLDatabaseFactory implements DatabaseFactory {
    // MySQL specific implementations
}

public class PostgreSQLDatabaseFactory implements DatabaseFactory {
    // PostgreSQL specific implementations
}
```

## Applying GRASP in Practice

### Design Process
1. **Identify Responsibilities**: What needs to be done?
2. **Identify Information Experts**: Who has the necessary information?
3. **Evaluate Coupling/Cohesion**: Does this maintain good design?
4. **Apply Other Patterns**: Use GoF patterns to implement responsibilities
5. **Refactor**: Continuously improve the design

### Common Patterns Integration

#### GRASP + GoF Patterns
- **Creator** → **Factory Pattern**
- **Controller** → **Command Pattern**
- **Polymorphism** → **Strategy Pattern**
- **Pure Fabrication** → **Adapter Pattern**

### Example: E-commerce Order Processing

```java
// Information Expert: Order knows its total
public class Order {
    private List<OrderItem> items;
    private Customer customer;

    public Money getTotal() {
        return items.stream()
                .map(item -> item.getProduct().getPrice().multiply(item.getQuantity()))
                .reduce(Money.zero(), Money::add);
    }
}

// Creator: Order creates OrderItems
public class Order {
    public OrderItem addItem(Product product, int quantity) {
        OrderItem item = new OrderItem(product, quantity);
        items.add(item);
        return item;
    }
}

// Controller: Use case controller
@RestController
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping("/orders")
    public OrderResponse placeOrder(@RequestBody PlaceOrderRequest request) {
        return placeOrderUseCase.execute(request);
    }
}

// Low Coupling: Dependency injection
@Service
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    public PlaceOrderUseCase(OrderRepository orderRepository, PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
    }
}
```

## Benefits and Trade-offs

### Benefits
- **Clear Responsibility Assignment**: Each class has well-defined responsibilities
- **Maintainable Code**: Changes are localized and predictable
- **Testable Design**: Classes have focused responsibilities
- **Reusable Components**: Low coupling enables reuse

### Trade-offs
- **Design Overhead**: Requires upfront design thinking
- **Learning Curve**: Takes time to master application
- **Subjective Application**: Requires design judgment
- **Over-engineering Risk**: Can lead to unnecessary complexity

## Common Pitfalls

### Over-application
- **Problem**: Applying GRASP everywhere leads to over-engineering
- **Solution**: Use judgment; simpler solutions are often better

### Ignoring Context
- **Problem**: Applying patterns without considering system constraints
- **Solution**: Consider performance, team skills, and business requirements

### Rigid Adherence
- **Problem**: Following patterns blindly without understanding rationale
- **Solution**: Understand why each pattern exists and when to bend rules

## Tools and Techniques

### Design Tools
- **CRC Cards**: Class-Responsibility-Collaborator cards for design
- **Sequence Diagrams**: Visualize object interactions
- **Class Diagrams**: Document static structure

### Code Quality Tools
- **SonarQube**: Code quality and maintainability metrics
- **Checkstyle**: Enforce coding standards
- **PMD**: Static code analysis

## References

- [GRASP Patterns - Craig Larman](https://www.craiglarman.com/wiki/index.php?title=GRASP)
- [Applying UML and Patterns - Craig Larman](https://www.amazon.com/Applying-UML-Patterns-Introduction-Object-Oriented/dp/0131489062)
- [Clean Architecture - Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)