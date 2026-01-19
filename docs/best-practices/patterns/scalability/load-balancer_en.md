# Load Balancer Pattern

## Overview

A Load Balancer is a component that distributes incoming network traffic across multiple servers or service instances to optimize resource utilization, maximize throughput, minimize response time, and ensure high availability. It acts as a reverse proxy that sits between clients and servers, routing requests based on various algorithms and health checks.

## Types of Load Balancers

### Layer 4 (Transport Layer)
- **Protocol**: TCP/UDP
- **Decision Criteria**: IP address, port, protocol
- **Performance**: High performance, low latency
- **Use Cases**: Basic load distribution, SSL termination

### Layer 7 (Application Layer)
- **Protocol**: HTTP/HTTPS
- **Decision Criteria**: URL, headers, cookies, content
- **Features**: Content-based routing, SSL termination, caching
- **Use Cases**: API gateways, microservices, advanced routing

## Load Balancing Algorithms

### Round Robin
- **Description**: Distributes requests sequentially across servers
- **Pros**: Simple, fair distribution
- **Cons**: Doesn't consider server load or capacity
- **Best For**: Identical servers with similar capacity

### Least Connections
- **Description**: Routes to server with fewest active connections
- **Pros**: Better load distribution for varying request times
- **Cons**: Doesn't account for server capacity differences
- **Best For**: Applications with variable response times

### IP Hash
- **Description**: Uses client IP to determine server assignment
- **Pros**: Session persistence, cache locality
- **Cons**: Uneven distribution if IP ranges vary
- **Best For**: Session-based applications, caching scenarios

### Weighted Round Robin
- **Description**: Assigns weights to servers based on capacity
- **Pros**: Accounts for server capacity differences
- **Cons**: Requires manual weight configuration
- **Best For**: Heterogeneous server environments

### Least Response Time
- **Description**: Routes to server with fastest response time
- **Pros**: Optimizes for performance
- **Cons**: Complex to implement, may cause oscillations
- **Best For**: Performance-critical applications

## Implementation Examples

### NGINX Load Balancer

```nginx
# Layer 7 HTTP Load Balancer
upstream backend_servers {
    least_conn;  # Load balancing method
    server backend1.example.com:8080 weight=3;
    server backend2.example.com:8080 weight=2;
    server backend3.example.com:8080 weight=1;
    server backup.example.com:8080 backup;  # Backup server
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
# Terraform configuration for ALB
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
  type: LoadBalancer  # Creates external load balancer

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

## Health Checks and Monitoring

### Active Health Checks
- **HTTP/HTTPS**: Check response codes and content
- **TCP**: Verify connection establishment
- **Custom Scripts**: Application-specific health validation

### Passive Health Monitoring
- **Response Time**: Track and alert on slow responses
- **Error Rates**: Monitor 4xx/5xx response codes
- **Throughput**: Measure requests per second

### Auto-Scaling Integration
- **Scale Out**: Add instances when load increases
- **Scale In**: Remove instances during low load
- **Predictive Scaling**: Use metrics to anticipate load changes

## Security Considerations

### SSL/TLS Termination
- **Centralized SSL**: Handle certificates at load balancer
- **Offloading**: Reduce server CPU load
- **Security Headers**: Add security headers to responses

### DDoS Protection
- **Rate Limiting**: Prevent abuse and attacks
- **IP Whitelisting**: Restrict access to trusted sources
- **Web Application Firewall**: Block malicious requests

### Access Control
- **Authentication**: Integrate with identity providers
- **Authorization**: Control access based on user roles
- **Logging**: Audit all access attempts

## High Availability and Failover

### Redundancy
- **Multiple Load Balancers**: Avoid single point of failure
- **Cross-Zone Deployment**: Distribute across availability zones
- **DNS Failover**: Automatic failover via DNS

### Session Persistence
- **Sticky Sessions**: Route related requests to same server
- **Shared Sessions**: Use distributed session stores
- **Stateless Design**: Prefer stateless applications

## Performance Optimization

### Connection Pooling
- **Keep-Alive**: Reuse connections to reduce overhead
- **Connection Limits**: Prevent resource exhaustion
- **Queue Management**: Handle request queuing gracefully

### Caching
- **Static Content**: Cache at load balancer level
- **Dynamic Content**: Use cache headers for browser caching
- **Edge Caching**: Distribute content closer to users

### Compression
- **Response Compression**: Reduce bandwidth usage
- **Content Types**: Configure compression for text-based responses

## Common Challenges

- **Configuration Complexity**: Managing complex routing rules
- **SSL Certificate Management**: Handling multiple domains/certificates
- **Debugging Issues**: Tracing requests through load balancer
- **Cost Optimization**: Balancing performance and cost

## Tools and Technologies

- **Hardware Load Balancers**: F5, Citrix NetScaler
- **Software Load Balancers**: NGINX, HAProxy, Traefik
- **Cloud Load Balancers**: AWS ALB/ELB, Azure Load Balancer, GCP Load Balancer
- **Service Mesh**: Istio, Linkerd for microservices load balancing

## Monitoring and Observability

- **Metrics**: Request rate, response time, error rates
- **Logging**: Access logs, error logs, security events
- **Tracing**: Distributed tracing for request flows
- **Alerting**: Proactive notifications for issues

## References

- [Load Balancing Algorithms](https://www.nginx.com/resources/glossary/load-balancing/)
- [AWS Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
- [NGINX Load Balancing Guide](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)