# Prometheus

## Gambaran Umum

Prometheus adalah toolkit monitoring dan alerting sistem open-source yang awalnya dibangun di SoundCloud. Sistem ini telah menjadi standar de facto untuk monitoring aplikasi cloud-native dan infrastruktur. Prometheus mengumpulkan metrik dari target yang dikonfigurasi pada interval tertentu, mengevaluasi ekspresi aturan, menampilkan hasil, dan dapat memicu alert ketika kondisi tertentu diamati.

Sistem ini dirancang untuk keandalan, menjadi sistem yang Anda kunjungi selama outage untuk menentukan apa yang rusak. Sistem ini menawarkan model data multi-dimensi dengan data time series yang diidentifikasi oleh nama metrik dan pasangan key/value, bahasa query yang fleksibel (PromQL), dan tidak bergantung pada penyimpanan terdistribusi.

## Konsep Utama

- **Metrics**: Pengukuran numerik yang dikumpulkan dari waktu ke waktu
- **Time Series**: Aliran nilai timestamp yang termasuk dalam metrik yang sama
- **Targets**: Aplikasi atau layanan yang di-scrape Prometheus untuk metrik
- **Jobs**: Koleksi target serupa yang di-scrape
- **Instances**: Target individu dalam sebuah job
- **Labels**: Pasangan key-value yang memberikan dimensi pada metrik
- **Exporters**: Library atau layanan yang mengekspos metrik ke Prometheus
- **Service Discovery**: Deteksi otomatis target untuk dimonitoring
- **Alerting Rules**: Kondisi yang memicu alert ketika terpenuhi
- **Recording Rules**: Ekspresi yang telah dihitung sebelumnya untuk performa

## Kapan Digunakan

- Monitoring microservices dan aplikasi terkontainerisasi
- Monitoring infrastruktur (server, database, network)
- Monitoring performa aplikasi
- Alerting dan respons insiden
- Perencanaan kapasitas dan analisis utilisasi resource
- Pelacakan service level objective (SLO)
- Troubleshooting masalah produksi
- Observability di environment cloud-native
- Monitoring cluster Kubernetes dan workloads
- Pelacakan business metrics dan KPI
- Analytics real-time dan dashboard

## Contoh

### Konfigurasi Prometheus Dasar

```yaml
# prometheus.yml - File konfigurasi utama
global:
  scrape_interval: 15s     # Seberapa sering scrape targets
  evaluation_interval: 15s # Seberapa sering mengevaluasi rules

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets:
          - 'node-exporter:9100'
          - 'web-server:9100'

  - job_name: 'application'
    static_configs:
      - targets:
          - 'app-server:8080'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
```

### Setup Node Exporter

```yaml
# docker-compose.yml - Node Exporter untuk metrik sistem
version: '3.8'
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
```

### Metrik Aplikasi dengan Client Libraries

```java
// Aplikasi Java dengan Prometheus client
import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;
import io.prometheus.client.spring.web.PrometheusTimeMethod;

@SpringBootApplication
public class EcommerceApplication {

    // Counter untuk tracking orders
    static final Counter ordersProcessed = Counter.build()
        .name("orders_processed_total")
        .help("Total jumlah order yang diproses")
        .labelNames("status", "payment_method")
        .register();

    // Histogram untuk request latency
    static final Histogram requestLatency = Histogram.build()
        .name("http_request_duration_seconds")
        .help("Durasi request dalam detik")
        .labelNames("method", "endpoint", "status")
        .buckets(0.1, 0.5, 1.0, 2.5, 5.0, 10.0)
        .register();

    @PrometheusTimeMethod(name = "http_request_duration_seconds", help = "Durasi request")
    @PostMapping("/api/orders")
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        try {
            Order order = orderService.createOrder(request);
            ordersProcessed.labels("success", request.getPaymentMethod()).inc();
            return ResponseEntity.ok(new OrderResponse(order));
        } catch (Exception e) {
            ordersProcessed.labels("failed", request.getPaymentMethod()).inc();
            throw e;
        }
    }
}
```

```python
# Aplikasi Python dengan Prometheus client
from prometheus_client import Counter, Histogram, generate_latest
from flask import Flask, Response

app = Flask(__name__)

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests',
                       ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency',
                           ['method', 'endpoint'])

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

@app.route('/api/products')
def get_products():
    with REQUEST_LATENCY.labels('GET', '/api/products').time():
        try:
            products = product_service.get_all()
            REQUEST_COUNT.labels('GET', '/api/products', '200').inc()
            return jsonify(products)
        except Exception as e:
            REQUEST_COUNT.labels('GET', '/api/products', '500').inc()
            raise
```

### Alerting Rules

```yaml
# alert_rules.yml - Konfigurasi alerting
groups:
  - name: ecommerce_alerts
    rules:
      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request latency detected"
          description: "95th percentile request latency is {{ $value }}s for {{ $labels.endpoint }}"

      - alert: LowOrderSuccessRate
        expr: rate(orders_processed_total{status="success"}[5m]) / rate(orders_processed_total[5m]) < 0.95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Low order success rate"
          description: "Order success rate dropped below 95%"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 1 minute"
```

### Recording Rules untuk Performa

```yaml
# recording_rules.yml - Metrik yang telah dihitung sebelumnya
groups:
  - name: ecommerce_recording_rules
    interval: 30s
    rules:
      - record: job:http_requests_total:rate5m
        expr: rate(http_requests_total[5m])

      - record: job:orders_processed_total:rate1h
        expr: rate(orders_processed_total[1h])

      - record: instance:cpu_usage:rate5m
        expr: rate(cpu_usage_seconds_total[5m])

      - record: job:memory_usage_percent
        expr: (1 - system_memory_available / system_memory_total) * 100

      - record: job:disk_usage_percent
        expr: (1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100
```

### Service Discovery dengan Kubernetes

```yaml
# prometheus.yml - Service discovery Kubernetes
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
      - role: service
    metrics_path: /metrics
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: job
```

### Query Lanjutan dengan PromQL

```promql
# Request rate per endpoint
rate(http_requests_total[5m])

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Service availability (uptime percentage)
avg_over_time(up[7d]) * 100

# Memory usage trend
predict_linear(memory_usage_bytes[1h], 3600)

# Top 10 endpoints by request count
topk(10, sum(rate(http_requests_total[5m])) by (endpoint))

# Alert firing rate
rate(alerts_total{alertstate="firing"}[5m])

# Resource utilization heatmap
increase(cpu_usage_seconds_total[1h])
```

### Integrasi dengan Alertmanager

```yaml
# alertmanager.yml - Routing alert dan notifikasi
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@company.com'
  smtp_auth_username: 'alerts@company.com'
  smtp_auth_password: 'your-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'team-email'
  routes:
    - match:
        severity: critical
      receiver: 'critical-pager'
    - match:
        team: frontend
      receiver: 'frontend-team'

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'devops@company.com'
        subject: '{{ .GroupLabels.alertname }} - {{ .GroupLabels.severity }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Value: {{ .Value }}
          Labels: {{ .Labels }}
          {{ end }}

  - name: 'critical-pager'
    pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'

  - name: 'frontend-team'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#frontend-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
```

## Praktik Terbaik

- Gunakan nama metrik dan label yang bermakna
- Implementasikan service discovery yang tepat
- Set interval scrape yang sesuai berdasarkan use case
- Gunakan recording rules untuk query kompleks
- Implementasikan hierarki alerting yang tepat
- Gunakan histogram metrics untuk pengukuran latency
- Implementasikan agregasi metrik dan federasi untuk deployment besar
- Gunakan konvensi labeling yang konsisten
- Implementasikan kebijakan retensi data yang tepat
- Gunakan autentikasi dan TLS untuk deployment produksi
- Implementasikan prosedur backup dan disaster recovery

### Konvensi Penamaan Metrik

```yaml
# Nama metrik yang baik
http_requests_total{status="200", method="GET", endpoint="/api/users"}
orders_processed_total{payment_method="credit_card", status="success"}
database_connections_active{db="users", instance="db01"}

# Nama metrik yang buruk (hindari)
requests{code="200", verb="GET", path="/api/users"}  # Terlalu generik
orders{pay_type="cc", stat="ok"}                    # Singkatan
db_conn_active{db_name="users", server="db01"}       # Penamaan tidak konsisten
```

### Setup High Availability

```yaml
# prometheus.yml - Konfigurasi HA
global:
  external_labels:
    cluster: 'production'
    replica: 'prometheus-01'

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 'alertmanager-01:9093'
          - 'alertmanager-02:9093'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets:
          - 'prometheus-01:9090'
          - 'prometheus-02:9090'
    relabel_configs:
      - source_labels: [__address__]
        target_label: __address__
        regex: '(.+):9090'
        replacement: '${1}:9090'
      - source_labels: [__address__]
        target_label: cluster
        replacement: 'production'
```

### Praktik Terbaik Keamanan

```yaml
# prometheus.yml - Konfigurasi aman
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'secure-app'
    scheme: https
    tls_config:
      ca_file: /etc/prometheus/certs/ca.pem
      cert_file: /etc/prometheus/certs/client.pem
      key_file: /etc/prometheus/certs/client-key.pem
    basic_auth:
      username: 'prometheus'
      password_file: /etc/prometheus/secrets/password
    static_configs:
      - targets: ['app.example.com:443']
```

## Pertimbangan Keamanan

- Implementasikan autentikasi dan otorisasi
- Gunakan enkripsi TLS untuk semua komunikasi
- Amankan endpoint metrik dari akses tidak sah
- Implementasikan segmentasi jaringan yang tepat
- Gunakan service account dengan privilege minimal
- Audit akses metrik dan penggunaan secara regular
- Implementasikan enkripsi data at rest
- Gunakan mekanisme service discovery yang aman
- Implementasikan logging dan monitoring Prometheus itu sendiri
- Update keamanan dan scanning vulnerability secara regular

## Prometheus vs Tools Monitoring Lain

| Fitur | Prometheus | Nagios | Zabbix | Datadog |
|-------|------------|--------|--------|---------|
| Data Model | Time Series | Status Checks | Time Series | Time Series |
| Query Language | PromQL | Basic | Zabbix DSL | Custom |
| Scalability | Horizontal | Limited | Vertical | Cloud |
| Alerting | Built-in | Built-in | Built-in | Built-in |
| Visualization | Basic | Limited | Good | Excellent |
| Cost | Free | Free | Free | Paid |
| Learning Curve | Medium | Low | Medium | Low |

## Use Case Umum

- **Monitoring Microservices**: Track health service, latency, dan error rates
- **Monitoring Infrastruktur**: CPU server, memory, disk, dan metrik network
- **Performa Aplikasi**: Request rates, response times, dan throughput
- **Business Metrics**: Volume order, registrasi user, tracking revenue
- **Monitoring Kubernetes**: Health pod, utilisasi resource, event cluster
- **Monitoring Database**: Connection pools, performa query, status replikasi
- **Monitoring Network**: Penggunaan bandwidth, packet loss, latency
- **Monitoring Keamanan**: Percobaan login gagal, aktivitas mencurigakan
- **Monitoring CI/CD Pipeline**: Build success rates, waktu deployment
- **Monitoring User Experience**: Waktu load halaman, error rates, conversion funnels