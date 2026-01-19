# Containerd

## Overview

Containerd is an industry-standard container runtime that manages the complete container lifecycle. It was originally developed by Docker and is now a graduated CNCF project. Containerd provides the core functionality for running containers, including image management, container execution, and storage.

Unlike Docker, which is a full platform, containerd is focused solely on container runtime operations. It's designed to be embedded into larger systems and provides a clean API for container management.

## Key Features

- **Image Management**: Pull, push, and manage container images
- **Container Lifecycle**: Create, start, stop, and delete containers
- **Storage**: Manage container storage and snapshots
- **Networking**: Handle container networking
- **Distribution**: Support for various image registries

## Architecture

Containerd consists of several components:
- **Containerd**: The main daemon
- **Containerd-shim**: Manages container processes
- **Runc**: Low-level container runtime
- **CNI**: Container networking interface

## When to Use

- Building custom container platforms
- Integrating containers into orchestration systems
- When you need a lightweight container runtime
- For high-performance container operations

## Basic Usage

Containerd is typically managed through higher-level tools like Docker or Kubernetes, but can be used directly:

```bash
# Import an image
ctr images import image.tar

# List images
ctr images list

# Run a container
ctr run --rm docker.io/library/alpine:latest test /bin/sh

# List containers
ctr containers list
```

## Integration with Kubernetes

Containerd is the default container runtime for Kubernetes (since v1.24). It provides better performance and resource utilization compared to Docker's runtime.

## Comparison with Docker

- **Scope**: Containerd is runtime-only; Docker includes build tools
- **Performance**: Containerd has lower overhead
- **Integration**: Containerd integrates better with orchestration systems
- **API**: Containerd provides gRPC API for management

## Best Practices

- Use containerd with Kubernetes for production workloads
- Monitor containerd metrics for performance tuning
- Keep containerd updated for security patches
- Use appropriate CNI plugins for networking requirements