# Pola Use Case Interactor

## Gambaran Umum

Pola Use Case Interactor (juga dikenal sebagai Application Services atau Use Case Handlers) mengoordinasikan workflow tingkat aplikasi dengan mengatur objek domain, repository, dan layanan eksternal untuk memenuhi use case bisnis tertentu. Interactor ini bertindak sebagai titik masuk untuk logika aplikasi, memastikan pemisahan yang bersih antara lapisan presentasi, domain, dan infrastruktur.

Use Case Interactor mengenkapsulasi alur dari satu use case, mengoordinasikan objek domain sambil menjaga model domain fokus pada aturan bisnis dan invarian. Pola ini mempromosikan prinsip clean architecture dan membuat logika aplikasi lebih mudah diuji dan dipelihara.

## Konsep Inti

### Use Case vs Application Service

#### Karakteristik Use Case
- **Tanggung Jawab Tunggal**: Setiap interactor menangani satu use case
- **Fokus Orkestrasi**: Mengkoordinasikan objek dan layanan domain
- **Batas Transaksi**: Mendefinisikan cakupan transaksional
- **Port Input/Output**: Interface yang jelas untuk input dan output
- **Independensi Domain**: Tidak mengandung aturan bisnis domain

#### Jenis Use Case Interactor
- **Command Interactors**: Menangani operasi tulis (create, update, delete)
- **Query Interactors**: Menangani operasi baca dengan logika kompleks
- **Saga Interactors**: Mengoordinasikan proses bisnis multi-langkah
- **Event Interactors**: Menangani domain events dan efek samping

### Komponen Arsitektur

#### Interface Use Case
```java
public interface UseCase<I extends UseCaseInput, O extends UseCaseOutput> {
    O execute(I input) throws UseCaseException;
}

public interface UseCaseInput {
    // Marker interface untuk data input
}

public interface UseCaseOutput {
    // Marker interface untuk data output
}
```

#### Implementasi Base Interactor
```java
public abstract class BaseUseCaseInteractor<I extends UseCaseInput, O extends UseCaseOutput>
        implements UseCase<I, O> {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    public O execute(I input) throws UseCaseException {
        try {
            validateInput(input);
            logger.debug("Menjalankan use case: {}", getClass().getSimpleName());

            O output = doExecute(input);

            logger.debug("Use case berhasil dijalankan: {}", getClass().getSimpleName());
            return output;

        } catch (DomainException e) {
            logger.warn("Kesalahan domain di use case {}: {}", getClass().getSimpleName(), e.getMessage());
            throw new UseCaseException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Kesalahan tak terduga di use case {}", getClass().getSimpleName(), e);
            throw new UseCaseException("Terjadi kesalahan tak terduga", e);
        }
    }

    protected abstract void validateInput(I input) throws ValidationException;
    protected abstract O doExecute(I input) throws UseCaseException;
}
```

#### Hierarki Exception Use Case
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
        super("Validasi gagal: " + String.join(", ", validationErrors));
        this.validationErrors = new ArrayList<>(validationErrors);
    }

    public List<String> getValidationErrors() { return validationErrors; }
}

public class AuthorizationException extends UseCaseException {
    private final String requiredPermission;

    public AuthorizationException(String requiredPermission) {
        super("Otorisasi gagal. Izin yang diperlukan: " + requiredPermission);
        this.requiredPermission = requiredPermission;
    }

    public String getRequiredPermission() { return requiredPermission; }
}
```

## Pola Implementasi

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
            errors.add("Customer ID diperlukan");
        }

        if (input.getItems() == null || input.getItems().isEmpty()) {
            errors.add("Pesanan harus mengandung setidaknya satu item");
        } else {
            for (OrderItemInput item : input.getItems()) {
                if (item.getProductId() == null || item.getProductId().trim().isEmpty()) {
                    errors.add("Product ID diperlukan untuk semua item");
                }
                if (item.getQuantity() <= 0) {
                    errors.add("Quantity harus lebih besar dari nol untuk semua item");
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
            .orElseThrow(() -> new UseCaseException("Customer tidak ditemukan: " + input.getCustomerId()));

        // Validate customer status
        if (!customer.isActive()) {
            throw new UseCaseException("Customer tidak aktif: " + input.getCustomerId());
        }

        // Create order aggregate
        Order order = new Order(customer.getId(), LocalDateTime.now());

        // Add items to order
        for (OrderItemInput itemInput : input.getItems()) {
            Product product = productRepository.findById(itemInput.getProductId())
                .orElseThrow(() -> new UseCaseException("Product tidak ditemukan: " + itemInput.getProductId()));

            // Check inventory
            if (!inventoryService.isAvailable(product.getId(), itemInput.getQuantity())) {
                throw new UseCaseException("Stok tidak cukup untuk produk: " + product.getId());
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
            errors.add("Customer ID diperlukan");
        }

        if (input.getEmail() != null && !isValidEmail(input.getEmail())) {
            errors.add("Format email tidak valid");
        }

        if (input.getPhoneNumber() != null && !isValidPhoneNumber(input.getPhoneNumber())) {
            errors.add("Format nomor telepon tidak valid");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    @Override
    @Transactional
    protected UpdateCustomerProfileOutput doExecute(UpdateCustomerProfileInput input) throws UseCaseException {
        Customer customer = customerRepository.findById(input.getCustomerId())
            .orElseThrow(() -> new UseCaseException("Customer tidak ditemukan: " + input.getCustomerId()));

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
                throw new UseCaseException("Email sudah ada: " + input.getEmail());
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
            errors.add("Customer ID diperlukan");
        }

        if (input.getPageSize() != null && input.getPageSize() <= 0) {
            errors.add("Ukuran halaman harus lebih besar dari nol");
        }

        if (input.getPageNumber() != null && input.getPageNumber() < 0) {
            errors.add("Nomor halaman harus non-negatif");
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
            throw new UseCaseException("Customer tidak ditemukan: " + input.getCustomerId());
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
            throw new ValidationException(List.of("Order ID diperlukan"));
        }
    }

    @Override
    @Transactional
    protected FulfillOrderOutput doExecute(FulfillOrderInput input) throws UseCaseException {
        Order order = orderRepository.findById(input.getOrderId())
            .orElseThrow(() -> new UseCaseException("Order tidak ditemukan: " + input.getOrderId()));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new UseCaseException("Order harus dibayar sebelum fulfillment: " + input.getOrderId());
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
                throw new UseCaseException("Payment capture gagal: " + paymentResult.getErrorMessage());
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
            throw new UseCaseException("Order fulfillment gagal: " + e.getMessage(), e);
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
            logger.error("Kompensasi gagal untuk order {}", order.getId(), compensationException);
        }
    }
}
```

## Integrasi Aplikasi

### Integrasi Controller

#### REST Controller dengan Use Cases
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

### Konfigurasi Dependency Injection

#### Konfigurasi Use Case
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

## Praktik Terbaik

### Kapan Menggunakan Use Case Interactor

#### Skenario yang Cocok
- **Workflow Bisnis Kompleks**: Proses multi-langkah dengan beberapa objek domain
- **Batas Transaksi**: Operasi yang membutuhkan atomicity di seluruh aggregate
- **Cross-Cutting Concerns**: Logging, security, dan monitoring di tingkat aplikasi
- **Integrasi Sistem Eksternal**: Mengkoordinasikan dengan layanan eksternal
- **Orkestrasi Aturan Bisnis**: Menggabungkan beberapa domain services

#### Kapan Menghindari
- **Operasi CRUD Sederhana**: Panggilan repository langsung cukup
- **Operasi Single Aggregate**: Method domain dapat menangani langsung
- **Logika Presentasi**: Jaga interactor fokus pada logika bisnis
- **Concern Infrastruktur**: Gunakan adapter dan port untuk dependensi eksternal

### Panduan Implementasi

#### Jaga Interactor Tetap Fokus
```java
// Good: Tanggung jawab use case tunggal
public class CreateOrderUseCase extends BaseUseCaseInteractor<CreateOrderInput, CreateOrderOutput> {
    // Fokus pada workflow pembuatan order
}

// Bad: Multiple responsibilities
public class OrderManagementUseCase extends BaseUseCaseInteractor<OrderManagementInput, OrderManagementOutput> {
    // Menangani create, update, delete, query - terlalu luas
}
```

#### Tangani Error dengan Tepat
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
                logger.warn("Kesalahan layanan eksternal: {}", e.getMessage());
                throw new UseCaseException("Layanan eksternal sementara tidak tersedia", e);
            } catch (DomainException e) {
                // Re-throw domain exceptions as-is
                throw e;
            } catch (Exception e) {
                // Wrap unexpected exceptions
                logger.error("Kesalahan tak terduga di use case", e);
                throw new UseCaseException("Terjadi kesalahan tak terduga", e);
            }
        }));
    }

    protected abstract O performUseCaseLogic(I input) throws Exception;
}
```

#### Gunakan Objek Input/Output yang Bermakna
```java
// Good: Objek input/output yang kaya
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

// Bad: Parameter primitif
public class CreateOrderUseCase extends BaseUseCaseInteractor<String, String> {
    // Menggunakan primitif kehilangan type safety dan konteks
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

        assertTrue(exception.getValidationErrors().contains("Customer ID diperlukan"));
        assertTrue(exception.getValidationErrors().contains("Pesanan harus mengandung setidaknya satu item"));
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

        assertTrue(exception.getMessage().contains("Customer tidak aktif"));
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

## Alat dan Teknologi

### Application Frameworks
- **Spring Framework**: Dependency injection dan manajemen transaksi
- **Micronaut**: Framework ringan dengan DI compile-time
- **Quarkus**: Framework Kubernetes-native dengan startup cepat
- **Helidon**: Microframework Oracle untuk microservices

### Framework Testing
- **JUnit 5**: Framework pengujian unit
- **Testcontainers**: Pengujian integrasi dengan container
- **Mockito**: Framework mocking untuk unit tests
- **Spring Boot Test**: Dukungan pengujian aplikasi Spring

### Resilience Patterns
- **Hystrix**: Implementasi pola circuit breaker
- **Resilience4j**: Library fault tolerance
- **Failsafe**: Penanganan kegagalan dan recovery

### Event-Driven Architecture
- **Spring Events**: Penerbitan event aplikasi
- **Axon Framework**: CQRS dan Event Sourcing
- **Eventuate**: Platform microservices event-driven

## Referensi

- [Clean Architecture: A Craftsman's Guide to Software Structure and Design](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) - Robert C. Martin
- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) - Vaughn Vernon
- [Patterns of Enterprise Application Architecture](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420) - Martin Fowler
- [Spring Framework Documentation](https://spring.io/projects/spring-framework)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)