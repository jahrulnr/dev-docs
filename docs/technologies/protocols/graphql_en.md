# GraphQL

## Overview

GraphQL is a query language for APIs and a runtime for executing those queries with your existing data. Developed by Facebook in 2012 and released as open source in 2015, GraphQL provides a more efficient, powerful, and flexible alternative to REST APIs. Instead of multiple endpoints returning fixed data structures, GraphQL allows clients to request exactly the data they need.

GraphQL solves many problems associated with REST APIs, including over-fetching (getting more data than needed) and under-fetching (not getting enough data, requiring multiple requests). It provides a single endpoint that can handle complex queries, mutations, and subscriptions.

## Key Concepts

- **Schema**: A strongly-typed definition of the API's data structure and operations
- **Query**: Read operations to fetch data from the server
- **Mutation**: Write operations to modify data on the server
- **Subscription**: Real-time operations for receiving data updates
- **Resolver**: Functions that handle the execution of GraphQL operations
- **Type System**: Defines the structure of data (Object types, Scalar types, Enum types, etc.)
- **Fields**: Properties of GraphQL types that can be queried
- **Arguments**: Parameters passed to fields for filtering, sorting, or pagination
- **Fragments**: Reusable pieces of GraphQL queries
- **Directives**: Instructions for the GraphQL execution engine

## When to Use

- APIs where clients need different data shapes
- Complex data relationships that are hard to represent in REST
- Reducing over-fetching and under-fetching of data
- Real-time applications requiring subscriptions
- APIs that serve multiple client types (web, mobile, etc.)
- Rapidly evolving APIs where schema changes are frequent
- Applications with complex filtering and aggregation needs
- Microservices architectures needing a unified API layer

## Examples

### GraphQL Schema Definition

```graphql
# Ecommerce GraphQL Schema
type Query {
  products(
    first: Int
    after: String
    category: String
    priceRange: PriceRangeInput
    search: String
  ): ProductConnection!
  
  product(id: ID!): Product
  
  categories: [Category!]!
  
  orders(customerId: ID!, first: Int, after: String): OrderConnection!
  
  customer(id: ID!): Customer
  
  cart(customerId: ID!): Cart
}

type Mutation {
  createProduct(input: CreateProductInput!): Product!
  
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  
  deleteProduct(id: ID!): DeletePayload!
  
  createOrder(input: CreateOrderInput!): Order!
  
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  
  addToCart(customerId: ID!, productId: ID!, quantity: Int!): CartItem!
  
  updateCartItem(cartItemId: ID!, quantity: Int!): CartItem!
  
  removeFromCart(cartItemId: ID!): DeletePayload!
  
  checkout(cartId: ID!, paymentInfo: PaymentInput!): Order!
}

type Subscription {
  productUpdated(productId: ID!): Product!
  
  orderStatusChanged(orderId: ID!): Order!
  
  inventoryChanged(productId: ID!): InventoryUpdate!
  
  cartUpdated(customerId: ID!): Cart!
}

# Core Types
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  currency: String!
  stockQuantity: Int!
  categories: [Category!]!
  images: [ProductImage!]!
  reviews: ReviewConnection!
  averageRating: Float
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category {
  id: ID!
  name: String!
  description: String
  parent: Category
  children: [Category!]!
  products(first: Int, after: String): ProductConnection!
}

type Order {
  id: ID!
  customer: Customer!
  items: [OrderItem!]!
  totalAmount: Float!
  currency: String!
  status: OrderStatus!
  shippingAddress: Address!
  billingAddress: Address!
  paymentMethod: PaymentMethod
  createdAt: DateTime!
  updatedAt: DateTime!
  trackingNumber: String
}

type Customer {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  addresses: [Address!]!
  orders(first: Int, after: String): OrderConnection!
  cart: Cart
}

type Cart {
  id: ID!
  customer: Customer!
  items: [CartItem!]!
  totalAmount: Float!
  currency: String!
  updatedAt: DateTime!
}

type CartItem {
  id: ID!
  product: Product!
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
  addedAt: DateTime!
}

# Input Types
input CreateProductInput {
  name: String!
  description: String
  price: Float!
  currency: String!
  stockQuantity: Int!
  categoryIds: [ID!]!
}

input UpdateProductInput {
  name: String
  description: String
  price: Float
  stockQuantity: Int
  categoryIds: [ID!]
}

input CreateOrderInput {
  customerId: ID!
  cartId: ID!
  shippingAddressId: ID!
  billingAddressId: ID!
  paymentMethodId: ID!
}

input PriceRangeInput {
  min: Float
  max: Float
}

input PaymentInput {
  method: PaymentMethodType!
  cardNumber: String
  expiryMonth: Int
  expiryYear: Int
  cvv: String
  paypalEmail: String
}

# Enums
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentMethodType {
  CREDIT_CARD
  DEBIT_CARD
  PAYPAL
  BANK_TRANSFER
  CASH_ON_DELIVERY
}

# Connection Types for Pagination
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  node: Product!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Scalar Types
scalar DateTime
scalar Email
scalar URL
```

### GraphQL Queries

```graphql
# Get product details with reviews
query GetProduct($productId: ID!) {
  product(id: $productId) {
    id
    name
    description
    price
    currency
    stockQuantity
    categories {
      id
      name
    }
    images {
      url
      altText
    }
    reviews(first: 5) {
      edges {
        node {
          id
          rating
          comment
          author {
            firstName
            lastName
          }
          createdAt
        }
      }
    }
    averageRating
  }
}

# Search products with filters
query SearchProducts($search: String, $category: String, $priceRange: PriceRangeInput) {
  products(
    first: 20
    search: $search
    category: $category
    priceRange: $priceRange
  ) {
    edges {
      node {
        id
        name
        price
        currency
        categories {
          name
        }
        images(first: 1) {
          url
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}

# Get customer order history
query GetCustomerOrders($customerId: ID!) {
  customer(id: $customerId) {
    id
    firstName
    lastName
    orders(first: 10) {
      edges {
        node {
          id
          totalAmount
          currency
          status
          createdAt
          items {
            product {
              name
            }
            quantity
            unitPrice
          }
        }
      }
    }
  }
}

# Get cart contents
query GetCart($customerId: ID!) {
  cart(customerId: $customerId) {
    id
    items {
      id
      product {
        id
        name
        price
        currency
        images(first: 1) {
          url
        }
      }
      quantity
      unitPrice
      totalPrice
    }
    totalAmount
    currency
  }
}
```

### GraphQL Mutations

```graphql
# Add product to cart
mutation AddToCart($customerId: ID!, $productId: ID!, $quantity: Int!) {
  addToCart(
    customerId: $customerId
    productId: $productId
    quantity: $quantity
  ) {
    id
    product {
      id
      name
      stockQuantity
    }
    quantity
    unitPrice
    totalPrice
  }
}

# Update cart item quantity
mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
  updateCartItem(cartItemId: $cartItemId, quantity: $quantity) {
    id
    quantity
    totalPrice
  }
}

# Create order from cart
mutation Checkout($cartId: ID!, $paymentInfo: PaymentInput!) {
  checkout(cartId: $cartId, paymentInfo: $paymentInfo) {
    id
    status
    totalAmount
    currency
    createdAt
    items {
      product {
        name
      }
      quantity
      unitPrice
    }
  }
}

# Update order status (admin operation)
mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
  updateOrderStatus(id: $orderId, status: $status) {
    id
    status
    updatedAt
  }
}
```

### GraphQL Subscriptions

```graphql
# Subscribe to product inventory changes
subscription OnProductUpdated($productId: ID!) {
  productUpdated(productId: $productId) {
    id
    name
    stockQuantity
    updatedAt
  }
}

# Subscribe to order status changes
subscription OnOrderStatusChanged($orderId: ID!) {
  orderStatusChanged(orderId: $orderId) {
    id
    status
    updatedAt
    trackingNumber
  }
}

# Subscribe to cart updates
subscription OnCartUpdated($customerId: ID!) {
  cartUpdated(customerId: $customerId) {
    id
    items {
      id
      product {
        name
      }
      quantity
      totalPrice
    }
    totalAmount
    currency
    updatedAt
  }
}
```

### Node.js GraphQL Server with Apollo Server

```javascript
const { ApolloServer, gql, PubSub } = require('apollo-server');
const pubsub = new PubSub();

// GraphQL Schema
const typeDefs = gql`
  ${schemaDefinition}
`;

// Resolvers
const resolvers = {
  Query: {
    products: async (_, { first, after, category, priceRange, search }) => {
      // Implement product fetching with filters
      const products = await Product.find({
        ...(category && { categories: category }),
        ...(priceRange && {
          price: {
            ...(priceRange.min && { $gte: priceRange.min }),
            ...(priceRange.max && { $lte: priceRange.max })
          }
        }),
        ...(search && {
          $or: [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
          ]
        })
      }).limit(first || 20);
      
      return {
        edges: products.map(product => ({
          node: product,
          cursor: product._id.toString()
        })),
        pageInfo: {
          hasNextPage: products.length === (first || 20),
          endCursor: products.length > 0 ? products[products.length - 1]._id.toString() : null
        },
        totalCount: await Product.countDocuments()
      };
    },
    
    product: async (_, { id }) => {
      return await Product.findById(id);
    },
    
    cart: async (_, { customerId }) => {
      return await Cart.findOne({ customer: customerId }).populate('items.product');
    }
  },
  
  Mutation: {
    addToCart: async (_, { customerId, productId, quantity }) => {
      const product = await Product.findById(productId);
      if (!product || product.stockQuantity < quantity) {
        throw new Error('Product not available');
      }
      
      let cart = await Cart.findOne({ customer: customerId });
      if (!cart) {
        cart = new Cart({ customer: customerId, items: [] });
      }
      
      const existingItem = cart.items.find(item => 
        item.product.toString() === productId
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * product.price;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          unitPrice: product.price,
          totalPrice: quantity * product.price
        });
      }
      
      cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      await cart.save();
      await cart.populate('items.product');
      
      // Publish cart update
      pubsub.publish('CART_UPDATED', { 
        cartUpdated: cart,
        customerId 
      });
      
      return cart.items[cart.items.length - 1];
    },
    
    checkout: async (_, { cartId, paymentInfo }) => {
      const cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Process payment (simplified)
      const paymentResult = await processPayment(cart, paymentInfo);
      if (!paymentResult.success) {
        throw new Error('Payment failed');
      }
      
      // Create order
      const order = new Order({
        customer: cart.customer,
        items: cart.items,
        totalAmount: cart.totalAmount,
        currency: cart.currency,
        status: 'CONFIRMED',
        paymentMethod: paymentResult.method
      });
      
      await order.save();
      
      // Clear cart
      await Cart.findByIdAndDelete(cartId);
      
      // Publish order status change
      pubsub.publish('ORDER_STATUS_CHANGED', { 
        orderStatusChanged: order 
      });
      
      return order;
    }
  },
  
  Subscription: {
    cartUpdated: {
      subscribe: (_, { customerId }) => 
        pubsub.asyncIterator(['CART_UPDATED'])
          .filter(event => event.customerId === customerId)
          .map(event => event.cartUpdated)
    },
    
    orderStatusChanged: {
      subscribe: (_, { orderId }) => 
        pubsub.asyncIterator(['ORDER_STATUS_CHANGED'])
          .filter(event => event.orderId === orderId)
          .map(event => event.orderStatusChanged)
    }
  }
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Add authentication context
    const token = req.headers.authorization || '';
    const user = getUserFromToken(token);
    return { user };
  }
});

server.listen().then(({ url }) => {
  console.log(`GraphQL server ready at ${url}`);
});
```

### React GraphQL Client with Apollo Client

```jsx
import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, gql } from '@apollo/client';

// Apollo Client setup
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache()
});

// GraphQL Queries
const GET_PRODUCTS = gql`
  query GetProducts($first: Int, $category: String) {
    products(first: $first, category: $category) {
      edges {
        node {
          id
          name
          price
          currency
          images(first: 1) {
            url
          }
        }
      }
    }
  }
`;

const GET_CART = gql`
  query GetCart($customerId: ID!) {
    cart(customerId: $customerId) {
      id
      items {
        id
        product {
          id
          name
          price
          images(first: 1) {
            url
          }
        }
        quantity
        totalPrice
      }
      totalAmount
      currency
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($customerId: ID!, $productId: ID!, $quantity: Int!) {
    addToCart(customerId: $customerId, productId: $productId, quantity: $quantity) {
      id
      quantity
      totalPrice
    }
  }
`;

// Product List Component
function ProductList({ category }) {
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: { first: 20, category }
  });
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <div className="product-list">
      {data.products.edges.map(({ node: product }) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Product Card Component
function ProductCard({ product }) {
  const [addToCart, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART, variables: { customerId: 'current-user-id' } }]
  });
  
  const handleAddToCart = () => {
    addToCart({
      variables: {
        customerId: 'current-user-id',
        productId: product.id,
        quantity: 1
      }
    });
  };
  
  return (
    <div className="product-card">
      <img src={product.images[0]?.url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.currency} {product.price}</p>
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}

// Cart Component
function Cart() {
  const { loading, error, data, subscribeToMore } = useQuery(GET_CART, {
    variables: { customerId: 'current-user-id' }
  });
  
  React.useEffect(() => {
    // Subscribe to cart updates
    const unsubscribe = subscribeToMore({
      document: gql`
        subscription OnCartUpdated($customerId: ID!) {
          cartUpdated(customerId: $customerId) {
            id
            items {
              id
              product { name }
              quantity
              totalPrice
            }
            totalAmount
            currency
          }
        }
      `,
      variables: { customerId: 'current-user-id' },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return {
          cart: subscriptionData.data.cartUpdated
        };
      }
    });
    
    return () => unsubscribe();
  }, [subscribeToMore]);
  
  if (loading) return <p>Loading cart...</p>;
  if (error) return <p>Cart error: {error.message}</p>;
  if (!data.cart) return <p>Cart is empty</p>;
  
  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      {data.cart.items.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.product.name}</span>
          <span>{item.quantity} x {data.cart.currency} {item.product.price}</span>
          <span>{data.cart.currency} {item.totalPrice}</span>
        </div>
      ))}
      <div className="cart-total">
        Total: {data.cart.currency} {data.cart.totalAmount}
      </div>
    </div>
  );
}

// App Component
function App() {
  return (
    <ApolloProvider client={client}>
      <div className="app">
        <header>
          <h1>Ecommerce Store</h1>
        </header>
        <main>
          <ProductList category="electronics" />
          <Cart />
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;
```

## Best Practices

- Design your schema thoughtfully with proper type relationships
- Use pagination for large datasets to prevent performance issues
- Implement proper error handling with custom error types
- Use fragments to reduce query duplication
- Implement authentication and authorization at the resolver level
- Use DataLoader to batch and cache database queries
- Implement proper caching strategies
- Use subscriptions sparingly for real-time features
- Version your schema properly for breaking changes
- Monitor query performance and complexity

### Schema Design Patterns

```graphql
# Connection Pattern for Pagination
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  node: Product!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Interface Pattern for Polymorphism
interface Node {
  id: ID!
}

interface ProductInterface implements Node {
  id: ID!
  name: String!
  price: Float!
  currency: String!
}

type PhysicalProduct implements ProductInterface & Node {
  id: ID!
  name: String!
  price: Float!
  currency: String!
  weight: Float
  dimensions: Dimensions
}

type DigitalProduct implements ProductInterface & Node {
  id: ID!
  name: String!
  price: Float!
  currency: String!
  downloadUrl: URL
  fileSize: Int
}

# Input Union Pattern
union SearchResult = Product | Category | Brand

type SearchResponse {
  results: [SearchResult!]!
  totalCount: Int!
}
```

### Performance Optimization

```javascript
// DataLoader for batching and caching
const DataLoader = require('dataloader');

const productLoader = new DataLoader(async (productIds) => {
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = {};
  products.forEach(product => {
    productMap[product._id.toString()] = product;
  });
  return productIds.map(id => productMap[id.toString()]);
});

const resolvers = {
  Order: {
    items: async (order) => {
      const items = await OrderItem.find({ order: order.id });
      // Batch load products
      const productIds = items.map(item => item.product);
      const products = await productLoader.loadMany(productIds);
      
      return items.map((item, index) => ({
        ...item.toObject(),
        product: products[index]
      }));
    }
  }
};
```

### Authentication and Authorization

```javascript
const resolvers = {
  Query: {
    orders: async (_, { customerId }, context) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Check if user can access these orders
      if (context.user.id !== customerId && !context.user.isAdmin) {
        throw new ForbiddenError('Access denied');
      }
      
      return await Order.find({ customer: customerId });
    }
  },
  
  Mutation: {
    updateOrderStatus: async (_, { id, status }, context) => {
      // Only admins can update order status
      if (!context.user || !context.user.isAdmin) {
        throw new ForbiddenError('Admin access required');
      }
      
      return await Order.findByIdAndUpdate(id, { status }, { new: true });
    }
  }
};
```

## GraphQL vs REST

| Feature | REST | GraphQL |
|---------|------|---------|
| Data Fetching | Multiple endpoints, over/under-fetching | Single endpoint, exact data needed |
| API Evolution | Versioning required for changes | Schema evolution with deprecation |
| Documentation | Manual (OpenAPI/Swagger) | Self-documenting schema |
| Real-time | Limited (polling/webhooks) | Native subscriptions |
| Caching | HTTP caching | Application-level caching |
| Client Complexity | Simple HTTP clients | GraphQL clients required |
| Server Complexity | Simple resolvers | Complex schema design |
| Performance | Multiple round trips | Single request optimization |
| Type Safety | Runtime validation | Compile-time guarantees |
| Learning Curve | Low | Medium-High |

## Related

- [HTTP](http_en.md)
- [gRPC](grpc_en.md)

## References

- [GraphQL Specification](https://spec.graphql.org/)
