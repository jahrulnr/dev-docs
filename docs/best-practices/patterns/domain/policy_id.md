# Pola Policy

## Gambaran Umum

Pola Policy mengenkapsulasi logika keputusan bisnis (aturan atau kebijakan) yang dapat dikonfigurasi dan diuji terpisah dari entitas domain. Pendekatan ini mempromosikan pemisahan tanggung jawab dan membuat aturan bisnis lebih mudah dipelihara dan disesuaikan dengan persyaratan yang berubah.

Pola Policy menyediakan cara untuk mengeksternalisasi aturan bisnis dari objek domain, membuatnya dapat dikonfigurasi, dapat diuji, dan dapat digunakan kembali. Policy bertindak sebagai komponen pengambilan keputusan yang dapat dikombinasikan dan diterapkan di berbagai konteks di seluruh aplikasi.

## Konsep Inti

### Policy vs Aturan Bisnis

#### Karakteristik Policy
- **Dapat Dikonfigurasi**: Dapat dimodifikasi tanpa perubahan kode
- **Dapat Diuji**: Pengujian unit terisolasi dari logika bisnis
- **Dapat Digunakan Ulang**: Diterapkan di berbagai konteks domain
- **Dapat Dikomposisi**: Dapat dikombinasikan dengan policy lain

#### Jenis Policy
- **Decision Policies**: Membuat keputusan ya/tidak (misalnya, policy persetujuan)
- **Calculation Policies**: Menghitung nilai (misalnya, policy harga, diskon)
- **Validation Policies**: Memeriksa batasan dan aturan
- **Transformation Policies**: Mengkonversi atau memodifikasi data

### Komponen Arsitektur

#### Interface Policy
```java
public interface Policy<T, R> {
    R apply(T context);
    boolean isApplicable(T context);
    String getName();
}

public interface DecisionPolicy<T> extends Policy<T, Boolean> {
    default R apply(T context) {
        return isApplicable(context);
    }
}

public interface CalculationPolicy<T, R extends Number> extends Policy<T, R> {
    // Khusus untuk perhitungan numerik
}
```

#### Policy Context
```java
public class PolicyContext<T> {
    private final T data;
    private final Map<String, Object> metadata;
    private final LocalDateTime evaluationTime;

    public PolicyContext(T data) {
        this.data = data;
        this.metadata = new HashMap<>();
        this.evaluationTime = LocalDateTime.now();
    }

    public PolicyContext(T data, Map<String, Object> metadata) {
        this.data = data;
        this.metadata = new HashMap<>(metadata);
        this.evaluationTime = LocalDateTime.now();
    }

    // Getters and fluent API for metadata
    public T getData() { return data; }

    @SuppressWarnings("unchecked")
    public <V> V getMetadata(String key) {
        return (V) metadata.get(key);
    }

    public PolicyContext<T> withMetadata(String key, Object value) {
        metadata.put(key, value);
        return this;
    }
}
```

#### Policy Engine
```java
public class PolicyEngine {
    private final List<Policy<?, ?>> policies;
    private final PolicyEvaluationStrategy strategy;

    public PolicyEngine() {
        this.policies = new ArrayList<>();
        this.strategy = new DefaultPolicyEvaluationStrategy();
    }

    public <T, R> R evaluate(Policy<T, R> policy, T context) {
        return strategy.evaluate(policy, context);
    }

    public <T, R> List<R> evaluateAll(List<Policy<T, R>> policies, T context) {
        return policies.stream()
            .filter(policy -> policy.isApplicable(context))
            .map(policy -> evaluate(policy, context))
            .collect(Collectors.toList());
    }

    public void registerPolicy(Policy<?, ?> policy) {
        policies.add(policy);
    }

    public void unregisterPolicy(Policy<?, ?> policy) {
        policies.remove(policy);
    }
}
```

## Pola Implementasi

### Decision Policies

#### Approval Policy
```java
public class OrderApprovalPolicy implements DecisionPolicy<Order> {
    private final BigDecimal approvalThreshold;
    private final Set<String> restrictedProducts;

    public OrderApprovalPolicy(BigDecimal approvalThreshold, Set<String> restrictedProducts) {
        this.approvalThreshold = approvalThreshold;
        this.restrictedProducts = restrictedProducts;
    }

    @Override
    public boolean isApplicable(Order order) {
        return order.getTotal().compareTo(approvalThreshold) >= 0 ||
               order.getItems().stream()
                   .anyMatch(item -> restrictedProducts.contains(item.getProductId()));
    }

    @Override
    public String getName() {
        return "OrderApprovalPolicy";
    }
}
```

#### Customer Eligibility Policy
```java
public class PremiumCustomerEligibilityPolicy implements DecisionPolicy<Customer> {
    private final int minimumOrderCount;
    private final BigDecimal minimumTotalSpent;
    private final int minimumAccountAgeDays;

    public PremiumCustomerEligibilityPolicy(int minimumOrderCount,
                                          BigDecimal minimumTotalSpent,
                                          int minimumAccountAgeDays) {
        this.minimumOrderCount = minimumOrderCount;
        this.minimumTotalSpent = minimumTotalSpent;
        this.minimumAccountAgeDays = minimumAccountAgeDays;
    }

    @Override
    public boolean isApplicable(Customer customer) {
        return customer.getOrderCount() >= minimumOrderCount &&
               customer.getTotalSpent().compareTo(minimumTotalSpent) >= 0 &&
               customer.getAccountAgeDays() >= minimumAccountAgeDays;
    }

    @Override
    public String getName() {
        return "PremiumCustomerEligibilityPolicy";
    }
}
```

### Calculation Policies

#### Pricing Policy
```java
public class VolumeDiscountPricingPolicy implements CalculationPolicy<Order, BigDecimal> {
    private final List<DiscountTier> discountTiers;

    public VolumeDiscountPricingPolicy(List<DiscountTier> discountTiers) {
        this.discountTiers = discountTiers;
    }

    @Override
    public BigDecimal apply(Order order) {
        BigDecimal total = order.getTotal();
        BigDecimal discount = BigDecimal.ZERO;

        for (DiscountTier tier : discountTiers) {
            if (total.compareTo(tier.getThreshold()) >= 0) {
                discount = total.multiply(tier.getDiscountRate());
                break;
            }
        }

        return total.subtract(discount);
    }

    @Override
    public boolean isApplicable(Order order) {
        return order.getItems().stream().mapToInt(OrderItem::getQuantity).sum() > 1;
    }

    @Override
    public String getName() {
        return "VolumeDiscountPricingPolicy";
    }

    public static class DiscountTier {
        private final BigDecimal threshold;
        private final BigDecimal discountRate;

        public DiscountTier(BigDecimal threshold, BigDecimal discountRate) {
            this.threshold = threshold;
            this.discountRate = discountRate;
        }

        // Getters
        public BigDecimal getThreshold() { return threshold; }
        public BigDecimal getDiscountRate() { return discountRate; }
    }
}
```

#### Shipping Cost Policy
```java
public class ShippingCostPolicy implements CalculationPolicy<Order, BigDecimal> {
    private final Map<String, BigDecimal> regionRates;
    private final BigDecimal weightRate;
    private final BigDecimal freeShippingThreshold;

    public ShippingCostPolicy(Map<String, BigDecimal> regionRates,
                            BigDecimal weightRate,
                            BigDecimal freeShippingThreshold) {
        this.regionRates = regionRates;
        this.weightRate = weightRate;
        this.freeShippingThreshold = freeShippingThreshold;
    }

    @Override
    public BigDecimal apply(Order order) {
        if (order.getTotal().compareTo(freeShippingThreshold) >= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal baseRate = regionRates.getOrDefault(order.getShippingRegion(), BigDecimal.ZERO);
        BigDecimal weightCost = order.getTotalWeight().multiply(weightRate);

        return baseRate.add(weightCost);
    }

    @Override
    public boolean isApplicable(Order order) {
        return order.getShippingRegion() != null;
    }

    @Override
    public String getName() {
        return "ShippingCostPolicy";
    }
}
```

### Validation Policies

#### Order Validation Policy
```java
public class OrderValidationPolicy implements DecisionPolicy<Order> {
    private final List<OrderValidationRule> rules;

    public OrderValidationPolicy(List<OrderValidationRule> rules) {
        this.rules = rules;
    }

    @Override
    public boolean isApplicable(Order order) {
        return rules.stream().allMatch(rule -> rule.validate(order));
    }

    @Override
    public String getName() {
        return "OrderValidationPolicy";
    }

    public interface OrderValidationRule {
        boolean validate(Order order);
        String getErrorMessage();
    }

    public static class MinimumOrderAmountRule implements OrderValidationRule {
        private final BigDecimal minimumAmount;

        public MinimumOrderAmountRule(BigDecimal minimumAmount) {
            this.minimumAmount = minimumAmount;
        }

        @Override
        public boolean validate(Order order) {
            return order.getTotal().compareTo(minimumAmount) >= 0;
        }

        @Override
        public String getErrorMessage() {
            return "Total pesanan harus minimal " + minimumAmount;
        }
    }

    public static class StockAvailabilityRule implements OrderValidationRule {
        private final InventoryService inventoryService;

        public StockAvailabilityRule(InventoryService inventoryService) {
            this.inventoryService = inventoryService;
        }

        @Override
        public boolean validate(Order order) {
            return order.getItems().stream()
                .allMatch(item -> inventoryService.isAvailable(item.getProductId(), item.getQuantity()));
        }

        @Override
        public String getErrorMessage() {
            return "Beberapa item tidak tersedia dalam jumlah yang diminta";
        }
    }
}
```

### Composite Policies

#### Policy Composition
```java
public class CompositePolicy<T, R> implements Policy<T, R> {
    private final List<Policy<T, R>> policies;
    private final PolicyCompositionStrategy<T, R> strategy;

    public CompositePolicy(List<Policy<T, R>> policies, PolicyCompositionStrategy<T, R> strategy) {
        this.policies = new ArrayList<>(policies);
        this.strategy = strategy;
    }

    @Override
    public R apply(T context) {
        return strategy.compose(policies, context);
    }

    @Override
    public boolean isApplicable(T context) {
        return policies.stream().anyMatch(policy -> policy.isApplicable(context));
    }

    @Override
    public String getName() {
        return "CompositePolicy[" +
               policies.stream().map(Policy::getName).collect(Collectors.joining(", ")) +
               "]";
    }

    public interface PolicyCompositionStrategy<T, R> {
        R compose(List<Policy<T, R>> policies, T context);
    }

    public static class FirstApplicableStrategy<T, R> implements PolicyCompositionStrategy<T, R> {
        @Override
        public R compose(List<Policy<T, R>> policies, T context) {
            return policies.stream()
                .filter(policy -> policy.isApplicable(context))
                .findFirst()
                .map(policy -> policy.apply(context))
                .orElse(null);
        }
    }

    public static class AllApplicableStrategy<T, R> implements PolicyCompositionStrategy<T, R> {
        @Override
        public R compose(List<Policy<T, R>> policies, T context) {
            return policies.stream()
                .filter(policy -> policy.isApplicable(context))
                .map(policy -> policy.apply(context))
                .reduce(null, (a, b) -> b); // Return last result
        }
    }
}
```

## Integrasi Aplikasi

### Domain Service dengan Policies

#### Order Processing Service
```java
@Service
public class OrderProcessingService {
    private final PolicyEngine policyEngine;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public OrderProcessingService(PolicyEngine policyEngine,
                                OrderRepository orderRepository,
                                PaymentService paymentService,
                                NotificationService notificationService) {
        this.policyEngine = policyEngine;
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Order processOrder(OrderRequest request) {
        // Create order from request
        Order order = createOrderFromRequest(request);

        // Apply validation policies
        OrderValidationPolicy validationPolicy = getValidationPolicy();
        if (!policyEngine.evaluate(validationPolicy, order)) {
            throw new OrderValidationException("Validasi pesanan gagal");
        }

        // Apply pricing policies
        VolumeDiscountPricingPolicy pricingPolicy = getPricingPolicy();
        BigDecimal finalPrice = policyEngine.evaluate(pricingPolicy, order);
        order.setFinalPrice(finalPrice);

        // Apply shipping policies
        ShippingCostPolicy shippingPolicy = getShippingPolicy();
        BigDecimal shippingCost = policyEngine.evaluate(shippingPolicy, order);
        order.setShippingCost(shippingCost);

        // Check approval policies
        OrderApprovalPolicy approvalPolicy = getApprovalPolicy();
        if (policyEngine.evaluate(approvalPolicy, order)) {
            order.setStatus(OrderStatus.PENDING_APPROVAL);
        } else {
            order.setStatus(OrderStatus.APPROVED);
        }

        // Process payment if auto-approved
        if (order.getStatus() == OrderStatus.APPROVED) {
            PaymentResult payment = paymentService.processPayment(order);
            if (payment.isSuccessful()) {
                order.setStatus(OrderStatus.PAID);
                notificationService.sendOrderConfirmation(order);
            } else {
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                throw new PaymentProcessingException("Pembayaran gagal");
            }
        }

        return orderRepository.save(order);
    }

    private OrderValidationPolicy getValidationPolicy() {
        List<OrderValidationPolicy.OrderValidationRule> rules = Arrays.asList(
            new OrderValidationPolicy.MinimumOrderAmountRule(new BigDecimal("10.00")),
            new OrderValidationPolicy.StockAvailabilityRule(inventoryService)
        );
        return new OrderValidationPolicy(rules);
    }

    private VolumeDiscountPricingPolicy getPricingPolicy() {
        List<VolumeDiscountPricingPolicy.DiscountTier> tiers = Arrays.asList(
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("100.00"), new BigDecimal("0.05")),
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("50.00"), new BigDecimal("0.02"))
        );
        return new VolumeDiscountPricingPolicy(tiers);
    }

    private ShippingCostPolicy getShippingPolicy() {
        Map<String, BigDecimal> regionRates = Map.of(
            "US", new BigDecimal("5.99"),
            "EU", new BigDecimal("12.99"),
            "ASIA", new BigDecimal("15.99")
        );
        return new ShippingCostPolicy(regionRates, new BigDecimal("0.50"), new BigDecimal("75.00"));
    }

    private OrderApprovalPolicy getApprovalPolicy() {
        return new OrderApprovalPolicy(
            new BigDecimal("500.00"),
            Set.of("RESTRICTED_ITEM_1", "RESTRICTED_ITEM_2")
        );
    }
}
```

### Konfigurasi Policy

#### Configuration-Based Policies
```java
@Configuration
public class PolicyConfiguration {

    @Bean
    public PolicyEngine policyEngine() {
        PolicyEngine engine = new PolicyEngine();

        // Register decision policies
        engine.registerPolicy(new OrderApprovalPolicy(
            new BigDecimal("500.00"),
            Set.of("premium-item-1", "premium-item-2")
        ));

        engine.registerPolicy(new PremiumCustomerEligibilityPolicy(5, new BigDecimal("200.00"), 30));

        // Register calculation policies
        engine.registerPolicy(new VolumeDiscountPricingPolicy(createDiscountTiers()));

        return engine;
    }

    @Bean
    @ConfigurationProperties(prefix = "app.policies.discount")
    public List<VolumeDiscountPricingPolicy.DiscountTier> discountTiers() {
        return createDiscountTiers();
    }

    private List<VolumeDiscountPricingPolicy.DiscountTier> createDiscountTiers() {
        return Arrays.asList(
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("1000.00"), new BigDecimal("0.10")),
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("500.00"), new BigDecimal("0.07")),
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("200.00"), new BigDecimal("0.05")),
            new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("100.00"), new BigDecimal("0.02"))
        );
    }
}
```

#### Database-Backed Policies
```java
@Repository
public class PolicyRepository {
    private final JdbcTemplate jdbcTemplate;

    public PolicyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DiscountRule> findActiveDiscountRules() {
        return jdbcTemplate.query(
            "SELECT threshold, discount_rate FROM discount_rules WHERE active = true ORDER BY threshold DESC",
            (rs, rowNum) -> new DiscountRule(
                rs.getBigDecimal("threshold"),
                rs.getBigDecimal("discount_rate")
            )
        );
    }

    public ApprovalThreshold findApprovalThreshold(String category) {
        return jdbcTemplate.queryForObject(
            "SELECT category, amount_threshold, requires_approval FROM approval_thresholds WHERE category = ?",
            (rs, rowNum) -> new ApprovalThreshold(
                rs.getString("category"),
                rs.getBigDecimal("amount_threshold"),
                rs.getBoolean("requires_approval")
            ),
            category
        );
    }
}

@Service
public class DynamicPolicyFactory {
    private final PolicyRepository policyRepository;

    public DynamicPolicyFactory(PolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    public VolumeDiscountPricingPolicy createPricingPolicy() {
        List<DiscountRule> rules = policyRepository.findActiveDiscountRules();
        List<VolumeDiscountPricingPolicy.DiscountTier> tiers = rules.stream()
            .map(rule -> new VolumeDiscountPricingPolicy.DiscountTier(rule.getThreshold(), rule.getDiscountRate()))
            .collect(Collectors.toList());

        return new VolumeDiscountPricingPolicy(tiers);
    }

    public OrderApprovalPolicy createApprovalPolicy() {
        ApprovalThreshold threshold = policyRepository.findApprovalThreshold("DEFAULT");
        return new OrderApprovalPolicy(threshold.getAmountThreshold(), Set.of());
    }
}
```

## Praktik Terbaik

### Kapan Menggunakan Pola Policy

#### Skenario yang Cocok
- **Aturan Bisnis Berubah Sering**: Aturan dimodifikasi oleh pengguna bisnis
- **Logika Keputusan Kompleks**: Beberapa kondisi dan perhitungan
- **Kepatuhan Regulasi**: Aturan yang harus dapat diaudit dan dikonfigurasi
- **A/B Testing**: Policy berbeda untuk segmen pengguna berbeda
- **Aplikasi Multi-tenant**: Aturan berbeda per tenant

#### Kapan Menghindari
- **Logika Bisnis Sederhana**: Pernyataan if-then-else yang langsung
- **Kritis Performa**: Overhead evaluasi policy tidak dapat diterima
- **Aturan Statis**: Aturan yang tidak pernah berubah dan sudah dipahami dengan baik
- **Domain Logic**: Invarian bisnis inti yang tidak boleh dikonfigurasi

### Panduan Implementasi

#### Jaga Policy Tetap Fokus
```java
// Good: Single responsibility
public class AgeVerificationPolicy implements DecisionPolicy<Customer> {
    private final int minimumAge;

    @Override
    public boolean isApplicable(Customer customer) {
        return customer.getAge() != null;
    }

    @Override
    public String getName() {
        return "AgeVerificationPolicy";
    }
}

// Bad: Multiple responsibilities
public class CustomerValidationPolicy implements DecisionPolicy<Customer> {
    @Override
    public boolean isApplicable(Customer customer) {
        // Age check
        if (customer.getAge() < 18) return false;

        // Email validation
        if (!customer.getEmail().contains("@")) return false;

        // Address validation
        if (customer.getAddress() == null) return false;

        return true;
    }
}
```

#### Buat Policy Dapat Dikonfigurasi
```java
public class ConfigurableDiscountPolicy implements CalculationPolicy<Order, BigDecimal> {
    private final PolicyConfiguration config;

    public ConfigurableDiscountPolicy(PolicyConfiguration config) {
        this.config = config;
    }

    @Override
    public BigDecimal apply(Order order) {
        BigDecimal discount = BigDecimal.ZERO;

        if (config.isVolumeDiscountEnabled() &&
            order.getItemCount() >= config.getVolumeDiscountThreshold()) {
            discount = order.getTotal().multiply(config.getVolumeDiscountRate());
        }

        if (config.isLoyaltyDiscountEnabled() &&
            order.getCustomer().isLoyaltyMember()) {
            discount = discount.add(order.getTotal().multiply(config.getLoyaltyDiscountRate()));
        }

        return order.getTotal().subtract(discount.min(order.getTotal()));
    }

    @Override
    public boolean isApplicable(Order order) {
        return config.isDiscountEnabled();
    }

    @Override
    public String getName() {
        return "ConfigurableDiscountPolicy";
    }
}
```

#### Tangani Kegagalan Policy dengan Baik
```java
public class ResilientPolicyEngine extends PolicyEngine {
    private static final Logger logger = LoggerFactory.getLogger(ResilientPolicyEngine.class);

    @Override
    public <T, R> R evaluate(Policy<T, R> policy, T context) {
        try {
            if (!policy.isApplicable(context)) {
                logger.debug("Policy {} tidak berlaku untuk konteks", policy.getName());
                return getDefaultValue(policy);
            }

            long startTime = System.nanoTime();
            R result = super.evaluate(policy, context);
            long duration = System.nanoTime() - startTime;

            logger.debug("Policy {} dievaluasi dalam {} ns", policy.getName(), duration);

            return result;

        } catch (Exception e) {
            logger.error("Evaluasi policy {} gagal", policy.getName(), e);
            return getFallbackValue(policy, e);
        }
    }

    @SuppressWarnings("unchecked")
    private <T, R> R getDefaultValue(Policy<T, R> policy) {
        if (policy instanceof DecisionPolicy) {
            return (R) Boolean.FALSE;
        }
        if (policy instanceof CalculationPolicy) {
            return (R) BigDecimal.ZERO;
        }
        return null;
    }

    private <T, R> R getFallbackValue(Policy<T, R> policy, Exception e) {
        // Could implement circuit breaker pattern here
        return getDefaultValue(policy);
    }
}
```

## Testing Policies

### Unit Testing
```java
@Test
public void shouldApplyVolumeDiscountWhenThresholdMet() {
    // Arrange
    List<VolumeDiscountPricingPolicy.DiscountTier> tiers = Arrays.asList(
        new VolumeDiscountPricingPolicy.DiscountTier(new BigDecimal("100.00"), new BigDecimal("0.10"))
    );
    VolumeDiscountPricingPolicy policy = new VolumeDiscountPricingPolicy(tiers);

    Order order = new Order();
    order.setTotal(new BigDecimal("150.00"));
    order.setItems(Arrays.asList(
        new OrderItem("item1", 2, new BigDecimal("75.00"))
    ));

    // Act
    BigDecimal result = policy.apply(order);

    // Assert
    assertEquals(new BigDecimal("135.00"), result); // 150 - 10% discount
    assertTrue(policy.isApplicable(order));
}

@Test
public void shouldNotApplyDiscountForSingleItemOrder() {
    // Arrange
    VolumeDiscountPricingPolicy policy = new VolumeDiscountPricingPolicy(Arrays.asList());
    Order order = new Order();
    order.setTotal(new BigDecimal("50.00"));
    order.setItems(Arrays.asList(
        new OrderItem("item1", 1, new BigDecimal("50.00"))
    ));

    // Act & Assert
    assertFalse(policy.isApplicable(order));
}

@Test
public void shouldRequireApprovalForHighValueOrders() {
    // Arrange
    OrderApprovalPolicy policy = new OrderApprovalPolicy(new BigDecimal("500.00"), Set.of());
    Order order = new Order();
    order.setTotal(new BigDecimal("600.00"));

    // Act & Assert
    assertTrue(policy.isApplicable(order));
}

@Test
public void shouldRequireApprovalForRestrictedItems() {
    // Arrange
    OrderApprovalPolicy policy = new OrderApprovalPolicy(
        new BigDecimal("1000.00"),
        Set.of("restricted-item")
    );
    Order order = new Order();
    order.setTotal(new BigDecimal("100.00"));
    order.setItems(Arrays.asList(
        new OrderItem("restricted-item", 1, new BigDecimal("100.00"))
    ));

    // Act & Assert
    assertTrue(policy.isApplicable(order));
}
```

### Integration Testing
```java
@SpringBootTest
public class PolicyIntegrationTest {

    @Autowired
    private PolicyEngine policyEngine;

    @Autowired
    private OrderProcessingService orderProcessingService;

    @Test
    public void shouldApplyAllPoliciesInOrderProcessing() {
        // Arrange
        OrderRequest request = createValidOrderRequest();

        // Act
        Order processedOrder = orderProcessingService.processOrder(request);

        // Assert
        assertNotNull(processedOrder.getId());
        assertNotNull(processedOrder.getFinalPrice());
        assertNotNull(processedOrder.getShippingCost());
        assertNotEquals(OrderStatus.PENDING_APPROVAL, processedOrder.getStatus());
    }

    @Test
    public void shouldRejectInvalidOrder() {
        // Arrange
        OrderRequest request = createInvalidOrderRequest(); // Below minimum amount

        // Act & Assert
        assertThrows(OrderValidationException.class, () ->
            orderProcessingService.processOrder(request)
        );
    }

    @Test
    public void shouldApplyVolumeDiscountForBulkOrders() {
        // Arrange
        OrderRequest request = createBulkOrderRequest(); // Multiple items

        // Act
        Order processedOrder = orderProcessingService.processOrder(request);

        // Assert
        BigDecimal expectedDiscount = processedOrder.getTotal()
            .multiply(new BigDecimal("0.05")); // 5% discount
        assertEquals(
            processedOrder.getTotal().subtract(expectedDiscount),
            processedOrder.getFinalPrice()
        );
    }

    private OrderRequest createValidOrderRequest() {
        OrderRequest request = new OrderRequest();
        request.setCustomerId("customer-1");
        request.setItems(Arrays.asList(
            new OrderItemRequest("item-1", 2, new BigDecimal("25.00"))
        ));
        return request;
    }

    private OrderRequest createInvalidOrderRequest() {
        OrderRequest request = new OrderRequest();
        request.setCustomerId("customer-1");
        request.setItems(Arrays.asList(
            new OrderItemRequest("item-1", 1, new BigDecimal("5.00")) // Below minimum
        ));
        return request;
    }

    private OrderRequest createBulkOrderRequest() {
        OrderRequest request = new OrderRequest();
        request.setCustomerId("customer-1");
        request.setItems(Arrays.asList(
            new OrderItemRequest("item-1", 5, new BigDecimal("20.00")),
            new OrderItemRequest("item-2", 3, new BigDecimal("15.00"))
        ));
        return request;
    }
}
```

## Alat dan Teknologi

### Framework Policy
- **Drools**: Sistem manajemen aturan bisnis
- **Easy Rules**: Mesin aturan Java sederhana
- **OpenL Tablets**: Aturan bisnis dan tabel keputusan
- **Activiti DMN**: Mesin Decision Model and Notation

### Manajemen Konfigurasi
- **Spring Cloud Config**: Konfigurasi eksternal
- **Consul**: Penemuan layanan dan konfigurasi
- **Apache ZooKeeper**: Penyimpanan konfigurasi terdistribusi
- **etcd**: Penyimpanan key-value terdistribusi untuk konfigurasi

### Monitoring dan Observability
- **Micrometer**: Fasade metrik aplikasi
- **Prometheus**: Toolkit monitoring dan alerting
- **Grafana**: Dashboard analitik dan monitoring
- **ELK Stack**: Elasticsearch, Logstash, Kibana untuk logging

### Framework Testing
- **JUnit 5**: Framework pengujian unit
- **Testcontainers**: Pengujian integrasi dengan container
- **WireMock**: API mocking untuk testing
- **Cucumber**: Behavior-driven development testing

## Referensi

- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) - Vaughn Vernon
- [Policy Pattern](https://martinfowler.com/bliki/PolicyObject.html) - Martin Fowler
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Robert C. Martin
- [Spring Framework Documentation](https://spring.io/projects/spring-framework)
- [Drools Documentation](https://drools.org/)