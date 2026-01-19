# AMQP (Advanced Message Queuing Protocol)

## Overview

AMQP is an open standard application layer protocol for message-oriented middleware. It's designed for reliable, secure, and efficient message delivery between applications and organizations. Unlike MQTT which is optimized for IoT and constrained devices, AMQP is more feature-rich and suitable for enterprise messaging scenarios.

AMQP provides a comprehensive messaging solution with support for multiple messaging patterns (point-to-point, publish-subscribe, request-reply), guaranteed delivery, message persistence, and advanced routing capabilities. It's widely used in financial services, healthcare, and other industries requiring robust messaging infrastructure.

## Key Concepts

- **Exchange**: Receives messages from producers and routes them to queues based on routing rules
- **Queue**: Stores messages until they can be consumed by applications
- **Binding**: Rules that connect exchanges to queues with routing keys
- **Routing Key**: Message attribute used by exchanges to determine routing
- **Message Properties**: Metadata like content-type, correlation-id, user-id, etc.
- **Delivery Modes**: Persistent (survives broker restart) vs transient messages
- **Consumer Acknowledgments**: Mechanisms to confirm message processing
- **Message TTL**: Time-to-live for automatic message expiration
- **Dead Letter Exchange**: Handles messages that cannot be delivered
- **Virtual Hosts**: Logical separation of resources within a broker

## When to Use

- Enterprise application integration
- Financial transaction processing
- Healthcare data exchange (HL7 messaging)
- Supply chain and logistics systems
- Complex event processing
- Workflow automation
- Guaranteed message delivery requirements
- Advanced routing and filtering needs
- Inter-organizational data exchange
- High-throughput messaging systems

## Examples

### Basic AMQP Publisher (JavaScript with amqplib)

```javascript
const amqp = require('amqplib');

async function publishOrderMessage() {
    try {
        // Connect to AMQP broker
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        // Declare exchange
        const exchange = 'ecommerce.orders';
        await channel.assertExchange(exchange, 'direct', { durable: true });
        
        // Declare queue
        const queue = 'order.processing';
        await channel.assertQueue(queue, { durable: true });
        
        // Bind queue to exchange
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
                userId: 'ecommerce-app',
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

### AMQP Consumer (JavaScript with amqplib)

```javascript
const amqp = require('amqplib');

async function startOrderConsumer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        const exchange = 'ecommerce.orders';
        const queue = 'order.processing';
        
        // Ensure exchange and queue exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, 'order.created');
        
        // Set prefetch for fair dispatch
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
                    
                    // Reject message and requeue (or send to dead letter)
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

### Python AMQP Publisher with pika

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
        channel.exchange_declare(exchange='ecommerce.inventory', 
                               exchange_type='topic', 
                               durable=True)
        
        # Declare queue
        result = channel.queue_declare(queue='inventory.updates', durable=True)
        queue_name = result.method.queue
        
        # Bind queue
        channel.queue_bind(exchange='ecommerce.inventory', 
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
            exchange='ecommerce.inventory',
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

## Best Practices

- Use appropriate exchange types for your routing needs
- Implement proper error handling and dead letter exchanges
- Configure message TTL to prevent queue buildup
- Use persistent delivery mode for critical messages
- Implement consumer acknowledgments properly
- Monitor queue depths and consumer lag
- Use message priorities for important messages
- Implement proper connection pooling
- Configure appropriate prefetch limits
- Use correlation IDs for request-reply patterns

### Exchange Types and Routing

```
# Direct Exchange: Exact routing key match
- Routing: order.created → order.processing queue
- Use case: Specific message types to specific consumers

# Topic Exchange: Pattern-based routing
- Routing: inventory.product.PROD-123 → queues with pattern inventory.product.*
- Use case: Category-based message filtering

# Fanout Exchange: Broadcast to all bound queues
- Routing: All messages to all bound queues regardless of routing key
- Use case: Broadcasting notifications to multiple services

# Headers Exchange: Routing based on message headers
- Routing: Messages with header x-service: payment → payment queues
- Use case: Complex routing logic based on multiple criteria
```

### Reliability Patterns

```javascript
// Circuit Breaker Pattern
class ReliablePublisher {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
    }
    
    async connect() {
        try {
            this.connection = await amqp.connect('amqp://localhost');
            this.channel = await this.connection.createChannel();
            this.isConnected = true;
            
            // Handle connection loss
            this.connection.on('error', (err) => {
                console.error('Connection error:', err);
                this.isConnected = false;
                this.reconnect();
            });
            
        } catch (error) {
            console.error('Failed to connect:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }
    
    async publishWithRetry(exchange, routingKey, message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!this.isConnected) {
                    await this.connect();
                }
                
                await this.channel.publish(exchange, routingKey, 
                    Buffer.from(JSON.stringify(message)), 
                    { persistent: true });
                
                return true;
            } catch (error) {
                console.error(`Publish attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}
```

## Integration with Ecommerce

AMQP excels in complex ecommerce scenarios requiring guaranteed delivery, advanced routing, and enterprise-grade reliability:

- **Order Processing Pipeline**: Multi-step order fulfillment with guaranteed delivery
- **Inventory Synchronization**: Complex inventory updates across multiple warehouses
- **Payment Processing**: Secure, reliable payment transaction messaging
- **Fraud Detection**: Real-time analysis of transaction patterns
- **Supply Chain Integration**: B2B messaging with trading partners
- **Customer Notification System**: Prioritized, reliable notification delivery
- **Analytics Pipeline**: High-volume event processing and aggregation
- **Multi-tenant Architecture**: Isolated messaging for different business units

### Ecommerce AMQP Architecture

```
┌─────────────────┐    AMQP    ┌─────────────────┐
│   Web/Mobile    │◄─────────►│   AMQP Broker   │
│   Applications  │           │   (RabbitMQ)    │
└─────────────────┘           └─────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐           ┌─────────────────┐
│   API Gateway   │           │   Dead Letter   │
│   (Message      │           │   Exchange      │
│    Validation)  │           └─────────────────┘
└─────────────────┘                    │
         │                             ▼
         ▼                    ┌─────────────────┐
┌─────────────────┐           │   Error         │
│   Order Service │           │   Handler       │
└─────────────────┘           └─────────────────┘
         │
         ▼
┌─────────────────┐ ◄─────────┐
│   Payment       │           │
│   Service       │           │
└─────────────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│   Inventory     │           │
│   Service       │           │
└─────────────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│   Shipping      │           │
│   Service       │           │
└─────────────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│   Notification  │◄──────────┘
│   Service       │
└─────────────────┘
```

### Common Ecommerce AMQP Message Patterns

```javascript
// Order Created Event
{
  "messageId": "msg-12345",
  "correlationId": "order-ORD-12345",
  "routingKey": "order.created",
  "exchange": "ecommerce.orders",
  "timestamp": "2024-01-15T10:30:00Z",
  "headers": {
    "source": "web-app",
    "priority": "high",
    "content-type": "application/json"
  },
  "body": {
    "orderId": "ORD-12345",
    "customerId": "CUST-67890",
    "items": [
      {
        "productId": "PROD-001",
        "sku": "TSHIRT-RED-L",
        "quantity": 2,
        "unitPrice": 29.99,
        "totalPrice": 59.98
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "billingAddress": { /* same structure */ },
    "paymentMethod": {
      "type": "credit_card",
      "last4": "4242",
      "brand": "visa"
    },
    "totalAmount": 59.98,
    "currency": "USD"
  }
}

// Inventory Update Event
{
  "messageId": "msg-67890",
  "correlationId": "inv-PROD-001-WH001",
  "routingKey": "inventory.updated.PROD-001",
  "exchange": "ecommerce.inventory",
  "timestamp": "2024-01-15T10:35:00Z",
  "headers": {
    "source": "warehouse-system",
    "event-type": "stock_change"
  },
  "body": {
    "productId": "PROD-001",
    "warehouseId": "WH001",
    "previousStock": 150,
    "newStock": 148,
    "changeType": "sale",
    "referenceId": "ORD-12345",
    "reason": "order_fulfilled",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}

// Payment Processed Event
{
  "messageId": "msg-54321",
  "correlationId": "pay-PAY-99999",
  "routingKey": "payment.processed",
  "exchange": "ecommerce.payments",
  "timestamp": "2024-01-15T10:32:00Z",
  "headers": {
    "source": "payment-gateway",
    "priority": "critical"
  },
  "body": {
    "paymentId": "PAY-99999",
    "orderId": "ORD-12345",
    "amount": 59.98,
    "currency": "USD",
    "status": "completed",
    "transactionId": "txn_abc123",
    "processedAt": "2024-01-15T10:32:00Z",
    "paymentMethod": {
      "type": "credit_card",
      "brand": "visa",
      "last4": "4242"
    }
  }
}
```