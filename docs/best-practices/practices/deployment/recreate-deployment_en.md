# Recreate Deployment

## Overview

Recreate Deployment is the simplest deployment strategy where all old application instances are shut down first, then new instances are started. This ensures no mixed versions but causes downtime during transition. Suitable for development environments or apps tolerant to short downtime.

Unlike rolling or blue-green, recreate does not maintain availability during updates.

## Core Principles

- **Shutdown First**: Stop all old instances before starting new ones.
- **Clean Slate**: No overlap between old and new versions.
- **Simple Execution**: Easy without complex tools.
- **Full Replacement**: All instances updated at once.
- **Downtime Expected**: Plan for maintenance windows.

## Basic Workflow

1. **Preparation**: Backup data if needed.
2. **Shutdown**: Stop all old instances.
3. **Deploy New**: Run instances with new version.
4. **Verification**: Test new application.
5. **Traffic Restore**: Redirect traffic if necessary.

Simple workflow example with Docker:

```bash
# Shutdown old
docker stop $(docker ps -q --filter ancestor=myapp:v1)

# Run new
docker run -d -p 80:80 myapp:v2
```

## Suitability with Deployment Strategies

Recreate is suitable for:

- **Development/Staging**: Where downtime is not critical.
- **Simple Apps**: Monolithic apps without high availability needs.
- **Maintenance Windows**: When scheduled downtime is allowed.
- **Low-Traffic Systems**: Minimal downtime impact.

Less suitable for:
- Production with high SLAs.
- Apps requiring 24/7 availability.
- Complex microservices with dependencies.

## Implementation Examples

### Example with Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    type: Recreate  # No rolling, full recreate
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2
```

### Example with AWS EC2
Use script to terminate and launch new.

```bash
# Terminate old instances
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0

# Launch new
aws ec2 run-instances --image-id ami-12345678 --count 1 --instance-type t2.micro
```

## Pros and Cons

### Pros
- **Simple**: No complex orchestration needed.
- **Clean Deployment**: No mixed versions.
- **Resource Efficient**: No extra instances required.
- **Fast for Small Apps**: Quick for small deployments.
- **No Compatibility Issues**: Old version fully replaced.

### Cons
- **Downtime**: System offline during update.
- **Risky**: If deployment fails, full outage.
- **Not Scalable**: Hard for large systems.
- **User Impact**: Users affected during downtime.
- **No Gradual Rollout**: All-or-nothing approach.

## Best Practices

- **Schedule Maintenance**: Do during low-traffic hours.
- **Backup First**: Always backup before shutdown.
- **Quick Verification**: Test fast post-deploy.
- **Fallback Plan**: Prepare rollback if fails.
- **Monitor Closely**: Watch logs during startup.

## Common Pitfalls

- **Unexpected Downtime**: Duration longer than expected.
- **Data Loss**: Forget to backup stateful data.
- **Startup Failures**: New instances fail to start.
- **No Monitoring**: Don't detect issues during downtime.
- **Overuse**: Used in production without plan.

## References
- Kubernetes Deployment Strategies.
- AWS EC2 Instance Management.
- "Continuous Delivery" book by Jez Humble.
- Tools: Docker, Kubernetes, AWS CLI.