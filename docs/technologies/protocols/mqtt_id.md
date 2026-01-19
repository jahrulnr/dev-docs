# MQTT (Message Queuing Telemetry Transport)

## Gambaran Umum

MQTT adalah protokol messaging ringan berbasis publish-subscribe yang dirancang untuk perangkat dengan keterbatasan resource dan jaringan dengan bandwidth rendah serta latency tinggi. Ideal untuk aplikasi IoT, aplikasi mobile, dan skenario dimana reliability jaringan tidak dapat diprediksi. MQTT beroperasi di atas TCP/IP dan menggunakan arsitektur berbasis broker.

Protokol ini sangat efisien dengan overhead minimal - pesan publish dasar bisa sebesar 2 bytes saja. Mendukung Quality of Service (QoS) levels, retained messages, dan fitur last will and testament untuk messaging yang reliable di jaringan yang tidak reliable.

## Konsep Utama

- **Broker**: Server pusat yang mengelola routing pesan antara publisher dan subscriber
- **Client**: Perangkat apa pun yang terhubung ke broker (bisa publisher, subscriber, atau keduanya)
- **Topic**: String hierarkis yang mengkategorikan pesan (contoh: "sensors/temperature/room1")
- **Publish/Subscribe**: Pola messaging terpisah dimana publisher tidak tahu subscriber
- **Quality of Service (QoS)**: Jaminan pengiriman (0: Paling banyak sekali, 1: Paling sedikit sekali, 2: Tepat sekali)
- **Retained Messages**: Pesan yang disimpan broker dan dikirim ke subscriber baru
- **Last Will and Testament (LWT)**: Pesan yang dipublish ketika client disconnect secara tidak terduga
- **Clean Session**: Menentukan apakah mempertahankan state session antar koneksi

## Kapan Digunakan

- Komunikasi perangkat IoT dan jaringan sensor
- Aplikasi mobile dengan konektivitas intermiten
- Telematika otomotif dan manajemen armada
- Sistem otomasi rumah pintar
- Monitoring dan kontrol industri
- Manajemen perangkat remote
- Koleksi data real-time dari edge devices
- Environment dengan keterbatasan bandwidth
- Aplikasi yang butuh queuing pesan offline

## Contoh

### Basic MQTT Client (JavaScript dengan MQTT.js)

```javascript
const mqtt = require('mqtt');

// Connect ke broker
const client = mqtt.connect('mqtt://broker.hivemq.com', {
    clientId: 'ecommerce-client-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

// Koneksi established
client.on('connect', function () {
    console.log('Terhubung ke MQTT broker');
    
    // Subscribe ke topics
    client.subscribe('ecommerce/inventory/+', { qos: 1 }, function (err) {
        if (!err) {
            console.log('Subscribed ke inventory topics');
        }
    });
    
    // Publish pesan
    client.publish('ecommerce/orders', JSON.stringify({
        orderId: 'ORD-12345',
        status: 'confirmed',
        timestamp: new Date().toISOString()
    }), { qos: 1, retain: false });
});

// Handle pesan masuk
client.on('message', function (topic, message) {
    console.log(`Pesan diterima di ${topic}: ${message.toString()}`);
    
    try {
        const data = JSON.parse(message.toString());
        handleInventoryUpdate(topic, data);
    } catch (e) {
        console.error('Gagal parse pesan:', e);
    }
});

// Handle disconnection
client.on('offline', function() {
    console.log('Client offline');
});

client.on('reconnect', function() {
    console.log('Reconnecting ke broker...');
});

// Publish inventory update
function publishInventoryUpdate(productId, newStock) {
    const topic = `ecommerce/inventory/${productId}`;
    const message = JSON.stringify({
        productId: productId,
        stock: newStock,
        lastUpdated: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: true });
}
```

### MQTT Broker Configuration (Mosquitto)

```conf
# mosquitto.conf
listener 1883
protocol mqtt

# Authentication
allow_anonymous false
password_file /etc/mosquitto/passwd

# Persistence
persistence true
persistence_location /var/lib/mosquitto/

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all

# Security
require_certificate false
use_identity_as_username false
```

### Python MQTT Client dengan Paho

```python
import paho.mqtt.client as mqtt
import json
import time

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Terhubung ke MQTT Broker!")
        client.subscribe("ecommerce/+/status")
    else:
        print(f"Gagal connect, return code {rc}")

def on_message(client, userdata, msg):
    print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
    
    try:
        data = json.loads(msg.payload.decode())
        process_ecommerce_event(msg.topic, data)
    except json.JSONDecodeError:
        print("Invalid JSON diterima")

# Create MQTT client
client = mqtt.Client("ecommerce-monitor")
client.on_connect = on_connect
client.on_message = on_message

# Connect ke broker
client.connect("localhost", 1883, 60)

# Publish periodic status
def publish_system_status():
    status = {
        "service": "inventory-service",
        "status": "healthy",
        "uptime": time.time(),
        "active_connections": 150
    }
    client.publish("ecommerce/services/inventory", json.dumps(status), qos=1)

# Start the loop
client.loop_start()

try:
    while True:
        publish_system_status()
        time.sleep(30)  # Publish setiap 30 detik
except KeyboardInterrupt:
    print("Stopping...")
    client.loop_stop()
```

## Praktik Terbaik

- Gunakan struktur topic hierarkis untuk organisasi lebih baik
- Implementasikan QoS level yang tepat berdasarkan kritikalitas pesan
- Gunakan retained messages secara bijak untuk hindari data stale
- Implementasikan authentication dan authorization
- Monitor performa broker dan limit koneksi
- Handle disconnection jaringan dengan graceful
- Gunakan Last Will and Testament untuk monitoring perangkat
- Implementasikan rate limiting pesan
- Gunakan client ID yang deskriptif untuk debugging
- Bersihkan topic dan retained messages yang tidak terpakai secara regular

### Pola Desain Topic

```
# Hierarki topic yang baik
ecommerce/orders/created
ecommerce/orders/ORD-12345/status
ecommerce/inventory/product-456/stock
ecommerce/payments/PAY-789/completed
ecommerce/notifications/user-101/alerts

# Hindari topic flat
ecommerce-updates
inventory-changes
order-status-changes
```

### Pertimbangan Security

- Selalu gunakan TLS/SSL untuk deployment production
- Implementasikan client certificate authentication
- Gunakan password kuat dan hindari akses anonymous
- Implementasikan authorization berbasis topic
- Rotate credentials secara regular
- Monitor pola koneksi yang mencurigakan
- Gunakan firewall untuk restrict akses broker

### Optimasi Performa

- Gunakan QoS 0 untuk pesan non-kritis
- Implementasikan kompresi pesan untuk payload besar
- Gunakan connection pooling untuk aplikasi high-throughput
- Monitor dan tune broker keep-alive settings
- Implementasikan proper backpressure handling
- Gunakan binary payloads jika memungkinkan
- Optimalkan topic subscriptions dengan wildcards

## Integrasi dengan Ecommerce

MQTT sangat berharga untuk platform ecommerce yang menangani real-time inventory, order processing, dan fitur IoT-enabled:

- **Tracking Inventory Real-time**: Update level stock instant across warehouse
- **Notifikasi Status Order**: Update proses order live ke customer
- **Integrasi Perangkat IoT**: Connected scales, smart shelves, automated checkout
- **Monitoring Supply Chain**: Track shipments dan logistics secara real-time
- **Dynamic Pricing**: Penyesuaian harga real-time berdasarkan demand/supply
- **Deteksi Fraud**: Monitor pola transaksi mencurigakan
- **Analytics Perilaku Customer**: Track interaksi dan preferensi user
- **Replenishment Otomatis**: Smart ordering ketika stock menipis
- **Sinkronisasi Multi-channel**: Jaga inventory online dan in-store tetap sync

### Arsitektur MQTT Ecommerce

```
┌─────────────────┐    MQTT    ┌─────────────────┐
│   IoT Devices   │◄─────────►│   MQTT Broker   │
│   (Sensors,     │           │   (EMQX/        │
│    Smart Shelves)│           │    Mosquitto)   │
└─────────────────┘           └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
         ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
         │  Inventory      │ │   Order         │ │   Analytics     │
         │  Service        │ │   Service       │ │   Service       │
         │                 │ │                 │ │                 │
         └─────────────────┘ └─────────────────┘ └─────────────────┘
                    ▲            ▲            ▲
                    └────────────┼────────────┘
                                 │
                    ┌─────────────────┐
                    │   WebSocket    │
                    │   Gateway      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Web Clients   │
                    │   (Real-time    │
                    │    Dashboard)   │
                    └─────────────────┘
```

### Common Ecommerce MQTT Topics

```javascript
// Inventory Management
{
  "topic": "ecommerce/inventory/PROD-123/stock",
  "payload": {
    "productId": "PROD-123",
    "warehouseId": "WH-001",
    "quantity": 150,
    "reserved": 5,
    "available": 145,
    "lastUpdated": "2024-01-15T14:30:00Z"
  }
}

// Order Processing
{
  "topic": "ecommerce/orders/ORD-456/status",
  "payload": {
    "orderId": "ORD-456",
    "status": "shipped",
    "trackingNumber": "1Z999AA1234567890",
    "estimatedDelivery": "2024-01-18",
    "timestamp": "2024-01-15T15:45:00Z"
  }
}

// Payment Events
{
  "topic": "ecommerce/payments/PAY-789/processed",
  "payload": {
    "paymentId": "PAY-789",
    "orderId": "ORD-456",
    "amount": 299.99,
    "currency": "USD",
    "method": "credit_card",
    "status": "completed",
    "timestamp": "2024-01-15T15:40:00Z"
  }
}

// Customer Notifications
{
  "topic": "ecommerce/notifications/user-101/alerts",
  "payload": {
    "userId": "user-101",
    "type": "order_update",
    "title": "Order Shipped!",
    "message": "Your order ORD-456 has been shipped",
    "priority": "normal",
    "timestamp": "2024-01-15T15:45:00Z"
  }
}
```