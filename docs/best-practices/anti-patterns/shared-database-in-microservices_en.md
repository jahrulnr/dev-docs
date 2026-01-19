# Shared Database in Microservices

## Overview

Shared Database in Microservices is an anti-pattern where multiple microservices share a single physical database or database schema. While it may seem efficient for data sharing, this approach creates tight coupling between services, preventing independent evolution and increasing the risk of systemic failures.

## Why It's a Problem

### Root Causes
- **Perceived Efficiency**: Sharing a database appears simpler than managing multiple databases.
- **Legacy Migration**: Transitioning from monolithic to microservices without refactoring the data layer.
- **Lack of Understanding**: Not understanding bounded context principles in Domain-Driven Design.

### Negative Impacts
- **Tight Coupling**: Schema changes in one service affect others.
- **Deployment Coordination**: Difficult to deploy services independently due to database dependencies.
- **Scalability Issues**: Database becomes a bottleneck for all services.
- **Data Consistency**: Hard to maintain consistency without distributed transactions.
- **Evolutionary Lock**: Difficult to evolve data models per domain requirements.

## Mitigation and Solutions

### Database per Service
- Each microservice owns its own database (dedicated instance or schema).
- Use database technology appropriate to the service's needs.

### Bounded Contexts
- Define clear domain boundaries.
- Each bounded context has its own data model.

### Data Sharing Patterns
- **Event-Driven Communication**: Publish events for data changes.
- **API Composition**: Services call APIs of other services for data.
- **CQRS**: Separate read/write models for complex queries.

### Implementation Example

#### Before (Anti-pattern)
```sql
-- Single database for all services
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  -- Fields for order service
  last_order_date DATE,
  -- Fields for payment service
  credit_limit DECIMAL
);
```

#### After (Best Practice)
```sql
-- User Service Database
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

-- Order Service Database
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  order_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) -- Via API call
);
```

#### Event-Driven Approach
```javascript
// User Service publishes event
eventBus.publish('user.updated', {
  userId: 123,
  newEmail: 'new@example.com'
});

// Order Service subscribes
eventBus.subscribe('user.updated', (event) => {
  updateOrderContact(event.userId, event.newEmail);
});
```

## Best Practices

- **Domain-Driven Design**: Use bounded contexts to define data ownership.
- **Event Sourcing**: Track data changes as events for consistency.
- **Saga Pattern**: Handle distributed transactions without 2PC.
- **API Gateway**: Centralized access for cross-service data needs.

## Tools and Technologies

- **Databases**: PostgreSQL, MongoDB per service
- **Message Brokers**: Apache Kafka, RabbitMQ for events
- **API Gateways**: Kong, Traefik for service communication
- **Service Meshes**: Istio for observability

## Common Mistakes

- **Shared Tables**: Sharing tables within one database.
- **Cross-Service Queries**: Services directly querying other services' databases.
- **Schema Coupling**: Schema changes affecting multiple services.
- **Transactional Boundaries**: ACID transactions across services.

## References

- "Building Microservices" by Sam Newman
- "Domain-Driven Design" by Eric Evans
- Microsoft Microservices Architecture guidance
- Martin Fowler's blog on Microservices
- Confluent documentation on Event Streaming