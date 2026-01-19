# Specification Pattern

## Overview

The Specification Pattern encapsulates business rules that can be combined using logical operators (AND, OR, NOT) and reused to query or validate domain objects. This pattern provides a flexible way to define and compose business criteria, making complex conditions more maintainable and testable.

The Specification Pattern allows domain experts to express business rules in a declarative manner, separating the logic for selecting objects from the objects themselves. This promotes cleaner domain models and enables sophisticated querying capabilities.

## Core Concepts

### Specification vs Query Objects

#### Characteristics of Specifications
- **Composable**: Can be combined with logical operators
- **Reusable**: Applied across different contexts
- **Testable**: Isolated business rule testing
- **Declarative**: Express intent clearly
- **Domain-focused**: Written in ubiquitous language

#### Types of Specifications
- **Selection Specifications**: Filter collections of objects
- **Validation Specifications**: Check if objects meet criteria
- **Query Specifications**: Build database queries dynamically
- **Composite Specifications**: Combine multiple specifications

### Architectural Components

#### Base Specification Interface
```java
public interface Specification<T> {
    boolean isSatisfiedBy(T candidate);
    Specification<T> and(Specification<T> other);
    Specification<T> or(Specification<T> other);
    Specification<T> not();
    String getDescription();
}

public abstract class AbstractSpecification<T> implements Specification<T> {

    @Override
    public Specification<T> and(Specification<T> other) {
        return new AndSpecification<>(this, other);
    }

    @Override
    public Specification<T> or(Specification<T> other) {
        return new OrSpecification<>(this, other);
    }

    @Override
    public Specification<T> not() {
        return new NotSpecification<>(this);
    }

    public abstract String getDescription();
}
```

#### Composite Specifications
```java
public class AndSpecification<T> extends AbstractSpecification<T> {
    private final Specification<T> left;
    private final Specification<T> right;

    public AndSpecification(Specification<T> left, Specification<T> right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public boolean isSatisfiedBy(T candidate) {
        return left.isSatisfiedBy(candidate) && right.isSatisfiedBy(candidate);
    }

    @Override
    public String getDescription() {
        return String.format("(%s AND %s)", left.getDescription(), right.getDescription());
    }
}

public class OrSpecification<T> extends AbstractSpecification<T> {
    private final Specification<T> left;
    private final Specification<T> right;

    public OrSpecification(Specification<T> left, Specification<T> right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public boolean isSatisfiedBy(T candidate) {
        return left.isSatisfiedBy(candidate) || right.isSatisfiedBy(candidate);
    }

    @Override
    public String getDescription() {
        return String.format("(%s OR %s)", left.getDescription(), right.getDescription());
    }
}

public class NotSpecification<T> extends AbstractSpecification<T> {
    private final Specification<T> spec;

    public NotSpecification(Specification<T> spec) {
        this.spec = spec;
    }

    @Override
    public boolean isSatisfiedBy(T candidate) {
        return !spec.isSatisfiedBy(candidate);
    }

    @Override
    public String getDescription() {
        return String.format("NOT (%s)", spec.getDescription());
    }
}
```

## Implementation Patterns

### Selection Specifications

#### Customer Specifications
```java
public class PremiumCustomerSpecification extends AbstractSpecification<Customer> {
    private final BigDecimal minimumSpent;
    private final int minimumOrders;

    public PremiumCustomerSpecification(BigDecimal minimumSpent, int minimumOrders) {
        this.minimumSpent = minimumSpent;
        this.minimumOrders = minimumOrders;
    }

    @Override
    public boolean isSatisfiedBy(Customer customer) {
        return customer.getTotalSpent().compareTo(minimumSpent) >= 0 &&
               customer.getOrderCount() >= minimumOrders;
    }

    @Override
    public String getDescription() {
        return String.format("Customer with minimum spent of %s and %d orders",
                           minimumSpent, minimumOrders);
    }
}

public class ActiveCustomerSpecification extends AbstractSpecification<Customer> {
    private final int daysSinceLastOrder;

    public ActiveCustomerSpecification(int daysSinceLastOrder) {
        this.daysSinceLastOrder = daysSinceLastOrder;
    }

    @Override
    public boolean isSatisfiedBy(Customer customer) {
        if (customer.getLastOrderDate() == null) {
            return false;
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(daysSinceLastOrder);
        return customer.getLastOrderDate().toLocalDate().isAfter(cutoffDate);
    }

    @Override
    public String getDescription() {
        return String.format("Customer active within last %d days", daysSinceLastOrder);
    }
}

public class CustomerInRegionSpecification extends AbstractSpecification<Customer> {
    private final String region;

    public CustomerInRegionSpecification(String region) {
        this.region = region;
    }

    @Override
    public boolean isSatisfiedBy(Customer customer) {
        return region.equals(customer.getRegion());
    }

    @Override
    public String getDescription() {
        return String.format("Customer in region %s", region);
    }
}
```

#### Product Specifications
```java
public class ProductInStockSpecification extends AbstractSpecification<Product> {
    private final int minimumStock;

    public ProductInStockSpecification(int minimumStock) {
        this.minimumStock = minimumStock;
    }

    @Override
    public boolean isSatisfiedBy(Product product) {
        return product.getStockQuantity() >= minimumStock;
    }

    @Override
    public String getDescription() {
        return String.format("Product with minimum stock of %d", minimumStock);
    }
}

public class ProductInCategorySpecification extends AbstractSpecification<Product> {
    private final String category;

    public ProductInCategorySpecification(String category) {
        this.category = category;
    }

    @Override
    public boolean isSatisfiedBy(Product product) {
        return category.equals(product.getCategory());
    }

    @Override
    public String getDescription() {
        return String.format("Product in category %s", category);
    }
}

public class ProductPriceRangeSpecification extends AbstractSpecification<Product> {
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;

    public ProductPriceRangeSpecification(BigDecimal minPrice, BigDecimal maxPrice) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
    }

    @Override
    public boolean isSatisfiedBy(Product product) {
        BigDecimal price = product.getPrice();
        return price.compareTo(minPrice) >= 0 && price.compareTo(maxPrice) <= 0;
    }

    @Override
    public String getDescription() {
        return String.format("Product with price between %s and %s", minPrice, maxPrice);
    }
}
```

### Validation Specifications

#### Order Validation Specifications
```java
public class OrderMinimumAmountSpecification extends AbstractSpecification<Order> {
    private final BigDecimal minimumAmount;

    public OrderMinimumAmountSpecification(BigDecimal minimumAmount) {
        this.minimumAmount = minimumAmount;
    }

    @Override
    public boolean isSatisfiedBy(Order order) {
        return order.getTotal().compareTo(minimumAmount) >= 0;
    }

    @Override
    public String getDescription() {
        return String.format("Order total minimum %s", minimumAmount);
    }
}

public class OrderContainsRestrictedItemsSpecification extends AbstractSpecification<Order> {
    private final Set<String> restrictedProductIds;

    public OrderContainsRestrictedItemsSpecification(Set<String> restrictedProductIds) {
        this.restrictedProductIds = restrictedProductIds;
    }

    @Override
    public boolean isSatisfiedBy(Order order) {
        return order.getItems().stream()
            .anyMatch(item -> restrictedProductIds.contains(item.getProductId()));
    }

    @Override
    public String getDescription() {
        return "Order contains restricted items";
    }
}

public class OrderShippingAddressCompleteSpecification extends AbstractSpecification<Order> {
    @Override
    public boolean isSatisfiedBy(Order order) {
        Address address = order.getShippingAddress();
        return address != null &&
               isNotBlank(address.getStreet()) &&
               isNotBlank(address.getCity()) &&
               isNotBlank(address.getPostalCode()) &&
               isNotBlank(address.getCountry());
    }

    @Override
    public String getDescription() {
        return "Order has complete shipping address";
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
```

### Query Specifications

#### JPA Criteria Specifications
```java
public class CustomerSpecifications {

    public static Specification<Customer> hasMinimumSpent(BigDecimal amount) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("totalSpent"), amount);
    }

    public static Specification<Customer> hasMinimumOrders(int count) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("orderCount"), count);
    }

    public static Specification<Customer> isActiveWithinDays(int days) {
        return (root, query, cb) -> {
            LocalDate cutoffDate = LocalDate.now().minusDays(days);
            return cb.greaterThan(root.get("lastOrderDate"), cutoffDate);
        };
    }

    public static Specification<Customer> inRegion(String region) {
        return (root, query, cb) -> cb.equal(root.get("region"), region);
    }

    public static Specification<Customer> premiumCustomers() {
        return hasMinimumSpent(new BigDecimal("500.00"))
            .and(hasMinimumOrders(5))
            .and(isActiveWithinDays(90));
    }

    public static Specification<Customer> highValueCustomers() {
        return hasMinimumSpent(new BigDecimal("1000.00"))
            .or(hasMinimumOrders(10));
    }
}
```

#### Repository with Specifications
```java
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    default List<Customer> findPremiumCustomers() {
        return findAll(CustomerSpecifications.premiumCustomers());
    }

    default List<Customer> findHighValueCustomers() {
        return findAll(CustomerSpecifications.highValueCustomers());
    }

    default List<Customer> findCustomersByCustomCriteria(BigDecimal minSpent, int minOrders, String region) {
        Specification<Customer> spec = Specification.where(null);

        if (minSpent != null) {
            spec = spec.and(CustomerSpecifications.hasMinimumSpent(minSpent));
        }

        if (minOrders > 0) {
            spec = spec.and(CustomerSpecifications.hasMinimumOrders(minOrders));
        }

        if (region != null) {
            spec = spec.and(CustomerSpecifications.inRegion(region));
        }

        return findAll(spec);
    }
}
```

## Application Integration

### Domain Services with Specifications

#### Customer Segmentation Service
```java
@Service
public class CustomerSegmentationService {
    private final CustomerRepository customerRepository;

    public CustomerSegmentationService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> findPremiumCustomers() {
        Specification<Customer> premiumSpec = new PremiumCustomerSpecification(
            new BigDecimal("500.00"), 5
        ).and(new ActiveCustomerSpecification(90));

        return customerRepository.findAll(premiumSpec);
    }

    public List<Customer> findAtRiskCustomers() {
        Specification<Customer> atRiskSpec = new ActiveCustomerSpecification(90).not()
            .and(new PremiumCustomerSpecification(new BigDecimal("100.00"), 1));

        return customerRepository.findAll(atRiskSpec);
    }

    public List<Customer> findTargetCustomersForCampaign(String region, BigDecimal minSpent) {
        Specification<Customer> targetSpec = new CustomerInRegionSpecification(region)
            .and(new PremiumCustomerSpecification(minSpent, 0))
            .and(new ActiveCustomerSpecification(180));

        return customerRepository.findAll(targetSpec);
    }

    public SegmentationReport generateSegmentationReport() {
        List<Customer> allCustomers = customerRepository.findAll();

        long premiumCount = allCustomers.stream()
            .filter(new PremiumCustomerSpecification(new BigDecimal("500.00"), 5)::isSatisfiedBy)
            .count();

        long activeCount = allCustomers.stream()
            .filter(new ActiveCustomerSpecification(90)::isSatisfiedBy)
            .count();

        long atRiskCount = allCustomers.stream()
            .filter(new ActiveCustomerSpecification(90).not()::isSatisfiedBy)
            .count();

        return new SegmentationReport(premiumCount, activeCount, atRiskCount, allCustomers.size());
    }
}
```

#### Product Search Service
```java
@Service
public class ProductSearchService {
    private final ProductRepository productRepository;

    public ProductSearchService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> searchProducts(ProductSearchCriteria criteria) {
        Specification<Product> spec = buildSearchSpecification(criteria);
        return productRepository.findAll(spec, buildSort(criteria));
    }

    public Page<Product> searchProductsPaged(ProductSearchCriteria criteria, Pageable pageable) {
        Specification<Product> spec = buildSearchSpecification(criteria);
        return productRepository.findAll(spec, pageable);
    }

    private Specification<Product> buildSearchSpecification(ProductSearchCriteria criteria) {
        Specification<Product> spec = Specification.where(null);

        if (criteria.getCategory() != null) {
            spec = spec.and(new ProductInCategorySpecification(criteria.getCategory()));
        }

        if (criteria.getMinPrice() != null || criteria.getMaxPrice() != null) {
            BigDecimal minPrice = criteria.getMinPrice() != null ? criteria.getMinPrice() : BigDecimal.ZERO;
            BigDecimal maxPrice = criteria.getMaxPrice() != null ? criteria.getMaxPrice() : BigDecimal.valueOf(Long.MAX_VALUE);
            spec = spec.and(new ProductPriceRangeSpecification(minPrice, maxPrice));
        }

        if (criteria.isInStockOnly()) {
            spec = spec.and(new ProductInStockSpecification(1));
        }

        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            spec = spec.and(nameOrDescriptionContains(criteria.getSearchTerm()));
        }

        return spec;
    }

    private Specification<Product> nameOrDescriptionContains(String term) {
        return (root, query, cb) -> {
            String likePattern = "%" + term.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("name")), likePattern),
                cb.like(cb.lower(root.get("description")), likePattern)
            );
        };
    }

    private Sort buildSort(ProductSearchCriteria criteria) {
        if (criteria.getSortBy() == null) {
            return Sort.by("name").ascending();
        }

        Sort.Direction direction = criteria.isSortDescending() ?
            Sort.Direction.DESC : Sort.Direction.ASC;

        return Sort.by(direction, criteria.getSortBy());
    }
}
```

### Validation with Specifications

#### Order Validation Service
```java
@Service
public class OrderValidationService {
    private final List<Specification<Order>> validationRules;

    public OrderValidationService() {
        this.validationRules = Arrays.asList(
            new OrderMinimumAmountSpecification(new BigDecimal("10.00")),
            new OrderShippingAddressCompleteSpecification(),
            new OrderContainsRestrictedItemsSpecification(Set.of("restricted-1", "restricted-2")).not()
        );
    }

    public ValidationResult validateOrder(Order order) {
        List<String> violations = new ArrayList<>();

        for (Specification<Order> rule : validationRules) {
            if (!rule.isSatisfiedBy(order)) {
                violations.add(rule.getDescription());
            }
        }

        return new ValidationResult(violations.isEmpty(), violations);
    }

    public boolean isValid(Order order) {
        return validationRules.stream().allMatch(rule -> rule.isSatisfiedBy(order));
    }

    public static class ValidationResult {
        private final boolean valid;
        private final List<String> violations;

        public ValidationResult(boolean valid, List<String> violations) {
            this.valid = valid;
            this.violations = violations;
        }

        public boolean isValid() { return valid; }
        public List<String> getViolations() { return violations; }
    }
}
```

## Best Practices

### When to Use Specification Pattern

#### Suitable Scenarios
- **Complex Business Rules**: Multiple conditions that need combination
- **Reusable Criteria**: Same rules used in different contexts
- **Dynamic Queries**: Criteria built at runtime
- **Domain Rule Validation**: Business rule checking
- **Search and Filter**: Flexible object filtering

#### When to Avoid
- **Simple Conditions**: Basic if statements
- **Performance Critical**: High-frequency operations
- **Static Rules**: Never-changing criteria
- **Single Use**: Rules used only once

### Implementation Guidelines

#### Keep Specifications Focused
```java
// Good: Single responsibility
public class HighValueCustomerSpecification extends AbstractSpecification<Customer> {
    private final BigDecimal threshold;

    @Override
    public boolean isSatisfiedBy(Customer customer) {
        return customer.getTotalSpent().compareTo(threshold) >= 0;
    }
}

// Bad: Multiple responsibilities
public class ComplexCustomerSpecification extends AbstractSpecification<Customer> {
    @Override
    public boolean isSatisfiedBy(Customer customer) {
        return customer.getTotalSpent().compareTo(new BigDecimal("100.00")) >= 0 &&
               customer.getOrderCount() >= 5 &&
               customer.getRegion().equals("US") &&
               customer.getLastOrderDate().isAfter(LocalDate.now().minusDays(90));
    }
}
```

#### Make Specifications Configurable
```java
public class ConfigurableCustomerSpecification extends AbstractSpecification<Customer> {
    private final SpecificationConfiguration config;

    public ConfigurableCustomerSpecification(SpecificationConfiguration config) {
        this.config = config;
    }

    @Override
    public boolean isSatisfiedBy(Customer customer) {
        Specification<Customer> spec = Specification.where(null);

        if (config.isSpentThresholdEnabled()) {
            spec = spec.and(new PremiumCustomerSpecification(config.getSpentThreshold(), 0));
        }

        if (config.isOrderCountEnabled()) {
            spec = spec.and(new PremiumCustomerSpecification(BigDecimal.ZERO, config.getOrderCountThreshold()));
        }

        if (config.isActivityCheckEnabled()) {
            spec = spec.and(new ActiveCustomerSpecification(config.getActivityDays()));
        }

        return spec.isSatisfiedBy(customer);
    }

    @Override
    public String getDescription() {
        return "Configurable customer specification based on runtime configuration";
    }
}
```

#### Handle Specification Performance
```java
public class CachedSpecification<T> extends AbstractSpecification<T> {
    private final Specification<T> delegate;
    private final Cache<String, Boolean> resultCache;
    private final Function<T, String> keyGenerator;

    public CachedSpecification(Specification<T> delegate,
                             Cache<String, Boolean> resultCache,
                             Function<T, String> keyGenerator) {
        this.delegate = delegate;
        this.resultCache = resultCache;
        this.keyGenerator = keyGenerator;
    }

    @Override
    public boolean isSatisfiedBy(T candidate) {
        String key = keyGenerator.apply(candidate);
        return resultCache.get(key, k -> delegate.isSatisfiedBy(candidate));
    }

    @Override
    public String getDescription() {
        return "Cached: " + delegate.getDescription();
    }
}
```

## Testing Specifications

### Unit Testing
```java
@Test
public void shouldSatisfyPremiumCustomerSpecification() {
    // Arrange
    PremiumCustomerSpecification spec = new PremiumCustomerSpecification(
        new BigDecimal("500.00"), 5
    );

    Customer premiumCustomer = new Customer();
    premiumCustomer.setTotalSpent(new BigDecimal("750.00"));
    premiumCustomer.setOrderCount(8);

    Customer regularCustomer = new Customer();
    regularCustomer.setTotalSpent(new BigDecimal("100.00"));
    regularCustomer.setOrderCount(2);

    // Act & Assert
    assertTrue(spec.isSatisfiedBy(premiumCustomer));
    assertFalse(spec.isSatisfiedBy(regularCustomer));
}

@Test
public void shouldCombineSpecificationsWithAnd() {
    // Arrange
    Specification<Customer> premiumSpec = new PremiumCustomerSpecification(
        new BigDecimal("500.00"), 5
    );
    Specification<Customer> activeSpec = new ActiveCustomerSpecification(90);
    Specification<Customer> combinedSpec = premiumSpec.and(activeSpec);

    Customer qualifiedCustomer = createQualifiedCustomer();
    Customer inactivePremiumCustomer = createInactivePremiumCustomer();

    // Act & Assert
    assertTrue(combinedSpec.isSatisfiedBy(qualifiedCustomer));
    assertFalse(combinedSpec.isSatisfiedBy(inactivePremiumCustomer));
}

@Test
public void shouldCombineSpecificationsWithOr() {
    // Arrange
    Specification<Customer> highSpentSpec = new PremiumCustomerSpecification(
        new BigDecimal("1000.00"), 0
    );
    Specification<Customer> highOrderSpec = new PremiumCustomerSpecification(
        BigDecimal.ZERO, 10
    );
    Specification<Customer> combinedSpec = highSpentSpec.or(highOrderSpec);

    Customer highSpender = createHighSpender();
    Customer frequentBuyer = createFrequentBuyer();
    Customer regularCustomer = createRegularCustomer();

    // Act & Assert
    assertTrue(combinedSpec.isSatisfiedBy(highSpender));
    assertTrue(combinedSpec.isSatisfiedBy(frequentBuyer));
    assertFalse(combinedSpec.isSatisfiedBy(regularCustomer));
}

@Test
public void shouldNegateSpecification() {
    // Arrange
    Specification<Customer> premiumSpec = new PremiumCustomerSpecification(
        new BigDecimal("500.00"), 5
    );
    Specification<Customer> notPremiumSpec = premiumSpec.not();

    Customer premiumCustomer = createPremiumCustomer();
    Customer regularCustomer = createRegularCustomer();

    // Act & Assert
    assertFalse(notPremiumSpec.isSatisfiedBy(premiumCustomer));
    assertTrue(notPremiumSpec.isSatisfiedBy(regularCustomer));
}
```

### Integration Testing
```java
@SpringBootTest
public class SpecificationIntegrationTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerSegmentationService segmentationService;

    @Test
    public void shouldFindPremiumCustomersUsingSpecification() {
        // Arrange
        createTestCustomers();

        // Act
        List<Customer> premiumCustomers = segmentationService.findPremiumCustomers();

        // Assert
        assertEquals(2, premiumCustomers.size());
        premiumCustomers.forEach(customer -> {
            assertTrue(customer.getTotalSpent().compareTo(new BigDecimal("500.00")) >= 0);
            assertTrue(customer.getOrderCount() >= 5);
        });
    }

    @Test
    public void shouldFindAtRiskCustomersUsingSpecification() {
        // Arrange
        createTestCustomers();

        // Act
        List<Customer> atRiskCustomers = segmentationService.findAtRiskCustomers();

        // Assert
        assertEquals(1, atRiskCustomers.size());
        Customer atRisk = atRiskCustomers.get(0);
        assertEquals("inactive-premium", atRisk.getId());
    }

    @Test
    public void shouldValidateOrdersUsingSpecifications() {
        // Arrange
        OrderValidationService validationService = new OrderValidationService();
        Order validOrder = createValidOrder();
        Order invalidOrder = createInvalidOrder();

        // Act
        ValidationResult validResult = validationService.validateOrder(validOrder);
        ValidationResult invalidResult = validationService.validateOrder(invalidOrder);

        // Assert
        assertTrue(validResult.isValid());
        assertTrue(validResult.getViolations().isEmpty());

        assertFalse(invalidResult.isValid());
        assertFalse(invalidResult.getViolations().isEmpty());
    }

    private void createTestCustomers() {
        Customer premium1 = new Customer();
        premium1.setId("premium-1");
        premium1.setTotalSpent(new BigDecimal("750.00"));
        premium1.setOrderCount(8);
        premium1.setLastOrderDate(LocalDateTime.now().minusDays(30));

        Customer premium2 = new Customer();
        premium2.setId("premium-2");
        premium2.setTotalSpent(new BigDecimal("600.00"));
        premium2.setOrderCount(6);
        premium2.setLastOrderDate(LocalDateTime.now().minusDays(15));

        Customer inactivePremium = new Customer();
        inactivePremium.setId("inactive-premium");
        inactivePremium.setTotalSpent(new BigDecimal("800.00"));
        inactivePremium.setOrderCount(7);
        inactivePremium.setLastOrderDate(LocalDateTime.now().minusDays(120));

        Customer regular = new Customer();
        regular.setId("regular");
        regular.setTotalSpent(new BigDecimal("100.00"));
        regular.setOrderCount(2);
        regular.setLastOrderDate(LocalDateTime.now().minusDays(60));

        customerRepository.saveAll(Arrays.asList(premium1, premium2, inactivePremium, regular));
    }

    private Order createValidOrder() {
        Order order = new Order();
        order.setTotal(new BigDecimal("50.00"));
        order.setItems(Arrays.asList(new OrderItem("normal-item", 1, new BigDecimal("50.00"))));
        order.setShippingAddress(new Address("123 Main St", "City", "12345", "Country"));
        return order;
    }

    private Order createInvalidOrder() {
        Order order = new Order();
        order.setTotal(new BigDecimal("5.00")); // Below minimum
        order.setItems(Arrays.asList(new OrderItem("normal-item", 1, new BigDecimal("5.00"))));
        order.setShippingAddress(new Address("", "", "", "")); // Incomplete address
        return order;
    }
}
```

## Tools and Technologies

### Specification Frameworks
- **Spring Data JPA**: Built-in Specification support
- **QueryDSL**: Type-safe queries with fluent API
- **jOOQ**: Fluent API for SQL query building
- **Apache Commons Collections**: Collection filtering utilities

### Testing Frameworks
- **JUnit 5**: Unit testing framework
- **AssertJ**: Fluent assertions for testing
- **Testcontainers**: Integration testing with containers
- **Spring Boot Test**: Spring application testing support

### Performance and Caching
- **Caffeine**: High-performance Java caching
- **Redis**: Distributed caching for specifications
- **Ehcache**: Enterprise caching solution
- **Hazelcast**: In-memory data grid

### Validation Libraries
- **Hibernate Validator**: Bean validation framework
- **Apache BVal**: Bean validation implementation
- **Validation API**: Jakarta Bean Validation

## References

- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://dddcommunity.org/book/evans_2003/) - Eric Evans
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) - Vaughn Vernon
- [Specification Pattern](https://martinfowler.com/apsupp/spec.pdf) - Eric Evans and Martin Fowler
- [Patterns of Enterprise Application Architecture](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420) - Martin Fowler
- [Spring Data JPA Documentation](https://spring.io/projects/spring-data-jpa)
- [QueryDSL Documentation](http://querydsl.com/)