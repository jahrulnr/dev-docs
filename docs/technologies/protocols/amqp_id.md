# AMQP (Advanced Message Queuing Protocol)

## Gambaran Umum

AMQP adalah standar protokol lapisan aplikasi terbuka untuk message-oriented middleware. Dirancang untuk pengiriman pesan yang reliable, secure, dan efisien antara aplikasi dan organisasi. Tidak seperti MQTT yang dioptimalkan untuk IoT dan perangkat dengan keterbatasan, AMQP lebih feature-rich dan cocok untuk skenario messaging enterprise.

AMQP menyediakan solusi messaging komprehensif dengan dukungan multiple messaging patterns (point-to-point, publish-subscribe, request-reply), guaranteed delivery, message persistence, dan kemampuan routing advanced. Luas digunakan di financial services, healthcare, dan industri lain yang membutuhkan infrastruktur messaging yang robust.

## Konsep Utama

- **Exchange**: Menerima pesan dari producer dan route ke queues berdasarkan aturan routing
- **Queue**: Menyimpan pesan sampai bisa dikonsumsi oleh aplikasi
- **Binding**: Aturan yang menghubungkan exchange ke queue dengan routing keys
- **Routing Key**: Atribut pesan yang digunakan exchange untuk menentukan routing
- **Message Properties**: Metadata seperti content-type, correlation-id, user-id, dll
- **Delivery Modes**: Persistent (bertahan dari broker restart) vs transient messages
- **Consumer Acknowledgments**: Mekanisme untuk konfirmasi pemrosesan pesan
- **Message TTL**: Time-to-live untuk ekspirasi pesan otomatis
- **Dead Letter Exchange**: Menangani pesan yang tidak bisa dikirim
- **Virtual Hosts**: Pemisahan logis resource dalam broker

## Kapan Digunakan

- Enterprise application integration
- Pemrosesan transaksi finansial
- Pertukaran data healthcare (HL7 messaging)
- Sistem supply chain dan logistics
- Complex event processing
- Otomasi workflow
- Kebutuhan guaranteed message delivery
- Kebutuhan routing dan filtering advanced
- Pertukaran data inter-organizational
- Sistem messaging high-throughput

## Contoh

### Basic AMQP Publisher (JavaScript dengan amqplib)

```javascript
const amqp = require('amqplib');

async function publishOrderMessage() {
    try {
        // Connect ke AMQP broker
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        // Declare exchange
        const exchange = 'example.orders';
        await channel.assertExchange(exchange, 'direct', { durable: true });
        
        // Declare queue
        const queue = 'order.processing';
        await channel.assertQueue(queue, { durable: true });
        
        // Bind queue ke exchange
        await channel.bindQueue(queue, exchange, 'order.created');
        
        // Create order message
        const orderMessage = {
            orderId: 'ORD-12345',
            customerId: 'CUST-67890',
            items: [
                { productId: 'PROD-001', quantity: 2, price: 29.99 },
                { productId: 'PROD-002', quantity: 1, price: 49.99 }
            ],
            totalAmount: 109.97,
            currency: 'USD',
            timestamp: new Date().toISOString()
        };
        
        // Publish message
        channel.publish(exchange, 'order.created', 
            Buffer.from(JSON.stringify(orderMessage)), {
                persistent: true,
                messageId: 'ORD-12345',
                timestamp: new Date(),
                userId: 'my-app',
                headers: {
                    'source': 'web-app',
                    'priority': 'normal'
                }
            });
        
        console.log('Order message published');
        
        // Close connection
        setTimeout(() => {
            connection.close();
        }, 500);
        
    } catch (error) {
        console.error('Error publishing message:', error);
    }
}

publishOrderMessage();
```

### AMQP Consumer (JavaScript dengan amqplib)

```javascript
const amqp = require('amqplib');

async function startOrderConsumer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        const exchange = 'example.orders';
        const queue = 'order.processing';
        
        // Ensure exchange dan queue exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, 'order.created');
        
        // Set prefetch untuk fair dispatch
        channel.prefetch(1);
        
        console.log('Waiting for order messages...');
        
        // Consume messages
        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const orderData = JSON.parse(msg.content.toString());
                    console.log('Processing order:', orderData.orderId);
                    
                    // Process the order
                    await processOrder(orderData);
                    
                    // Acknowledge message
                    channel.ack(msg);
                    console.log('Order processed successfully');
                    
                } catch (error) {
                    console.error('Error processing order:', error);
                    
                    // Reject message dan requeue (atau kirim ke dead letter)
                    channel.nack(msg, false, false);
                }
            }
        });
        
    } catch (error) {
        console.error('Consumer error:', error);
    }
}

async function processOrder(orderData) {
    // Simulate order processing
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Order ${orderData.orderId} processed for $${orderData.totalAmount}`);
            resolve();
        }, 1000);
    });
}

startOrderConsumer();
```

### Python AMQP Publisher dengan pika

```python
import pika
import json
import uuid
from datetime import datetime

def publish_inventory_update():
    # Connection parameters
    credentials = pika.PlainCredentials('guest', 'guest')
    parameters = pika.ConnectionParameters('localhost', credentials=credentials)
    
    try:
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare exchange
        channel.exchange_declare(exchange='example.inventory', 
                               exchange_type='topic', 
                               durable=True)
        
        # Declare queue
        result = channel.queue_declare(queue='inventory.updates', durable=True)
        queue_name = result.method.queue
        
        # Bind queue
        channel.queue_bind(exchange='example.inventory', 
                         queue=queue_name, 
                         routing_key='inventory.product.*')
        
        # Create inventory update message
        inventory_message = {
            'eventId': str(uuid.uuid4()),
            'productId': 'PROD-123',
            'warehouseId': 'WH-001',
            'previousStock': 100,
            'newStock': 85,
            'changeReason': 'order_fulfilled',
            'orderId': 'ORD-45678',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Publish message
        channel.basic_publish(
            exchange='example.inventory',
            routing_key='inventory.product.PROD-123',
            body=json.dumps(inventory_message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                message_id=str(uuid.uuid4()),
                timestamp=int(datetime.utcnow().timestamp()),
                user_id='inventory-service',
                headers={
                    'event_type': 'stock_update',
                    'source_system': 'warehouse'
                }
            )
        )
        
        print("Inventory update published")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()

publish_inventory_update()
```

## Praktik Terbaik

- Gunakan tipe exchange yang sesuai untuk kebutuhan routing
- Implementasikan proper error handling dan dead letter exchanges
- Konfigurasi message TTL untuk prevent queue buildup
- Gunakan persistent delivery mode untuk pesan kritis
- Implementasikan consumer acknowledgments dengan proper
- Monitor queue depths dan consumer lag
- Gunakan message priorities untuk pesan penting
- Implementasikan proper connection pooling
- Konfigurasi appropriate prefetch limits
- Gunakan correlation IDs untuk request-reply patterns
- **Direct exchange**: exact routing key match (mis. `order.created` → processing queue)
- **Topic exchange**: pattern routing (mis. `inventory.product.*`)
- **Fanout exchange**: broadcast ke semua bound queue
- **Headers exchange**: route berdasarkan atribut header pesan

## Kasus penggunaan umum

- Work queue dan background job processing
- Microservices event-driven dengan guaranteed delivery
- Routing kompleks antar exchange dan queue
- Pola request/reply antar service
- Dead-letter handling dan workflow retry

## Terkait

- [MQTT](mqtt_id.md)
- [RabbitMQ](../infrastructure/rabbitmq_id.md)

## Referensi

- [AMQP 0-9-1 Overview](https://www.rabbitmq.com/tutorials/amqp-concepts)
