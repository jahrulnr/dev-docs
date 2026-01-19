# Throttling

## Overview

Throttling is a pattern that controls the rate of requests sent to or processed by a system to prevent overload and ensure fair resource usage. This pattern helps maintain service availability, prevents cascading failures, and protects backend systems from being overwhelmed by excessive traffic.

Throttling can be implemented at various levels (network, application, service) and uses different algorithms to determine when and how to limit requests. The goal is to balance system protection with user experience, allowing legitimate traffic while blocking or delaying abusive requests.

## Core Concepts

### Throttling vs Rate Limiting

#### Key Differences
- **Rate Limiting**: Focuses on controlling request frequency per client
- **Throttling**: Broader concept of controlling resource consumption and system load
- **Load Shedding**: Discarding requests when system is overloaded

#### Throttling Types
- **Request Throttling**: Limits number of requests per time window
- **Bandwidth Throttling**: Limits data transfer rates
- **Resource Throttling**: Limits CPU, memory, or database usage
- **Concurrent Connection Throttling**: Limits simultaneous connections

### Throttling Algorithms

#### Token Bucket Algorithm
```java
public class TokenBucket {
    private final long capacity;
    private final double refillRate; // tokens per second
    private double tokens;
    private long lastRefillTime;

    public TokenBucket(long capacity, double refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefillTime = System.nanoTime();
    }

    public synchronized boolean tryConsume(long tokensToConsume) {
        refill();

        if (tokens >= tokensToConsume) {
            tokens -= tokensToConsume;
            return true;
        }

        return false;
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsedSeconds = (now - lastRefillTime) / 1_000_000_000.0;
        long tokensToAdd = (long) (elapsedSeconds * refillRate);

        if (tokensToAdd > 0) {
            tokens = Math.min(capacity, tokens + tokensToAdd);
            lastRefillTime = now;
        }
    }
}
```

#### Leaky Bucket Algorithm
```java
public class LeakyBucket {
    private final long capacity;
    private final double leakRate; // requests per second
    private long waterLevel;
    private long lastLeakTime;

    public LeakyBucket(long capacity, double leakRate) {
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.waterLevel = 0;
        this.lastLeakTime = System.nanoTime();
    }

    public synchronized boolean tryAddRequest() {
        leak();

        if (waterLevel < capacity) {
            waterLevel++;
            return true;
        }

        return false;
    }

    private void leak() {
        long now = System.nanoTime();
        double elapsedSeconds = (now - lastLeakTime) / 1_000_000_000.0;
        long leakedRequests = (long) (elapsedSeconds * leakRate);

        if (leakedRequests > 0) {
            waterLevel = Math.max(0, waterLevel - leakedRequests);
            lastLeakTime = now;
        }
    }
}
```

#### Fixed Window Counter
```java
public class FixedWindowCounter {
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final long windowSizeMs;
    private final long maxRequests;

    public FixedWindowCounter(long windowSizeMs, long maxRequests) {
        this.windowSizeMs = windowSizeMs;
        this.maxRequests = maxRequests;
    }

    public boolean allow(String key) {
        long currentWindow = System.currentTimeMillis() / windowSizeMs;

        Window window = windows.computeIfAbsent(key, k -> new Window(currentWindow, 0));

        // Reset counter if we're in a new window
        if (window.windowId != currentWindow) {
            window.windowId = currentWindow;
            window.counter = 0;
        }

        if (window.counter < maxRequests) {
            window.counter++;
            return true;
        }

        return false;
    }

    private static class Window {
        long windowId;
        long counter;

        Window(long windowId, long counter) {
            this.windowId = windowId;
            this.counter = counter;
        }
    }
}
```

#### Sliding Window Log
```java
public class SlidingWindowLog {
    private final Map<String, LinkedList<Long>> requestLogs = new ConcurrentHashMap<>();
    private final long windowSizeMs;
    private final long maxRequests;

    public SlidingWindowLog(long windowSizeMs, long maxRequests) {
        this.windowSizeMs = windowSizeMs;
        this.maxRequests = maxRequests;
    }

    public boolean allow(String key) {
        long now = System.currentTimeMillis();

        requestLogs.computeIfAbsent(key, k -> new LinkedList<>()).add(now);

        // Remove requests outside the sliding window
        LinkedList<Long> requests = requestLogs.get(key);
        while (!requests.isEmpty() && now - requests.peekFirst() > windowSizeMs) {
            requests.pollFirst();
        }

        return requests.size() <= maxRequests;
    }
}
```

## Implementation Patterns

### API Gateway Throttling

#### Spring Cloud Gateway Implementation
```java
@Configuration
public class ThrottlingConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("api_route", r -> r.path("/api/**")
                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(
                    redisRateLimiter()).setKeyResolver(userKeyResolver())))
                .uri("lb://api-service"))
            .build();
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(10, 20); // replenishRate, burstCapacity
    }

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders()
                .getFirst("X-User-Id");
            return Mono.just(userId != null ? userId : "anonymous");
        };
    }
}
```

#### Custom Throttling Filter
```java
@Component
public class ThrottlingFilter implements WebFilter {

    private final RateLimiter rateLimiter;
    private final KeyResolver keyResolver;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return keyResolver.resolve(exchange)
            .flatMap(key -> {
                if (rateLimiter.allow(key)) {
                    return chain.filter(exchange);
                } else {
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    return exchange.getResponse().setComplete();
                }
            });
    }
}
```

### Distributed Throttling

#### Redis-Based Distributed Counter
```java
@Service
public class DistributedRateLimiter {
    private final RedisTemplate<String, String> redisTemplate;
    private final long windowSizeSeconds;
    private final long maxRequests;

    public DistributedRateLimiter(RedisTemplate<String, String> redisTemplate,
                                long windowSizeSeconds, long maxRequests) {
        this.redisTemplate = redisTemplate;
        this.windowSizeSeconds = windowSizeSeconds;
        this.maxRequests = maxRequests;
    }

    public boolean allow(String key) {
        String redisKey = "rate_limit:" + key;
        long currentWindow = System.currentTimeMillis() / 1000 / windowSizeSeconds;

        String windowKey = redisKey + ":" + currentWindow;

        Long currentCount = redisTemplate.opsForValue()
            .increment(windowKey);

        // Set expiration for the window
        redisTemplate.expire(windowKey, windowSizeSeconds, TimeUnit.SECONDS);

        return currentCount <= maxRequests;
    }
}
```

#### Redis Cluster Throttling
```java
public class RedisClusterRateLimiter {
    private final RedisClusterConnection connection;
    private final Script script;

    public RedisClusterRateLimiter(RedisClusterConnection connection) {
        this.connection = connection;
        // Load Lua script for atomic rate limiting
        this.script = Script.of("""
            local key = KEYS[1]
            local window = ARGV[1]
            local limit = tonumber(ARGV[2])
            local current = redis.call('INCR', key)
            if current == 1 then
                redis.call('EXPIRE', key, window)
            end
            return current <= limit
            """);
    }

    public boolean allow(String key, int windowSeconds, int maxRequests) {
        RedisClusterCommands<String, String> commands = connection.sync();
        return (Boolean) script.eval(commands,
            Collections.singletonList(key),
            Arrays.asList(String.valueOf(windowSeconds), String.valueOf(maxRequests)));
    }
}
```

### Adaptive Throttling

#### Load-Based Throttling
```java
@Service
public class AdaptiveThrottler {
    private final SystemMetricsCollector metricsCollector;
    private final AtomicLong currentLimit = new AtomicLong(100);

    @Scheduled(fixedRate = 10000) // Adjust every 10 seconds
    public void adjustLimits() {
        double cpuUsage = metricsCollector.getCpuUsage();
        double memoryUsage = metricsCollector.getMemoryUsage();

        if (cpuUsage > 80 || memoryUsage > 85) {
            // Reduce limit when system is under stress
            currentLimit.updateAndGet(limit -> Math.max(10, limit / 2));
        } else if (cpuUsage < 50 && memoryUsage < 60) {
            // Increase limit when system has capacity
            currentLimit.updateAndGet(limit -> Math.min(1000, limit * 2));
        }
    }

    public boolean allow(String key) {
        // Use current adaptive limit
        return fixedWindowCounter.allow(key, currentLimit.get());
    }
}
```

## Throttling Strategies

### Client-Side Throttling

#### Exponential Backoff
```javascript
class ApiClient {
    constructor(baseUrl, maxRetries = 3) {
        this.baseUrl = baseUrl;
        this.maxRetries = maxRetries;
    }

    async request(endpoint, options = {}) {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, options);

                if (response.status === 429) {
                    // Rate limited, wait with exponential backoff
                    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
                    await this.sleep(delay);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return response.json();

            } catch (error) {
                if (attempt === this.maxRetries) {
                    throw error;
                }

                // Exponential backoff for other errors too
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

#### Client-Side Rate Limiting
```javascript
class ClientRateLimiter {
    constructor(requestsPerMinute = 60) {
        this.requestsPerMinute = requestsPerMinute;
        this.requests = [];
    }

    async waitForSlot() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove requests older than 1 minute
        this.requests = this.requests.filter(time => time > oneMinuteAgo);

        if (this.requests.length >= this.requestsPerMinute) {
            // Wait until the oldest request expires
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 60000 - (now - oldestRequest);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }
        }

        this.requests.push(now);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### Service-Level Throttling

#### Microservice Throttling
```java
@Service
public class OrderService {
    private final RateLimiter rateLimiter;
    private final CircuitBreaker circuitBreaker;

    public OrderService() {
        this.rateLimiter = RateLimiter.create(100.0); // 100 requests per second
        this.circuitBreaker = CircuitBreaker.ofDefaults("order-service");
    }

    public Mono<Order> createOrder(CreateOrderRequest request) {
        return Mono.fromCallable(() -> {
            if (!rateLimiter.tryAcquire()) {
                throw new RateLimitExceededException();
            }

            return circuitBreaker.decorateSupplier(() ->
                orderRepository.save(new Order(request))
            ).call();
        });
    }
}
```

#### Database Throttling
```java
@Repository
public class ThrottledDatabaseRepository {
    private final DataSource dataSource;
    private final Semaphore connectionLimiter;

    public ThrottledDatabaseRepository(DataSource dataSource, int maxConnections) {
        this.dataSource = dataSource;
        this.connectionLimiter = new Semaphore(maxConnections);
    }

    public <T> T executeQuery(String sql, RowMapper<T> mapper) throws SQLException {
        connectionLimiter.acquire();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            return mapper.mapRow(rs);
        } finally {
            connectionLimiter.release();
        }
    }
}
```

## Monitoring and Observability

### Throttling Metrics
```java
@Component
public class ThrottlingMetricsCollector {
    private final MeterRegistry registry;

    public void recordThrottlingEvent(String clientId, boolean allowed, String endpoint) {
        Counter.builder("throttling.requests")
            .tag("client", clientId)
            .tag("endpoint", endpoint)
            .tag("allowed", String.valueOf(allowed))
            .register(registry)
            .increment();

        if (!allowed) {
            // Additional metrics for rejected requests
            Counter.builder("throttling.rejected")
                .tag("client", clientId)
                .tag("endpoint", endpoint)
                .register(registry)
                .increment();
        }
    }

    public void recordRateLimit(String clientId, long currentRate, long limit) {
        Gauge.builder("throttling.current_rate", currentRate)
            .tag("client", clientId)
            .register(registry);

        Gauge.builder("throttling.limit", limit)
            .tag("client", clientId)
            .register(registry);
    }
}
```

### Alerting
```java
@Component
public class ThrottlingAlertManager {
    private final AlertService alertService;

    @Scheduled(fixedRate = 60000) // Check every minute
    public void checkThrottlingThresholds() {
        double rejectionRate = calculateRejectionRate();

        if (rejectionRate > 0.1) { // 10% rejection rate
            alertService.sendAlert(
                "High throttling rate detected",
                String.format("Rejection rate: %.2f%%", rejectionRate * 100)
            );
        }
    }

    private double calculateRejectionRate() {
        // Calculate based on metrics
        // Implementation depends on your metrics system
        return 0.0;
    }
}
```

## Best Practices

### Throttling Policy Design

#### Multi-Tier Rate Limits
```java
public class MultiTierRateLimiter {
    private final RateLimiter globalLimiter;     // Overall system protection
    private final Map<String, RateLimiter> userLimiters;  // Per-user limits
    private final Map<String, RateLimiter> endpointLimiters; // Per-endpoint limits

    public boolean allow(String userId, String endpoint) {
        // Check global limit first
        if (!globalLimiter.tryAcquire()) {
            return false;
        }

        // Check user-specific limit
        RateLimiter userLimiter = userLimiters.computeIfAbsent(userId,
            k -> RateLimiter.create(10.0)); // 10 requests per second per user

        if (!userLimiter.tryAcquire()) {
            return false;
        }

        // Check endpoint-specific limit
        RateLimiter endpointLimiter = endpointLimiters.computeIfAbsent(endpoint,
            k -> RateLimiter.create(100.0)); // 100 requests per second per endpoint

        return endpointLimiter.tryAcquire();
    }
}
```

#### Graceful Degradation
```java
@RestController
public class ApiController {
    private final ThrottlingService throttlingService;
    private final DegradedModeService degradedService;

    @GetMapping("/api/data")
    public ResponseEntity<?> getData(@RequestHeader("X-API-Key") String apiKey) {
        if (!throttlingService.allow(apiKey, "/api/data")) {
            // Check if we can serve degraded response
            if (degradedService.isAvailable()) {
                return ResponseEntity.status(200)
                    .header("X-Degraded", "true")
                    .body(degradedService.getCachedData());
            }

            return ResponseEntity.status(429)
                .header("Retry-After", "60")
                .body(new ErrorResponse("Rate limit exceeded"));
        }

        // Normal processing
        return ResponseEntity.ok(fullService.getData());
    }
}
```

### Configuration Management

#### Dynamic Configuration
```java
@Configuration
@ConfigurationProperties(prefix = "throttling")
public class ThrottlingProperties {
    private Map<String, RateLimitConfig> endpoints = new HashMap<>();

    public static class RateLimitConfig {
        private long requestsPerMinute = 60;
        private long burstLimit = 100;

        // Getters and setters
    }

    // Methods to update limits at runtime
    public void updateLimit(String endpoint, long newLimit) {
        RateLimitConfig config = endpoints.get(endpoint);
        if (config != null) {
            config.setRequestsPerMinute(newLimit);
        }
    }
}
```

## Common Challenges

### Throttling in Distributed Systems

#### Distributed Rate Limiting
```java
public class DistributedRateLimiter {
    private final RedissonClient redisson;
    private final String keyPrefix;

    public boolean allow(String key, int maxRequests, long windowMs) {
        RRateLimiter limiter = redisson.getRateLimiter(keyPrefix + key);
        limiter.trySetRate(RateType.OVERALL, maxRequests, windowMs, RateIntervalUnit.MILLISECONDS);

        return limiter.tryAcquire();
    }
}
```

#### Cache Stampede Prevention
```java
@Service
public class CacheThrottler {
    private final Cache cache;
    private final Semaphore semaphore = new Semaphore(10); // Max 10 concurrent cache rebuilds

    public Object getWithThrottling(String key) {
        Object value = cache.get(key);

        if (value == null) {
            // Throttle cache rebuilds
            if (semaphore.tryAcquire()) {
                try {
                    // Rebuild cache
                    value = rebuildCache(key);
                    cache.put(key, value);
                } finally {
                    semaphore.release();
                }
            } else {
                // Return stale data or default value
                return getStaleData(key);
            }
        }

        return value;
    }
}
```

### Testing Throttling

#### Unit Testing Rate Limiters
```java
@Test
public void shouldThrottleRequestsOverLimit() {
    TokenBucket bucket = new TokenBucket(10, 1.0); // 10 tokens, refill 1 per second

    // Consume all tokens
    for (int i = 0; i < 10; i++) {
        assertTrue(bucket.tryConsume(1));
    }

    // Next request should be throttled
    assertFalse(bucket.tryConsume(1));
}

@Test
public void shouldAllowRequestsAfterRefill() throws InterruptedException {
    TokenBucket bucket = new TokenBucket(10, 10.0); // Fast refill for testing

    // Consume all tokens
    for (int i = 0; i < 10; i++) {
        bucket.tryConsume(1);
    }

    // Wait for refill
    Thread.sleep(1000);

    // Should allow requests again
    assertTrue(bucket.tryConsume(1));
}
```

## Tools and Technologies

### API Gateway Solutions
- **Kong**: Plugin-based API gateway with rate limiting
- **NGINX**: Rate limiting modules and directives
- **AWS API Gateway**: Built-in throttling and rate limiting
- **Azure API Management**: Comprehensive throttling policies

### Libraries and Frameworks
- **Bucket4j**: Java rate limiting library
- **Resilience4j**: Fault tolerance library with rate limiting
- **Guava RateLimiter**: Google's rate limiting implementation
- **Redis**: Distributed rate limiting with Lua scripts

### Monitoring Tools
- **Prometheus**: Metrics collection for throttling
- **Grafana**: Dashboards for rate limiting visualization
- **DataDog**: Application performance monitoring
- **New Relic**: APM with API monitoring

## References

- [Rate Limiting Patterns](https://microservices.io/patterns/reliability/rate-limiting.html)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Leaky Bucket Algorithm](https://en.wikipedia.org/wiki/Leaky_bucket)
- [API Rate Limiting Best Practices](https://tools.ietf.org/html/rfc6585)
- [Google Guava RateLimiter](https://github.com/google/guava/wiki/RateLimiterExplained)
- [Kong Rate Limiting](https://docs.konghq.com/hub/kong-inc/rate-limiting/)