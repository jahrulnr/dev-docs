# Prometheus

## Overview

Prometheus is an open-source systems monitoring and alerting toolkit originally built at SoundCloud. It has become the de facto standard for monitoring cloud-native applications and infrastructure. Prometheus collects metrics from configured targets at given intervals, evaluates rule expressions, displays the results, and can trigger alerts when specified conditions are observed.

The system is designed for reliability, to be the system you go to during an outage to determine what is broken. It offers a multi-dimensional data model with time series data identified by metric name and key/value pairs, a flexible query language (PromQL), and no reliance on distributed storage.

## Key Concepts

- **Metrics**: Numerical measurements collected over time
- **Time Series**: Stream of timestamped values belonging to the same metric
- **Targets**: Applications or services that Prometheus scrapes for metrics
- **Jobs**: Collections of similar targets that are scraped
- **Instances**: Individual targets within a job
- **Labels**: Key-value pairs that provide dimensions to metrics
- **Exporters**: Libraries or services that expose metrics to Prometheus
- **Service Discovery**: Automatic detection of targets to monitor
- **Alerting Rules**: Conditions that trigger alerts when met
- **Recording Rules**: Pre-computed expressions for performance

## When to Use

- Monitoring microservices and containerized applications
- Infrastructure monitoring (servers, databases, networks)
- Application performance monitoring
- Alerting and incident response
- Capacity planning and resource utilization analysis
- Service level objective (SLO) tracking
- Troubleshooting production issues
- Observability in cloud-native environments
- Monitoring Kubernetes clusters and workloads
- Business metrics and KPI tracking
- Real-time analytics and dashboards

## Examples

### Basic Prometheus Configuration

```yaml
# prometheus.yml - Main configuration file
global:
  scrape_interval: 15s     # How frequently to scrape targets
  evaluation_interval: 15s # How frequently to evaluate rules

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

### Node Exporter Setup

```yaml
# docker-compose.yml - Node Exporter for system metrics
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

### Application Metrics with Client Libraries

```java
// Java application with Prometheus client
import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;
import io.prometheus.client.spring.web.PrometheusTimeMethod;

@SpringBootApplication
public class EcommerceApplication {

    // Counter for tracking orders
    static final Counter ordersProcessed = Counter.build()
        .name("orders_processed_total")
        .help("Total number of processed orders")
        .labelNames("status", "payment_method")
        .register();

    // Histogram for request latency
    static final Histogram requestLatency = Histogram.build()
        .name("http_request_duration_seconds")
        .help("Request duration in seconds")
        .labelNames("method", "endpoint", "status")
        .buckets(0.1, 0.5, 1.0, 2.5, 5.0, 10.0)
        .register();

    @PrometheusTimeMethod(name = "http_request_duration_seconds", help = "Request duration")
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
# Python application with Prometheus client
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
# alert_rules.yml - Alerting configuration
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

### Recording Rules for Performance

```yaml
# recording_rules.yml - Pre-computed metrics
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

### Service Discovery with Kubernetes

```yaml
# prometheus.yml - Kubernetes service discovery
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

### Advanced Queries with PromQL

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

### Integration with Alertmanager

```yaml
# alertmanager.yml - Alert routing and notification
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

## Best Practices

- Use meaningful metric names and labels
- Implement proper service discovery
- Set appropriate scrape intervals based on use case
- Use recording rules for complex queries
- Implement proper alerting hierarchies
- Use histogram metrics for latency measurements
- Implement metric aggregation and federation for large deployments
- Use consistent labeling conventions
- Implement proper data retention policies
- Use authentication and TLS for production deployments
- Implement backup and disaster recovery procedures

### Metric Naming Conventions

```yaml
# Good metric names
http_requests_total{status="200", method="GET", endpoint="/api/users"}
orders_processed_total{payment_method="credit_card", status="success"}
database_connections_active{db="users", instance="db01"}

# Bad metric names (avoid)
requests{code="200", verb="GET", path="/api/users"}  # Too generic
orders{pay_type="cc", stat="ok"}                    # Abbreviations
db_conn_active{db_name="users", server="db01"}       # Inconsistent naming
```

### High Availability Setup

```yaml
# prometheus.yml - HA configuration
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

### Security Best Practices

```yaml
# prometheus.yml - Secure configuration
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

## Security Considerations

- Implement authentication and authorization
- Use TLS encryption for all communications
- Secure metric endpoints from unauthorized access
- Implement proper network segmentation
- Use service accounts with minimal privileges
- Regularly audit metric access and usage
- Implement data encryption at rest
- Use secure service discovery mechanisms
- Implement proper logging and monitoring of Prometheus itself
- Regular security updates and vulnerability scanning

## Prometheus vs Other Monitoring Tools

| Feature | Prometheus | Nagios | Zabbix | Datadog |
|---------|------------|--------|--------|---------|
| Data Model | Time Series | Status Checks | Time Series | Time Series |
| Query Language | PromQL | Basic | Zabbix DSL | Custom |
| Scalability | Horizontal | Limited | Vertical | Cloud |
| Alerting | Built-in | Built-in | Built-in | Built-in |
| Visualization | Basic | Limited | Good | Excellent |
| Cost | Free | Free | Free | Paid |
| Learning Curve | Medium | Low | Medium | Low |

## Common Use Cases

- **Microservices Monitoring**: Track service health, latency, and error rates
- **Infrastructure Monitoring**: Server CPU, memory, disk, and network metrics
- **Application Performance**: Request rates, response times, and throughput
- **Business Metrics**: Order volumes, user registrations, revenue tracking
- **Kubernetes Monitoring**: Pod health, resource usage, cluster events
- **Database Monitoring**: Connection pools, query performance, replication status
- **Network Monitoring**: Bandwidth usage, packet loss, latency
- **Security Monitoring**: Failed login attempts, suspicious activities
- **CI/CD Pipeline Monitoring**: Build success rates, deployment times
- **User Experience Monitoring**: Page load times, error rates, conversion funnels