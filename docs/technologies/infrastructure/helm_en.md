# Helm

## Overview

Helm is the package manager for Kubernetes, allowing you to define, install, and upgrade complex Kubernetes applications. Think of it as apt/yum for Kubernetes - it simplifies application deployment and management through charts.

Helm uses a packaging format called charts, which are collections of files that describe a related set of Kubernetes resources. Charts can be versioned, shared, and reused across different environments.

## Key Concepts

- **Charts**: Packages containing Kubernetes manifests and metadata
- **Releases**: Instances of charts deployed to a cluster
- **Repositories**: Collections of charts that can be shared and accessed
- **Templates**: Dynamic generation of Kubernetes manifests using Go templating
- **Values**: Configuration files that customize chart deployments

## Architecture

- **Helm Client**: Command-line tool for chart management
- **Tiller (deprecated)**: Server-side component (removed in Helm 3)
- **Chart Museum**: Repository server for hosting charts
- **Release Storage**: Tracking of deployed releases in cluster

## When to Use

- Deploying complex applications with multiple dependencies
- Managing application configurations across environments
- Sharing and reusing Kubernetes applications
- Implementing GitOps workflows
- Standardizing application deployments

## Basic Commands

```bash
# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Search for charts
helm search repo nginx

# Install chart
helm install my-release bitnami/nginx

# List releases
helm list

# Upgrade release
helm upgrade my-release bitnami/nginx --version 13.0.0

# Uninstall release
helm uninstall my-release

# Create new chart
helm create mychart
```

## Example Chart Structure

```
mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── templates/          # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl
└── charts/             # Dependencies
```

## Example values.yaml

```yaml
replicaCount: 3

image:
  repository: nginx
  tag: "1.20"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  annotations: {}
  hosts:
    - host: myapp.example.com
      paths: []
  tls: []
```

## Best Practices

- Use semantic versioning for charts
- Implement proper dependency management
- Use subcharts for complex applications
- Implement validation with JSON schemas
- Use helm lint for chart validation
- Store charts in version control

## Integration with Ecommerce

Helm is essential for ecommerce deployments:
- Packaging entire microservices stacks
- Managing database and cache deployments
- Implementing canary deployments with traffic splitting
- Standardizing monitoring and logging setups
- Enabling self-service deployments for development teams

## Comparison with Kustomize

- **Approach**: Helm uses templating; Kustomize uses overlays
- **Complexity**: Helm supports more complex logic; Kustomize is simpler
- **Ecosystem**: Helm has larger chart ecosystem
- **Learning**: Kustomize has gentler learning curve for basic use cases