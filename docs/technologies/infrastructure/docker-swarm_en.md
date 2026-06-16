# Docker Swarm

## Overview

Docker Swarm is Docker's native clustering and orchestration solution for containerized applications. It allows you to create and manage a cluster of Docker nodes as a single virtual system. Swarm provides native clustering capabilities without requiring external orchestration tools.

Swarm mode was introduced in Docker 1.12 and provides declarative service definitions, load balancing, scaling, and rolling updates out of the box.

## Key Concepts

- **Nodes**: Individual Docker hosts that participate in the swarm
- **Manager Nodes**: Handle cluster management and orchestration decisions
- **Worker Nodes**: Run containers as directed by managers
- **Services**: Declarative definitions of desired container states
- **Stacks**: Groups of related services defined in Compose files

## Architecture

- **Raft Consensus**: Managers use Raft algorithm for consistent state
- **Service Discovery**: Built-in DNS-based service discovery
- **Load Balancing**: Internal load balancer for service access
- **Rolling Updates**: Zero-downtime updates for services

## When to Use

- Small to medium-scale container orchestration
- When you want to stay within the Docker ecosystem
- Simple deployment scenarios
- Learning container orchestration concepts

## Basic Commands

```bash
# Initialize swarm
docker swarm init

# Join worker node
docker swarm join --token <token> <manager_ip>:2377

# Create service
docker service create --name web --publish 8080:80 nginx

# Scale service
docker service scale web=3

# Update service
docker service update --image nginx:1.20 web

# List services
docker service ls

# Inspect service
docker service inspect web
```

## Example Stack File

```yaml
version: '3.8'
services:
  web:
    image: nginx
    ports:
      - "80:80"
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  app:
    image: myapp
    depends_on:
      - db
    deploy:
      replicas: 2

  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints: [node.role == manager]

volumes:
  db-data:
```

## Comparison with Kubernetes

- **Complexity**: Swarm is simpler to set up and manage
- **Features**: Kubernetes has more advanced features and ecosystem
- **Scalability**: Kubernetes scales better for large deployments
- **Learning Curve**: Swarm has gentler learning curve

## Best Practices

- Use manager nodes for both management and workloads in small clusters
- Implement proper networking with overlay networks
- Use secrets management for sensitive data
- Monitor swarm health and performance
- Plan for high availability with multiple managers

## Typical use cases

- Small-to-medium container clusters without full Kubernetes complexity
- Rolling updates and service scaling on Docker-native stacks
- Edge deployments with modest orchestration requirements
- Gradual migration from single-host Compose to multi-node orchestration

## Related

- [Docker](docker_en.md)
- [Kubernetes](kubernetes_en.md)

## References

- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)
