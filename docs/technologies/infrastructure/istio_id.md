# Istio

## Gambaran Umum

Istio adalah platform service mesh open-source yang menyediakan cara seragam untuk mengintegrasikan microservices, mengelola aliran traffic di seluruh microservices, menegakkan kebijakan, dan mengagregasi data telemetry. Platform ini menyediakan wawasan behavioral dan kontrol operasional atas service mesh secara keseluruhan, tanpa memerlukan perubahan pada kode aplikasi.

Sebagai service mesh, Istio menawarkan kemampuan seperti traffic management, security, observability, dan policy enforcement. Sistem ini bekerja dengan men-deploy sidecar proxy (Envoy) di samping setiap instance service, menciptakan mesh proxy yang saling terhubung yang menangani semua komunikasi service-to-service.

## Konsep Utama

- **Service Mesh**: Layer infrastruktur untuk menangani komunikasi service-to-service
- **Sidecar Proxy**: Envoy proxy yang di-deploy di samping setiap instance service
- **Control Plane**: Mengelola dan mengkonfigurasi data plane proxies
- **Data Plane**: Menangani routing traffic dan policy enforcement sebenarnya
- **Virtual Services**: Mendefinisikan aturan routing untuk traffic yang menargetkan services
- **Destination Rules**: Mengkonfigurasi kebijakan untuk traffic ke services
- **Gateways**: Mengelola inbound dan outbound traffic untuk mesh
- **Service Entries**: Menambahkan external services ke service registry
- **Peer Authentication**: Mengkonfigurasi autentikasi service-to-service
- **Authorization Policies**: Mendefinisikan access control untuk services

## Kapan Digunakan

- Mengelola arsitektur microservices yang kompleks
- Mengimplementasikan traffic management dan aturan routing
- Menegakkan kebijakan keamanan di seluruh services
- Mengumpulkan distributed tracing dan metrics
- Mengimplementasikan canary deployments dan A/B testing
- Mengelola autentikasi service-to-service
- Mengimplementasikan circuit breakers dan fault injection
- Load balancing dan traffic shifting
- Multi-cluster service mesh management
- Implementasi zero-trust security
- Observability dan monitoring microservices

## Contoh

### Instalasi Istio Dasar

```bash
# Install Istio menggunakan istioctl
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH

# Install Istio dengan default profile
istioctl install --set profile=default -y

# Enable sidecar injection untuk default namespace
kubectl label namespace default istio-injection=enabled
```

### Deployment Aplikasi Sample

```yaml
# deployment.yaml - Sample application dengan Istio
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
        version: v1
    spec:
      containers:
      - name: api
        image: ecommerce/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: SERVICE_NAME
          value: "ecommerce-api"
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api
spec:
  selector:
    app: ecommerce-api
  ports:
  - name: http
    port: 8080
    targetPort: 8080
```

### Traffic Management dengan Virtual Services

```yaml
# virtual-service.yaml - Route traffic ke versi berbeda
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-api
spec:
  hosts:
  - ecommerce-api
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*Mobile.*"
    route:
    - destination:
        host: ecommerce-api
        subset: mobile-optimized
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: ecommerce-api
        subset: canary
  - route:  # Default route
    - destination:
        host: ecommerce-api
        subset: stable
      weight: 90
    - destination:
        host: ecommerce-api
        subset: canary
      weight: 10
```

### Destination Rules untuk Traffic Policies

```yaml
# destination-rule.yaml - Define subsets dan policies
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ecommerce-api
spec:
  host: ecommerce-api
  subsets:
  - name: stable
    labels:
      version: v1
  - name: canary
    labels:
      version: v2
  - name: mobile-optimized
    labels:
      version: mobile
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
```

### Konfigurasi Gateway

```yaml
# gateway.yaml - Ingress gateway untuk external traffic
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ecommerce-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "api.ecommerce.com"
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: ecommerce-tls
    hosts:
    - "api.ecommerce.com"
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-gateway-vs
spec:
  hosts:
  - "api.ecommerce.com"
  gateways:
  - ecommerce-gateway
  http:
  - match:
    - uri:
        prefix: "/api/v1"
    route:
    - destination:
        host: ecommerce-api
  - match:
    - uri:
        prefix: "/api/v2"
    route:
    - destination:
        host: ecommerce-api-v2
```

### Autentikasi Service-to-Service

```yaml
# peer-authentication.yaml - Konfigurasi Mutual TLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: default
spec:
  mtls:
    mode: STRICT  # Enforce mutual TLS
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: permissive-for-legacy
  namespace: legacy
spec:
  selector:
    matchLabels:
      app: legacy-app
  mtls:
    mode: PERMISSIVE  # Allow both TLS and plain text
```

### Authorization Policies

```yaml
# authorization-policy.yaml - Access control
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ecommerce-api-policy
  namespace: default
spec:
  selector:
    matchLabels:
      app: ecommerce-api
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/payment-service"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/api/payments"]
  - from:
    - source:
        namespaces: ["frontend"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/products", "/api/cart"]
  - from:
    - source:
        requestPrincipals: ["*"]
    when:
    - key: request.auth.claims[role]
      values: ["admin"]
```

### Fault Injection dan Circuit Breaking

```yaml
# fault-injection.yaml - Testing resilience
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-api-fault
spec:
  hosts:
  - ecommerce-api
  http:
  - fault:
      delay:
        percentage:
          value: 10.0
        fixedDelay: 5s
      abort:
        percentage:
          value: 5.0
        httpStatus: 503
    route:
    - destination:
        host: ecommerce-api
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ecommerce-api-circuit-breaker
spec:
  host: ecommerce-api
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### Distributed Tracing dengan Jaeger

```yaml
# tracing.yaml - Enable distributed tracing
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-default
  namespace: istio-system
spec:
  tracing:
  - providers:
    - name: "jaeger"
    randomSamplingPercentage: 100.0
---
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: ecommerce-api-tracing
  namespace: default
spec:
  selector:
    matchLabels:
      app: ecommerce-api
  tracing:
  - providers:
    - name: "jaeger"
    randomSamplingPercentage: 50.0
    customTags:
      user_id:
        header:
          name: "x-user-id"
      request_id:
        header:
          name: "x-request-id"
```

### Custom Metrics dan Monitoring

```yaml
# telemetry.yaml - Custom metrics collection
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: ecommerce-metrics
  namespace: default
spec:
  selector:
    matchLabels:
      app: ecommerce-api
  metrics:
  - providers:
    - name: "prometheus"
    overrides:
    - tagOverrides:
        request_operation:
          value: "method"
      match:
        metric: REQUEST_COUNT
        mode: CLIENT_AND_SERVER
    - tagOverrides:
        response_code:
          value: "response_code"
      match:
        metric: REQUEST_COUNT
        mode: CLIENT_AND_SERVER
```

### Multi-Cluster Service Mesh

```yaml
# cross-cluster-access.yaml - Konfigurasi Multi-cluster
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-ecommerce-api
spec:
  hosts:
  - api.cluster2.ecommerce.com
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  resolution: DNS
  endpoints:
  - address: api.cluster2.ecommerce.com
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: cross-cluster-routing
spec:
  hosts:
  - api.ecommerce.com
  http:
  - match:
    - headers:
        x-cluster:
          exact: "cluster2"
    route:
    - destination:
        host: api.cluster2.ecommerce.com
  - route:
    - destination:
        host: ecommerce-api
```

### Konfigurasi Spesifik E-commerce

```yaml
# ecommerce-traffic-management.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-traffic-management
spec:
  hosts:
  - api.ecommerce.com
  http:
  # Route mobile traffic ke optimized service
  - match:
    - headers:
        user-agent:
          regex: ".*(Mobile|iPhone|Android).*"  
    route:
    - destination:
        host: ecommerce-api-mobile
  # A/B testing untuk checkout flow
  - match:
    - uri:
        prefix: "/checkout"
    - headers:
        cookie:
          regex: "ab-test-group=A"
    route:
    - destination:
        host: ecommerce-checkout
        subset: version-a
  - match:
    - uri:
        prefix: "/checkout"
    route:
    - destination:
        host: ecommerce-checkout
        subset: version-b
  # Rate limiting untuk search API
  - match:
    - uri:
        prefix: "/search"
    route:
    - destination:
        host: ecommerce-search
    timeout: 3s
  # Default routing
  - route:
    - destination:
        host: ecommerce-api
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ecommerce-policies
spec:
  host: ecommerce-api
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpCookie:
          name: ecommerce-session
          ttl: 300s
    connectionPool:
      http:
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 60s
      maxEjectionPercent: 50
```

## Praktik Terbaik

- Mulai dengan konfigurasi Istio minimal dan secara bertahap tambahkan fitur
- Gunakan namespaces untuk mengisolasi environment atau tim berbeda
- Implementasikan batas resource yang tepat untuk Envoy proxies
- Gunakan fitur keamanan built-in Istio (mTLS, authorization)
- Implementasikan monitoring dan alerting yang tepat untuk service mesh
- Gunakan traffic mirroring untuk testing perubahan dengan aman
- Implementasikan gradual rollouts menggunakan canary deployments
- Gunakan service entries untuk integrasi external service
- Implementasikan cleanup konfigurasi yang tidak digunakan
- Update Istio ke versi stabil terbaru secara regular
- Gunakan tools validasi konfigurasi Istio

### Resource Management

```yaml
# resource-limits.yaml - Alokasi resource yang tepat
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-sidecar-injector
  namespace: istio-system
data:
  values: |
    sidecarInjectorWebhook:
      injectedAnnotations:
        kubectl.kubernetes.io/default-logs-container: "istio-proxy"
        kubectl.kubernetes.io/default-container: "istio-proxy"
    global:
      proxy:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Monitoring Komponen Istio

```yaml
# istio-monitoring.yaml - Monitor health service mesh
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: istio-component-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      istio: mixer
  namespaceSelector:
    matchNames:
    - istio-system
  endpoints:
  - port: prometheus
    interval: 30s
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: istio-alerts
  namespace: monitoring
spec:
  groups:
  - name: istio
    rules:
    - alert: IstioHighRequestLatency
      expr: histogram_quantile(0.95, rate(istio_request_duration_seconds_bucket[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High Istio request latency"
    - alert: IstioHighErrorRate
      expr: rate(istio_requests_total{response_code=~"5.."}[5m]) / rate(istio_requests_total[5m]) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate in service mesh"
```

### Security Hardening

```yaml
# security-hardening.yaml - Enhanced security
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: strict-mtls
  namespace: default
spec:
  action: DENY
  rules:
  - from:
    - source:
        notPrincipals: ["*"]
---
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: default
spec:
  selector:
    matchLabels:
      app: ecommerce-api
  jwtRules:
  - issuer: "https://accounts.ecommerce.com"
    jwksUri: "https://accounts.ecommerce.com/.well-known/jwks.json"
    forwardOriginalToken: true
```

## Pertimbangan Keamanan

- Enable mutual TLS untuk semua komunikasi service-to-service
- Implementasikan authorization policies yang tepat untuk akses service
- Gunakan JWT tokens untuk autentikasi end-user
- Rotate certificates dan keys secara regular
- Implementasikan network policies untuk membatasi pod-to-pod communication
- Gunakan fitur keamanan Istio untuk defense in depth
- Monitor security events dan anomali
- Implementasikan manajemen secrets yang tepat untuk certificates
- Gunakan external certificate authorities untuk production
- Audit konfigurasi service mesh secara regular

## Istio vs Service Meshes Lain

| Fitur | Istio | Linkerd | Consul Connect | AWS App Mesh |
|-------|-------|---------|---------------|--------------|
| Maturity | Tinggi | Tinggi | Sedang | Sedang |
| Kubernetes Native | Ya | Ya | Tidak | Ya |
| Multi-Platform | Ya | Kubernetes | Multi | AWS |
| Traffic Management | Excellent | Good | Good | Good |
| Security | Excellent | Good | Good | Good |
| Observability | Excellent | Good | Good | Good |
| Learning Curve | Tinggi | Rendah | Sedang | Sedang |
| Community | Besar | Besar | Besar | AWS |

## Use Case Umum

- **Microservices Traffic Management**: Route traffic antar microservices dengan aturan advanced
- **Canary Deployments**: Roll out versi baru secara bertahap dengan traffic splitting
- **A/B Testing**: Route traffic berdasarkan atribut user atau headers
- **Security Policy Enforcement**: Implementasi zero-trust security di seluruh services
- **Observability**: Kumpulkan metrics, logs, dan traces dari interaksi service
- **Fault Injection**: Test resilience service dengan controlled failures
- **Multi-Cluster Communication**: Hubungkan services di seluruh Kubernetes clusters
- **External Service Integration**: Kelola traffic ke external APIs dan services
- **Rate Limiting**: Kontrol request rates untuk mencegah service overload
- **Circuit Breaking**: Otomatis fail fast ketika services unhealthy