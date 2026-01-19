# Pola Load Balancer

## Gambaran Umum

Load Balancer adalah komponen yang mendistribusikan trafik jaringan masuk ke beberapa server atau instance layanan untuk mengoptimalkan pemanfaatan sumber daya, memaksimalkan throughput, meminimalkan waktu respons, dan memastikan ketersediaan tinggi. Komponen ini bertindak sebagai reverse proxy yang berada di antara klien dan server, merutekan permintaan berdasarkan berbagai algoritma dan pemeriksaan kesehatan.

## Jenis Load Balancer

### Layer 4 (Transport Layer)
- **Protokol**: TCP/UDP
- **Kriteria Keputusan**: Alamat IP, port, protokol
- **Performa**: Performa tinggi, latensi rendah
- **Kasus Penggunaan**: Distribusi beban dasar, terminasi SSL

### Layer 7 (Application Layer)
- **Protokol**: HTTP/HTTPS
- **Kriteria Keputusan**: URL, header, cookie, konten
- **Fitur**: Routing berbasis konten, terminasi SSL, caching
- **Kasus Penggunaan**: API gateway, microservices, routing lanjutan

## Algoritma Load Balancing

### Round Robin
- **Deskripsi**: Mendistribusikan permintaan secara berurutan ke server
- **Kelebihan**: Sederhana, distribusi yang adil
- **Kekurangan**: Tidak mempertimbangkan beban atau kapasitas server
- **Terbaik Untuk**: Server identik dengan kapasitas serupa

### Least Connections
- **Deskripsi**: Merutekan ke server dengan koneksi aktif paling sedikit
- **Kelebihan**: Distribusi beban yang lebih baik untuk waktu respons bervariasi
- **Kekurangan**: Tidak memperhitungkan perbedaan kapasitas server
- **Terbaik Untuk**: Aplikasi dengan waktu respons bervariasi

### IP Hash
- **Deskripsi**: Menggunakan IP klien untuk menentukan penugasan server
- **Kelebihan**: Persistensi sesi, lokalitas cache
- **Kekurangan**: Distribusi tidak merata jika rentang IP bervariasi
- **Terbaik Untuk**: Aplikasi berbasis sesi, skenario caching

### Weighted Round Robin
- **Deskripsi**: Menetapkan bobot ke server berdasarkan kapasitas
- **Kelebihan**: Memperhitungkan perbedaan kapasitas server
- **Kekurangan**: Membutuhkan konfigurasi bobot manual
- **Terbaik Untuk**: Lingkungan server heterogen

### Least Response Time
- **Deskripsi**: Merutekan ke server dengan waktu respons tercepat
- **Kelebihan**: Mengoptimalkan untuk performa
- **Kekurangan**: Kompleks untuk diimplementasikan, dapat menyebabkan osilasi
- **Terbaik Untuk**: Aplikasi kritis performa

## Contoh Implementasi

### NGINX Load Balancer

```nginx
# Layer 7 HTTP Load Balancer
upstream backend_servers {
    least_conn;  # Metode load balancing
    server backend1.example.com:8080 weight=3;
    server backend2.example.com:8080 weight=2;
    server backend3.example.com:8080 weight=1;
    server backup.example.com:8080 backup;  # Server cadangan
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health checks
        health_check interval=10 fails=3 passes=2;
    }
}
```

### AWS Application Load Balancer (ALB)

```hcl
# Konfigurasi Terraform untuk ALB
resource "aws_lb" "app_lb" {
  name               = "app-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = true

  tags = {
    Environment = "production"
  }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "app-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}
```

### Kubernetes Service Load Balancing

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - name: http
      port: 80
      targetPort: 8080
  type: LoadBalancer  # Membuat load balancer eksternal

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Health Checks dan Monitoring

### Active Health Checks
- **HTTP/HTTPS**: Memeriksa kode respons dan konten
- **TCP**: Memverifikasi pembentukan koneksi
- **Script Kustom**: Validasi kesehatan khusus aplikasi

### Passive Health Monitoring
- **Response Time**: Melacak dan mengingatkan respons lambat
- **Error Rates**: Memantau kode respons 4xx/5xx
- **Throughput**: Mengukur permintaan per detik

### Integrasi Auto-Scaling
- **Scale Out**: Menambah instance saat beban meningkat
- **Scale In**: Menghapus instance saat beban rendah
- **Predictive Scaling**: Menggunakan metrik untuk mengantisipasi perubahan beban

## Pertimbangan Keamanan

### Terminasi SSL/TLS
- **SSL Terpusat**: Menangani sertifikat di load balancer
- **Offloading**: Mengurangi beban CPU server
- **Security Headers**: Menambahkan header keamanan ke respons

### Perlindungan DDoS
- **Rate Limiting**: Mencegah penyalahgunaan dan serangan
- **IP Whitelisting**: Membatasi akses ke sumber terpercaya
- **Web Application Firewall**: Memblokir permintaan berbahaya

### Kontrol Akses
- **Autentikasi**: Terintegrasi dengan penyedia identitas
- **Otorisasi**: Mengontrol akses berdasarkan peran pengguna
- **Logging**: Mengaudit semua upaya akses

## Ketersediaan Tinggi dan Failover

### Redundansi
- **Multiple Load Balancers**: Menghindari single point of failure
- **Cross-Zone Deployment**: Mendistribusikan ke availability zones
- **DNS Failover**: Failover otomatis melalui DNS

### Persistensi Sesi
- **Sticky Sessions**: Merutekan permintaan terkait ke server yang sama
- **Shared Sessions**: Menggunakan penyimpanan sesi terdistribusi
- **Desain Stateless**: Lebih suka aplikasi stateless

## Optimasi Performa

### Connection Pooling
- **Keep-Alive**: Menggunakan ulang koneksi untuk mengurangi overhead
- **Connection Limits**: Mencegah kehabisan sumber daya
- **Queue Management**: Menangani antrian permintaan dengan baik

### Caching
- **Konten Statis**: Cache di level load balancer
- **Konten Dinamis**: Menggunakan header cache untuk browser caching
- **Edge Caching**: Mendistribusikan konten lebih dekat ke pengguna

### Kompresi
- **Response Compression**: Mengurangi penggunaan bandwidth
- **Content Types**: Mengkonfigurasi kompresi untuk respons berbasis teks

## Tantangan Umum

- **Kompleksitas Konfigurasi**: Mengelola aturan routing yang kompleks
- **Manajemen Sertifikat SSL**: Menangani multiple domain/sertifikat
- **Debugging Issues**: Melacak permintaan melalui load balancer
- **Optimasi Biaya**: Menyeimbangkan performa dan biaya

## Tools dan Teknologi

- **Hardware Load Balancers**: F5, Citrix NetScaler
- **Software Load Balancers**: NGINX, HAProxy, Traefik
- **Cloud Load Balancers**: AWS ALB/ELB, Azure Load Balancer, GCP Load Balancer
- **Service Mesh**: Istio, Linkerd untuk load balancing microservices

## Monitoring dan Observabilitas

- **Metrik**: Tingkat permintaan, waktu respons, tingkat error
- **Logging**: Log akses, log error, event keamanan
- **Tracing**: Distributed tracing untuk alur permintaan
- **Alerting**: Notifikasi proaktif untuk masalah

## Referensi

- [Load Balancing Algorithms](https://www.nginx.com/resources/glossary/load-balancing/)
- [AWS Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
- [NGINX Load Balancing Guide](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)