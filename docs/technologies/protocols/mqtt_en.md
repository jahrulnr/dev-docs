# MQTT (Message Queuing Telemetry Transport)

## Overview

MQTT is a lightweight, publish-subscribe messaging protocol designed for constrained devices and low-bandwidth, high-latency networks. It's ideal for IoT applications, mobile applications, and scenarios where network reliability is unpredictable. MQTT operates on top of TCP/IP and uses a broker-based architecture.

The protocol is extremely efficient with minimal overhead - a basic publish message can be as small as 2 bytes. It supports Quality of Service (QoS) levels, retained messages, and last will and testament features for reliable messaging in unreliable networks.

## Key Concepts

- **Broker**: Central server that manages message routing between publishers and subscribers
- **Client**: Any device that connects to a broker (can be publisher, subscriber, or both)
- **Topic**: Hierarchical string that categorizes messages (e.g., "sensors/temperature/room1")
- **Publish/Subscribe**: Decoupled messaging pattern where publishers don't know subscribers
- **Quality of Service (QoS)**: Delivery guarantees (0: At most once, 1: At least once, 2: Exactly once)
- **Retained Messages**: Messages stored by broker and sent to new subscribers
- **Last Will and Testament (LWT)**: Message published when client disconnects unexpectedly
- **Clean Session**: Determines whether to maintain session state between connections

## When to Use

- IoT device communication and sensor networks
- Mobile applications with intermittent connectivity
- Automotive telematics and fleet management
- Smart home automation systems
- Industrial monitoring and control systems
- Remote device management
- Real-time data collection from edge devices
- Bandwidth-constrained environments
- Applications requiring offline message queuing

## Examples

### Basic MQTT Client (JavaScript with MQTT.js)

```javascript
const mqtt = require('mqtt');

// Connect to broker
const client = mqtt.connect('mqtt://broker.hivemq.com', {
    clientId: 'my-app-client-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

// Connection established
client.on('connect', function () {
    console.log('Connected to MQTT broker');
    
    // Subscribe to topics
    client.subscribe('example/inventory/+', { qos: 1 }, function (err) {
        if (!err) {
            console.log('Subscribed to inventory topics');
        }
    });
    
    // Publish a message
    client.publish('example/orders', JSON.stringify({
        orderId: 'ORD-12345',
        status: 'confirmed',
        timestamp: new Date().toISOString()
    }), { qos: 1, retain: false });
});

// Handle incoming messages
client.on('message', function (topic, message) {
    console.log(`Received message on ${topic}: ${message.toString()}`);
    
    try {
        const data = JSON.parse(message.toString());
        handleInventoryUpdate(topic, data);
    } catch (e) {
        console.error('Failed to parse message:', e);
    }
});

// Handle disconnection
client.on('offline', function() {
    console.log('Client went offline');
});

client.on('reconnect', function() {
    console.log('Reconnecting to broker...');
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

### Python MQTT Client with Paho

```python
import paho.mqtt.client as mqtt
import json
import time

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        client.subscribe("example/+/status")
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
    
    try:
        data = json.loads(msg.payload.decode())
        process_example_event(msg.topic, data)
    except json.JSONDecodeError:
        print("Invalid JSON received")

# Create MQTT client
client = mqtt.Client("my-app-monitor")
client.on_connect = on_connect
client.on_message = on_message

# Connect to broker
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
        time.sleep(30)  # Publish every 30 seconds
except KeyboardInterrupt:
    print("Stopping...")
    client.loop_stop()
```

## Best Practices

- Use hierarchical topic structures for better organization
- Implement proper QoS levels based on message criticality
- Use retained messages sparingly to avoid stale data
- Implement authentication and authorization
- Monitor broker performance and connection limits
- Handle network disconnections gracefully
- Use Last Will and Testament for device monitoring
- Implement message rate limiting
- Use descriptive client IDs for debugging
- Regularly clean up unused topics and retained messages

### Topic Design Patterns

```
# Good topic hierarchy
example/orders/created
example/orders/ORD-12345/status
example/inventory/product-456/stock
example/payments/PAY-789/completed
example/notifications/user-101/alerts

# Avoid flat topics
example-updates
inventory-changes
order-status-changes
```

### Security Considerations

- Always use TLS/SSL for production deployments
- Implement client certificate authentication
- Use strong passwords and avoid anonymous access
- Implement topic-based authorization
- Regularly rotate credentials
- Monitor for suspicious connection patterns
- Use firewalls to restrict broker access

### Performance Optimization

- Use QoS 0 for non-critical messages
- Implement message compression for large payloads
- Use connection pooling for high-throughput applications
- Monitor and tune broker keep-alive settings
- Implement proper backpressure handling
- Use binary payloads when possible
- Optimize topic subscriptions with wildcards

## Common use cases

- IoT sensor telemetry and device command channels
- Mobile clients on constrained or intermittent networks
- Industrial monitoring and edge-to-cloud aggregation
- Fleet tracking and asset status updates
- Smart-building automation and SCADA integrations

## Related

- [AMQP](amqp_en.md)
- [WebSocket](websocket_en.md)
- [RabbitMQ](../infrastructure/rabbitmq_en.md)

## References

- [MQTT Version 5.0 Specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
