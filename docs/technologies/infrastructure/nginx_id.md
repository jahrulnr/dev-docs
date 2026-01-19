# Nginx

## Gambaran Umum

Nginx adalah high-performance HTTP dan reverse proxy server, serta IMAP/POP3 proxy server. Awalnya dibuat untuk menyelesaikan masalah C10K (menangani 10.000 koneksi concurrent), Nginx telah menjadi salah satu web server paling populer di dunia. Nginx unggul dalam serving static content, load balancing, caching, dan bertindak sebagai reverse proxy.

Nginx menggunakan arsitektur asynchronous, event-driven yang membuatnya lightweight dan efisien. Nginx dapat menangani ribuan koneksi concurrent dengan penggunaan resource minimal, menjadikannya ideal untuk website dan API dengan traffic tinggi.

## Konsep Utama

- **Reverse Proxy**: Server yang berada di antara clients dan backend servers
- **Load Balancing**: Distribusi traffic di seluruh multiple servers
- **Caching**: Menyimpan content yang sering diakses untuk meningkatkan performa
- **SSL/TLS Termination**: Menangani enkripsi/dekripsi di level proxy
- **Rate Limiting**: Mengontrol request rates untuk mencegah abuse
- **WebSockets**: Support untuk real-time bidirectional communication
- **HTTP/2**: Modern HTTP protocol dengan multiplexing dan header compression
- **Microcaching**: Short-term caching untuk dynamic content
- **Upstream Servers**: Backend servers yang di-proxy oleh Nginx
- **Locations**: URL matching dan routing rules

## Kapan Digunakan

- High-performance web serving dan content delivery
- Load balancing di seluruh multiple application servers
- Reverse proxy untuk microservices dan APIs
- SSL/TLS termination dan certificate management
- Static content serving dan caching
- Rate limiting dan DDoS protection
- WebSocket proxying untuk real-time applications
- API gateway functionality
- Media streaming dan video delivery
- Mobile application backends
- Content delivery network (CDN) components

## Contoh

### Konfigurasi Nginx Dasar

```nginx
# /etc/nginx/nginx.conf - File konfigurasi utama
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

### Konfigurasi Reverse Proxy

```nginx
# /etc/nginx/conf.d/api.conf - API reverse proxy
upstream api_backend {
    least_conn;
    server api-server-1:8080 weight=3;
    server api-server-2:8080 weight=3;
    server api-server-3:8080 weight=1 backup;
    keepalive 32;
}

server {
    listen 80;
    server_name api.ecommerce.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Load Balancing dengan Health Checks

```nginx
# Konfigurasi load balancing advanced
upstream ecommerce_app {
    ip_hash;  # Session persistence
    server app1.ecommerce.com:8080 weight=5 max_fails=3 fail_timeout=30s;
    server app2.ecommerce.com:8080 weight=5 max_fails=3 fail_timeout=30s;
    server app3.ecommerce.com:8080 weight=2 max_fails=3 fail_timeout=30s;
    server backup.ecommerce.com:8080 backup;

    # Health check (requires nginx-plus or openresty)
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "GET /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}

server {
    listen 80;
    server_name www.ecommerce.com;

    location / {
        proxy_pass http://ecommerce_app;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;

        # Sticky sessions alternative
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Cookie $http_cookie;
    }

    # Static content caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @proxy;
    }

    location @proxy {
        proxy_pass http://ecommerce_app;
    }
}
```

### Konfigurasi SSL/TLS

```nginx
# SSL configuration dengan modern security
server {
    listen 443 ssl http2;
    server_name secure.ecommerce.com;

    # SSL certificate configuration
    ssl_certificate /etc/ssl/certs/ecommerce.crt;
    ssl_certificate_key /etc/ssl/private/ecommerce.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # Modern configuration (Mozilla SSL Configuration Generator)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://backend;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name secure.ecommerce.com;
    return 301 https://$server_name$request_uri;
}
```

### Caching dan Microcaching

```nginx
# Microcaching untuk dynamic content
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=ecommerce_cache:10m max_size=1g
                 inactive=60m use_temp_path=off;

upstream app_backend {
    server app1:8080;
    server app2:8080;
}

server {
    listen 80;
    server_name api.ecommerce.com;

    # Cache settings
    proxy_cache ecommerce_cache;
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;

    # Cache key
    proxy_cache_key "$scheme$request_method$host$request_uri";

    # Bypass cache for authenticated users
    proxy_cache_bypass $http_authorization;

    # Add cache status header for debugging
    add_header X-Cache-Status $upstream_cache_status;

    location /api/ {
        proxy_pass http://app_backend;

        # Microcaching: cache for 1 second
        proxy_cache_valid 200 1s;
        proxy_ignore_headers Cache-Control Expires;

        # Don't cache POST/PUT/DELETE
        proxy_cache_methods GET HEAD;
    }

    # Static assets with long-term caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # No caching for sensitive endpoints
    location /api/user/ {
        proxy_pass http://app_backend;
        proxy_cache off;
    }
}
```

### Rate Limiting dan DDoS Protection

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $server_name zone=server:10m rate=100r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
limit_conn conn_limit_per_ip 10;
limit_conn_zone $server_name zone=conn_limit_per_server:10m;
limit_conn conn_limit_per_server 1000;

server {
    listen 80;
    server_name api.ecommerce.com;

    # Apply rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;

    # Brute force protection for login
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;

        if ($http_x_forwarded_for) {
            set $client_ip $http_x_forwarded_for;
        }

        # Block suspicious IPs (basic example)
        if ($client_ip ~* "^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)") {
            return 403;
        }

        proxy_pass http://auth_backend;
    }

    # API endpoints with different limits
    location /api/public/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://public_api;
    }

    location /api/private/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://private_api;
    }

    # DDoS protection
    location / {
        # Geo blocking (example)
        if ($geoip_country_code ~* "(CN|RU|IN)") {
            return 403 "Access denied from your region";
        }

        # User agent filtering
        if ($http_user_agent ~* "badbot|scanner") {
            return 403;
        }

        proxy_pass http://backend;
    }
}
```

### WebSocket Proxy

```nginx
# Konfigurasi WebSocket untuk real-time features
upstream websocket_backend {
    ip_hash;
    server ws1.ecommerce.com:8080;
    server ws2.ecommerce.com:8080;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name ws.ecommerce.com;

    location /ws {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket specific timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        # Disable buffering
        proxy_buffering off;
        proxy_cache off;
    }

    # Fallback for non-WebSocket requests
    location / {
        proxy_pass http://websocket_backend;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Konfigurasi API Gateway

```nginx
# API Gateway dengan routing dan authentication
lua_package_path "/etc/nginx/lua/?.lua;;";

upstream auth_service {
    server auth.ecommerce.com:8080;
}

upstream user_service {
    server user-service:8080;
}

upstream product_service {
    server product-service:8080;
}

upstream order_service {
    server order-service:8080;
}

server {
    listen 80;
    server_name api.ecommerce.com;

    # Shared dictionary for rate limiting
    lua_shared_dict api_limits 10m;

    location /api/v1/auth/ {
        proxy_pass http://auth_service;
        limit_req zone=auth burst=5 nodelay;
    }

    location /api/v1/users/ {
        access_by_lua_block {
            local jwt = require("resty.jwt")
            local token = ngx.var.http_authorization
            if not token then
                ngx.exit(ngx.HTTP_UNAUTHORIZED)
            end

            local jwt_obj = jwt:verify("your-secret-key", token:gsub("Bearer ", ""))
            if not jwt_obj.verified then
                ngx.exit(ngx.HTTP_UNAUTHORIZED)
            end

            ngx.req.set_header("X-User-ID", jwt_obj.payload.user_id)
        }

        proxy_pass http://user_service;
        limit_req zone=api burst=20 nodelay;
    }

    location /api/v1/products/ {
        proxy_pass http://product_service;
        limit_req zone=api burst=50 nodelay;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    location /api/v1/orders/ {
        access_by_lua_block {
            -- Additional authorization logic for orders
            local user_id = ngx.req.get_headers()["X-User-ID"]
            if not user_id then
                ngx.exit(ngx.HTTP_FORBIDDEN)
            end
        }

        proxy_pass http://order_service;
        limit_req zone=orders burst=10 nodelay;
    }

    # Health check endpoint
    location /health {
        access_log off;
        content_by_lua_block {
            ngx.say("API Gateway is healthy")
        }
    }
}
```

### Konfigurasi Media Streaming

```nginx
# Konfigurasi video streaming
server {
    listen 80;
    server_name streaming.ecommerce.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    # HLS streaming
    location /hls/ {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        root /var/www/streaming;
        add_header Cache-Control no-cache;

        # CORS for video players
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Range";

        location ~* \.m3u8$ {
            add_header Access-Control-Allow-Origin *;
            add_header Cache-Control no-cache;
        }
    }

    # MP4 pseudo streaming
    location /videos/ {
        mp4;
        mp4_buffer_size 1m;
        mp4_max_buffer_size 5m;

        root /var/www/videos;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # DASH streaming
    location /dash/ {
        root /var/www/dash;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control no-cache;

        location ~* \.mpd$ {
            add_header Content-Type application/dash+xml;
        }
    }
}
```

## Praktik Terbaik

- Gunakan versi stabil terbaru Nginx
- Konfigurasi worker processes berdasarkan CPU cores
- Optimalkan kernel parameters untuk high concurrency
- Implementasikan proper logging dan monitoring
- Gunakan SSL/TLS dengan modern cipher suites
- Implementasikan rate limiting dan DDoS protection
- Konfigurasi caching yang sesuai untuk use case Anda
- Gunakan upstream servers dengan health checks
- Implementasikan proper error pages dan handling
- Monitor performance metrics dan adjust konfigurasi
- Gunakan configuration management tools untuk consistency
- Implementasikan backup dan disaster recovery procedures

### Performance Tuning

```nginx
# High-performance configuration
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 65536;
    use epoll;
    multi_accept on;
}

http {
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 50m;
    large_client_header_buffers 4 16k;

    # Timeout settings
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    # Connection settings
    keepalive_timeout 65;
    keepalive_requests 100;
    reset_timedout_connection on;

    # Performance optimizations
    sendfile on;
    sendfile_max_chunk 512k;
    tcp_nopush on;
    tcp_nodelay on;

    # Compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;

    # Open file cache
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### Monitoring dan Logging

```nginx
# Enhanced logging configuration
log_format detailed '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time ua="$upstream_addr" '
                    'us="$upstream_status" ut="$upstream_response_time" '
                    'ul="$upstream_response_length" '
                    'cs=$upstream_cache_status';

access_log /var/log/nginx/access.log detailed;

# Error logging
error_log /var/log/nginx/error.log warn;

# Health monitoring endpoint
server {
    listen 8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Security Hardening

```nginx
# Security-focused configuration
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Block common exploits
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(wp-admin|wp-login|phpmyadmin|admin) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Restrict methods
    if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS)$ ) {
        return 405;
    }

    # Basic auth for sensitive areas
    location /admin {
        auth_basic "Restricted Area";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://admin_backend;
    }

    # Rate limiting for all requests
    limit_req zone=global burst=100 nodelay;
    limit_req_status 429;

    return 444; # Close connection without response
}
```

## Pertimbangan Keamanan

- Jaga Nginx tetap update dengan security patches
- Gunakan konfigurasi SSL/TLS yang kuat
- Implementasikan proper access controls dan authentication
- Konfigurasi rate limiting untuk mencegah abuse
- Gunakan security headers (HSTS, CSP, X-Frame-Options)
- Monitor logs untuk aktivitas mencurigakan
- Implementasikan measures DDoS protection
- Gunakan fail-safe configurations
- Amankan sensitive configuration files
- Implementasikan proper firewall rules
- Regular security audits dan penetration testing

## Nginx vs Web Servers Lain

| Fitur | Nginx | Apache | Caddy | Lighttpd |
|-------|-------|--------|-------|----------|
| Performance | Excellent | Good | Excellent | Good |
| Memory Usage | Low | High | Low | Low |
| Configuration | Complex | Moderate | Simple | Moderate |
| Modules | Extensive | Extensive | Limited | Moderate |
| Reverse Proxy | Excellent | Good | Good | Good |
| Load Balancing | Excellent | Limited | Limited | Limited |
| Learning Curve | Moderate | Low | Low | Moderate |
| Community | Large | Large | Growing | Medium |

## Use Case Umum

- **Web Server**: High-performance static content serving
- **Reverse Proxy**: API gateway dan microservices proxy
- **Load Balancer**: Distribusi traffic di seluruh application servers
- **API Gateway**: Request routing, authentication, dan rate limiting
- **Content Delivery**: Static asset caching dan delivery
- **SSL Termination**: Certificate management dan HTTPS handling
- **Media Streaming**: Video dan audio content delivery
- **WebSockets Proxy**: Real-time application support
- **Security Gateway**: DDoS protection dan access control
- **Microcaching**: Dynamic content performance optimization