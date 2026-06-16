# HTTP Protocols

## Overview

HTTP (Hypertext Transfer Protocol) adalah protokol application-layer di balik sebagian besar lalu lintas web dan API. Client mengirim **request**; server mengembalikan **response** dengan status code, headers, dan body opsional. HTTP bersifat stateless — setiap request independen kecuali aplikasi menambahkan session, cookie, atau token.

Versi berkembang untuk performa: **HTTP/1.1** (1997, persistent connections), **HTTP/2** (2015, multiplexing, kompresi header HPACK), **HTTP/3** (2022, QUIC di atas UDP, head-of-line blocking berkurang). HTTPS membungkus HTTP dengan TLS untuk kerahasiaan dan integritas.

HTTP cocok untuk REST API, aset statis, webhook, dan sebagai jalur upgrade transport (mis. WebSocket). Pilih HTTP/2 atau HTTP/3 ketika latensi dan jumlah koneksi penting; semantik (methods, status codes) sama di semua versi.

## Key concepts

### Request methods

| Method | Use case umum |
|--------|---------------|
| GET | Read resource; safe, idempotent |
| POST | Create resource atau aksi non-idempotent |
| PUT | Ganti resource di URL |
| PATCH | Partial update |
| DELETE | Hapus resource |
| HEAD | Seperti GET tanpa body (metadata saja) |
| OPTIONS | Method yang didukung dan CORS preflight |

### Status codes

| Range | Arti | Kode umum |
|-------|------|-----------|
| 1xx | Informational | 100 Continue |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved Permanently, 304 Not Modified |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests |
| 5xx | Server error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

**401 vs 403**: 401 — autentikasi hilang atau tidak valid; 403 — terautentikasi tetapi tidak berwenang.

**404 vs 200 dengan daftar kosong**: 404 ketika ID resource tidak ada; 200 dengan `[]` ketika query collection valid tetapi tidak ada hasil.

### Headers

Header request/response umum:

- **Content-Type** / **Accept** — format body dan content negotiation
- **Authorization** — kredensial (Bearer token, dll.)
- **Cache-Control** / **ETag** — perilaku caching
- **Location** — URI resource yang dibuat (dengan 201)
- **CORS** — `Access-Control-*` untuk akses cross-origin di browser

### Perbandingan versi

| Fitur | HTTP/1.1 | HTTP/2 | HTTP/3 |
|-------|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP) |
| Multiplexing | Tidak (per koneksi) | Ya | Ya |
| Kompresi header | Tidak | HPACK | QPACK |
| Head-of-line blocking | Ya | Parsial (TCP) | Berkurang |

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

API production sebaiknya memakai HTTPS, error body konsisten untuk 4xx/5xx, dan header cache yang sesuai pada GET yang aman.

## Related

- [gRPC](grpc_id.md)
- [GraphQL](graphql_id.md)
- [WebSocket](websocket_id.md)

## References

- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110)
