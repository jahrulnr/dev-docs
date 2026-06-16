# HTTP Protocols

## Overview

HTTP (Hypertext Transfer Protocol) is the application-layer protocol behind most web and API traffic. Clients send **requests**; servers return **responses** with status codes, headers, and optional bodies. HTTP is stateless — each request is independent unless the application adds sessions, cookies, or tokens.

Versions evolved for performance: **HTTP/1.1** (1997, persistent connections), **HTTP/2** (2015, multiplexing, HPACK header compression), **HTTP/3** (2022, QUIC over UDP, reduced head-of-line blocking). HTTPS wraps HTTP in TLS for confidentiality and integrity.

HTTP fits REST APIs, static assets, webhooks, and as a transport upgrade path (e.g. WebSocket). Choose HTTP/2 or HTTP/3 when latency and connection count matter; semantics (methods, status codes) stay the same across versions.

## Key concepts

### Request methods

| Method | Typical use |
|--------|-------------|
| GET | Read resource; safe, idempotent |
| POST | Create resource or non-idempotent action |
| PUT | Replace resource at URL |
| PATCH | Partial update |
| DELETE | Remove resource |
| HEAD | Like GET without body (metadata only) |
| OPTIONS | Supported methods and CORS preflight |

### Status codes

| Range | Meaning | Common codes |
|-------|---------|--------------|
| 1xx | Informational | 100 Continue |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved Permanently, 304 Not Modified |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests |
| 5xx | Server error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

**401 vs 403**: 401 — authentication missing or invalid; 403 — authenticated but not authorized.

**404 vs 200 with empty list**: 404 when the resource ID does not exist; 200 with `[]` when the collection query is valid but has no matches.

### Headers

Common request/response headers:

- **Content-Type** / **Accept** — body format and content negotiation
- **Authorization** — credentials (Bearer token, etc.)
- **Cache-Control** / **ETag** — caching behavior
- **Location** — URI of created resource (with 201)
- **CORS** — `Access-Control-*` for browser cross-origin access

### Version comparison

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---------|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP) |
| Multiplexing | No (per connection) | Yes | Yes |
| Header compression | No | HPACK | QPACK |
| Head-of-line blocking | Yes | Partial (TCP) | Reduced |

## Example: REST request and response

```http
GET /api/orders/ORD-123 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=60
ETag: "a1b2c3"

{
  "id": "ORD-123",
  "status": "confirmed",
  "items": [
    { "sku": "WIDGET-01", "quantity": 2, "unitPrice": 29.99 }
  ],
  "totalAmount": 59.98
}
```

```http
POST /api/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{"customerId": "CUST-456", "items": [{"sku": "WIDGET-01", "quantity": 1}]}

HTTP/1.1 201 Created
Location: /api/orders/ORD-124
Content-Type: application/json

{"id": "ORD-124", "status": "pending"}
```

Production APIs should use HTTPS, consistent error bodies for 4xx/5xx, and appropriate cache headers on safe GET responses.

## Related

- [gRPC](grpc_en.md)
- [GraphQL](graphql_en.md)
- [WebSocket](websocket_en.md)

## References

- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110)
