# Google Cloud Pub/Sub

## Gambaran Umum

Google Cloud Pub/Sub adalah layanan pesan untuk pertukaran data peristiwa antar aplikasi dan layanan. Layanan ini menyediakan pesan asinkron yang andal, banyak-ke-banyak antar aplikasi. Pub/Sub dirancang untuk menyediakan pesan dengan latensi rendah dan tahan lama yang berfungsi dalam skala besar.

## Konsep Utama

### Komponen Inti
- **Topics**: Sumber daya bernama tempat pesan dikirim oleh publisher
- **Subscriptions**: Sumber daya bernama yang mewakili aliran pesan dari topic
- **Messages**: Data yang bergerak melalui layanan
- **Publishers**: Aplikasi yang mengirim pesan ke topics
- **Subscribers**: Aplikasi yang menerima pesan dari subscriptions

### Pengiriman Pesan
- **Pengiriman setidaknya sekali**: Pesan dikirim setidaknya satu kali
- **Pengurutan**: Pengurutan per-kunci untuk pemrosesan pesan terurut
- **Penyaringan**: Penyaringan pesan sisi server berdasarkan atribut
- **Dead-letter topics**: Menangani pesan yang tidak dapat diproses
- **Pengiriman Push/Pull**: Pilih antara push ke webhook atau pull dari subscription

### Fitur Lanjutan
- **Pemrosesan tepat sekali**: Mencegah pemrosesan pesan duplikat
- **Retensi pesan**: Konfigurasi berapa lama pesan dipertahankan
- **Seek**: Putar ulang pesan dari titik waktu tertentu
- **Snapshots**: Simpan status subscription untuk putar ulang nanti
- **Subscriptions BigQuery**: Secara otomatis streaming pesan ke BigQuery

## Kapan Menggunakan

- Memisahkan mikro layanan dan arsitektur berbasis peristiwa
- Streaming data real-time dan analitik
- Komunikasi perangkat IoT dan ingestion data
- Orkestrasi alur kerja dan pemrosesan asinkron
- Agregasi log dan pemantauan terpusat
- Event sourcing dan pola CQRS
- Notifikasi real-time dan peringatan
- Orkestrasi pipeline data
- Pesan lintas-region dan lintas-cloud
- Komunikasi backend aplikasi mobile

## Contoh

### Publisher dan Subscriber Dasar

```python
# Contoh Publisher Python
from google.cloud import pubsub_v1
import json

def publish_order_event():
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path('my-project', 'ecommerce-orders')

    order_data = {
        'order_id': 'ORD-12345',
        'customer_id': 'CUST-67890',
        'total_amount': 299.99,
        'items': [
            {'product_id': 'PROD-001', 'quantity': 2, 'price': 149.99},
            {'product_id': 'PROD-002', 'quantity': 1, 'price': 0.01}
        ],
        'timestamp': '2024-01-15T10:30:00Z'
    }

    # Publish pesan
    data = json.dumps(order_data).encode('utf-8')
    future = publisher.publish(topic_path, data, order_id='ORD-12345')

    print(f'Pesan order dipublish: {future.result()}')

if __name__ == '__main__':
    publish_order_event()
```

```python
# Contoh Subscriber Python
from google.cloud import pubsub_v1
import json

def order_processing_callback(message):
    """Memproses pesan order"""
    try:
        order_data = json.loads(message.data.decode('utf-8'))
        print(f'Memproses order: {order_data["order_id"]}')

        # Proses order (update inventory, pembayaran, dll.)
        process_order(order_data)

        # Acknowledge pesan
        message.ack()
        print(f'Order berhasil diproses: {order_data["order_id"]}')

    except Exception as e:
        print(f'Error memproses order: {e}')
        # Negative acknowledge - pesan akan dikirim ulang
        message.nack()

def subscribe_to_orders():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path('my-project', 'order-processing-sub')

    # Subscribe ke pesan
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=order_processing_callback
    )

    print('Mendengarkan pesan order...')

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print('Subscription dibatalkan')

def process_order(order_data):
    # Logika pemrosesan order
    print(f'Mengupdate inventory untuk order {order_data["order_id"]}')
    # Simulasi pemrosesan
    import time
    time.sleep(0.1)
```

### Penyaringan Pesan dan Pemrosesan Terurut Lanjutan

```python
# Penyaringan Pesan dan Pemrosesan Terurut
from google.cloud import pubsub_v1
import json

def setup_filtered_subscription():
    """Membuat subscription dengan penyaringan pesan"""
    subscriber = pubsub_v1.SubscriberClient()

    subscription_path = subscriber.subscription_path('my-project', 'high-value-orders')
    topic_path = subscriber.topic_path('my-project', 'ecommerce-orders')

    # Membuat subscription dengan filter
    subscription = pubsub_v1.types.Subscription(
        name=subscription_path,
        topic=topic_path,
        filter='attributes.order_total > "500"',  # Filter untuk order bernilai tinggi
        enable_message_ordering=True  # Mengaktifkan pengiriman terurut
    )

    subscriber.create_subscription(subscription)
    print('Subscription terfilter untuk order bernilai tinggi dibuat')

def publish_ordered_messages():
    """Publish pesan dengan ordering keys"""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path('my-project', 'inventory-updates')

    # Publish update inventory untuk produk yang sama secara berurutan
    product_updates = [
        {'product_id': 'PROD-001', 'action': 'reserve', 'quantity': 2, 'order_id': 'ORD-123'},
        {'product_id': 'PROD-001', 'action': 'ship', 'quantity': 2, 'order_id': 'ORD-123'},
        {'product_id': 'PROD-001', 'action': 'deliver', 'quantity': 2, 'order_id': 'ORD-123'},
    ]

    for update in product_updates:
        data = json.dumps(update).encode('utf-8')
        # Gunakan product_id sebagai ordering key untuk memastikan pengiriman terurut
        future = publisher.publish(
            topic_path,
            data,
            product_id=update['product_id'],
            action=update['action']
        )
        print(f'Update inventory dipublish: {future.result()}')

def process_ordered_messages(message):
    """Memproses pesan dengan jaminan pengurutan"""
    try:
        update_data = json.loads(message.data.decode('utf-8'))
        product_id = message.attributes.get('product_id')

        print(f'Memproses {update_data["action"]} untuk produk {product_id}')

        # Proses secara berurutan (reserve -> ship -> deliver)
        if update_data['action'] == 'reserve':
            reserve_inventory(update_data)
        elif update_data['action'] == 'ship':
            ship_inventory(update_data)
        elif update_data['action'] == 'deliver':
            deliver_inventory(update_data)

        message.ack()

    except Exception as e:
        print(f'Error memproses pesan: {e}')
        message.nack()
```

### Dead Letter Topics dan Penanganan Error

```python
# Dead Letter Topics untuk Pesan Gagal
from google.cloud import pubsub_v1
import json

def setup_dead_letter_subscription():
    """Membuat subscription dengan dead letter topic"""
    subscriber = pubsub_v1.SubscriberClient()

    subscription_path = subscriber.subscription_path('my-project', 'order-processing')
    topic_path = subscriber.topic_path('my-project', 'ecommerce-orders')
    dead_letter_topic_path = subscriber.topic_path('my-project', 'failed-orders')

    # Membuat subscription dengan dead letter policy
    subscription = pubsub_v1.types.Subscription(
        name=subscription_path,
        topic=topic_path,
        dead_letter_policy=pubsub_v1.types.DeadLetterPolicy(
            dead_letter_topic=dead_letter_topic_path,
            max_delivery_attempts=5  # Coba ulang 5 kali sebelum dead letter
        ),
        ack_deadline_seconds=60,  # 60 detik untuk memproses
        retry_policy=pubsub_v1.types.RetryPolicy(
            minimum_backoff='10s',
            maximum_backoff='300s'  # Exponential backoff
        )
    )

    subscriber.create_subscription(subscription)
    print('Subscription dengan dead letter policy dibuat')

def process_with_error_handling(message):
    """Memproses pesan dengan penanganan error komprehensif"""
    try:
        order_data = json.loads(message.data.decode('utf-8'))

        # Validasi data order
        if not validate_order(order_data):
            raise ValueError('Data order tidak valid')

        # Proses order
        result = process_order(order_data)

        if not result['success']:
            raise Exception(f'Pemrosesan order gagal: {result["error"]}')

        message.ack()
        print(f'Order berhasil diproses: {order_data["order_id"]}')

    except json.JSONDecodeError:
        print('JSON tidak valid dalam pesan')
        message.nack()  # Akan akhirnya pergi ke dead letter topic

    except ValueError as e:
        print(f'Error validasi: {e}')
        message.nack()

    except Exception as e:
        print(f'Error pemrosesan: {e}')
        message.nack()

def validate_order(order_data):
    """Validasi struktur data order"""
    required_fields = ['order_id', 'customer_id', 'total_amount', 'items']
    return all(field in order_data for field in required_fields)

def process_order(order_data):
    """Mock pemrosesan order dengan potensi kegagalan"""
    # Simulasi kegagalan pemrosesan acak
    import random
    if random.random() < 0.1:  # Tingkat kegagalan 10%
        return {'success': False, 'error': 'Pemrosesan pembayaran gagal'}

    # Simulasi waktu pemrosesan
    import time
    time.sleep(0.5)

    return {'success': True, 'order_id': order_data['order_id']}
```

### Push Subscriptions dan Webhooks

```python
# Push Subscription dengan Cloud Function
from flask import Flask, request, jsonify
from google.cloud import pubsub_v1
import json
import os

app = Flask(__name__)

@app.route('/webhook/order-notification', methods=['POST'])
def order_notification_webhook():
    """Menangani push messages dari Pub/Sub"""
    try:
        # Verifikasi request dari Pub/Sub
        if request.method != 'POST':
            return 'Method not allowed', 405

        # Ekstrak pesan dari Pub/Sub
        envelope = request.get_json()
        if not envelope:
            return 'Bad Request: No JSON payload', 400

        message = envelope.get('message')
        if not message:
            return 'Bad Request: No message in envelope', 400

        # Decode data pesan
        data = json.loads(message['data'].decode('utf-8'))
        attributes = message.get('attributes', {})

        print(f'Notifikasi order diterima: {data["order_id"]}')

        # Proses notifikasi
        send_order_notification(data)

        return jsonify({'success': True}), 200

    except Exception as e:
        print(f'Error memproses webhook: {e}')
        return jsonify({'error': str(e)}), 500

def send_order_notification(order_data):
    """Kirim notifikasi ke pelanggan"""
    # Implementasi untuk mengirim notifikasi email/SMS
    print(f'Mengirim notifikasi untuk order {order_data["order_id"]}')

def create_push_subscription():
    """Membuat push subscription ke Cloud Function"""
    subscriber = pubsub_v1.SubscriberClient()

    subscription_path = subscriber.subscription_path(
        os.getenv('GOOGLE_CLOUD_PROJECT'),
        'order-notification-push'
    )
    topic_path = subscriber.topic_path(
        os.getenv('GOOGLE_CLOUD_PROJECT'),
        'order-notifications'
    )

    # Cloud Function URL
    push_endpoint = f'https://{os.getenv("REGION")}-{os.getenv("GOOGLE_CLOUD_PROJECT")}.cloudfunctions.net/order-notification-webhook'

    subscription = pubsub_v1.types.Subscription(
        name=subscription_path,
        topic=topic_path,
        push_config=pubsub_v1.types.PushConfig(
            push_endpoint=push_endpoint,
            oidc_token=pubsub_v1.types.OidcToken(
                service_account_email='pubsub-push@my-project.iam.gserviceaccount.com'
            )
        )
    )

    subscriber.create_subscription(subscription)
    print(f'Push subscription dibuat ke {push_endpoint}')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

### Konfigurasi Terraform

```hcl
# Konfigurasi Topic Pub/Sub
resource "google_pubsub_topic" "ecommerce_orders" {
  name = "ecommerce-orders"

  labels = {
    environment = "production"
    team        = "ecommerce"
  }

  message_retention_duration = "604800s"  # 7 hari
}

resource "google_pubsub_topic" "inventory_updates" {
  name = "inventory-updates"

  labels = {
    environment = "production"
    team        = "inventory"
  }
}

# Subscriptions dengan metode pengiriman berbeda
resource "google_pubsub_subscription" "order_processing" {
  name  = "order-processing-sub"
  topic = google_pubsub_topic.ecommerce_orders.name

  ack_deadline_seconds = 60

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.failed_orders.id
    max_delivery_attempts = 5
  }

  labels = {
    environment = "production"
    service     = "order-processing"
  }
}

# Push subscription untuk notifikasi
resource "google_pubsub_subscription" "order_notifications_push" {
  name  = "order-notifications-push"
  topic = google_pubsub_topic.ecommerce_orders.name

  push_config {
    push_endpoint = "https://us-central1-my-project.cloudfunctions.net/order-notification-webhook"

    oidc_token {
      service_account_email = "pubsub-push@my-project.iam.gserviceaccount.com"
    }
  }

  filter = "attributes.event_type = \"order_created\""
}

# Dead letter topic
resource "google_pubsub_topic" "failed_orders" {
  name = "failed-orders"

  labels = {
    environment = "production"
    type        = "dead-letter"
  }
}

# Izin IAM
resource "google_pubsub_topic_iam_binding" "orders_publisher" {
  topic   = google_pubsub_topic.ecommerce_orders.name
  role    = "roles/pubsub.publisher"
  members = [
    "serviceAccount:order-service@my-project.iam.gserviceaccount.com",
  ]
}

resource "google_pubsub_subscription_iam_binding" "processing_subscriber" {
  subscription = google_pubsub_subscription.order_processing.name
  role         = "roles/pubsub.subscriber"
  members = [
    "serviceAccount:order-processor@my-project.iam.gserviceaccount.com",
  ]
}
```

## Praktik Terbaik

- Gunakan ack deadline yang sesuai untuk waktu pemrosesan pesan
- Implementasikan penanganan error dan dead letter topics yang tepat
- Gunakan penyaringan pesan untuk mengurangi beban subscriber
- Aktifkan pengurutan pesan ketika urutan penting
- Pantau backlog subscription dan tingkat pemrosesan
- Gunakan push subscriptions untuk pemrosesan real-time
- Implementasikan autentikasi yang tepat untuk push endpoints
- Gunakan retry policy yang sesuai untuk kegagalan sementara
- Pantau dan beri peringatan pada pertumbuhan dead letter queue
- Gunakan label dan metadata untuk organisasi
- Implementasikan logging dan tracing yang tepat

### Optimasi Performa

```bash
# Pantau performa subscription
gcloud pubsub subscriptions describe order-processing-sub --format="table(name,ackDeadlineSeconds,pushConfig)"

# Periksa backlog subscription
gcloud pubsub subscriptions describe order-processing-sub --format="value(numOutstandingMessages)"

# Pantau dead letter queue
gcloud pubsub topics list-subscriptions failed-orders

# Skalakan throughput subscription
gcloud pubsub subscriptions update order-processing-sub --ack-deadline=30

# Aktifkan pengiriman tepat sekali untuk pesan kritis
gcloud pubsub subscriptions update order-processing-sub --enable-exactly-once-delivery
```

### Optimasi Biaya

```bash
# Pantau biaya Pub/Sub
gcloud billing accounts list
gcloud alpha billing budgets create pubsub-budget \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Pub/Sub Budget" \
  --budget-amount=1000 \
  --threshold-rule=percent=80

# Gunakan retensi pesan yang sesuai
gcloud pubsub topics update ecommerce-orders --message-retention-duration=7d

# Pantau throughput pesan
gcloud pubsub topics describe ecommerce-orders --format="value(messageRetentionDuration)"
```

## Pertimbangan Keamanan

- Gunakan IAM roles dengan izin minimal yang diperlukan
- Aktifkan Cloud Audit Logs untuk pemantauan kepatuhan
- Gunakan VPC Service Controls untuk keamanan jaringan
- Implementasikan autentikasi yang tepat untuk push endpoints
- Enkripsi data pesan sensitif
- Gunakan service accounts alih-alih user accounts
- Implementasikan kontrol akses yang tepat untuk topics dan subscriptions
- Putar kunci service account secara teratur
- Pantau upaya akses tidak sah
- Gunakan customer-managed encryption keys untuk topics sensitif

## Pub/Sub vs Layanan Pesan Lain

| Fitur | Cloud Pub/Sub | Amazon SQS | Amazon SNS | RabbitMQ |
|-------|----------------|------------|------------|----------|
| Model Pengiriman | Pull/Push | Pull | Push | Pull/Push |
| Pengurutan | Per kunci | Upaya terbaik | Tidak | Per queue |
| Persistence | 7 hari | 14 hari | Tidak ada | Dapat dikonfigurasi |
| Penyaringan | Sisi server | Tidak | Tidak | Sisi klien |
| Skalabilitas | Global | Regional | Regional | Cluster |
| Tepat sekali | Ya | Tidak | Tidak | Tidak |
| Dead letters | Ya | Ya | Tidak | Ya |

## Kasus Penggunaan Umum

- **Arsitektur Berbasis Peristiwa**: Memisahkan komunikasi mikro layanan
- **Analitik Real-time**: Stream peristiwa ke BigQuery dan platform analitik
- **Ingestion Data IoT**: Kumpulkan dan proses data sensor dalam skala besar
- **Pemrosesan Order**: Tangani alur kerja e-commerce secara asinkron
- **Sistem Notifikasi**: Kirim peringatan dan notifikasi real-time
- **Agregasi Log**: Pusatkan log aplikasi dan sistem
- **Orkestrasi Alur Kerja**: Koordinasikan proses bisnis yang kompleks
- **Pipeline Data**: Stream data antar tahap pemrosesan
- **Backend Mobile**: Tangani peristiwa aplikasi mobile dan sinkronisasi
- **Gaming**: Proses peristiwa game real-time dan leaderboard