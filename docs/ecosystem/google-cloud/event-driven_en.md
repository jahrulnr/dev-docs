# Google Cloud Pub/Sub

## Overview

Google Cloud Pub/Sub is a messaging service for exchanging event data among applications and services. It provides reliable, many-to-many, asynchronous messaging between applications. Pub/Sub is designed to provide low-latency, durable messaging that works at scale.

## Key Concepts

### Core Components
- **Topics**: Named resource to which messages are sent by publishers
- **Subscriptions**: Named resource representing the stream of messages from a topic
- **Messages**: The data that moves through the service
- **Publishers**: Applications that send messages to topics
- **Subscribers**: Applications that receive messages from subscriptions

### Message Delivery
- **At-least-once delivery**: Messages are delivered at least once
- **Ordering**: Per-key ordering for ordered message processing
- **Filtering**: Server-side message filtering based on attributes
- **Dead-letter topics**: Handle messages that cannot be processed
- **Push/Pull delivery**: Choose between push to webhook or pull from subscription

### Advanced Features
- **Exactly-once processing**: Prevent duplicate message processing
- **Message retention**: Configure how long messages are retained
- **Seek**: Replay messages from a specific point in time
- **Snapshots**: Save subscription state for later replay
- **BigQuery subscriptions**: Automatically stream messages to BigQuery

## When to Use

- Decoupling microservices and event-driven architectures
- Real-time data streaming and analytics
- IoT device communication and data ingestion
- Workflow orchestration and asynchronous processing
- Log aggregation and centralized monitoring
- Event sourcing and CQRS patterns
- Real-time notifications and alerts
- Data pipeline orchestration
- Cross-region and cross-cloud messaging
- Mobile application backend communication

## Examples

### Basic Publisher and Subscriber

```python
# Python Publisher Example
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

    # Publish message
    data = json.dumps(order_data).encode('utf-8')
    future = publisher.publish(topic_path, data, order_id='ORD-12345')

    print(f'Published order event: {future.result()}')

if __name__ == '__main__':
    publish_order_event()
```

```python
# Python Subscriber Example
from google.cloud import pubsub_v1
import json

def order_processing_callback(message):
    """Process order messages"""
    try:
        order_data = json.loads(message.data.decode('utf-8'))
        print(f'Processing order: {order_data["order_id"]}')

        # Process order (inventory update, payment, etc.)
        process_order(order_data)

        # Acknowledge the message
        message.ack()
        print(f'Order processed successfully: {order_data["order_id"]}')

    except Exception as e:
        print(f'Error processing order: {e}')
        # Negative acknowledge - message will be redelivered
        message.nack()

def subscribe_to_orders():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path('my-project', 'order-processing-sub')

    # Subscribe to messages
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=order_processing_callback
    )

    print('Listening for order messages...')

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print('Subscription cancelled')

def process_order(order_data):
    # Order processing logic
    print(f'Updating inventory for order {order_data["order_id"]}')
    # Simulate processing
    import time
    time.sleep(0.1)
```

### Advanced Message Filtering and Ordering

```python
# Message Filtering and Ordered Processing
from google.cloud import pubsub_v1
import json

def setup_filtered_subscription():
    """Create subscription with message filtering"""
    subscriber = pubsub_v1.SubscriberClient()

    subscription_path = subscriber.subscription_path('my-project', 'high-value-orders')
    topic_path = subscriber.topic_path('my-project', 'ecommerce-orders')

    # Create subscription with filter
    subscription = pubsub_v1.types.Subscription(
        name=subscription_path,
        topic=topic_path,
        filter='attributes.order_total > "500"',  # Filter for high-value orders
        enable_message_ordering=True  # Enable ordered delivery
    )

    subscriber.create_subscription(subscription)
    print('Created filtered subscription for high-value orders')

def publish_ordered_messages():
    """Publish messages with ordering keys"""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path('my-project', 'inventory-updates')

    # Publish inventory updates for same product in order
    product_updates = [
        {'product_id': 'PROD-001', 'action': 'reserve', 'quantity': 2, 'order_id': 'ORD-123'},
        {'product_id': 'PROD-001', 'action': 'ship', 'quantity': 2, 'order_id': 'ORD-123'},
        {'product_id': 'PROD-001', 'action': 'deliver', 'quantity': 2, 'order_id': 'ORD-123'},
    ]

    for update in product_updates:
        data = json.dumps(update).encode('utf-8')
        # Use product_id as ordering key to ensure ordered delivery
        future = publisher.publish(
            topic_path,
            data,
            product_id=update['product_id'],
            action=update['action']
        )
        print(f'Published inventory update: {future.result()}')

def process_ordered_messages(message):
    """Process messages with ordering guarantee"""
    try:
        update_data = json.loads(message.data.decode('utf-8'))
        product_id = message.attributes.get('product_id')

        print(f'Processing {update_data["action"]} for product {product_id}')

        # Process in order (reserve -> ship -> deliver)
        if update_data['action'] == 'reserve':
            reserve_inventory(update_data)
        elif update_data['action'] == 'ship':
            ship_inventory(update_data)
        elif update_data['action'] == 'deliver':
            deliver_inventory(update_data)

        message.ack()

    except Exception as e:
        print(f'Error processing message: {e}')
        message.nack()
```

### Dead Letter Topics and Error Handling

```python
# Dead Letter Topics for Failed Messages
from google.cloud import pubsub_v1
import json

def setup_dead_letter_subscription():
    """Create subscription with dead letter topic"""
    subscriber = pubsub_v1.SubscriberClient()

    subscription_path = subscriber.subscription_path('my-project', 'order-processing')
    topic_path = subscriber.topic_path('my-project', 'ecommerce-orders')
    dead_letter_topic_path = subscriber.topic_path('my-project', 'failed-orders')

    # Create subscription with dead letter policy
    subscription = pubsub_v1.types.Subscription(
        name=subscription_path,
        topic=topic_path,
        dead_letter_policy=pubsub_v1.types.DeadLetterPolicy(
            dead_letter_topic=dead_letter_topic_path,
            max_delivery_attempts=5  # Retry 5 times before dead letter
        ),
        ack_deadline_seconds=60,  # 60 seconds to process
        retry_policy=pubsub_v1.types.RetryPolicy(
            minimum_backoff='10s',
            maximum_backoff='300s'  # Exponential backoff
        )
    )

    subscriber.create_subscription(subscription)
    print('Created subscription with dead letter policy')

def process_with_error_handling(message):
    """Process messages with comprehensive error handling"""
    try:
        order_data = json.loads(message.data.decode('utf-8'))

        # Validate order data
        if not validate_order(order_data):
            raise ValueError('Invalid order data')

        # Process order
        result = process_order(order_data)

        if not result['success']:
            raise Exception(f'Order processing failed: {result["error"]}')

        message.ack()
        print(f'Successfully processed order: {order_data["order_id"]}')

    except json.JSONDecodeError:
        print('Invalid JSON in message')
        message.nack()  # Will eventually go to dead letter topic

    except ValueError as e:
        print(f'Validation error: {e}')
        message.nack()

    except Exception as e:
        print(f'Processing error: {e}')
        message.nack()

def validate_order(order_data):
    """Validate order data structure"""
    required_fields = ['order_id', 'customer_id', 'total_amount', 'items']
    return all(field in order_data for field in required_fields)

def process_order(order_data):
    """Mock order processing with potential failures"""
    # Simulate random processing failures
    import random
    if random.random() < 0.1:  # 10% failure rate
        return {'success': False, 'error': 'Payment processing failed'}

    # Simulate processing time
    import time
    time.sleep(0.5)

    return {'success': True, 'order_id': order_data['order_id']}
```

### Push Subscriptions and Webhooks

```python
# Push Subscription with Cloud Function
from flask import Flask, request, jsonify
from google.cloud import pubsub_v1
import json
import os

app = Flask(__name__)

@app.route('/webhook/order-notification', methods=['POST'])
def order_notification_webhook():
    """Handle push messages from Pub/Sub"""
    try:
        # Verify the request is from Pub/Sub
        if request.method != 'POST':
            return 'Method not allowed', 405

        # Extract message from Pub/Sub
        envelope = request.get_json()
        if not envelope:
            return 'Bad Request: No JSON payload', 400

        message = envelope.get('message')
        if not message:
            return 'Bad Request: No message in envelope', 400

        # Decode message data
        data = json.loads(message['data'].decode('utf-8'))
        attributes = message.get('attributes', {})

        print(f'Received order notification: {data["order_id"]}')

        # Process notification
        send_order_notification(data)

        return jsonify({'success': True}), 200

    except Exception as e:
        print(f'Error processing webhook: {e}')
        return jsonify({'error': str(e)}), 500

def send_order_notification(order_data):
    """Send notification to customer"""
    # Implementation for sending email/SMS notifications
    print(f'Sending notification for order {order_data["order_id"]}')

def create_push_subscription():
    """Create push subscription to Cloud Function"""
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
    print(f'Created push subscription to {push_endpoint}')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

### Terraform Configuration

```hcl
# Pub/Sub Topic Configuration
resource "google_pubsub_topic" "ecommerce_orders" {
  name = "ecommerce-orders"

  labels = {
    environment = "production"
    team        = "ecommerce"
  }

  message_retention_duration = "604800s"  # 7 days
}

resource "google_pubsub_topic" "inventory_updates" {
  name = "inventory-updates"

  labels = {
    environment = "production"
    team        = "inventory"
  }
}

# Subscriptions with different delivery methods
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

# Push subscription for notifications
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

# IAM permissions
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

## Best Practices

- Use appropriate ack deadlines for message processing time
- Implement proper error handling and dead letter topics
- Use message filtering to reduce subscriber load
- Enable message ordering when sequence matters
- Monitor subscription backlog and processing rates
- Use push subscriptions for real-time processing
- Implement proper authentication for push endpoints
- Use appropriate retry policies for transient failures
- Monitor and alert on dead letter queue growth
- Use labels and metadata for organization
- Implement proper logging and tracing

### Performance Optimization

```bash
# Monitor subscription performance
gcloud pubsub subscriptions describe order-processing-sub --format="table(name,ackDeadlineSeconds,pushConfig)"

# Check subscription backlog
gcloud pubsub subscriptions describe order-processing-sub --format="value(numOutstandingMessages)"

# Monitor dead letter queue
gcloud pubsub topics list-subscriptions failed-orders

# Scale subscription throughput
gcloud pubsub subscriptions update order-processing-sub --ack-deadline=30

# Enable exactly-once delivery for critical messages
gcloud pubsub subscriptions update order-processing-sub --enable-exactly-once-delivery
```

### Cost Optimization

```bash
# Monitor Pub/Sub costs
gcloud billing accounts list
gcloud alpha billing budgets create pubsub-budget \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Pub/Sub Budget" \
  --budget-amount=1000 \
  --threshold-rule=percent=80

# Use appropriate message retention
gcloud pubsub topics update ecommerce-orders --message-retention-duration=7d

# Monitor message throughput
gcloud pubsub topics describe ecommerce-orders --format="value(messageRetentionDuration)"
```

## Security Considerations

- Use IAM roles with minimal required permissions
- Enable Cloud Audit Logs for compliance monitoring
- Use VPC Service Controls for network security
- Implement proper authentication for push endpoints
- Encrypt sensitive message data
- Use service accounts instead of user accounts
- Implement proper access controls for topics and subscriptions
- Regularly rotate service account keys
- Monitor for unauthorized access attempts
- Use customer-managed encryption keys for sensitive topics

## Pub/Sub vs Other Messaging Services

| Feature | Cloud Pub/Sub | Amazon SQS | Amazon SNS | RabbitMQ |
|---------|----------------|------------|------------|----------|
| Delivery Model | Pull/Push | Pull | Push | Pull/Push |
| Ordering | Per key | Best effort | No | Per queue |
| Persistence | 7 days | 14 days | None | Configurable |
| Filtering | Server-side | No | No | Client-side |
| Scalability | Global | Regional | Regional | Cluster |
| Exactly-once | Yes | No | No | No |
| Dead letters | Yes | Yes | No | Yes |

## Common Use Cases

- **Event-Driven Architecture**: Decouple microservices communication
- **Real-time Analytics**: Stream events to BigQuery and analytics platforms
- **IoT Data Ingestion**: Collect and process sensor data at scale
- **Order Processing**: Handle e-commerce order workflows asynchronously
- **Notification Systems**: Send real-time alerts and notifications
- **Log Aggregation**: Centralize application and system logs
- **Workflow Orchestration**: Coordinate complex business processes
- **Data Pipeline**: Stream data between processing stages
- **Mobile Backend**: Handle mobile app events and synchronization
- **Gaming**: Process real-time game events and leaderboards