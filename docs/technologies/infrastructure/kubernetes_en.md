# Kubernetes

## Overview

Kubernetes (K8s) is an open-source platform for automating deployment, scaling, and management of containerized applications. Originally developed by Google and now maintained by the Cloud Native Computing Foundation (CNCF), Kubernetes provides a framework for running distributed systems resiliently.

Kubernetes orchestrates containers across clusters of machines, providing features like service discovery, load balancing, storage orchestration, and automated rollouts/rollbacks.

## Key Concepts

- **Pods**: Smallest deployable units, containing one or more containers
- **Services**: Abstractions for accessing pods, providing load balancing
- **Deployments**: Declarative way to manage pod replicas and updates
- **Namespaces**: Virtual clusters for resource isolation
- **ConfigMaps/Secrets**: Ways to inject configuration and sensitive data
- **Persistent Volumes**: Storage abstractions for stateful applications

## Architecture Components

- **Control Plane**: API server, scheduler, controller manager, etcd
- **Worker Nodes**: Kubelet, kube-proxy, container runtime
- **Add-ons**: Networking, DNS, monitoring, logging

## When to Use

- Large-scale container orchestration
- Complex microservices architectures
- Multi-cloud or hybrid deployments
- Applications requiring high availability and scalability
- Teams with DevOps practices

## Basic Commands

```bash
# Create deployment
kubectl create deployment nginx --image=nginx

# Expose deployment as service
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Scale deployment
kubectl scale deployment nginx --replicas=3

# Update image
kubectl set image deployment/nginx nginx=nginx:1.20

# Check pod status
kubectl get pods

# View logs
kubectl logs <pod-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/bash
```

## Example Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Best Practices

- Use namespaces for environment isolation
- Implement resource limits and requests
- Use liveness and readiness probes
- Implement proper logging and monitoring
- Use Helm for complex application packaging
- Implement security contexts and network policies

## Comparison with Docker Swarm

- **Ecosystem**: Kubernetes has larger community and tool ecosystem
- **Features**: More advanced scheduling, networking, and storage options
- **Complexity**: Steeper learning curve but more powerful
- **Adoption**: Industry standard for enterprise container orchestration

## Related

- [Docker](docker_en.md)
- [Helm](helm_en.md)
- [Docker Swarm](docker-swarm_en.md)

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
