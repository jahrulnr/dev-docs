# GraphQL

## Overview

GraphQL is a query language for APIs and a runtime for executing those queries against existing data sources. Developed at Meta and released as open source in 2015, it offers a flexible alternative to REST: clients describe the shape of data they need, and the server returns exactly that shape from a single endpoint.

GraphQL addresses common REST pain points — **over-fetching** (responses include unused fields) and **under-fetching** (multiple round trips to assemble a view). A strongly typed **schema** documents available types, queries, mutations, and subscriptions; **resolvers** connect schema fields to backing services or databases.

The trade-off is server complexity: query depth, resolver fan-out, and caching require deliberate design. GraphQL fits product APIs with varied clients, nested domain models, and evolving read shapes; it is a weaker default for simple CRUD resources or cache-friendly public HTTP APIs.

## Key concepts

- **Schema**: Strongly typed contract defining types, queries, mutations, and subscriptions
- **Query**: Read operation — client selects fields on types
- **Mutation**: Write operation — create, update, or delete data
- **Subscription**: Long-lived operation for server-pushed updates (often over WebSocket)
- **Resolver**: Function that fetches or computes a field value
- **Type system**: Object types, scalars, enums, interfaces, unions, and input types
- **Arguments**: Parameters on fields (filtering, pagination, IDs)
- **Fragments**: Reusable field selections within queries

## Schema basics

A minimal schema declares root operations and domain types. Resolvers map each field to data; the example below uses a generic orders domain.

```graphql
type Query {
  order(id: ID!): Order
  orders(first: Int, status: OrderStatus): [Order!]!
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
}

type Order {
  id: ID!
  customerId: ID!
  items: [OrderItem!]!
  totalAmount: Float!
  status: OrderStatus!
  createdAt: String!
}

type OrderItem {
  sku: String!
  quantity: Int!
  unitPrice: Float!
}

input CreateOrderInput {
  customerId: ID!
  items: [OrderItemInput!]!
}

input OrderItemInput {
  sku: String!
  quantity: Int!
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  CANCELLED
}
```

**Pagination**: Relay-style connections (`edges`, `pageInfo`, cursors) or offset/limit arguments are common for large lists. **Interfaces and unions** model polymorphic types when several shapes share fields.

## Example: query

Clients request only the fields they need. Variables keep operations reusable.

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    status
    totalAmount
    items {
      sku
      quantity
      unitPrice
    }
  }
}
```

Nested selections replace multiple REST calls when related data lives in one graph.

## Example: mutation

Mutations follow the same field-selection model as queries. Input types group write parameters.

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    totalAmount
    createdAt
  }
}
```

Use explicit error types or union results (`CreateOrderResult = Order | ValidationError`) when business rules can fail without a generic 500.

## Trade-offs vs REST

| Aspect | REST | GraphQL |
|--------|------|---------|
| Endpoints | Many resource URLs | Typically one `/graphql` endpoint |
| Data shape | Fixed per endpoint | Client-selected fields |
| Over/under-fetching | Common without BFF | Reduced when schema matches domain |
| Caching | HTTP cache (ETag, CDN) | Application-level; harder at the edge |
| Versioning | URL or header versions | Schema evolution + `@deprecated` |
| Real-time | Polling, SSE, Webhooks | Native subscriptions (with transport) |
| Client tooling | Any HTTP client | GraphQL client recommended |
| Server load | Predictable per route | Query complexity limits needed |

**When to prefer GraphQL**: Multiple clients with different data needs, deep object graphs, unified API over microservices.

**When to prefer REST**: Simple CRUD, heavy CDN caching, teams without GraphQL operational experience.

## Related

- [HTTP](http_en.md)
- [gRPC](grpc_en.md)
- [WebSocket](websocket_en.md)

## References

- [GraphQL Specification](https://spec.graphql.org/)
