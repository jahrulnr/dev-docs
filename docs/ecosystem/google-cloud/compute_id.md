# Layanan Komputasi Google Cloud Platform

## Gambaran Umum

Google Cloud Platform (GCP) menyediakan rangkaian layanan komputasi yang komprehensif yang dirancang untuk menjalankan aplikasi dalam skala apa pun, dari workload kecil hingga sistem enterprise-grade. Layanan komputasi GCP menawarkan fleksibilitas, skalabilitas, dan integrasi dengan layanan Google Cloud lainnya.

## Layanan Utama

### Compute Engine
- **Virtual Machines**: VM yang scalable dengan tipe mesin kustom
- **Preemptible VMs**: Instance berumur pendek yang hemat biaya
- **Managed Instance Groups**: Grup auto-scaling untuk high availability
- **Sole-Tenant Nodes**: Hardware dedicated untuk kebutuhan compliance

### Kubernetes Engine (GKE)
- **Managed Kubernetes**: Cluster Kubernetes yang fully managed
- **Autopilot Mode**: Manajemen Kubernetes hands-free
- **Anthos**: Manajemen Kubernetes multi-cloud dan hybrid
- **Cloud Run**: Eksekusi container serverless

### Cloud Functions
- **Serverless Functions**: Komputasi event-driven
- **Multiple Runtimes**: Node.js, Python, Go, Java, .NET, Ruby, PHP
- **HTTP Triggers**: Fungsi yang dapat diakses web
- **Event Triggers**: Respons terhadap event Cloud Storage, Pub/Sub, Firestore

### App Engine
- **Standard Environment**: Runtime sandboxed untuk deployment cepat
- **Flexible Environment**: Runtime kustom berbasis Docker
- **Automatic Scaling**: Dari nol hingga jutaan instance
- **Built-in Services**: Memcache, task queues, search

## Kapan Digunakan

- **Compute Engine**: Workload VM tradisional, konfigurasi kustom, workload GPU
- **GKE**: Aplikasi containerized, microservices, pipeline CI/CD
- **Cloud Functions**: Event processing, API backends, tugas automation
- **App Engine**: Aplikasi web, mobile backends, rapid prototyping

## Contoh

### Deployment VM Compute Engine

```bash
# Membuat instance VM
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

# Membuat aturan firewall
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server
```

### Cluster Kubernetes Engine

```yaml
# Konfigurasi cluster GKE
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

### Cloud Functions untuk Pemrosesan Order

```javascript
// index.js
const functions = require('@google-cloud/functions-framework');
const {PubSub} = require('@google-cloud/pubsub');

functions.cloudEvent('processOrder', async (cloudEvent) => {
  const pubsubMessage = cloudEvent.data.message;
  const orderData = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

  console.log('Memproses order:', orderData.orderId);

  // Logika pemrosesan order
  await processOrder(orderData);

  // Publikasikan ke topic inventory
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
  // Logika pemrosesan order
  // Validasi pembayaran, update inventory, kirim notifikasi
}
```

```yaml
# function.yaml
name: process-order
description: Memproses order baru dari Pub/Sub
runtime: nodejs18
entryPoint: processOrder
eventTrigger:
  eventType: google.cloud.pubsub.topic.v1.messagePublished
  resource: projects/${PROJECT_ID}/topics/new-orders
```

### Deployment App Engine

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
// app.js - Aplikasi Express.js untuk App Engine
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;

    // Proses order
    const result = await processOrder(order);

    res.json({ success: true, orderId: result.id });
  } catch (error) {
    console.error('Pemrosesan order gagal:', error);
    res.status(500).json({ error: 'Pemrosesan order gagal' });
  }
});

app.get('/_ah/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
```

## Praktik Terbaik

- Gunakan tipe mesin yang sesuai untuk kebutuhan workload
- Implementasikan auto-scaling untuk workload variabel
- Gunakan layanan managed (GKE, Cloud Run) untuk mengurangi overhead operasional
- Implementasikan monitoring dan logging yang proper
- Gunakan Cloud Armor untuk perlindungan DDoS dan WAF
- Implementasikan IAM roles dan service accounts yang proper
- Gunakan Cloud CDN untuk content delivery global
- Implementasikan strategi backup dan disaster recovery
- Gunakan Cloud Build untuk pipeline CI/CD
- Monitor biaya dengan Cloud Billing alerts

### Optimasi Biaya

```bash
# Gunakan preemptible VMs untuk workload non-kritis
gcloud compute instances create batch-worker \
  --preemptible \
  --machine-type=n1-standard-4 \
  --zone=us-central1-a

# Gunakan committed use discounts untuk workload predictable
gcloud compute commitments create web-commitment \
  --region=us-central1 \
  --plan=12-month \
  --type=COMPUTE_OPTIMIZED \
  --resources=cpus=8,memory=32GB

# Sustained use discounts otomatis (tidak perlu aksi)
```

### Konfigurasi Keamanan

```yaml
# IAM policy untuk resource komputasi
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

## Pertimbangan Keamanan

- Gunakan VPC networks untuk isolasi jaringan
- Implementasikan Cloud Armor untuk perlindungan aplikasi
- Gunakan service accounts dengan permissions minimal yang diperlukan
- Aktifkan Cloud Audit Logs untuk compliance
- Gunakan customer-managed encryption keys untuk data sensitif
- Implementasikan aturan firewall dan security groups yang proper
- Gunakan Cloud Identity-Aware Proxy untuk akses aplikasi
- Update dan patch instance secara regular
- Gunakan Binary Authorization untuk keamanan container
- Implementasikan logging dan monitoring yang proper

## Layanan Komputasi GCP vs AWS vs Azure

| Fitur | GCP | AWS | Azure |
|-------|-----|-----|-------|
| VM Service | Compute Engine | EC2 | Virtual Machines |
| Container Service | GKE | EKS | AKS |
| Serverless | Cloud Functions | Lambda | Functions |
| App Platform | App Engine | Elastic Beanstalk | App Service |
| Kubernetes | Native | Managed | Managed |
| Model Pricing | Sustained use discounts | Reserved instances | Reserved instances |
| Global Regions | 35+ | 25+ | 60+ |

## Use Case Umum

- **Aplikasi Web**: App Engine untuk deployment cepat
- **Microservices**: GKE untuk container orchestration
- **Pemrosesan Data**: Compute Engine dengan GPUs
- **API Backends**: Cloud Functions untuk serverless APIs
- **Batch Processing**: Preemptible VMs untuk computing hemat biaya
- **Machine Learning**: AI Platform dengan hardware kustom
- **Gaming**: Instance high-performance dengan networking global
- **E-commerce**: Auto-scaling web frontends dan APIs