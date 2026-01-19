# Google Cloud Platform Compute Services

## Overview

Google Cloud Platform (GCP) provides a comprehensive suite of compute services designed to run applications at any scale, from small workloads to enterprise-grade systems. GCP's compute services offer flexibility, scalability, and integration with other Google Cloud services.

## Key Services

### Compute Engine
- **Virtual Machines**: Scalable VMs with custom machine types
- **Preemptible VMs**: Cost-effective, short-lived instances
- **Managed Instance Groups**: Auto-scaling groups for high availability
- **Sole-Tenant Nodes**: Dedicated hardware for compliance requirements

### Kubernetes Engine (GKE)
- **Managed Kubernetes**: Fully managed Kubernetes clusters
- **Autopilot Mode**: Hands-free Kubernetes management
- **Anthos**: Multi-cloud and hybrid Kubernetes management
- **Cloud Run**: Serverless container execution

### Cloud Functions
- **Serverless Functions**: Event-driven compute
- **Multiple Runtimes**: Node.js, Python, Go, Java, .NET, Ruby, PHP
- **HTTP Triggers**: Web-accessible functions
- **Event Triggers**: Respond to Cloud Storage, Pub/Sub, Firestore events

### App Engine
- **Standard Environment**: Sandboxed runtimes for quick deployment
- **Flexible Environment**: Docker-based custom runtimes
- **Automatic Scaling**: Zero to millions of instances
- **Built-in Services**: Memcache, task queues, search

## When to Use

- **Compute Engine**: Traditional VM workloads, custom configurations, GPU workloads
- **GKE**: Containerized applications, microservices, CI/CD pipelines
- **Cloud Functions**: Event processing, API backends, automation tasks
- **App Engine**: Web applications, mobile backends, rapid prototyping

## Examples

### Compute Engine VM Deployment

```bash
# Create a VM instance
gcloud compute instances create ecommerce-web \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server \
  --metadata startup-script='#!/bin/bash
    apt-get update
    apt-get install -y nginx
    systemctl start nginx'

# Create firewall rules
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server
```

### Kubernetes Engine Cluster

```yaml
# GKE cluster configuration
apiVersion: container.cncf.io/v1
kind: Cluster
metadata:
  name: ecommerce-cluster
spec:
  kubernetesVersion: "1.27"
  network: default
  subnetwork: default
  clusterIpv4Cidr: 10.0.0.0/14
  servicesIpv4Cidr: 10.4.0.0/19
  nodePools:
  - name: default-pool
    initialNodeCount: 3
    config:
      machineType: e2-medium
      diskSizeGb: 50
      oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
    management:
      autoUpgrade: true
      autoRepair: true
```

### Cloud Functions for Order Processing

```javascript
// index.js
const functions = require('@google-cloud/functions-framework');
const {PubSub} = require('@google-cloud/pubsub');

functions.cloudEvent('processOrder', async (cloudEvent) => {
  const pubsubMessage = cloudEvent.data.message;
  const orderData = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

  console.log('Processing order:', orderData.orderId);

  // Process order logic
  await processOrder(orderData);

  // Publish to inventory topic
  const pubsub = new PubSub();
  const topic = pubsub.topic('inventory-updates');

  await topic.publishMessage({
    data: Buffer.from(JSON.stringify({
      orderId: orderData.orderId,
      items: orderData.items,
      action: 'reserve'
    }))
  });
});

async function processOrder(orderData) {
  // Order processing logic
  // Validate payment, update inventory, send notifications
}
```

```yaml
# function.yaml
name: process-order
description: Processes new orders from Pub/Sub
runtime: nodejs18
entryPoint: processOrder
eventTrigger:
  eventType: google.cloud.pubsub.topic.v1.messagePublished
  resource: projects/${PROJECT_ID}/topics/new-orders
```

### App Engine Deployment

```yaml
# app.yaml
runtime: nodejs18
env: standard

handlers:
- url: /.*
  script: auto
  secure: always

env_variables:
  NODE_ENV: production
  DATABASE_URL: /cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME}

beta_settings:
  cloud_sql_instances: ${PROJECT_ID}:${REGION}:${INSTANCE_NAME}
```

```javascript
// app.js - Express.js app for App Engine
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;

    // Process order
    const result = await processOrder(order);

    res.json({ success: true, orderId: result.id });
  } catch (error) {
    console.error('Order processing failed:', error);
    res.status(500).json({ error: 'Order processing failed' });
  }
});

app.get('/_ah/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Best Practices

- Use appropriate machine types for workload requirements
- Implement auto-scaling for variable workloads
- Use managed services (GKE, Cloud Run) for reduced operational overhead
- Implement proper monitoring and logging
- Use Cloud Armor for DDoS protection and WAF
- Implement proper IAM roles and service accounts
- Use Cloud CDN for global content delivery
- Implement backup and disaster recovery strategies
- Use Cloud Build for CI/CD pipelines
- Monitor costs with Cloud Billing alerts

### Cost Optimization

```bash
# Use preemptible VMs for non-critical workloads
gcloud compute instances create batch-worker \
  --preemptible \
  --machine-type=n1-standard-4 \
  --zone=us-central1-a

# Use committed use discounts for predictable workloads
gcloud compute commitments create web-commitment \
  --region=us-central1 \
  --plan=12-month \
  --type=COMPUTE_OPTIMIZED \
  --resources=cpus=8,memory=32GB

# Use sustained use discounts automatically (no action needed)
```

### Security Configuration

```yaml
# IAM policy for compute resources
{
  "bindings": [
    {
      "role": "roles/compute.instanceAdmin.v1",
      "members": [
        "serviceAccount:compute-admin@${PROJECT_ID}.iam.gserviceaccount.com"
      ]
    },
    {
      "role": "roles/monitoring.viewer",
      "members": [
        "serviceAccount:monitoring@${PROJECT_ID}.iam.gserviceaccount.com"
      ]
    }
  ]
}
```

## Security Considerations

- Use VPC networks for network isolation
- Implement Cloud Armor for application protection
- Use service accounts with minimal required permissions
- Enable Cloud Audit Logs for compliance
- Use customer-managed encryption keys for sensitive data
- Implement proper firewall rules and security groups
- Use Cloud Identity-Aware Proxy for application access
- Regularly update and patch instances
- Use Binary Authorization for container security
- Implement proper logging and monitoring

## GCP vs AWS vs Azure Compute Services

| Feature | GCP | AWS | Azure |
|---------|-----|-----|-------|
| VM Service | Compute Engine | EC2 | Virtual Machines |
| Container Service | GKE | EKS | AKS |
| Serverless | Cloud Functions | Lambda | Functions |
| App Platform | App Engine | Elastic Beanstalk | App Service |
| Kubernetes | Native | Managed | Managed |
| Pricing Model | Sustained use discounts | Reserved instances | Reserved instances |
| Global Regions | 35+ | 25+ | 60+ |

## Common Use Cases

- **Web Applications**: App Engine for rapid deployment
- **Microservices**: GKE for container orchestration
- **Data Processing**: Compute Engine with GPUs
- **API Backends**: Cloud Functions for serverless APIs
- **Batch Processing**: Preemptible VMs for cost-effective computing
- **Machine Learning**: AI Platform with custom hardware
- **Gaming**: High-performance instances with global networking
- **E-commerce**: Auto-scaling web frontends and APIs