# GraphQL

## Overview

GraphQL adalah query language untuk API dan runtime untuk menjalankan query tersebut terhadap sumber data yang ada. Dikembangkan di Meta dan dirilis sebagai open source pada 2015, GraphQL menawarkan alternatif yang fleksibel dibanding REST: client mendeskripsikan bentuk data yang dibutuhkan, dan server mengembalikan bentuk tersebut dari satu endpoint.

GraphQL mengatasi pain point REST yang umum — **over-fetching** (response berisi field yang tidak dipakai) dan **under-fetching** (beberapa round trip untuk menyusun satu view). **Schema** yang strongly typed mendokumentasikan tipe, query, mutation, dan subscription; **resolver** menghubungkan field schema ke service atau database di belakangnya.

Trade-off-nya ada di kompleksitas server: query depth, fan-out resolver, dan caching perlu desain yang disengaja. GraphQL cocok untuk product API dengan banyak client, model domain bersarang, dan bentuk read yang terus berubah; kurang ideal sebagai default untuk CRUD sederhana atau API publik yang mengandalkan HTTP cache.

## Key concepts

- **Schema**: Kontrak strongly typed yang mendefinisikan tipe, query, mutation, dan subscription
- **Query**: Operasi read — client memilih field pada tipe
- **Mutation**: Operasi write — create, update, atau delete data
- **Subscription**: Operasi long-lived untuk update yang di-push server (sering lewat WebSocket)
- **Resolver**: Fungsi yang mengambil atau menghitung nilai field
- **Type system**: Object types, scalars, enums, interfaces, unions, dan input types
- **Arguments**: Parameter pada field (filtering, pagination, ID)
- **Fragments**: Seleksi field yang dapat dipakai ulang dalam query

## Schema basics

Schema minimal mendeklarasikan root operations dan tipe domain. Resolver memetakan setiap field ke data; contoh di bawah memakai domain orders generik.

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

**Pagination**: Connection gaya Relay (`edges`, `pageInfo`, cursors) atau argumen offset/limit umum untuk daftar besar. **Interfaces dan unions** memodelkan tipe polimorfik ketika beberapa bentuk berbagi field.

## Example: query

Client hanya meminta field yang dibutuhkan. Variables membuat operasi dapat dipakai ulang.

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

Seleksi bersarang menggantikan beberapa panggilan REST ketika data terkait ada dalam satu graph.

## Example: mutation

Mutation mengikuti model seleksi field yang sama dengan query. Input types mengelompokkan parameter write.

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

Gunakan tipe error eksplisit atau union result (`CreateOrderResult = Order | ValidationError`) ketika aturan bisnis bisa gagal tanpa generic 500.

## Trade-offs vs REST

| Aspek | REST | GraphQL |
|-------|------|---------|
| Endpoints | Banyak URL resource | Biasanya satu endpoint `/graphql` |
| Bentuk data | Tetap per endpoint | Field dipilih client |
| Over/under-fetching | Umum tanpa BFF | Berkurang jika schema selaras dengan domain |
| Caching | HTTP cache (ETag, CDN) | Application-level; lebih sulit di edge |
| Versioning | Versi URL atau header | Evolusi schema + `@deprecated` |
| Real-time | Polling, SSE, Webhooks | Subscription native (dengan transport) |
| Client tooling | HTTP client apa pun | GraphQL client disarankan |
| Beban server | Prediktif per route | Perlu batas kompleksitas query |

**Kapan memilih GraphQL**: Banyak client dengan kebutuhan data berbeda, object graph dalam, API terpadu di atas microservices.

**Kapan memilih REST**: CRUD sederhana, caching CDN berat, tim tanpa pengalaman operasional GraphQL.

## Related

- [HTTP](http_id.md)
- [gRPC](grpc_id.md)
- [WebSocket](websocket_id.md)

## References

- [GraphQL Specification](https://spec.graphql.org/)
