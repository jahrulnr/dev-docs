# Policy Pattern

## Overview

The Policy Pattern encapsulates business decision logic (rules or policies) that can be configured and tested independently from domain entities. This approach promotes separation of concerns and makes business rules more maintainable and adaptable to changing requirements.

The Policy pattern provides a way to externalize business rules from domain objects, making them configurable, testable, and reusable. Policies act as decision-making components that can be combined and applied in various contexts throughout the application.

## Core Concepts

### Policy vs Business Rules

#### Policy Characteristics
- **Configurable**: Can be modified without code changes
- **Testable**: Isolated unit testing of business logic
- **Reusable**: Applied across different domain contexts
- **Composable**: Can be combined with other policies

#### Types of Policies
- **Decision Policies**: Make yes/no decisions (e.g., approval policies)
- **Calculation Policies**: Compute values (e.g., pricing, discount policies)
- **Validation Policies**: Check constraints and rules
- **Transformation Policies**: Convert or modify data

### Architecture Components

#### Policy Interface
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
    // Specific to numeric calculations
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

## Implementation Patterns

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
            return "Order total must be at least " + minimumAmount;
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
            return "Some items are not available in the requested quantity";
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

## Application Integration

### Domain Service with Policies

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
            throw new OrderValidationException("Order validation failed");
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
                throw new PaymentProcessingException("Payment failed");
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

### Policy Configuration

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

## Best Practices

### When to Use Policy Pattern

#### Suitable Scenarios
- **Business Rules Change Frequently**: Rules modified by business users
- **Complex Decision Logic**: Multiple conditions and calculations
- **Regulatory Compliance**: Rules that must be auditable and configurable
- **A/B Testing**: Different policies for different user segments
- **Multi-tenant Applications**: Different rules per tenant

#### When to Avoid
- **Simple Business Logic**: Straightforward if-then-else statements
- **Performance Critical**: Policy evaluation overhead not acceptable
- **Static Rules**: Rules that never change and are well understood
- **Domain Logic**: Core business invariants that shouldn't be configurable

### Implementation Guidelines

#### Keep Policies Focused
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

#### Make Policies Configurable
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

#### Handle Policy Failures Gracefully
```java
public class ResilientPolicyEngine extends PolicyEngine {
    private static final Logger logger = LoggerFactory.getLogger(ResilientPolicyEngine.class);

    @Override
    public <T, R> R evaluate(Policy<T, R> policy, T context) {
        try {
            if (!policy.isApplicable(context)) {
                logger.debug("Policy {} not applicable for context", policy.getName());
                return getDefaultValue(policy);
            }

            long startTime = System.nanoTime();
            R result = super.evaluate(policy, context);
            long duration = System.nanoTime() - startTime;

            logger.debug("Policy {} evaluated in {} ns", policy.getName(), duration);

            return result;

        } catch (Exception e) {
            logger.error("Policy {} evaluation failed", policy.getName(), e);
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

## Tools and Technologies

### Policy Frameworks
- **Drools**: Business rules management system
- **Easy Rules**: Simple Java rules engine
- **OpenL Tablets**: Business rules and decision tables
- **Activiti DMN**: Decision Model and Notation engine

### Configuration Management
- **Spring Cloud Config**: Externalized configuration
- **Consul**: Service discovery and configuration
- **Apache ZooKeeper**: Distributed configuration store
- **etcd**: Distributed key-value store for configuration

### Monitoring and Observability
- **Micrometer**: Application metrics facade
- **Prometheus**: Monitoring and alerting toolkit
- **Grafana**: Analytics and monitoring dashboard
- **ELK Stack**: Elasticsearch, Logstash, Kibana for logging

### Testing Frameworks
- **JUnit 5**: Unit testing framework
- **Testcontainers**: Integration testing with containers
- **WireMock**: API mocking for testing
- **Cucumber**: Behavior-driven development testing

## References

- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) - Vaughn Vernon
- [Policy Pattern](https://martinfowler.com/bliki/PolicyObject.html) - Martin Fowler
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Robert C. Martin
- [Spring Framework Documentation](https://spring.io/projects/spring-framework)
- [Drools Documentation](https://drools.org/)