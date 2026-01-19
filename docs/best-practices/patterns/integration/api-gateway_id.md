# API Gateway

## Gambaran Umum

API Gateway adalah pola arsitektur yang menyediakan titik masuk tunggal untuk permintaan klien ke beberapa microservices. Ini bertindak sebagai reverse proxy dan lapisan manajemen API, merutekan permintaan ke layanan backend yang sesuai sambil menangani masalah lintas seperti autentikasi, pembatasan laju, logging, transformasi permintaan/respons, dan terjemahan protokol.

Manfaat termasuk kontrol akses terpusat dan kebijakan keamanan, integrasi klien yang disederhanakan dengan menyediakan antarmuka API terpadu, skalabilitas yang ditingkatkan melalui load balancing dan caching, observabilitas yang lebih baik dengan logging dan monitoring terpusat, dan kemampuan untuk mengembangkan layanan backend tanpa memengaruhi klien.

## Komponen Utama

- **Klien**: Aplikasi frontend (web, mobile, perangkat IoT) yang membuat permintaan API.
- **API Gateway**: Titik masuk pusat yang menerima semua permintaan klien, menerapkan kebijakan, dan merutekannya ke layanan yang sesuai.
- **Microservices**: Layanan backend individu yang menangani domain bisnis tertentu.
- **Layanan Autentikasi/Otorisasi**: Menangani verifikasi identitas pengguna dan kontrol akses.
- **Pembatas Laju**: Mengontrol frekuensi permintaan untuk mencegah penyalahgunaan dan memastikan penggunaan yang adil.
- **Load Balancer**: Mendistribusikan lalu lintas di seluruh beberapa instance layanan.

```text
[Aplikasi Klien]
      |
      v
+-------------+     Routing     +-----------------+
| API Gateway |  ----------->   | Microservice A  |
| - Auth      |                 +-----------------+
| - Rate Limit|     Routing     +-----------------+
| - Logging   |  ----------->   | Microservice B  |
+-------------+                 +-----------------+
      ^
      |
[Transformasi Respons]
```

## Kapan Menggunakan

Gunakan API Gateway di arsitektur microservices untuk menyediakan titik masuk terpadu untuk klien. Saat mengimplementasikan masalah lintas seperti autentikasi, pembatasan laju, dan logging secara terpusat. Untuk terjemahan protokol (misalnya, REST ke GraphQL). Ketika Anda perlu menyembunyikan kompleksitas beberapa layanan dari klien. Dalam skenario yang memerlukan versioning API dan migrasi bertahap. Hindari di aplikasi monolitik sederhana atau ketika layanan dapat diakses langsung oleh klien tepercaya.

## Panduan Implementasi

1. Pilih solusi API Gateway: Pilih berdasarkan infrastruktur Anda (misalnya, Kong, Nginx, AWS API Gateway, Azure API Management, atau implementasi kustom).
2. Definisikan rute API dan layanan upstream: Petakan endpoint yang menghadap klien ke URL layanan backend.
3. Implementasikan autentikasi dan otorisasi: Integrasikan dengan penyedia identitas (OAuth, JWT, kunci API).
4. Tambahkan pembatasan laju dan throttling: Lindungi layanan dari penyalahgunaan menggunakan algoritma token bucket atau sliding window.
5. Konfigurasikan load balancing: Distribusikan permintaan di seluruh beberapa instance layanan.
6. Implementasikan transformasi permintaan/respons: Modifikasi payload, header, atau protokol sesuai kebutuhan.
7. Tambahkan monitoring dan logging: Pusatkan metrik, jejak, dan log untuk observabilitas.
8. Tangani kesalahan dengan baik: Berikan respons kesalahan yang konsisten dan mekanisme fallback.
9. Amankan komunikasi: Gunakan HTTPS/TLS dan pertimbangkan mutual TLS untuk komunikasi layanan-ke-layanan.
10. Rencanakan skalabilitas: Pastikan gateway dapat menangani lalu lintas yang meningkat dan implementasikan strategi caching.

## Contoh

Di platform e-commerce, API Gateway menangani autentikasi pengguna, merutekan permintaan katalog produk ke layanan katalog, permintaan pesanan ke layanan pesanan, dan permintaan pembayaran ke layanan pembayaran.

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "time"
)

type APIGateway struct {
    router *gin.Engine
}

func NewAPIGateway() *APIGateway {
    r := gin.Default()
    
    // Middleware autentikasi
    r.Use(authMiddleware())
    
    // Middleware pembatas laju
    r.Use(rateLimitMiddleware())
    
    // Rute
    r.GET("/api/products", proxyToService("catalog-service:8080"))
    r.POST("/api/orders", proxyToService("order-service:8081"))
    r.POST("/api/payments", proxyToService("payment-service:8082"))
    
    return &APIGateway{router: r}
}

func authMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
            return
        }
        // Logika validasi token di sini
        c.Next()
    }
}

func rateLimitMiddleware() gin.HandlerFunc {
    // Implementasi pembatas laju sederhana
    limiter := time.Tick(time.Second / 10) // 10 permintaan per detik
    
    return func(c *gin.Context) {
        <-limiter
        c.Next()
    }
}

func proxyToService(target string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Logika proxy untuk meneruskan permintaan ke target layanan
        // Di implementasi nyata, gunakan httputil.ReverseProxy
        c.JSON(200, gin.H{"message": "Proxied to " + target})
    }
}

func main() {
    gateway := NewAPIGateway()
    gateway.router.Run(":8080")
}
```

## Tautan

Untuk arsitektur microservices, lihat [Clean Architecture](../../architecture/clean-architecture_id.md). Untuk integrasi event-driven, periksa [Event-Driven Architecture](../../ecosystem/aws/event-driven_id.md). Untuk prinsip desain API, lihat [SOLID Principles](../../principles/solid_id.md).