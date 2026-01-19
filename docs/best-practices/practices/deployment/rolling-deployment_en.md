# Rolling Deployment

## Overview

Rolling Deployment is a deployment strategy where application instances are updated gradually, one by one or in small batches, without shutting down the entire system. The new version is rolled out to a subset of instances while the old version continues running, minimizing downtime and risk. This approach suits applications tolerant to mixed versions during transition.

Unlike blue-green deployments that switch all traffic at once, rolling updates instances incrementally for high availability.

## Core Principles

- **Incremental Updates**: Update instances in small batches (e.g., 10-25% at a time).
- **Zero Downtime**: Traffic remains served during updates.
- **Health Checks**: Ensure new instances are healthy before proceeding.
- **Quick Rollback**: Stop rollout and revert if issues arise.
- **Load Balancing**: Automatic traffic distribution during updates.

## Basic Workflow

1. **Preparation**: Prepare new version in registry/container.
2. **Batch Update**: Update first batch (e.g., 20% instances), wait for healthy.
3. **Traffic Shift**: Load balancer directs traffic to new instances.
4. **Iteration**: Repeat for next batches until 100%.
5. **Monitoring**: Monitor metrics during and after rollout.
6. **Cleanup**: Remove old instances if successful.

Simple workflow example with Kubernetes Deployment:

```yaml
# Example Rolling Update in Kubernetes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # Max 1 instance down
      maxSurge: 1        # Max 1 extra instance
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2  # Update image
```

## Suitability with Deployment Strategies

Rolling is highly suitable for:

- **Stateless Applications**: Where instances are independent.
- **Microservices/Containers**: Easy orchestration with Kubernetes/Docker Swarm.
- **Continuous Deployment**: Supports frequent deploys without downtime.
- **Resource-Constrained Environments**: No need for duplicated infrastructure.

Less suitable for:
- Stateful applications with complex data.
- Monolithic systems hard to scale.
- Absolute zero-downtime requirements (use blue-green).

## Implementation Examples

### Example with AWS ECS
Use Rolling Update in ECS Service.

```bash
# Update service with rolling strategy
aws ecs update-service --cluster my-cluster --service my-service --task-definition new-task-def --deployment-configuration maximumPercent=200,minimumHealthyPercent=50
```

50% minimum healthy, 200% max for rolling.

### Example with Docker Compose
```yaml
version: '3.8'
services:
  app:
    image: myapp:v2
    deploy:
      update_config:
        parallelism: 1  # Update 1 container at a time
        delay: 10s      # Delay between updates
```

## Pros and Cons

### Pros
- **No Downtime**: Availability during updates.
- **Resource Efficient**: No need for duplicated environments.
- **Simple Setup**: Easy in orchestration tools.
- **Gradual Rollout**: Early issue detection per batch.
- **Cost Effective**: Minimal extra infrastructure.

### Cons
- **Mixed Versions**: Risk of incompatibility between old/new versions.
- **Slower Rollout**: Longer than blue-green for full update.
- **Intensive Monitoring**: Need to watch each batch.
- **Not for Critical Updates**: Hard rollback for major bugs.
- **Dependency on Health Checks**: Weak checks miss issues.

## Best Practices

- **Small Batches**: Start with 10-20% to minimize risk.
- **Health Checks**: Implement readiness/liveness probes.
- **Monitoring**: Use tools like Prometheus for metrics.
- **Canary First**: Combine with canary for initial testing.
- **Automation**: Script or CI/CD for automated rollout.

## Common Pitfalls

- **Ignoring Health Checks**: Proceed without verification.
- **Large Batches**: Risk downtime if batches too big.
- **State Issues**: Data inconsistency during mixed versions.
- **No Rollback Plan**: Difficult revert for major issues.
- **Over-Reliance**: Not suitable for all scenarios.

## References
- Kubernetes Rolling Updates documentation.
- AWS ECS Deployment Strategies.
- "Site Reliability Engineering" book by Google.
- Tools: Kubernetes, Docker Swarm, AWS ECS.