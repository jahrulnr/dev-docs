# Use Case Interactor Pattern

## Overview

The Use Case Interactor Pattern (also known as Application Services or Use Case Handlers) orchestrates application-level workflows by coordinating domain objects, repositories, and external services to fulfill specific business use cases. These interactors act as the entry point for application logic, ensuring clean separation between presentation, domain, and infrastructure layers.

Use Case Interactors encapsulate the flow of a single use case, orchestrating domain objects while keeping the domain model focused on business rules and invariants. This pattern promotes clean architecture principles and makes application logic more testable and maintainable.

## Core Concepts

### Use Case vs Application Service

#### Characteristics of Use Cases
- **Single Responsibility**: Each interactor handles one use case
- **Orchestration Focus**: Coordinates domain objects and services
- **Transaction Boundary**: Defines transactional scope
- **Input/Output Ports**: Clear interfaces for input and output
- **Domain Independence**: Doesn't contain domain business rules

#### Types of Use Case Interactors
- **Command Interactors**: Handle write operations (create, update, delete)
- **Query Interactors**: Handle read operations with complex logic
- **Saga Interactors**: Orchestrate multi-step business processes
- **Event Interactors**: Handle domain events and side effects

### Architectural Components

#### Use Case Interface
```java
public interface UseCase<I extends UseCaseInput, O extends UseCaseOutput> {
    O execute(I input) throws UseCaseException;
}

public interface UseCaseInput {
    // Marker interface for input data
}

public interface UseCaseOutput {
    // Marker interface for output data
}
```

#### Base Interactor Implementation
```java
public abstract class BaseUseCaseInteractor<I extends UseCaseInput, O extends UseCaseOutput>
        implements UseCase<I, O> {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    public O execute(I input) throws UseCaseException {
        try {
            validateInput(input);
            logger.debug("Executing use case: {}", getClass().getSimpleName());

            O output = doExecute(input);

            logger.debug("Use case executed successfully: {}", getClass().getSimpleName());
            return output;

        } catch (DomainException e) {
            logger.warn("Domain error in use case {}: {}", getClass().getSimpleName(), e.getMessage());
            throw new UseCaseException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error in use case {}", getClass().getSimpleName(), e);
            throw new UseCaseException("An unexpected error occurred", e);
        }
    }

    protected abstract void validateInput(I input) throws ValidationException;
    protected abstract O doExecute(I input) throws UseCaseException;
}
```

#### Use Case Exception Hierarchy
```java
public class UseCaseException extends RuntimeException {
    private final String useCaseName;
    private final Map<String, Object> context;

    public UseCaseException(String message) {
        super(message);
        this.useCaseName = getClass().getSimpleName();
        this.context = new HashMap<>();
    }

    public UseCaseException(String message, Throwable cause) {
        super(message, cause);
        this.useCaseName = getClass().getSimpleName();
        this.context = new HashMap<>();
    }

    public UseCaseException(String message, String useCaseName, Map<String, Object> context) {
        super(message);
        this.useCaseName = useCaseName;
        this.context = context != null ? new HashMap<>(context) : new HashMap<>();
    }

    // Getters
    public String getUseCaseName() { return useCaseName; }
    public Map<String, Object> getContext() { return new HashMap<>(context); }
}

public class ValidationException extends UseCaseException {
    private final List<String> validationErrors;

    public ValidationException(List<String> validationErrors) {
        super("Validation failed: " + String.join(", ", validationErrors));
        this.validationErrors = new ArrayList<>(validationErrors);
    }

    public List<String> getValidationErrors() { return validationErrors; }
}

public class AuthorizationException extends UseCaseException {
    private final String requiredPermission;

    public AuthorizationException(String requiredPermission) {
        super("Authorization failed. Required permission: " + requiredPermission);
        this.requiredPermission = requiredPermission;
    }

    public String getRequiredPermission() { return requiredPermission; }
}
```

## Implementation Patterns

### Command Interactors

#### Create Order Use Case
```java
public class CreateOrderUseCase extends BaseUseCaseInteractor<CreateOrderInput, CreateOrderOutput> {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final PricingService pricingService;
    private final InventoryService inventoryService;
    private final EventPublisher eventPublisher;

    public CreateOrderUseCase(OrderRepository orderRepository,
                            CustomerRepository customerRepository,
                            ProductRepository productRepository,
                            PricingService pricingService,
                            InventoryService inventoryService,
                            EventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.pricingService = pricingService;
        this.inventoryService = inventoryService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    protected void validateInput(CreateOrderInput input) throws ValidationException {
        List<String> errors = new ArrayList<>();

        if (input.getCustomerId() == null || input.getCustomerId().trim().isEmpty()) {
            errors.add("Customer ID is required");
        }

        if (input.getItems() == null || input.getItems().isEmpty()) {
            errors.add("Order must contain at least one item");
        } else {
            for (OrderItemInput item : input.getItems()) {
                if (item.getProductId() == null || item.getProductId().trim().isEmpty()) {
                    errors.add("Product ID is required for all items");
                }
                if (item.getQuantity() <= 0) {
                    errors.add("Quantity must be greater than zero for all items");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    @Override
    @Transactional
    protected CreateOrderOutput doExecute(CreateOrderInput input) throws UseCaseException {
        // Load customer
        Customer customer = customerRepository.findById(input.getCustomerId())
            .orElseThrow(() -> new UseCaseException("Customer not found: " + input.getCustomerId()));

        // Validate customer status
        if (!customer.isActive()) {
            throw new UseCaseException("Customer is not active: " + input.getCustomerId());
        }

        // Create order aggregate
        Order order = new Order(customer.getId(), LocalDateTime.now());

        // Add items to order
        for (OrderItemInput itemInput : input.getItems()) {
            Product product = productRepository.findById(itemInput.getProductId())
                .orElseThrow(() -> new UseCaseException("Product not found: " + itemInput.getProductId()));

            // Check inventory
            if (!inventoryService.isAvailable(product.getId(), itemInput.getQuantity())) {
                throw new UseCaseException("Insufficient inventory for product: " + product.getId());
            }

            // Calculate pricing
            Money itemPrice = pricingService.calculatePrice(product, itemInput.getQuantity(), customer);

            OrderItem orderItem = new OrderItem(product.getId(), itemInput.getQuantity(), itemPrice);
            order.addItem(orderItem);
        }

        // Apply pricing rules and discounts
        pricingService.applyPricingRules(order, customer);

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Reserve inventory
        inventoryService.reserveInventory(savedOrder);

        // Publish domain events
        eventPublisher.publish(new OrderCreatedEvent(savedOrder.getId(), savedOrder.getTotal()));

        return new CreateOrderOutput(savedOrder.getId(), savedOrder.getTotal());
    }
}
```

#### Update Customer Profile Use Case
```java
public class UpdateCustomerProfileUseCase extends BaseUseCaseInteractor<UpdateCustomerProfileInput, UpdateCustomerProfileOutput> {

    private final CustomerRepository customerRepository;
    private final EventPublisher eventPublisher;

    public UpdateCustomerProfileUseCase(CustomerRepository customerRepository, EventPublisher eventPublisher) {
        this.customerRepository = customerRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    protected void validateInput(UpdateCustomerProfileInput input) throws ValidationException {
        List<String> errors = new ArrayList<>();

        if (input.getCustomerId() == null || input.getCustomerId().trim().isEmpty()) {
            errors.add("Customer ID is required");
        }

        if (input.getEmail() != null && !isValidEmail(input.getEmail())) {
            errors.add("Invalid email format");
        }

        if (input.getPhoneNumber() != null && !isValidPhoneNumber(input.getPhoneNumber())) {
            errors.add("Invalid phone number format");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    @Override
    @Transactional
    protected UpdateCustomerProfileOutput doExecute(UpdateCustomerProfileInput input) throws UseCaseException {
        Customer customer = customerRepository.findById(input.getCustomerId())
            .orElseThrow(() -> new UseCaseException("Customer not found: " + input.getCustomerId()));

        // Track changes for event publishing
        Map<String, Object> changes = new HashMap<>();

        // Update profile information
        if (input.getFirstName() != null && !input.getFirstName().equals(customer.getFirstName())) {
            changes.put("firstName", Map.of("old", customer.getFirstName(), "new", input.getFirstName()));
            customer.setFirstName(input.getFirstName());
        }

        if (input.getLastName() != null && !input.getLastName().equals(customer.getLastName())) {
            changes.put("lastName", Map.of("old", customer.getLastName(), "new", input.getLastName()));
            customer.setLastName(input.getLastName());
        }

        if (input.getEmail() != null && !input.getEmail().equals(customer.getEmail())) {
            // Check if email is already taken by another customer
            if (customerRepository.existsByEmailAndIdNot(input.getEmail(), customer.getId())) {
                throw new UseCaseException("Email already exists: " + input.getEmail());
            }
            changes.put("email", Map.of("old", customer.getEmail(), "new", input.getEmail()));
            customer.setEmail(input.getEmail());
        }

        if (input.getPhoneNumber() != null && !input.getPhoneNumber().equals(customer.getPhoneNumber())) {
            changes.put("phoneNumber", Map.of("old", customer.getPhoneNumber(), "new", input.getPhoneNumber()));
            customer.setPhoneNumber(input.getPhoneNumber());
        }

        // Update address if provided
        if (input.getAddress() != null) {
            customer.setAddress(input.getAddress());
            changes.put("address", "updated");
        }

        // Save updated customer
        Customer updatedCustomer = customerRepository.save(customer);

        // Publish event if there were changes
        if (!changes.isEmpty()) {
            eventPublisher.publish(new CustomerProfileUpdatedEvent(customer.getId(), changes));
        }

        return new UpdateCustomerProfileOutput(updatedCustomer.getId(), changes.keySet());
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }

    private boolean isValidPhoneNumber(String phone) {
        return phone != null && phone.matches("^\\+?[1-9]\\d{1,14}$");
    }
}
```

### Query Interactors

#### Customer Order History Use Case
```java
public class GetCustomerOrderHistoryUseCase extends BaseUseCaseInteractor<GetCustomerOrderHistoryInput, GetCustomerOrderHistoryOutput> {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public GetCustomerOrderHistoryUseCase(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    protected void validateInput(GetCustomerOrderHistoryInput input) throws ValidationException {
        List<String> errors = new ArrayList<>();

        if (input.getCustomerId() == null || input.getCustomerId().trim().isEmpty()) {
            errors.add("Customer ID is required");
        }

        if (input.getPageSize() != null && input.getPageSize() <= 0) {
            errors.add("Page size must be greater than zero");
        }

        if (input.getPageNumber() != null && input.getPageNumber() < 0) {
            errors.add("Page number must be non-negative");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    @Override
    @Transactional(readOnly = true)
    protected GetCustomerOrderHistoryOutput doExecute(GetCustomerOrderHistoryInput input) throws UseCaseException {
        // Verify customer exists
        if (!customerRepository.existsById(input.getCustomerId())) {
            throw new UseCaseException("Customer not found: " + input.getCustomerId());
        }

        // Build query criteria
        OrderQueryCriteria criteria = new OrderQueryCriteria();
        criteria.setCustomerId(input.getCustomerId());
        criteria.setStatus(input.getStatus());
        criteria.setDateFrom(input.getDateFrom());
        criteria.setDateTo(input.getDateTo());
        criteria.setMinAmount(input.getMinAmount());
        criteria.setMaxAmount(input.getMaxAmount());

        // Set pagination defaults
        int pageSize = input.getPageSize() != null ? input.getPageSize() : 20;
        int pageNumber = input.getPageNumber() != null ? input.getPageNumber() : 0;

        Pageable pageable = PageRequest.of(pageNumber, pageSize,
            Sort.by("createdDate").descending());

        // Execute query
        Page<OrderSummary> orderPage = orderRepository.findOrderSummaries(criteria, pageable);

        // Calculate summary statistics
        OrderHistorySummary summary = calculateSummary(orderPage.getContent());

        return new GetCustomerOrderHistoryOutput(
            orderPage.getContent(),
            orderPage.getTotalElements(),
            orderPage.getTotalPages(),
            orderPage.hasNext(),
            orderPage.hasPrevious(),
            summary
        );
    }

    private OrderHistorySummary calculateSummary(List<OrderSummary> orders) {
        BigDecimal totalSpent = orders.stream()
            .map(OrderSummary::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = orders.size();

        BigDecimal averageOrderValue = orderCount > 0 ?
            totalSpent.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP) :
            BigDecimal.ZERO;

        LocalDateTime mostRecentOrder = orders.stream()
            .map(OrderSummary::getCreatedDate)
            .max(LocalDateTime::compareTo)
            .orElse(null);

        return new OrderHistorySummary(totalSpent, orderCount, averageOrderValue, mostRecentOrder);
    }
}
```

### Saga Interactors

#### Order Fulfillment Saga
```java
public class FulfillOrderUseCase extends BaseUseCaseInteractor<FulfillOrderInput, FulfillOrderOutput> {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final ShippingService shippingService;
    private final NotificationService notificationService;
    private final EventPublisher eventPublisher;

    public FulfillOrderUseCase(OrderRepository orderRepository,
                             InventoryService inventoryService,
                             PaymentService paymentService,
                             ShippingService shippingService,
                             NotificationService notificationService,
                             EventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
        this.paymentService = paymentService;
        this.shippingService = shippingService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    protected void validateInput(FulfillOrderInput input) throws ValidationException {
        if (input.getOrderId() == null || input.getOrderId().trim().isEmpty()) {
            throw new ValidationException(List.of("Order ID is required"));
        }
    }

    @Override
    @Transactional
    protected FulfillOrderOutput doExecute(FulfillOrderInput input) throws UseCaseException {
        Order order = orderRepository.findById(input.getOrderId())
            .orElseThrow(() -> new UseCaseException("Order not found: " + input.getOrderId()));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new UseCaseException("Order must be paid before fulfillment: " + input.getOrderId());
        }

        try {
            // Step 1: Reserve inventory
            inventoryService.reserveInventory(order);
            order.setStatus(OrderStatus.INVENTORY_RESERVED);
            orderRepository.save(order);

            // Step 2: Process payment capture
            PaymentResult paymentResult = paymentService.capturePayment(order);
            if (!paymentResult.isSuccessful()) {
                // Compensate: Release inventory
                inventoryService.releaseInventory(order);
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                orderRepository.save(order);
                throw new UseCaseException("Payment capture failed: " + paymentResult.getErrorMessage());
            }
            order.setStatus(OrderStatus.PAYMENT_CAPTURED);
            orderRepository.save(order);

            // Step 3: Create shipment
            Shipment shipment = shippingService.createShipment(order);
            order.setShipment(shipment);
            order.setStatus(OrderStatus.SHIPPED);
            orderRepository.save(order);

            // Step 4: Send notifications
            notificationService.sendOrderShippedNotification(order);

            // Step 5: Publish events
            eventPublisher.publish(new OrderFulfilledEvent(order.getId(), shipment.getTrackingNumber()));

            return new FulfillOrderOutput(order.getId(), shipment.getTrackingNumber(), order.getStatus());

        } catch (Exception e) {
            // Saga compensation: Try to undo completed steps
            compensateFulfillment(order);
            throw new UseCaseException("Order fulfillment failed: " + e.getMessage(), e);
        }
    }

    private void compensateFulfillment(Order order) {
        try {
            switch (order.getStatus()) {
                case SHIPPED:
                    shippingService.cancelShipment(order.getShipment());
                    // Fall through
                case PAYMENT_CAPTURED:
                    paymentService.refundPayment(order);
                    // Fall through
                case INVENTORY_RESERVED:
                    inventoryService.releaseInventory(order);
                    break;
            }

            order.setStatus(OrderStatus.FULFILLMENT_FAILED);
            orderRepository.save(order);

        } catch (Exception compensationException) {
            // Log compensation failure but don't throw
            logger.error("Compensation failed for order {}", order.getId(), compensationException);
        }
    }
}
```

## Application Integration

### Controller Integration

#### REST Controller with Use Cases
```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final GetCustomerOrderHistoryUseCase getOrderHistoryUseCase;
    private final FulfillOrderUseCase fulfillOrderUseCase;

    public OrderController(CreateOrderUseCase createOrderUseCase,
                          GetCustomerOrderHistoryUseCase getOrderHistoryUseCase,
                          FulfillOrderUseCase fulfillOrderUseCase) {
        this.createOrderUseCase = createOrderUseCase;
        this.getOrderHistoryUseCase = getOrderHistoryUseCase;
        this.fulfillOrderUseCase = fulfillOrderUseCase;
    }

    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            CreateOrderInput input = new CreateOrderInput(
                request.getCustomerId(),
                request.getItems().stream()
                    .map(item -> new OrderItemInput(item.getProductId(), item.getQuantity()))
                    .collect(Collectors.toList())
            );

            CreateOrderOutput output = createOrderUseCase.execute(input);

            CreateOrderResponse response = new CreateOrderResponse(output.getOrderId(), output.getTotal());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (ValidationException e) {
            Map<String, List<String>> errors = Map.of("validationErrors", e.getValidationErrors());
            return ResponseEntity.badRequest().body(errors);
        } catch (UseCaseException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}/history")
    public ResponseEntity<GetCustomerOrderHistoryResponse> getOrderHistory(
            @PathVariable String customerId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            GetCustomerOrderHistoryInput input = new GetCustomerOrderHistoryInput(
                customerId, status, dateFrom, dateTo, null, null, page, size
            );

            GetCustomerOrderHistoryOutput output = getOrderHistoryUseCase.execute(input);

            GetCustomerOrderHistoryResponse response = new GetCustomerOrderHistoryResponse(
                output.getOrders(),
                output.getTotalElements(),
                output.getTotalPages(),
                output.isHasNext(),
                output.isHasPrevious(),
                output.getSummary()
            );

            return ResponseEntity.ok(response);

        } catch (UseCaseException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/fulfill")
    public ResponseEntity<FulfillOrderResponse> fulfillOrder(@PathVariable String orderId) {
        try {
            FulfillOrderInput input = new FulfillOrderInput(orderId);
            FulfillOrderOutput output = fulfillOrderUseCase.execute(input);

            FulfillOrderResponse response = new FulfillOrderResponse(
                output.getOrderId(),
                output.getTrackingNumber(),
                output.getStatus()
            );

            return ResponseEntity.ok(response);

        } catch (UseCaseException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
```

### Dependency Injection Configuration

#### Use Case Configuration
```java
@Configuration
public class UseCaseConfiguration {

    @Bean
    public CreateOrderUseCase createOrderUseCase(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            PricingService pricingService,
            InventoryService inventoryService,
            EventPublisher eventPublisher) {

        return new CreateOrderUseCase(
            orderRepository, customerRepository, productRepository,
            pricingService, inventoryService, eventPublisher
        );
    }

    @Bean
    public UpdateCustomerProfileUseCase updateCustomerProfileUseCase(
            CustomerRepository customerRepository,
            EventPublisher eventPublisher) {

        return new UpdateCustomerProfileUseCase(customerRepository, eventPublisher);
    }

    @Bean
    public GetCustomerOrderHistoryUseCase getCustomerOrderHistoryUseCase(
            OrderRepository orderRepository,
            CustomerRepository customerRepository) {

        return new GetCustomerOrderHistoryUseCase(orderRepository, customerRepository);
    }

    @Bean
    public FulfillOrderUseCase fulfillOrderUseCase(
            OrderRepository orderRepository,
            InventoryService inventoryService,
            PaymentService paymentService,
            ShippingService shippingService,
            NotificationService notificationService,
            EventPublisher eventPublisher) {

        return new FulfillOrderUseCase(
            orderRepository, inventoryService, paymentService,
            shippingService, notificationService, eventPublisher
        );
    }
}
```

## Best Practices

### When to Use Use Case Interactors

#### Suitable Scenarios
- **Complex Business Workflows**: Multi-step processes with multiple domain objects
- **Transaction Boundaries**: Operations that need atomicity across aggregates
- **Cross-Cutting Concerns**: Logging, security, and monitoring at application level
- **External System Integration**: Coordinating with external services
- **Business Rule Orchestration**: Combining multiple domain services

#### When to Avoid
- **Simple CRUD Operations**: Direct repository calls suffice
- **Single Aggregate Operations**: Domain methods can handle directly
- **Presentation Logic**: Keep interactors focused on business logic
- **Infrastructure Concerns**: Use adapters and ports for external dependencies

### Implementation Guidelines

#### Keep Interactors Focused
```java
// Good: Single use case responsibility
public class CreateOrderUseCase extends BaseUseCaseInteractor<CreateOrderInput, CreateOrderOutput> {
    // Focused on order creation workflow
}

// Bad: Multiple responsibilities
public class OrderManagementUseCase extends BaseUseCaseInteractor<OrderManagementInput, OrderManagementOutput> {
    // Handles create, update, delete, query - too broad
}
```

#### Handle Errors Appropriately
```java
public class RobustUseCaseInteractor<I extends UseCaseInput, O extends UseCaseOutput>
        extends BaseUseCaseInteractor<I, O> {

    private final CircuitBreaker circuitBreaker;
    private final RetryPolicy retryPolicy;

    @Override
    protected O doExecute(I input) throws UseCaseException {
        return circuitBreaker.execute(() -> retryPolicy.execute(() -> {
            try {
                return performUseCaseLogic(input);
            } catch (ExternalServiceException e) {
                // Log and convert to domain exception
                logger.warn("External service error: {}", e.getMessage());
                throw new UseCaseException("External service temporarily unavailable", e);
            } catch (DomainException e) {
                // Re-throw domain exceptions as-is
                throw e;
            } catch (Exception e) {
                // Wrap unexpected exceptions
                logger.error("Unexpected error in use case", e);
                throw new UseCaseException("An unexpected error occurred", e);
            }
        }));
    }

    protected abstract O performUseCaseLogic(I input) throws Exception;
}
```

#### Use Meaningful Input/Output Objects
```java
// Good: Rich input/output objects
public class CreateOrderInput implements UseCaseInput {
    private final String customerId;
    private final List<OrderItemInput> items;
    private final Address shippingAddress;
    private final String paymentMethodId;

    // Constructor, getters, validation
}

public class CreateOrderOutput implements UseCaseOutput {
    private final String orderId;
    private final Money total;
    private final OrderStatus status;
    private final LocalDateTime createdAt;

    // Constructor, getters
}

// Bad: Primitive parameters
public class CreateOrderUseCase extends BaseUseCaseInteractor<String, String> {
    // Using primitives loses type safety and context
}
```

## Testing Use Case Interactors

### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
public class CreateOrderUseCaseTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private PricingService pricingService;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private EventPublisher eventPublisher;

    private CreateOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new CreateOrderUseCase(
            orderRepository, customerRepository, productRepository,
            pricingService, inventoryService, eventPublisher
        );
    }

    @Test
    void shouldCreateOrderSuccessfully() {
        // Arrange
        String customerId = "customer-1";
        Customer customer = new Customer(customerId, "John", "Doe", "john@example.com");
        customer.setActive(true);

        String productId = "product-1";
        Product product = new Product(productId, "Test Product", new Money("50.00"));

        OrderItemInput itemInput = new OrderItemInput(productId, 2);
        CreateOrderInput input = new CreateOrderInput(customerId, List.of(itemInput));

        Order savedOrder = new Order(customerId, LocalDateTime.now());
        savedOrder.setId("order-1");

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(inventoryService.isAvailable(productId, 2)).thenReturn(true);
        when(pricingService.calculatePrice(product, 2, customer)).thenReturn(new Money("100.00"));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        // Act
        CreateOrderOutput output = useCase.execute(input);

        // Assert
        assertEquals("order-1", output.getOrderId());
        assertEquals(new Money("100.00"), output.getTotal());

        verify(orderRepository).save(any(Order.class));
        verify(inventoryService).reserveInventory(savedOrder);
        verify(eventPublisher).publish(any(OrderCreatedEvent.class));
    }

    @Test
    void shouldThrowValidationExceptionForInvalidInput() {
        // Arrange
        CreateOrderInput input = new CreateOrderInput(null, List.of());

        // Act & Assert
        ValidationException exception = assertThrows(ValidationException.class, () ->
            useCase.execute(input)
        );

        assertTrue(exception.getValidationErrors().contains("Customer ID is required"));
        assertTrue(exception.getValidationErrors().contains("Order must contain at least one item"));
    }

    @Test
    void shouldThrowUseCaseExceptionForInactiveCustomer() {
        // Arrange
        String customerId = "customer-1";
        Customer inactiveCustomer = new Customer(customerId, "John", "Doe", "john@example.com");
        inactiveCustomer.setActive(false);

        CreateOrderInput input = new CreateOrderInput(customerId,
            List.of(new OrderItemInput("product-1", 1)));

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(inactiveCustomer));

        // Act & Assert
        UseCaseException exception = assertThrows(UseCaseException.class, () ->
            useCase.execute(input)
        );

        assertTrue(exception.getMessage().contains("Customer is not active"));
    }
}
```

### Integration Testing
```java
@SpringBootTest
@Sql(scripts = "/test-data.sql")
public class CreateOrderUseCaseIntegrationTest {

    @Autowired
    private CreateOrderUseCase createOrderUseCase;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    void shouldCreateOrderAndPersistToDatabase() {
        // Arrange
        String customerId = "test-customer";
        CreateOrderInput input = new CreateOrderInput(customerId,
            List.of(new OrderItemInput("test-product", 2)));

        // Act
        CreateOrderOutput output = createOrderUseCase.execute(input);

        // Assert
        assertNotNull(output.getOrderId());
        assertNotNull(output.getTotal());

        // Verify persistence
        Optional<Order> savedOrder = orderRepository.findById(output.getOrderId());
        assertTrue(savedOrder.isPresent());
        assertEquals(customerId, savedOrder.get().getCustomerId());
        assertEquals(1, savedOrder.get().getItems().size());
    }

    @Test
    void shouldHandleConcurrentOrderCreation() throws InterruptedException {
        // Arrange
        String customerId = "test-customer";
        CreateOrderInput input = new CreateOrderInput(customerId,
            List.of(new OrderItemInput("limited-stock-product", 1)));

        ExecutorService executor = Executors.newFixedThreadPool(5);
        List<CompletableFuture<CreateOrderOutput>> futures = new ArrayList<>();

        // Act - Submit multiple concurrent requests
        for (int i = 0; i < 5; i++) {
            CompletableFuture<CreateOrderOutput> future = CompletableFuture.supplyAsync(() ->
                createOrderUseCase.execute(input), executor
            );
            futures.add(future);
        }

        // Assert - Some should succeed, some should fail due to inventory constraints
        List<CreateOrderOutput> results = futures.stream()
            .map(future -> {
                try {
                    return future.join();
                } catch (CompletionException e) {
                    if (e.getCause() instanceof UseCaseException) {
                        return null; // Expected failure
                    }
                    throw e;
                }
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        assertTrue(results.size() >= 1); // At least one should succeed
        assertTrue(results.size() < 5);  // Not all should succeed due to limited stock

        executor.shutdown();
    }
}
```

## Tools and Technologies

### Application Frameworks
- **Spring Framework**: Dependency injection and transaction management
- **Micronaut**: Lightweight framework with compile-time DI
- **Quarkus**: Kubernetes-native framework with fast startup
- **Helidon**: Oracle's microframework for microservices

### Testing Frameworks
- **JUnit 5**: Unit testing framework
- **Testcontainers**: Integration testing with containers
- **Mockito**: Mocking framework for unit tests
- **Spring Boot Test**: Spring application testing support

### Resilience Patterns
- **Hystrix**: Circuit breaker pattern implementation
- **Resilience4j**: Fault tolerance library
- **Failsafe**: Failure handling and recovery

### Event-Driven Architecture
- **Spring Events**: Application event publishing
- **Axon Framework**: CQRS and Event Sourcing
- **Eventuate**: Event-driven microservices platform

## References

- [Clean Architecture: A Craftsman's Guide to Software Structure and Design](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) - Robert C. Martin
- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) - Vaughn Vernon
- [Patterns of Enterprise Application Architecture](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420) - Martin Fowler
- [Spring Framework Documentation](https://spring.io/projects/spring-framework)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)