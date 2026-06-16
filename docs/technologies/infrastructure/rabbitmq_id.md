# RabbitMQ

## Gambaran Umum

RabbitMQ adalah message broker yang robust dan open-source yang mengimplementasikan Advanced Message Queuing Protocol (AMQP). Dirancang untuk delivery pesan yang reliable, routing, dan queuing dalam sistem terdistribusi. Awalnya dikembangkan oleh Rabbit Technologies dan kemudian diakuisisi oleh VMware, RabbitMQ telah menjadi salah satu message broker yang paling banyak diadopsi dalam aplikasi enterprise.

RabbitMQ unggul dalam menyediakan messaging yang reliable di antara aplikasi, mendukung multiple messaging patterns, dan menawarkan ekosistem plugin yang ekstensif. RabbitMQ sangat cocok untuk skenario routing yang kompleks, guaranteed delivery, dan kebutuhan messaging high-reliability.

## Konsep Utama

- **Exchange**: Komponen routing pesan yang menerima pesan dan merutekannya ke queues
- **Queue**: Buffer yang menyimpan pesan sampai dikonsumsi oleh aplikasi
- **Binding**: Link antara exchange dan queue dengan aturan routing
- **Routing Key**: Atribut pesan yang digunakan untuk keputusan routing
- **Virtual Host**: Pengelompokan logis dari exchanges, queues, dan bindings
- **Connection**: Koneksi TCP antara aplikasi dan server RabbitMQ
- **Channel**: Koneksi virtual dalam koneksi TCP untuk multiplexing
- **Consumer**: Aplikasi yang menerima dan memproses pesan
- **Publisher**: Aplikasi yang mengirim pesan ke exchanges
- **Message Acknowledgment**: Mekanisme untuk mengkonfirmasi pemrosesan pesan yang berhasil
- **Dead Letter Exchange**: Menangani pesan yang tidak dapat dikirimkan atau diproses

## Kapan Digunakan

- Delivery pesan yang reliable di antara sistem terdistribusi
- Kebutuhan routing dan filtering pesan yang kompleks
- Pola work queue untuk pemrosesan background job
- Pola messaging publish/subscribe
- Pola komunikasi request/reply
- Pemrosesan pesan berbasis prioritas
- Persistence pesan dan guaranteed delivery
- Messaging high-reliability dalam aplikasi enterprise
- Integrasi antara sistem heterogen
- Komunikasi microservices yang event-driven
- Pemrosesan task asynchronous dan job queues

## Contoh

### Publisher dan Consumer Dasar

```python
# Contoh Publisher Python
import pika
import json

def publish_order():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    # Declare exchange dan queue
    channel.exchange_declare(exchange='app_orders', exchange_type='direct')
    channel.queue_declare(queue='order_processing', durable=True)
    channel.queue_bind(exchange='app_orders', queue='order_processing', routing_key='new_order')

    order_data = {
        'order_id': 'ORD-12345',
        'customer_id': 'CUST-67890',
        'items': [
            {'product_id': 'PROD-001', 'quantity': 2, 'price': 29.99},
            {'product_id': 'PROD-002', 'quantity': 1, 'price': 49.99}
        ],
        'total_amount': 109.97,
        'timestamp': '2024-01-15T10:30:00Z'
    }

    channel.basic_publish(
        exchange='app_orders',
        routing_key='new_order',
        body=json.dumps(order_data),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Buat pesan persistent
            content_type='application/json'
        )
    )

    print("Order berhasil dipublikasikan")
    connection.close()
```

```python
# Contoh Consumer Python
import pika
import json

def callback(ch, method, properties, body):
    order_data = json.loads(body)
    print(f"Memproses order: {order_data['order_id']}")

    # Proses order (update inventory, pemrosesan pembayaran, dll.)
    process_order(order_data)

    # Acknowledge pesan
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_orders():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    channel.queue_declare(queue='order_processing', durable=True)

    # Setup QoS - jangan dispatch pesan baru ke worker sampai previous di-acknowledge
    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(queue='order_processing', on_message_callback=callback)

    print('Menunggu orders. Untuk keluar tekan CTRL+C')
    channel.start_consuming()

def process_order(order_data):
    # Logika pemrosesan order
    print(f"Update inventory untuk order {order_data['order_id']}")
    # Simulasi waktu pemrosesan
    import time
    time.sleep(1)
```

### Routing Advanced dengan Topic Exchange

```python
# Topic Exchange untuk Routing Kompleks
import pika
import json

def setup_topic_exchange():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    # Declare topic exchange
    channel.exchange_declare(exchange='app_events', exchange_type='topic')

    # Declare queues untuk consumers berbeda
    channel.queue_declare(queue='inventory_updates', durable=True)
    channel.queue_declare(queue='payment_processing', durable=True)
    channel.queue_declare(queue='shipping_notifications', durable=True)
    channel.queue_declare(queue='analytics_events', durable=True)

    # Bind queues dengan routing patterns
    channel.queue_bind(exchange='app_events', queue='inventory_updates',
                      routing_key='order.inventory.*')
    channel.queue_bind(exchange='app_events', queue='payment_processing',
                      routing_key='order.payment.*')
    channel.queue_bind(exchange='app_events', queue='shipping_notifications',
                      routing_key='order.shipping.*')
    channel.queue_bind(exchange='app_events', queue='analytics_events',
                      routing_key='order.*.analytics')

    connection.close()

def publish_inventory_event():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    event_data = {
        'event_type': 'inventory_update',
        'product_id': 'PROD-001',
        'quantity_change': -2,
        'order_id': 'ORD-12345',
        'timestamp': '2024-01-15T10:30:00Z'
    }

    channel.basic_publish(
        exchange='app_events',
        routing_key='order.inventory.update',
        body=json.dumps(event_data)
    )

    print("Event inventory berhasil dipublikasikan")
    connection.close()
```

### Implementasi Pola RPC

```python
# Pola Request-Reply (RPC)
import pika
import uuid
import json

class OrderValidatorRpcClient:
    def __init__(self):
        self.connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        self.channel = self.connection.channel()

        # Declare reply queue
        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

        self.response = None
        self.corr_id = None

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = json.loads(body)

    def call(self, order_data):
        self.response = None
        self.corr_id = str(uuid.uuid4())

        self.channel.basic_publish(
            exchange='',
            routing_key='order_validation_queue',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=json.dumps(order_data)
        )

        while self.response is None:
            self.connection.process_data_events()

        return self.response

# RPC Server
def validate_order():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    channel.queue_declare(queue='order_validation_queue')

    def on_request(ch, method, props, body):
        order_data = json.loads(body)

        # Validasi order
        is_valid = validate_order_logic(order_data)

        response = {
            'order_id': order_data['order_id'],
            'is_valid': is_valid,
            'validation_errors': [] if is_valid else ['Metode pembayaran tidak valid']
        }

        ch.basic_publish(
            exchange='',
            routing_key=props.reply_to,
            properties=pika.BasicProperties(correlation_id=props.correlation_id),
            body=json.dumps(response)
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='order_validation_queue', on_message_callback=on_request)

    print("Layanan validasi order dimulai")
    channel.start_consuming()

def validate_order_logic(order_data):
    # Logika validasi order
    return order_data.get('payment_method') in ['credit_card', 'paypal', 'bank_transfer']
```

### Implementasi Priority Queue

```python
# Priority Queue untuk Pemrosesan Order
import pika

def setup_priority_queue():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    # Declare priority queue dengan max priority 10
    args = {'x-max-priority': 10}
    channel.queue_declare(queue='priority_orders', arguments=args, durable=True)

    # Bind ke exchange
    channel.exchange_declare(exchange='order_exchange', exchange_type='direct')
    channel.queue_bind(exchange='order_exchange', queue='priority_orders')

    connection.close()

def publish_priority_order(priority):
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    order_data = {
        'order_id': f'ORD-PRIORITY-{priority}',
        'priority': priority,
        'customer_type': 'premium' if priority > 5 else 'regular',
        'timestamp': '2024-01-15T10:30:00Z'
    }

    # Set prioritas pesan
    properties = pika.BasicProperties(priority=priority)

    channel.basic_publish(
        exchange='order_exchange',
        routing_key='',
        body=json.dumps(order_data),
        properties=properties
    )

    print(f"Order prioritas berhasil dipublikasikan dengan prioritas {priority}")
    connection.close()
```

### Setup Dead Letter Exchange

```python
# Dead Letter Exchange untuk Pesan yang Gagal
import pika
import json

def setup_dead_letter_exchange():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    # Declare dead letter exchange dan queue
    channel.exchange_declare(exchange='dead_letter_exchange', exchange_type='direct')
    channel.queue_declare(queue='failed_orders', durable=True)
    channel.queue_bind(exchange='dead_letter_exchange', queue='failed_orders')

    # Declare main processing queue dengan konfigurasi dead letter
    args = {
        'x-dead-letter-exchange': 'dead_letter_exchange',
        'x-dead-letter-routing-key': 'failed',
        'x-message-ttl': 60000,  # 1 menit TTL
        'x-max-retries': 3
    }

    channel.queue_declare(queue='order_processing', arguments=args, durable=True)
    connection.close()

def publish_order_with_retry():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    order_data = {
        'order_id': 'ORD-RETRY-001',
        'retry_count': 0,
        'max_retries': 3,
        'timestamp': '2024-01-15T10:30:00Z'
    }

    channel.basic_publish(
        exchange='',
        routing_key='order_processing',
        body=json.dumps(order_data)
    )

    connection.close()
```

### Konfigurasi Clustering

```yaml
# docker-compose.yml untuk RabbitMQ Cluster
version: '3.8'
services:
  rabbit1:
    image: rabbitmq:3.12-management-alpine
    hostname: rabbit1
    environment:
      RABBITMQ_ERLANG_COOKIE: 'secret_cookie'
      RABBITMQ_DEFAULT_USER: 'admin'
      RABBITMQ_DEFAULT_PASS: 'admin123'
    ports:
      - "15672:15672"
      - "5672:5672"
    volumes:
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq

  rabbit2:
    image: rabbitmq:3.12-management-alpine
    hostname: rabbit2
    depends_on:
      - rabbit1
    environment:
      RABBITMQ_ERLANG_COOKIE: 'secret_cookie'
      RABBITMQ_DEFAULT_USER: 'admin'
      RABBITMQ_DEFAULT_PASS: 'admin123'
    ports:
      - "15673:15672"
      - "5673:5672"
    volumes:
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq

  rabbit3:
    image: rabbitmq:3.12-management-alpine
    hostname: rabbit3
    depends_on:
      - rabbit1
    environment:
      RABBITMQ_ERLANG_COOKIE: 'secret_cookie'
      RABBITMQ_DEFAULT_USER: 'admin'
      RABBITMQ_DEFAULT_PASS: 'admin123'
    ports:
      - "15674:15672"
      - "5674:5672"
    volumes:
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq

networks:
  rabbitmq:
    driver: bridge
```

```ini
# rabbitmq.conf - Konfigurasi RabbitMQ
# Konfigurasi cluster
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@rabbit1
cluster_formation.classic_config.nodes.2 = rabbit@rabbit2
cluster_formation.classic_config.nodes.3 = rabbit@rabbit3

# Batas memory dan disk
vm_memory_high_watermark.absolute = 2GB
disk_free_limit.absolute = 5GB

# Heartbeat dan timeouts
heartbeat = 60
handshake_timeout = 10000

# TCP listener settings
tcp_listen_options.backlog = 128
tcp_listen_options.nodelay = true

# Management plugin
management.load_definitions = /etc/rabbitmq/definitions.json

# Keamanan
ssl_options.verify = verify_peer
ssl_options.fail_if_no_peer_cert = false
```

### Monitoring dan Management

```python
# Script Monitoring RabbitMQ
import requests
import json

def get_queue_info():
    url = 'http://localhost:15672/api/queues'
    auth = ('admin', 'admin123')

    response = requests.get(url, auth=auth)
    queues = response.json()

    for queue in queues:
        print(f"Queue: {queue['name']}")
        print(f"  Messages: {queue['messages']}")
        print(f"  Consumers: {queue['consumers']}")
        print(f"  Memory: {queue['memory']} bytes")
        print()

def get_node_info():
    url = 'http://localhost:15672/api/nodes'
    auth = ('admin', 'admin123')

    response = requests.get(url, auth=auth)
    nodes = response.json()

    for node in nodes:
        print(f"Node: {node['name']}")
        print(f"  Uptime: {node['uptime']}")
        print(f"  Memory used: {node['mem_used']}")
        print(f"  Disk free: {node['disk_free']}")
        print()

def create_user():
    url = 'http://localhost:15672/api/users/app_user'
    auth = ('admin', 'admin123')
    data = {
        'password': 'secure_password',
        'tags': 'management'
    }

    response = requests.put(url, auth=auth, json=data)
    if response.status_code == 201:
        print("User berhasil dibuat")
    else:
        print(f"Gagal membuat user: {response.status_code}")
```

## Praktik Terbaik

- Gunakan tipe exchange yang sesuai untuk kebutuhan routing Anda
- Implementasikan error handling dan message acknowledgment yang proper
- Konfigurasi dead letter exchanges untuk penanganan pesan yang gagal
- Gunakan pesan persistent untuk data penting
- Implementasikan connection pooling dan manajemen resource yang proper
- Monitor panjang queue dan consumer lag
- Gunakan clustering untuk high availability
- Implementasikan keamanan dengan SSL dan access controls
- Konfigurasi prefetch limits yang sesuai untuk fair dispatching
- Gunakan message TTL untuk cleanup otomatis
- Implementasikan retry logic dengan exponential backoff
- Gunakan priority queues untuk pesan time-sensitive
- Monitor dan tune metrics performa secara regular

### Performance Tuning

```ini
# Konfigurasi RabbitMQ Advanced
# TCP connection settings
tcp_listen_options.backlog = 4096
tcp_listen_options.nodelay = true
tcp_listen_options.linger.on = true
tcp_listen_options.linger.timeout = 0

# Erlang VM tuning
vm_memory_high_watermark.absolute = 4GB
vm_memory_high_watermark_paging_ratio = 0.75

# Queue settings
queue_index_embed_msgs_below = 4096
lazy_queue_explicit_gc_run_operation_threshold = 1000

# Message store settings
msg_store_index_module = rabbit_msg_store_ets_index
msg_store_file_size_limit = 16777216

# Credit flow settings
credit_flow_default_credit = 400
credit_flow_default_credit.delay = 0
```

### Konfigurasi Keamanan

```ini
# Konfigurasi fokus keamanan
# SSL/TLS settings
ssl_options.certfile = /etc/rabbitmq/ssl/server.crt
ssl_options.keyfile = /etc/rabbitmq/ssl/server.key
ssl_options.cacertfile = /etc/rabbitmq/ssl/ca.crt
ssl_options.verify = verify_peer
ssl_options.fail_if_no_peer_cert = true

# Authentication
auth_mechanisms.1 = PLAIN
auth_mechanisms.2 = AMQPLAIN
auth_mechanisms.3 = EXTERNAL

# Access control
loopback_users.guest = false
default_user = admin
default_pass = secure_password_123

# Network security
tcp_listen_options.keepalive = true
tcp_listen_options.send_timeout = 15000
```

## Pertimbangan Keamanan

- Aktifkan SSL/TLS untuk komunikasi terenkripsi
- Gunakan mekanisme autentikasi yang kuat
- Implementasikan kontrol akses dan permissions yang proper
- Lakukan rotasi sertifikat dan kredensial secara regular
- Monitor upaya akses yang tidak sah
- Gunakan firewall dan segmentasi jaringan
- Implementasikan logging dan auditing yang proper
- Jaga RabbitMQ dan Erlang tetap update dengan security patches
- Gunakan konfigurasi aman untuk deployment production
- Implementasikan enkripsi pesan untuk data sensitif
- Gunakan virtual hosts untuk isolasi multi-tenancy
- Lakukan backup konfigurasi dan data secara regular

## RabbitMQ vs Message Broker Lain

| Fitur | RabbitMQ | Apache Kafka | ActiveMQ | Redis Queue |
|-------|----------|--------------|----------|-------------|
| Protocol | AMQP | Custom | JMS | RESP |
| Routing | Advanced | Simple | Basic | Basic |
| Persistence | Configurable | Always | Configurable | Optional |
| Clustering | Manual | Automatic | Manual | Manual |
| Performance | High | Very High | Medium | Very High |
| Complexity | Medium | Low | Medium | Low |
| Use Case | Enterprise | Big Data | General | Simple |

## Use Case Umum

- **Work Queues**: Pemrosesan background job dan distribusi task
- **Publish/Subscribe**: Broadcasting event ke multiple consumers
- **Request/Reply**: Pola komunikasi synchronous
- **Priority Queues**: Pemrosesan pesan time-sensitive
- **Dead Letter Handling**: Manajemen pesan gagal dan retry logic
- **Message Routing**: Routing kompleks berdasarkan atribut pesan
- **Load Balancing**: Distribusi work di seluruh multiple workers
- **Komunikasi Microservices**: Messaging asynchronous service-to-service
- **Pemrosesan Order**: Workflow fulfillment order e-commerce
- **Sistem Notifikasi**: Alert dan notifikasi real-time
- **Data Pipeline**: Proses ETL dan integrasi data
- **Audit Logging**: Manajemen audit trail terpusat