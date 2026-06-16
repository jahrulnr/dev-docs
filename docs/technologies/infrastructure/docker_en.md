# Docker

## Overview

Docker is a platform for developing, shipping, and running applications in containers. Containers allow you to package an application with all its dependencies into a standardized unit that can run consistently across different environments. This solves the "works on my machine" problem and enables microservices architectures.

Docker uses containerization technology to isolate applications and their dependencies. Each container runs as a lightweight, standalone process on the host OS, sharing the kernel but with its own filesystem, networking, and process space.

## Key Concepts

- **Images**: Read-only templates used to create containers. Images are built from Dockerfiles.
- **Containers**: Runnable instances of images. Containers are ephemeral and can be started, stopped, and deleted.
- **Dockerfile**: A text file with instructions to build a Docker image.
- **Docker Compose**: Tool for defining and running multi-container Docker applications.
- **Docker Registry**: Repository for storing and distributing Docker images (e.g., Docker Hub).

## When to Use

- Developing microservices that need to run consistently across environments
- Creating reproducible development and testing environments
- Simplifying deployment pipelines
- Isolating applications and their dependencies

## Basic Commands

```bash
# Build an image
docker build -t myapp .

# Run a container
docker run -d -p 8080:8080 myapp

# List running containers
docker ps

# Stop a container
docker stop <container_id>

# Remove a container
docker rm <container_id>

# List images
docker images

# Remove an image
docker rmi <image_id>
```

## Example Dockerfile

```dockerfile
# Use official Node.js runtime as base image
FROM node:14

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
```

## Best Practices

- Use multi-stage builds to reduce image size
- Avoid running containers as root
- Use .dockerignore to exclude unnecessary files
- Tag images with version numbers
- Regularly update base images for security

## Typical use cases

- Packaging applications with reproducible runtime environments
- Local development parity with production deployments
- CI/CD build, test, and artifact pipelines
- Building images consumed by Kubernetes or Docker Swarm
- Isolating service dependencies in microservice stacks

## Related

- [Kubernetes](kubernetes_en.md)
- [Docker Swarm](docker-swarm_en.md)
- [containerd](containerd_en.md)

## References

- [Docker Documentation](https://docs.docker.com/)
