# Google Cloud Run

## Gambaran Umum

Google Cloud Run adalah platform serverless terkelola penuh yang memungkinkan Anda menjalankan container stateless yang dapat dipanggil melalui HTTP requests. Layanan ini mengabstraksi manajemen infrastruktur sambil menyediakan scaling otomatis, ketersediaan tinggi, dan penagihan pay-per-use.

## Konsep Utama

### Tipe Layanan
- **Cloud Run (fully managed)**: Google mengelola semua termasuk networking
- **Cloud Run for Anthos**: Jalankan di cluster Anthos untuk deployment hybrid
- **Cloud Run jobs**: Jalankan container sebagai batch jobs alih-alih services

### Model Eksekusi
- **Request-response**: Eksekusi container yang dipicu HTTP
- **Event-driven**: Integrasi dengan Pub/Sub, Cloud Storage, dan layanan lain
- **Concurrency**: Multiple requests ditangani oleh single container instance
- **Cold starts**: Latensi request awal saat scaling dari nol

### Scaling dan Performa
- **Automatic scaling**: Scale ke nol saat tidak ada traffic, scale up berdasarkan requests
- **Concurrency control**: Maximum concurrent requests per container instance
- **CPU allocation**: Alokasi CPU yang dapat dikonfigurasi per request
- **Memory limits**: Batas memori yang dapat dikonfigurasi per container

### Opsi Deployment
- **Source-based**: Deploy dari source code dengan buildpacks
- **Container-based**: Deploy container images yang sudah dibangun
- **Direct from source**: Integrasi GitHub untuk CI/CD
- **Cloud Build integration**: Build dan deployment otomatis

## Kapan Menggunakan

- API backend dan microservices
- Aplikasi web dan websites
- Pipeline pemrosesan data
- Pemrosesan event-driven
- Background jobs dan tasks
- Backend aplikasi mobile
- Pemrosesan data IoT
- Analitik real-time
- ML model serving
- Modernisasi aplikasi legacy
- Environment development dan testing
- Alternatif serverless function
- Migrasi aplikasi containerized

## Contoh

### Layanan HTTP Dasar

```python
# Flask API Service
from flask import Flask, request, jsonify
import os
import logging

app = Flask(__name__)

# Configure logging untuk Cloud Run
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/', methods=['GET'])
def hello():
    """Basic hello world endpoint"""
    return jsonify({
        'message': 'Hello from Cloud Run!',
        'timestamp': '2024-01-15T10:30:00Z',
        'service': 'ecommerce-api'
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get products dengan optional filtering"""
    try:
        category = request.args.get('category')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        # Dalam aplikasi nyata, ini akan query database
        products = [
            {
                'id': 1,
                'name': 'Laptop Pro',
                'price': 1299.99,
                'category': 'Electronics',
                'stock': 50
            },
            {
                'id': 2,
                'name': 'Wireless Headphones',
                'price': 199.99,
                'category': 'Electronics',
                'stock': 100
            }
        ]

        # Apply filtering
        if category:
            products = [p for p in products if p['category'].lower() == category.lower()]

        # Apply pagination
        paginated_products = products[offset:offset + limit]

        return jsonify({
            'products': paginated_products,
            'total': len(products),
            'limit': limit,
            'offset': offset
        })

    except Exception as e:
        logger.error(f'Error fetching products: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Buat order baru"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['customer_id', 'items']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Calculate total
        total_amount = sum(item['price'] * item['quantity'] for item in data['items'])

        # Dalam aplikasi nyata, ini akan save ke database dan publish events
        order = {
            'id': 'ORD-12345',
            'customer_id': data['customer_id'],
            'total_amount': total_amount,
            'status': 'pending',
            'items': data['items'],
            'created_at': '2024-01-15T10:30:00Z'
        }

        logger.info(f'Order created: {order["id"]}')

        return jsonify(order), 201

    except Exception as e:
        logger.error(f'Error creating order: {e}')
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

### Dockerfile untuk Cloud Run

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "app.py"]
```

```txt
# requirements.txt
Flask==2.3.3
gunicorn==21.2.0
requests==2.31.0
```

### Pemrosesan Event-Driven

```python
# Cloud Run service yang dipicu oleh Pub/Sub
from flask import Flask, request, jsonify
import json
import logging
import base64

app = Flask(__name__)
logger = logging.getLogger(__name__)

@app.route('/', methods=['POST'])
def process_pubsub_message():
    """Memproses pesan dari Pub/Sub"""
    try:
        # Extract Pub/Sub message
        envelope = request.get_json()

        if not envelope:
            return jsonify({'error': 'No envelope'}), 400

        pubsub_message = envelope.get('message')
        if not pubsub_message:
            return jsonify({'error': 'No message in envelope'}), 400

        # Decode message data
        if 'data' in pubsub_message:
            message_data = base64.b64decode(pubsub_message['data']).decode('utf-8')
            event_data = json.loads(message_data)
        else:
            event_data = {}

        # Extract attributes
        attributes = pubsub_message.get('attributes', {})

        logger.info(f'Received message: {event_data}')

        # Process based on event type
        event_type = attributes.get('event_type', 'unknown')

        if event_type == 'order_created':
            result = process_order_created(event_data)
        elif event_type == 'inventory_updated':
            result = process_inventory_updated(event_data)
        elif event_type == 'payment_processed':
            result = process_payment_processed(event_data)
        else:
            logger.warning(f'Unknown event type: {event_type}')
            result = {'status': 'ignored', 'reason': 'unknown_event_type'}

        return jsonify(result), 200

    except json.JSONDecodeError as e:
        logger.error(f'Invalid JSON in message: {e}')
        return jsonify({'error': 'Invalid JSON'}), 400
    except Exception as e:
        logger.error(f'Error processing message: {e}')
        return jsonify({'error': 'Internal server error'}), 500

def process_order_created(order_data):
    """Memproses event order created"""
    try:
        order_id = order_data['order_id']

        # Update inventory
        for item in order_data['items']:
            update_inventory(item['product_id'], -item['quantity'])

        # Send notification
        send_order_notification(order_id, order_data['customer_email'])

        # Update analytics
        update_sales_analytics(order_data)

        logger.info(f'Order processed: {order_id}')
        return {'status': 'processed', 'order_id': order_id}

    except Exception as e:
        logger.error(f'Error processing order: {e}')
        raise

def process_inventory_updated(inventory_data):
    """Memproses event inventory updated"""
    try:
        product_id = inventory_data['product_id']
        quantity_change = inventory_data['quantity_change']

        # Update cache or search index
        update_product_cache(product_id)

        # Check for low stock alerts
        check_low_stock_alert(product_id)

        logger.info(f'Inventory updated: {product_id}, change: {quantity_change}')
        return {'status': 'processed', 'product_id': product_id}

    except Exception as e:
        logger.error(f'Error processing inventory update: {e}')
        raise

def process_payment_processed(payment_data):
    """Memproses event payment processed"""
    try:
        order_id = payment_data['order_id']
        payment_status = payment_data['status']

        if payment_status == 'success':
            # Update order status
            update_order_status(order_id, 'paid')

            # Trigger shipping process
            trigger_shipping_process(order_id)

        elif payment_status == 'failed':
            # Cancel order
            cancel_order(order_id)

            # Restore inventory
            restore_inventory(order_id)

        logger.info(f'Payment processed: {order_id}, status: {payment_status}')
        return {'status': 'processed', 'order_id': order_id, 'payment_status': payment_status}

    except Exception as e:
        logger.error(f'Error processing payment: {e}')
        raise

# Mock functions (replace dengan implementasi aktual)
def update_inventory(product_id, quantity_change):
    pass

def send_order_notification(order_id, customer_email):
    pass

def update_sales_analytics(order_data):
    pass

def update_product_cache(product_id):
    pass

def check_low_stock_alert(product_id):
    pass

def update_order_status(order_id, status):
    pass

def trigger_shipping_process(order_id):
    pass

def cancel_order(order_id):
    pass

def restore_inventory(order_id):
    pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

### Integrasi Cloud Storage

```python
# Cloud Run service dengan integrasi Cloud Storage
from flask import Flask, request, jsonify, send_file
from google.cloud import storage
import os
import logging
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
logger = logging.getLogger(__name__)

# Initialize Cloud Storage client
storage_client = storage.Client()
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'ecommerce-media')

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload/product-image', methods=['POST'])
def upload_product_image():
    """Upload gambar produk ke Cloud Storage"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        product_id = request.form.get('product_id')

        if not product_id:
            return jsonify({'error': 'Product ID required'}), 400

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{product_id}/{uuid.uuid4()}_{filename}"

        # Upload to Cloud Storage
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(unique_filename)

        # Set content type
        content_type = file.content_type or 'application/octet-stream'
        blob.upload_from_file(file, content_type=content_type)

        # Make public if needed
        if request.form.get('public') == 'true':
            blob.make_public()

        # Generate signed URL for private access
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=3600,  # 1 hour
            method="GET"
        )

        image_url = signed_url if request.form.get('public') != 'true' else blob.public_url

        logger.info(f'Image uploaded: {unique_filename}')

        return jsonify({
            'filename': unique_filename,
            'url': image_url,
            'bucket': BUCKET_NAME,
            'size': blob.size,
            'content_type': content_type
        }), 201

    except Exception as e:
        logger.error(f'Error uploading image: {e}')
        return jsonify({'error': 'Upload failed'}), 500

@app.route('/images/<path:filename>', methods=['GET'])
def get_image(filename):
    """Sajikan gambar dari Cloud Storage"""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)

        if not blob.exists():
            return jsonify({'error': 'Image not found'}), 404

        # Generate signed URL
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=3600,  # 1 hour
            method="GET"
        )

        return jsonify({'url': signed_url}), 200

    except Exception as e:
        logger.error(f'Error serving image: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/images/product/<product_id>', methods=['GET'])
def get_product_images(product_id):
    """Dapatkan semua gambar untuk produk"""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)

        # List blobs with product prefix
        blobs = bucket.list_blobs(prefix=f"{product_id}/")

        images = []
        for blob in blobs:
            if blob.name.endswith('/') or not allowed_file(blob.name):
                continue

            image_info = {
                'filename': blob.name,
                'url': blob.generate_signed_url(
                    version="v4",
                    expiration=3600,
                    method="GET"
                ) if not blob.public_url else blob.public_url,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created.isoformat() if blob.time_created else None
            }
            images.append(image_info)

        return jsonify({
            'product_id': product_id,
            'images': images,
            'count': len(images)
        }), 200

    except Exception as e:
        logger.error(f'Error listing product images: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/images/<path:filename>', methods=['DELETE'])
def delete_image(filename):
    """Hapus gambar dari Cloud Storage"""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)

        if not blob.exists():
            return jsonify({'error': 'Image not found'}), 404

        blob.delete()

        logger.info(f'Image deleted: {filename}')

        return jsonify({'message': 'Image deleted successfully'}), 200

    except Exception as e:
        logger.error(f'Error deleting image: {e}')
        return jsonify({'error': 'Delete failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

### Konfigurasi Terraform

```hcl
# Cloud Run Service
resource "google_cloud_run_service" "ecommerce_api" {
  name     = "ecommerce-api"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/my-project/ecommerce-api:latest"

        ports {
          container_port = 8080
        }

        env {
          name  = "PORT"
          value = "8080"
        }

        env {
          name  = "DATABASE_URL"
          value = "mysql://user:password@cloud-sql-instance/db"
        }

        env {
          name  = "REDIS_URL"
          value = "redis://redis-instance:6379"
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }

      container_concurrency = 80
      timeout_seconds      = 300
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "100"
        "run.googleapis.com/cpu-throttling" = "false"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "all"
    }
  }
}

# Cloud Run service dengan Pub/Sub trigger
resource "google_cloud_run_service" "order_processor" {
  name     = "order-processor"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/my-project/order-processor:latest"

        env {
          name  = "PUBSUB_TOPIC"
          value = google_pubsub_topic.order_events.name
        }
      }
    }
  }
}

# IAM permissions untuk Cloud Run
resource "google_cloud_run_service_iam_member" "api_invoker" {
  service  = google_cloud_run_service.ecommerce_api.name
  location = google_cloud_run_service.ecommerce_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Pub/Sub subscription untuk Cloud Run
resource "google_pubsub_subscription" "order_processor_sub" {
  name  = "order-processor-sub"
  topic = google_pubsub_topic.order_events.name

  push_config {
    push_endpoint = google_cloud_run_service.order_processor.status[0].url

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds = 60
}

# Service account untuk Pub/Sub
resource "google_service_account" "pubsub_invoker" {
  account_id   = "pubsub-cloud-run-invoker"
  display_name = "Pub/Sub Cloud Run Invoker"
}

# IAM binding untuk service account
resource "google_cloud_run_service_iam_member" "pubsub_invoker" {
  service  = google_cloud_run_service.order_processor.name
  location = google_cloud_run_service.order_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.pubsub_invoker.email}"
}

# Cloud Storage bucket untuk media
resource "google_storage_bucket" "media_bucket" {
  name          = "ecommerce-media-bucket"
  location      = "US"
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://my-ecommerce-app.com"]
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# IAM untuk Cloud Storage
resource "google_storage_bucket_iam_member" "media_bucket_viewer" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Cloud Build trigger untuk CI/CD
resource "google_cloudbuild_trigger" "api_build" {
  name = "ecommerce-api-build"

  github {
    owner = "my-org"
    name  = "ecommerce-api"
    push {
      branch = "^main$"
    }
  }

  build {
    step {
      name = "gcr.io/cloud-builders/docker"
      args = ["build", "-t", "gcr.io/$PROJECT_ID/ecommerce-api:$COMMIT_SHA", "."]
    }

    step {
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "gcr.io/$PROJECT_ID/ecommerce-api:$COMMIT_SHA"]
    }

    step {
      name = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args = [
        "run", "deploy", "ecommerce-api",
        "--image", "gcr.io/$PROJECT_ID/ecommerce-api:$COMMIT_SHA",
        "--region", "us-central1",
        "--platform", "managed",
        "--allow-unauthenticated"
      ]
    }
  }
}

# Custom domain mapping
resource "google_cloud_run_domain_mapping" "api_domain" {
  location = "us-central1"
  name     = "api.my-ecommerce-app.com"

  metadata {
    namespace = google_project.project.project_id
  }

  spec {
    route_name = google_cloud_run_service.ecommerce_api.name
  }
}

# Load balancer untuk custom domain
resource "google_compute_global_address" "api_ip" {
  name = "api-global-ip"
}

resource "google_compute_global_forwarding_rule" "api_forwarding_rule" {
  name       = "api-forwarding-rule"
  target     = google_compute_target_http_proxy.api_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.api_ip.address
}

resource "google_compute_target_http_proxy" "api_proxy" {
  name    = "api-http-proxy"
  url_map = google_compute_url_map.api_url_map.id
}

resource "google_compute_url_map" "api_url_map" {
  name            = "api-url-map"
  default_service = google_compute_backend_service.api_backend.id
}

resource "google_compute_backend_service" "api_backend" {
  name      = "api-backend"
  protocol  = "HTTP"
  port_name = "http"
  timeout_sec = 30

  backend {
    group = google_cloud_run_service.ecommerce_api.status[0].network_config[0].network
  }
}
```

## Praktik Terbaik

- Gunakan batas CPU dan memori yang sesuai
- Implementasikan health checks yang tepat
- Tangani cold starts dengan baik
- Gunakan concurrency controls secara efektif
- Implementasikan error handling dan logging yang tepat
- Gunakan environment variables untuk konfigurasi
- Implementasikan request timeouts
- Gunakan connection pooling untuk database
- Cache data yang sering diakses
- Implementasikan authentication dan authorization yang tepat
- Gunakan structured logging
- Monitor performa dan errors
- Implementasikan graceful shutdown
- Gunakan container base images yang sesuai
- Minimalkan ukuran container image
- Gunakan multi-stage builds untuk image yang lebih kecil

### Optimasi Performa

```bash
# Deploy dengan pengaturan teroptimasi
gcloud run deploy ecommerce-api \
  --image gcr.io/my-project/ecommerce-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --concurrency 80 \
  --cpu 1 \
  --memory 512Mi \
  --max-instances 100 \
  --timeout 300 \
  --port 8080

# Aktifkan alokasi CPU
gcloud run services update ecommerce-api \
  --cpu-throttling=false

# Set minimum instances untuk mengurangi cold starts
gcloud run services update ecommerce-api \
  --min-instances=1

# Monitor performa
gcloud run services describe ecommerce-api \
  --format="table(status.conditions[0].type,status.conditions[0].status)"

# Periksa revisions
gcloud run revisions list \
  --service=ecommerce-api \
  --format="table(name,status.conditions[0].status,spec.containers[0].resources.limits.cpu,spec.containers[0].resources.limits.memory)"
```

### Optimasi Biaya

```bash
# Monitor biaya Cloud Run
gcloud billing accounts list
gcloud alpha billing budgets create cloudrun-budget \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Cloud Run Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=80

# Set batas resource yang sesuai
gcloud run services update ecommerce-api \
  --cpu 0.5 \
  --memory 256Mi \
  --concurrency 50

# Gunakan CPU throttling untuk penghematan biaya
gcloud run services update ecommerce-api \
  --cpu-throttling=true

# Set max instances untuk kontrol biaya
gcloud run services update ecommerce-api \
  --max-instances=10

# Scale ke nol saat tidak digunakan
gcloud run services update ecommerce-api \
  --min-instances=0
```

## Pertimbangan Keamanan

- Gunakan IAM roles dengan izin minimal yang diperlukan
- Implementasikan authentication dan authorization yang tepat
- Gunakan HTTPS untuk semua komunikasi
- Validasi dan sanitasi input data
- Gunakan environment variables untuk secrets
- Implementasikan error handling tanpa kebocoran informasi
- Gunakan VPC networking untuk komunikasi privat
- Implementasikan rate limiting dan DDoS protection
- Monitor aktivitas mencurigakan
- Gunakan Cloud Audit Logs untuk compliance
- Implementasikan manajemen session yang tepat
- Gunakan container vulnerability scanning
- Implementasikan logging dan monitoring yang tepat
- Gunakan managed identity untuk komunikasi service-to-service

## Cloud Run vs Opsi Serverless Lain

| Fitur | Cloud Run | Cloud Functions | App Engine | Lambda |
|-------|-----------|-----------------|------------|--------|
| Runtime | Any (containers) | Limited languages | Multiple | Limited languages |
| Scaling | Automatic | Automatic | Automatic | Automatic |
| Cold starts | Yes | Yes | No (standard) | Yes |
| Execution time | 15 min | 9 min | No limit | 15 min |
| Pricing | Per request + CPU | Per request + GB-s | Per instance | Per request + GB-s |
| State | Stateless | Stateless | Stateful option | Stateless |
| Deployment | Container images | Source code | Source/apps | ZIP packages |

## Kasus Penggunaan Umum

- **API Gateways**: RESTful dan GraphQL APIs
- **Microservices**: Komponen aplikasi yang terdekomposisi
- **Aplikasi Web**: Full-stack web apps dalam containers
- **Pemrosesan Data**: ETL pipelines dan transformasi data
- **Event Processing**: Pemrosesan stream event real-time
- **ML Model Serving**: Endpoint inferensi AI/ML
- **Background Jobs**: Pemrosesan task asinkron
- **Mobile Backends**: API backends untuk aplikasi mobile
- **IoT Processing**: Ingestion dan pemrosesan data sensor
- **Legacy Migration**: Containerizing aplikasi existing
- **Development Tools**: CI/CD helpers dan utility development
- **Webhooks**: Integrasi layanan eksternal
- **Image Processing**: Pemrosesan dan optimasi media
- **Authentication**: Custom auth dan authorization services