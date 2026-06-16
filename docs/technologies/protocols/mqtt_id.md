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
    clientId: 'my-app-client-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

// Koneksi established
client.on('connect', function () {
    console.log('Terhubung ke MQTT broker');
    
    // Subscribe ke topics
    client.subscribe('example/inventory/+', { qos: 1 }, function (err) {
        if (!err) {
            console.log('Subscribed ke inventory topics');
        }
    });
    
    // Publish pesan
    client.publish('example/orders', JSON.stringify({
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
    const topic = `example/inventory/${productId}`;
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
        client.subscribe("example/+/status")
    else:
        print(f"Gagal connect, return code {rc}")

def on_message(client, userdata, msg):
    print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
    
    try:
        data = json.loads(msg.payload.decode())
        process_example_event(msg.topic, data)
    except json.JSONDecodeError:
        print("Invalid JSON diterima")

# Create MQTT client
client = mqtt.Client("my-app-monitor")
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
    client.publish("example/services/inventory", json.dumps(status), qos=1)

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
example/orders/created
example/orders/ORD-12345/status
example/inventory/product-456/stock
example/payments/PAY-789/completed
example/notifications/user-101/alerts

# Hindari topic flat
example-updates
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

## Kasus penggunaan umum

- Telemetri sensor IoT dan channel perintah device
- Klien mobile di jaringan terbatas atau tidak stabil
- Monitoring industri dan agregasi edge-to-cloud
- Pelacakan armada dan pembaruan status aset
- Otomasi smart-building dan integrasi SCADA

## Terkait

- [AMQP](amqp_id.md)
- [WebSocket](websocket_id.md)
- [RabbitMQ](../infrastructure/rabbitmq_id.md)

## Referensi

- [MQTT Version 5.0 Specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
