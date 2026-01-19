# HTTP Protocols

## Overview

HTTP (Hypertext Transfer Protocol) is the foundation of data communication on the World Wide Web. It defines how messages are formatted and transmitted between web browsers and web servers. HTTP has evolved through several versions: HTTP/1.1 (1997), HTTP/2 (2015), and HTTP/3 (2022), each bringing improvements in performance, security, and efficiency.

HTTP is a stateless, application-layer protocol that operates over TCP (HTTP/1.1 and HTTP/2) or QUIC (HTTP/3). It uses a request-response model where clients send requests to servers, which then respond with the requested resources.

## Key Concepts

- **Request Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Status Codes**: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), 5xx (Server Error)
- **Headers**: Metadata sent with requests/responses (Content-Type, Authorization, Cache-Control)
- **Connection Types**: Keep-alive (persistent connections), Pipelining, Multiplexing
- **Security**: HTTPS (HTTP over TLS), HSTS, CSP

### HTTP Versions Comparison

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---------|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP-based) |
| Connections | Multiple per host | Single per host | Single per host |
| Multiplexing | No | Yes | Yes |
| Header Compression | No | HPACK | QPACK |
| Server Push | No | Yes | Yes |
| Head-of-Line Blocking | Yes | Partial | No |

## When to Use

- Web APIs and RESTful services
- Web applications and SPAs
- Microservices communication
- File transfers and media streaming
- IoT device communication
- Real-time applications (with WebSocket upgrade)

## Examples

### HTTP/1.1 Request/Response

```http
GET /api/products HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer token123

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 123

[{"id": 1, "name": "Product A", "price": 29.99}]
```

### HTTP/2 Features

```http
# Multiplexing multiple requests over single connection
GET /api/products
GET /api/categories
GET /api/users
# All sent simultaneously over one TCP connection
```

### HTTP/3 with QUIC

```http
# Uses UDP instead of TCP for better performance
# Built-in encryption (QUIC includes TLS 1.3)
# Faster connection establishment
```

## Best Practices

- Use HTTPS for all production traffic
- Implement proper caching headers (Cache-Control, ETag)
- Use appropriate status codes
- Implement rate limiting and throttling
- Compress responses (gzip, brotli)
- Use HTTP/2 or HTTP/3 for better performance
- Implement CORS properly for web applications
- Use semantic versioning for API changes

### HTTP Status Codes Best Practices

#### 2xx Success Codes
- **200 OK**: Use for successful GET, PUT, PATCH requests
- **201 Created**: Use when creating new resources (POST)
- **202 Accepted**: Use for async operations that will complete later
- **204 No Content**: Use for successful requests with no response body (DELETE, PUT)

#### 3xx Redirection Codes
- **301 Moved Permanently**: Use for permanent URL changes (SEO friendly)
- **302 Found**: Use for temporary redirects
- **307 Temporary Redirect**: Preserves request method (use over 302 for APIs)
- **308 Permanent Redirect**: Preserves request method for permanent moves

#### 4xx Client Error Codes
- **400 Bad Request**: Use for malformed requests or validation errors
- **401 Unauthorized**: Use when authentication is required but missing/invalid
- **403 Forbidden**: Use when authentication succeeds but authorization fails
- **404 Not Found**: Use when resource doesn't exist
- **405 Method Not Allowed**: Use when HTTP method isn't supported for the resource
- **409 Conflict**: Use for conflicts (e.g., duplicate resources)
- **422 Unprocessable Entity**: Use for validation errors with detailed messages
- **429 Too Many Requests**: Use with rate limiting

#### 5xx Server Error Codes
- **500 Internal Server Error**: Use for unexpected server errors (avoid overusing)
- **502 Bad Gateway**: Use when upstream server returns invalid response
- **503 Service Unavailable**: Use during maintenance or overload
- **504 Gateway Timeout**: Use when upstream server doesn't respond in time

#### Ecommerce-Specific Status Code Usage
```javascript
// Product API examples
GET /api/products/123
// 200: Product found and returned
// 404: Product doesn't exist
// 410: Product was deleted (soft delete)

POST /api/orders
// 201: Order created successfully
// 400: Invalid order data
// 409: Order conflicts (e.g., out of stock)
// 422: Business rule violation (e.g., minimum order amount)

PUT /api/cart
// 200: Cart updated
// 204: Cart cleared (no content)
// 400: Invalid cart items
// 401: User not authenticated
```

### Common Confusing Scenarios

#### 401 Unauthorized vs 403 Forbidden
- **401 Unauthorized**: Use when authentication is missing or invalid
  - User not logged in
  - Invalid/malformed token
  - Token expired
- **403 Forbidden**: Use when authentication succeeds but user lacks permission
  - Logged-in user trying to access admin-only resource
  - User trying to modify someone else's data
  - Account suspended/blocked

```javascript
// Examples
GET /api/admin/users (user not logged in)
// 401: "Authentication required"

GET /api/admin/users (logged in as regular user)
// 403: "Insufficient permissions"
```

#### 404 Not Found vs 200 OK with Empty Data
- **404 Not Found**: Use when the resource conceptually doesn't exist
  - Invalid product ID in URL
  - Non-existent user profile
  - Deleted resource (hard delete)
- **200 OK with Empty Array/Object**: Use for valid queries that return no results
  - Search with no matches
  - Filtering that excludes all items
  - Collection endpoints with no data yet

```javascript
// Examples
GET /api/products/invalid-id
// 404: Product doesn't exist

GET /api/products?category=nonexistent
// 200: {"products": []} - Valid query, no results

GET /api/orders?status=shipped (new user)
// 200: {"orders": []} - Valid query, no orders yet
```

#### 400 Bad Request vs 422 Unprocessable Entity
- **400 Bad Request**: Use for malformed requests
  - Invalid JSON syntax
  - Missing required parameters
  - Wrong parameter types
- **422 Unprocessable Entity**: Use for valid requests that fail business rules
  - Validation errors with detailed messages
  - Business logic constraints
  - Data conflicts

```javascript
// Examples
POST /api/orders {"product_id": "invalid"}
// 400: Bad request format

POST /api/orders {"product_id": 123, "quantity": 1000}
// 422: "Insufficient stock - only 50 available"
```

#### 409 Conflict vs 422 Unprocessable Entity
- **409 Conflict**: Use for resource state conflicts
  - Duplicate creation attempts
  - Concurrent modification conflicts
  - Version conflicts
- **422 Unprocessable Entity**: Use for validation/business rule failures
  - Age restrictions
  - Business constraints
  - Data integrity issues

```javascript
// Examples
POST /api/users {"email": "existing@example.com"}
// 409: "User with this email already exists"

POST /api/orders {"user_age": 15}
// 422: "Must be 18 or older to place orders"
```

#### 500 Internal Server Error vs 503 Service Unavailable
- **500 Internal Server Error**: Use for unexpected server errors
  - Code bugs
  - Database connection failures
  - Unexpected exceptions
- **503 Service Unavailable**: Use for planned/unplanned outages
  - Maintenance windows
  - Service overload
  - Upstream service failures

```javascript
// Examples
GET /api/products (database crash)
// 500: "Internal server error"

GET /api/products (scheduled maintenance)
// 503: "Service temporarily unavailable"
```

#### 406 Not Acceptable vs 200 OK
- **406 Not Acceptable**: Use when server cannot produce response matching client's Accept headers
  - Client requests JSON but server only supports XML
  - Content negotiation fails for media types
  - API versioning conflicts
- **200 OK**: Use when content is acceptable or no specific content type requested
  - Default response format
  - Client accepts multiple formats
  - No content negotiation required

```javascript
// Examples
GET /api/products
Accept: application/xml
// Server only supports JSON
// 406: "Not Acceptable - only JSON supported"

GET /api/products
Accept: application/json, application/xml
// Server supports JSON
// 200: Returns JSON (preferred format)
```

#### 400 Bad Request vs 406 Not Acceptable vs 415 Unsupported Media Type
- **400 Bad Request**: Malformed request syntax or invalid parameters
- **406 Not Acceptable**: Valid request but cannot satisfy content negotiation
- **415 Unsupported Media Type**: Request entity has unsupported Content-Type

```javascript
// Examples
POST /api/products {"name":}
// 400: Missing required fields

POST /api/products
Content-Type: application/json
Accept: text/html
// Server can't return HTML
// 406: Not acceptable content type

POST /api/products
Content-Type: text/plain
// Server expects JSON
// 415: Unsupported media type
```

#### 200 OK vs 201 Created vs 202 Accepted vs 204 No Content
- **200 OK**: Standard success response with content
- **201 Created**: Resource successfully created (include Location header)
- **202 Accepted**: Request accepted for processing (async operations)
- **204 No Content**: Success but no content to return

```javascript
// Examples
GET /api/products/123
// 200: {"id": 123, "name": "Product"}

POST /api/products
// 201: Location: /api/products/456

POST /api/reports/generate (async)
// 202: "Report generation started"

DELETE /api/cart/items/123
// 204: Item deleted, no content
```

## Integration with Ecommerce

HTTP protocols are fundamental to ecommerce systems:

- **API Communication**: Product catalogs, order processing, payment gateways
- **Web Applications**: User interfaces for shopping carts, checkout flows
- **Microservices**: Inter-service communication in distributed architectures
- **CDN Integration**: Content delivery for images, videos, static assets
- **Mobile Apps**: API consumption for native mobile ecommerce apps
- **Third-party Integrations**: Payment processors, shipping APIs, inventory systems

### Ecommerce-Specific Headers

```http
# Security headers
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY

# Performance headers
Cache-Control: public, max-age=3600
Accept-Encoding: gzip, deflate, br

# Ecommerce-specific
X-CSRF-Token: abc123
X-Requested-With: XMLHttpRequest
```