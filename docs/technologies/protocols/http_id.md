# Protokol HTTP

## Gambaran Umum

HTTP (Hypertext Transfer Protocol) adalah fondasi komunikasi data di World Wide Web. Ia mendefinisikan bagaimana pesan diformat dan dikirim antara web browser dan web server. HTTP telah berevolusi melalui beberapa versi: HTTP/1.1 (1997), HTTP/2 (2015), dan HTTP/3 (2022), masing-masing membawa peningkatan dalam performa, keamanan, dan efisiensi.

HTTP adalah protokol stateless, application-layer yang beroperasi di atas TCP (HTTP/1.1 dan HTTP/2) atau QUIC (HTTP/3). Ia menggunakan model request-response di mana klien mengirim request ke server, yang kemudian merespons dengan resource yang diminta.

## Konsep Utama

- **Request Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Status Codes**: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), 5xx (Server Error)
- **Headers**: Metadata yang dikirim dengan request/response (Content-Type, Authorization, Cache-Control)
- **Connection Types**: Keep-alive (persistent connections), Pipelining, Multiplexing
- **Security**: HTTPS (HTTP over TLS), HSTS, CSP

### Perbandingan Versi HTTP

| Fitur | HTTP/1.1 | HTTP/2 | HTTP/3 |
|-------|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP-based) |
| Connections | Multiple per host | Single per host | Single per host |
| Multiplexing | Tidak | Ya | Ya |
| Header Compression | Tidak | HPACK | QPACK |
| Server Push | Tidak | Ya | Ya |
| Head-of-Line Blocking | Ya | Partial | Tidak |

## Kapan Digunakan

- Web APIs dan layanan RESTful
- Aplikasi web dan SPAs
- Komunikasi microservices
- Transfer file dan streaming media
- Komunikasi perangkat IoT
- Aplikasi real-time (dengan upgrade WebSocket)

## Contoh

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

### Fitur HTTP/2

```http
# Multiplexing multiple requests over single connection
GET /api/products
GET /api/categories
GET /api/users
# Semua dikirim simultan over satu TCP connection
```

### HTTP/3 dengan QUIC

```http
# Menggunakan UDP instead of TCP untuk performa lebih baik
# Built-in encryption (QUIC include TLS 1.3)
# Connection establishment lebih cepat
```

## Praktik Terbaik

- Gunakan HTTPS untuk semua trafik produksi
- Implementasikan header caching proper (Cache-Control, ETag)
- Gunakan status code yang sesuai
- Implementasikan rate limiting dan throttling
- Kompresi response (gzip, brotli)
- Gunakan HTTP/2 atau HTTP/3 untuk performa lebih baik
- Implementasikan CORS proper untuk aplikasi web
- Gunakan semantic versioning untuk perubahan API

### Praktik Terbaik Kode Status HTTP

#### Kode 2xx Sukses
- **200 OK**: Gunakan untuk request GET, PUT, PATCH yang berhasil
- **201 Created**: Gunakan saat membuat resource baru (POST)
- **202 Accepted**: Gunakan untuk operasi async yang akan selesai nanti
- **204 No Content**: Gunakan untuk request berhasil tanpa response body (DELETE, PUT)

#### Kode 3xx Redirect
- **301 Moved Permanently**: Gunakan untuk perubahan URL permanen (SEO friendly)
- **302 Found**: Gunakan untuk redirect sementara
- **307 Temporary Redirect**: Pertahankan method request (gunakan daripada 302 untuk API)
- **308 Permanent Redirect**: Pertahankan method request untuk perpindahan permanen

#### Kode 4xx Error Klien
- **400 Bad Request**: Gunakan untuk request malformed atau error validasi
- **401 Unauthorized**: Gunakan saat autentikasi diperlukan tapi missing/invalid
- **403 Forbidden**: Gunakan saat autentikasi berhasil tapi otorisasi gagal
- **404 Not Found**: Gunakan saat resource tidak ada
- **405 Method Not Allowed**: Gunakan saat HTTP method tidak didukung untuk resource
- **409 Conflict**: Gunakan untuk konflik (e.g., resource duplikat)
- **422 Unprocessable Entity**: Gunakan untuk error validasi dengan pesan detail
- **429 Too Many Requests**: Gunakan dengan rate limiting

#### Kode 5xx Error Server
- **500 Internal Server Error**: Gunakan untuk error server tak terduga (hindari overuse)
- **502 Bad Gateway**: Gunakan saat upstream server return response invalid
- **503 Service Unavailable**: Gunakan saat maintenance atau overload
- **504 Gateway Timeout**: Gunakan saat upstream server tidak respond dalam waktu

#### Penggunaan Kode Status Spesifik Ecommerce
```javascript
// Contoh API produk
GET /api/products/123
// 200: Produk ditemukan dan dikembalikan
// 404: Produk tidak ada
// 410: Produk dihapus (soft delete)

POST /api/orders
// 201: Order berhasil dibuat
// 400: Data order invalid
// 409: Konflik order (e.g., out of stock)
// 422: Pelanggaran business rule (e.g., minimum order amount)

PUT /api/cart
// 200: Cart diupdate
// 204: Cart dikosongkan (no content)
// 400: Cart items invalid
// 401: User tidak terautentikasi
```

### Skenario Membingungkan yang Umum

#### 401 Unauthorized vs 403 Forbidden
- **401 Unauthorized**: Gunakan saat autentikasi missing atau invalid
  - User tidak login
  - Token invalid/malformed
  - Token expired
- **403 Forbidden**: Gunakan saat autentikasi berhasil tapi user kurang permission
  - User login mencoba akses resource admin-only
  - User mencoba modify data orang lain
  - Account suspended/blocked

```javascript
// Contoh
GET /api/admin/users (user tidak login)
// 401: "Authentication required"

GET /api/admin/users (login sebagai user regular)
// 403: "Insufficient permissions"
```

#### 404 Not Found vs 200 OK dengan Data Kosong
- **404 Not Found**: Gunakan saat resource secara konseptual tidak ada
  - Invalid product ID di URL
  - User profile tidak ada
  - Resource dihapus (hard delete)
- **200 OK dengan Array/Object Kosong**: Gunakan untuk query valid yang return no results
  - Search tanpa match
  - Filtering yang exclude semua items
  - Collection endpoints tanpa data

```javascript
// Contoh
GET /api/products/invalid-id
// 404: Product doesn't exist

GET /api/products?category=nonexistent
// 200: {"products": []} - Query valid, no results

GET /api/orders?status=shipped (user baru)
// 200: {"orders": []} - Query valid, belum ada orders
```

#### 400 Bad Request vs 422 Unprocessable Entity
- **400 Bad Request**: Gunakan untuk request malformed
  - Invalid JSON syntax
  - Missing required parameters
  - Wrong parameter types
- **422 Unprocessable Entity**: Gunakan untuk request valid yang gagal business rules
  - Validation errors dengan pesan detail
  - Business logic constraints
  - Data conflicts

```javascript
// Contoh
POST /api/orders {"product_id": "invalid"}
// 400: Bad request format

POST /api/orders {"product_id": 123, "quantity": 1000}
// 422: "Insufficient stock - only 50 available"
```

#### 409 Conflict vs 422 Unprocessable Entity
- **409 Conflict**: Gunakan untuk konflik state resource
  - Duplicate creation attempts
  - Concurrent modification conflicts
  - Version conflicts
- **422 Unprocessable Entity**: Gunakan untuk validation/business rule failures
  - Age restrictions
  - Business constraints
  - Data integrity issues

```javascript
// Contoh
POST /api/users {"email": "existing@example.com"}
// 409: "User with this email already exists"

POST /api/orders {"user_age": 15}
// 422: "Must be 18 or older to place orders"
```

#### 500 Internal Server Error vs 503 Service Unavailable
- **500 Internal Server Error**: Gunakan untuk error server tak terduga
  - Code bugs
  - Database connection failures
  - Unexpected exceptions
- **503 Service Unavailable**: Gunakan untuk outage planned/unplanned
  - Maintenance windows
  - Service overload
  - Upstream service failures

```javascript
// Contoh
GET /api/products (database crash)
// 500: "Internal server error"

GET /api/products (scheduled maintenance)
// 503: "Service temporarily unavailable"
```

#### 406 Not Acceptable vs 200 OK
- **406 Not Acceptable**: Gunakan saat server tidak bisa produce response matching Accept headers klien
  - Klien request JSON tapi server hanya support XML
  - Content negotiation gagal untuk media types
  - Konflik API versioning
- **200 OK**: Gunakan saat content acceptable atau tidak ada content type spesifik yang diminta
  - Default response format
  - Klien accept multiple formats
  - Tidak perlu content negotiation

```javascript
// Contoh
GET /api/products
Accept: application/xml
// Server hanya support JSON
// 406: "Not Acceptable - only JSON supported"

GET /api/products
Accept: application/json, application/xml
// Server support JSON
// 200: Return JSON (format preferred)
```

#### 400 Bad Request vs 406 Not Acceptable vs 415 Unsupported Media Type
- **400 Bad Request**: Syntax request malformed atau parameters invalid
- **406 Not Acceptable**: Request valid tapi tidak bisa satisfy content negotiation
- **415 Unsupported Media Type**: Request entity punya Content-Type yang tidak didukung

```javascript
// Contoh
POST /api/products {"name":}
// 400: Missing required fields

POST /api/products
Content-Type: application/json
Accept: text/html
// Server tidak bisa return HTML
// 406: Not acceptable content type

POST /api/products
Content-Type: text/plain
// Server expect JSON
// 415: Unsupported media type
```

#### 200 OK vs 201 Created vs 202 Accepted vs 204 No Content
- **200 OK**: Response sukses standar dengan content
- **201 Created**: Resource berhasil dibuat (include Location header)
- **202 Accepted**: Request diterima untuk processing (operasi async)
- **204 No Content**: Sukses tapi tidak ada content untuk return

```javascript
// Contoh
GET /api/products/123
// 200: {"id": 123, "name": "Product"}

POST /api/products
// 201: Location: /api/products/456

POST /api/reports/generate (async)
// 202: "Report generation started"

DELETE /api/cart/items/123
// 204: Item deleted, no content
```

## Integrasi dengan Ecommerce

Protokol HTTP fundamental untuk sistem ecommerce:

- **Komunikasi API**: Katalog produk, pemrosesan order, gateway pembayaran
- **Aplikasi Web**: Interface pengguna untuk shopping cart, flow checkout
- **Microservices**: Komunikasi inter-service di arsitektur terdistribusi
- **Integrasi CDN**: Content delivery untuk gambar, video, asset statis
- **Aplikasi Mobile**: Konsumsi API untuk native mobile ecommerce apps
- **Integrasi Third-party**: Payment processor, shipping APIs, sistem inventory

### Headers Spesifik Ecommerce

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