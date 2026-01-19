# Canary Deployment

## Overview

Canary Deployment is a deployment strategy that rolls out changes gradually to a small subset of users or instances to detect issues before a full release. This approach minimizes risk by testing new features in a production environment with controlled exposure, allowing for quick rollbacks if regressions occur. Unlike blue-green deployments that switch all traffic at once, canary uses percentage-based traffic for incremental testing.

It is part of progressive delivery, combining canary with feature flags and monitoring for safer deployments.

## Core Principles

- **Incremental Rollout**: Start with a small percentage (e.g., 5%), gradually increase based on metrics.
- **Intensive Monitoring**: Monitor error rates, response times, and user feedback in real-time.
- **Automated Rollback**: If thresholds are exceeded, automatically rollback to the old version.
- **Traffic Routing**: Use load balancers or service meshes for traffic control.
- **Gradual Exposure**: Increase exposure based on confidence from testing.

## Basic Workflow

1. **Preparation**: Prepare the new version in staging or parallel environment.
2. **Initial Deploy**: Roll out to a small subset (canary group), e.g., 5% traffic.
3. **Monitoring**: Observe KPIs during an observation period (e.g., 10-30 minutes).
4. **Evaluation**: If metrics are good, increase percentage (10%, 25%, 50%, 100%).
5. **Full Rollout or Rollback**: If stable, proceed to 100%; if issues, rollback.
6. **Cleanup**: After success, decommission canary instances.

Simple workflow example with Kubernetes and Istio:

```yaml
# Example VirtualService for canary routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-vs
spec:
  http:
  - route:
    - destination:
        host: myapp
        subset: v1  # Old version
      weight: 95
    - destination:
        host: myapp
        subset: v2  # New canary version
      weight: 5
```

## Suitability with Deployment Strategies

Canary is highly suitable for:

- **High-Traffic Applications**: Where full testing is hard to replicate.
- **Continuous Deployment**: Supports frequent deploys with low risk.
- **User-Facing Features**: For validating UX and performance with real users.
- **Microservices**: Easy to implement per service.

Less suitable for:
- Large monolithic systems without traffic control.
- Environments without mature monitoring.
- Infrastructure changes (not applications), as rollback is difficult.

## Implementation Examples

### Example with AWS
- Use AWS Lambda with weighted routing or ALB for canary.
- Blue: Old version, Green: New version as canary.

Simple script:

```bash
# Update Lambda alias weights
aws lambda update-alias --function-name myfunction --name prod --routing-config AdditionalVersionWeights={2=0.05}  # 5% to v2
```

Monitor with CloudWatch.

### Example with Docker and Nginx
```nginx
# Upstream for load balancing
upstream backend {
    server old-app:80 weight=95;
    server new-app:80 weight=5;  # Canary
}
```

Update weights gradually.

## Pros and Cons

### Pros
- **Low Risk**: Issues detected early with small exposure.
- **Real User Testing**: Validation in production environment.
- **Gradual Rollout**: Partial rollback possible if needed.
- **Increased Confidence**: Metrics-driven decisions.
- **Faster Feedback**: Detect regressions before full impact.

### Cons
- **Monitoring Complexity**: Requires strong alerting and observability.
- **Traffic Control Overhead**: Hard to implement without tools like Istio or ALB.
- **Delayed Full Rollout**: Gradual process takes time.
- **Data Consistency Issues**: If stateful, can cause problems between versions.
- **Monitoring Cost**: Overhead for tools and resources.

## Best Practices

- **Define Metrics**: Set thresholds for error rate, latency, etc.
- **Automated Rollback**: Implement circuit breakers or automated scripts.
- **A/B Testing Integration**: Combine with feature flags for user segmentation.
- **Gradual Increases**: Don't jump drastically; use small increments.
- **Team Alerts**: Real-time notifications to dev/ops when thresholds are breached.

## Common Pitfalls

- **Insufficient Monitoring**: Without good metrics, issues are missed.
- **Too Small Canary**: If 1%, major issues might not be detected.
- **Ignoring User Feedback**: Focus on technical metrics, forget UX issues.
- **Manual Overrides**: Don't force rollout without data.
- **State Mismatch**: Old and new versions interact with different data.

## References
- Istio documentation on Traffic Management.
- Google's article on Progressive Delivery.
- "Site Reliability Engineering" book by Google.
- Tools: Kubernetes/Istio, AWS ALB, LaunchDarkly for feature flags.