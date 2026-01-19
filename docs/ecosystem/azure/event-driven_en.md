# Azure Event-Driven Services

## Overview

Azure Event-Driven services provide a comprehensive platform for building reactive, event-based applications that can respond to changes in real-time. These services enable decoupling of application components, enabling scalable and resilient architectures that can handle high-volume event processing.

## Key Concepts

### Core Services
- **Azure Event Hubs**: High-throughput, low-latency event ingestion service
- **Azure Event Grid**: Intelligent event routing service for reactive programming
- **Azure Service Bus**: Enterprise messaging with advanced features like queues and topics
- **Azure Functions**: Serverless compute triggered by events
- **Azure Logic Apps**: Workflow automation with event triggers

### Event Patterns
- **Event Streaming**: Continuous flow of events from producers to consumers
- **Event Routing**: Intelligent distribution of events based on content and metadata
- **Message Queuing**: Reliable delivery of messages with various delivery guarantees
- **Event-Driven Compute**: Serverless execution triggered by events
- **Workflow Automation**: Complex business processes triggered by events

### Event Processing Models
- **At-Least-Once**: Events delivered at least once, may have duplicates
- **At-Most-Once**: Events delivered at most once, may lose events
- **Exactly-Once**: Events delivered exactly once, most reliable but complex
- **Event Sourcing**: Storing state changes as a sequence of events
- **CQRS**: Command Query Responsibility Segregation for event-driven systems

## When to Use

- **Event Hubs**: High-volume telemetry, log aggregation, real-time analytics
- **Event Grid**: Cross-service integration, serverless workflows, IoT events
- **Service Bus**: Enterprise messaging, complex routing, guaranteed delivery
- **Functions**: Event processing, data transformation, API integrations
- **Logic Apps**: Business process automation, multi-step workflows

## Examples

### Azure Event Hubs

```bash
# Create Event Hubs namespace
az eventhubs namespace create \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard \
  --capacity 2

# Create Event Hub
az eventhubs eventhub create \
  --name orders \
  --namespace-name ecommerce-events \
  --resource-group ecommerce-rg \
  --partition-count 4 \
  --retention-time-in-hours 168 \
  --cleanup-policy Delete

# Create consumer group
az eventhubs eventhub consumer-group create \
  --name order-processor \
  --eventhub-name orders \
  --namespace-name ecommerce-events \
  --resource-group ecommerce-rg

# Get connection string
CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
  --resource-group ecommerce-rg \
  --namespace-name ecommerce-events \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

echo $CONNECTION_STRING
```

```python
# Python script for Event Hubs producer and consumer
from azure.eventhub import EventHubProducerClient, EventData, EventHubConsumerClient
from azure.eventhub.extensions.checkpointstoreblob import BlobCheckpointStore
from azure.storage.blob import BlobServiceClient
import json
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderEventProducer:
    def __init__(self, connection_string, eventhub_name):
        self.producer = EventHubProducerClient.from_connection_string(
            connection_string, eventhub_name=eventhub_name
        )
        self.eventhub_name = eventhub_name

    async def send_order_events(self, orders):
        """Send order events to Event Hub"""
        try:
            async with self.producer:
                # Create event data batch
                event_data_batch = await self.producer.create_batch()

                for order in orders:
                    # Create event data
                    event_data = EventData(json.dumps(order))

                    # Add custom properties
                    event_data.properties = {
                        'event_type': 'order_created',
                        'customer_id': order['customer_id'],
                        'order_total': order['total_amount']
                    }

                    # Add to batch
                    event_data_batch.add(event_data)

                # Send batch
                await self.producer.send_batch(event_data_batch)

                logger.info(f"Sent {len(orders)} order events to Event Hub")

        except Exception as e:
            logger.error(f"Error sending events: {str(e)}")
            raise

    def send_single_order(self, order):
        """Send single order event synchronously"""
        try:
            event_data = EventData(json.dumps(order))
            event_data.properties = {
                'event_type': 'order_created',
                'customer_id': order['customer_id'],
                'order_total': order['total_amount']
            }

            with self.producer:
                self.producer.send_event(event_data)

            logger.info(f"Sent order event: {order['order_id']}")

        except Exception as e:
            logger.error(f"Error sending single event: {str(e)}")
            raise

class OrderEventConsumer:
    def __init__(self, connection_string, eventhub_name, consumer_group, storage_connection_string, container_name):
        # Initialize checkpoint store
        blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
        checkpoint_store = BlobCheckpointStore(
            blob_service_client=blob_service_client,
            container_name=container_name
        )

        self.consumer = EventHubConsumerClient.from_connection_string(
            connection_string,
            consumer_group=consumer_group,
            eventhub_name=eventhub_name,
            checkpoint_store=checkpoint_store
        )

    async def process_events(self):
        """Process events from Event Hub"""
        try:
            async def on_event(partition_context, event):
                try:
                    # Parse event data
                    order_data = json.loads(event.body_as_str())

                    logger.info(f"Received order event: {order_data['order_id']}")

                    # Process order
                    await self._process_order(order_data)

                    # Update checkpoint
                    await partition_context.update_checkpoint(event)

                except Exception as e:
                    logger.error(f"Error processing event: {str(e)}")

            async with self.consumer:
                await self.consumer.receive(
                    on_event=on_event,
                    starting_position="-1"  # Start from beginning
                )

        except Exception as e:
            logger.error(f"Error in event processing: {str(e)}")
            raise

    async def _process_order(self, order_data):
        """Process individual order (mock implementation)"""
        # Validate order
        if not self._validate_order(order_data):
            raise ValueError(f"Invalid order data: {order_data}")

        # Update inventory
        await self._update_inventory(order_data['items'])

        # Send confirmation
        await self._send_order_confirmation(order_data)

        # Trigger downstream processes
        await self._trigger_fulfillment(order_data)

        logger.info(f"Order processed successfully: {order_data['order_id']}")

    def _validate_order(self, order_data):
        """Validate order data"""
        required_fields = ['order_id', 'customer_id', 'items', 'total_amount']
        return all(field in order_data for field in required_fields)

    async def _update_inventory(self, items):
        """Update inventory (mock implementation)"""
        for item in items:
            logger.info(f"Updating inventory for {item['product_id']}: -{item['quantity']}")

    async def _send_order_confirmation(self, order_data):
        """Send order confirmation (mock implementation)"""
        logger.info(f"Sending confirmation for order {order_data['order_id']}")

    async def _trigger_fulfillment(self, order_data):
        """Trigger order fulfillment process (mock implementation)"""
        logger.info(f"Triggering fulfillment for order {order_data['order_id']}")

# Usage example
async def main():
    # Configuration
    EVENTHUB_CONNECTION = "your_eventhub_connection_string"
    EVENTHUB_NAME = "orders"
    CONSUMER_GROUP = "order-processor"
    STORAGE_CONNECTION = "your_storage_connection_string"
    CONTAINER_NAME = "checkpoints"

    # Sample orders
    sample_orders = [
        {
            'order_id': 'ORD-001',
            'customer_id': 'CUST-123',
            'total_amount': 299.99,
            'items': [
                {'product_id': 'PROD-1', 'quantity': 1, 'price': 299.99}
            ]
        },
        {
            'order_id': 'ORD-002',
            'customer_id': 'CUST-456',
            'total_amount': 149.98,
            'items': [
                {'product_id': 'PROD-2', 'quantity': 2, 'price': 74.99}
            ]
        }
    ]

    # Send events
    producer = OrderEventProducer(EVENTHUB_CONNECTION, EVENTHUB_NAME)
    await producer.send_order_events(sample_orders)

    # Process events
    consumer = OrderEventConsumer(
        EVENTHUB_CONNECTION,
        EVENTHUB_NAME,
        CONSUMER_GROUP,
        STORAGE_CONNECTION,
        CONTAINER_NAME
    )

    await consumer.process_events()

if __name__ == "__main__":
    asyncio.run(main())
```

### Azure Event Grid

```bash
# Create Event Grid topic
az eventgrid topic create \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --location eastus

# Create Event Grid subscription for order events
az eventgrid event-subscription create \
  --name order-processing \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "https://ecommerce-functions.azurewebsites.net/api/OrderProcessor" \
  --endpoint-type webhook \
  --included-event-types "Order.Created" "Order.Updated" "Order.Cancelled"

# Create subscription for Azure Functions
az eventgrid event-subscription create \
  --name inventory-updates \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-functions/functions/InventoryUpdater" \
  --endpoint-type azurefunction \
  --included-event-types "Order.Created"

# Create subscription for Service Bus queue
az eventgrid event-subscription create \
  --name email-notifications \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.ServiceBus/namespaces/ecommerce-servicebus/queues/email-queue" \
  --endpoint-type servicebusqueue \
  --included-event-types "Order.Created" "Order.Shipped"
```

```python
# Python script for Event Grid publisher and handler
from azure.eventgrid import EventGridPublisherClient, EventGridEvent
from azure.core.credentials import AzureKeyCredential
from azure.functions import HttpRequest, HttpResponse
import json
import logging

logger = logging.getLogger(__name__)

class OrderEventPublisher:
    def __init__(self, topic_endpoint, topic_key):
        self.publisher = EventGridPublisherClient(
            endpoint=topic_endpoint,
            credential=AzureKeyCredential(topic_key)
        )

    def publish_order_event(self, event_type, order_data):
        """Publish order event to Event Grid"""
        try:
            # Create event
            event = EventGridEvent(
                event_type=event_type,
                subject=f"order/{order_data['order_id']}",
                data=order_data,
                data_version="1.0"
            )

            # Publish event
            self.publisher.send([event])

            logger.info(f"Published {event_type} event for order {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error publishing event: {str(e)}")
            raise

    def publish_order_created(self, order_data):
        """Publish order created event"""
        self.publish_order_event("Order.Created", order_data)

    def publish_order_updated(self, order_data):
        """Publish order updated event"""
        self.publish_order_event("Order.Updated", order_data)

    def publish_order_cancelled(self, order_data):
        """Publish order cancelled event"""
        self.publish_order_event("Order.Cancelled", order_data)

    def publish_order_shipped(self, order_data):
        """Publish order shipped event"""
        self.publish_order_event("Order.Shipped", order_data)

# Azure Functions event handler
def order_processor_function(req: HttpRequest) -> HttpResponse:
    """Azure Function to process order events from Event Grid"""
    try:
        # Parse Event Grid events
        events = req.get_json()

        for event in events:
            event_type = event['eventType']
            order_data = event['data']

            logger.info(f"Processing {event_type} for order {order_data['order_id']}")

            if event_type == "Order.Created":
                # Process new order
                process_new_order(order_data)
            elif event_type == "Order.Updated":
                # Process order update
                process_order_update(order_data)
            elif event_type == "Order.Cancelled":
                # Process order cancellation
                process_order_cancellation(order_data)
            elif event_type == "Order.Shipped":
                # Process order shipment
                process_order_shipment(order_data)

        return HttpResponse("Events processed successfully", status_code=200)

    except Exception as e:
        logger.error(f"Error processing events: {str(e)}")
        return HttpResponse(f"Error: {str(e)}", status_code=500)

def process_new_order(order_data):
    """Process new order"""
    try:
        # Validate order
        validate_order(order_data)

        # Update inventory
        update_inventory(order_data['items'])

        # Create shipment record
        create_shipment_record(order_data)

        # Send confirmation email
        send_confirmation_email(order_data)

        logger.info(f"New order processed: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error processing new order: {str(e)}")
        raise

def process_order_update(order_data):
    """Process order update"""
    try:
        # Update order in database
        update_order_in_db(order_data)

        # Notify relevant parties
        notify_order_update(order_data)

        logger.info(f"Order updated: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error processing order update: {str(e)}")
        raise

def process_order_cancellation(order_data):
    """Process order cancellation"""
    try:
        # Cancel order in database
        cancel_order_in_db(order_data)

        # Restore inventory
        restore_inventory(order_data['items'])

        # Process refund
        process_refund(order_data)

        # Send cancellation notification
        send_cancellation_notification(order_data)

        logger.info(f"Order cancelled: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error processing order cancellation: {str(e)}")
        raise

def process_order_shipment(order_data):
    """Process order shipment"""
    try:
        # Update shipment status
        update_shipment_status(order_data)

        # Send shipping notification
        send_shipping_notification(order_data)

        # Update order status
        update_order_status(order_data, "shipped")

        logger.info(f"Order shipped: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error processing order shipment: {str(e)}")
        raise

# Helper functions (mock implementations)
def validate_order(order_data):
    """Validate order data"""
    required_fields = ['order_id', 'customer_id', 'items']
    if not all(field in order_data for field in required_fields):
        raise ValueError("Missing required order fields")

def update_inventory(items):
    """Update inventory (mock)"""
    for item in items:
        logger.info(f"Updating inventory: {item['product_id']} -{item['quantity']}")

def create_shipment_record(order_data):
    """Create shipment record (mock)"""
    logger.info(f"Creating shipment record for order {order_data['order_id']}")

def send_confirmation_email(order_data):
    """Send confirmation email (mock)"""
    logger.info(f"Sending confirmation email for order {order_data['order_id']}")

def update_order_in_db(order_data):
    """Update order in database (mock)"""
    logger.info(f"Updating order {order_data['order_id']} in database")

def notify_order_update(order_data):
    """Notify order update (mock)"""
    logger.info(f"Notifying order update for {order_data['order_id']}")

def cancel_order_in_db(order_data):
    """Cancel order in database (mock)"""
    logger.info(f"Cancelling order {order_data['order_id']} in database")

def restore_inventory(items):
    """Restore inventory (mock)"""
    for item in items:
        logger.info(f"Restoring inventory: {item['product_id']} +{item['quantity']}")

def process_refund(order_data):
    """Process refund (mock)"""
    logger.info(f"Processing refund for order {order_data['order_id']}")

def send_cancellation_notification(order_data):
    """Send cancellation notification (mock)"""
    logger.info(f"Sending cancellation notification for {order_data['order_id']}")

def update_shipment_status(order_data):
    """Update shipment status (mock)"""
    logger.info(f"Updating shipment status for order {order_data['order_id']}")

def send_shipping_notification(order_data):
    """Send shipping notification (mock)"""
    logger.info(f"Sending shipping notification for order {order_data['order_id']}")

def update_order_status(order_data, status):
    """Update order status (mock)"""
    logger.info(f"Updating order {order_data['order_id']} status to {status}")

# Usage example
def main():
    # Configuration
    TOPIC_ENDPOINT = "https://ecommerce-events.eastus-1.eventgrid.azure.net/api/events"
    TOPIC_KEY = "your_topic_key"

    # Create publisher
    publisher = OrderEventPublisher(TOPIC_ENDPOINT, TOPIC_KEY)

    # Sample order
    sample_order = {
        'order_id': 'ORD-001',
        'customer_id': 'CUST-123',
        'total_amount': 299.99,
        'items': [
            {'product_id': 'PROD-1', 'quantity': 1, 'price': 299.99}
        ]
    }

    # Publish events
    publisher.publish_order_created(sample_order)

    # Simulate order lifecycle
    import time
    time.sleep(2)
    publisher.publish_order_shipped(sample_order)

if __name__ == "__main__":
    main()
```

### Azure Service Bus

```bash
# Create Service Bus namespace
az servicebus namespace create \
  --name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard

# Create queue
az servicebus queue create \
  --name order-processing \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --max-delivery-count 3 \
  --lock-duration PT5M \
  --default-message-time-to-live P7D

# Create topic
az servicebus topic create \
  --name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg

# Create subscription
az servicebus topic subscription create \
  --name email-subscription \
  --topic-name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --max-delivery-count 3

# Create rule for subscription
az servicebus topic subscription rule create \
  --name order-created-rule \
  --subscription-name email-subscription \
  --topic-name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --filter-sql-expression "eventType = 'Order.Created'"
```

```python
# Python script for Service Bus messaging
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from azure.servicebus.management import ServiceBusAdministrationClient
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

class OrderMessageQueue:
    def __init__(self, connection_string):
        self.client = ServiceBusClient.from_connection_string(connection_string)

    async def send_order_message(self, queue_name, order_data, message_properties=None):
        """Send order message to queue"""
        try:
            async with self.client:
                sender = self.client.get_queue_sender(queue_name=queue_name)

                # Create message
                message_body = json.dumps(order_data)
                message = ServiceBusMessage(message_body)

                # Add custom properties
                if message_properties:
                    for key, value in message_properties.items():
                        message.properties[key] = value

                # Add default properties
                message.properties['message_type'] = 'order'
                message.properties['priority'] = order_data.get('priority', 'normal')

                async with sender:
                    await sender.send_messages(message)

                logger.info(f"Order message sent to queue: {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            raise

    async def receive_and_process_orders(self, queue_name):
        """Receive and process order messages from queue"""
        try:
            async with self.client:
                receiver = self.client.get_queue_receiver(queue_name=queue_name)

                async with receiver:
                    received_msgs = await receiver.receive_messages(
                        max_message_count=10,
                        max_wait_time=5
                    )

                    for msg in received_msgs:
                        try:
                            # Parse message
                            order_data = json.loads(str(msg))

                            logger.info(f"Processing order: {order_data['order_id']}")

                            # Process order
                            await self._process_order(order_data)

                            # Complete message
                            await receiver.complete_message(msg)

                        except Exception as e:
                            logger.error(f"Error processing message: {str(e)}")
                            # Dead-letter the message
                            await receiver.dead_letter_message(
                                msg,
                                reason="Processing failed",
                                error_description=str(e)
                            )

        except Exception as e:
            logger.error(f"Error receiving messages: {str(e)}")
            raise

    async def _process_order(self, order_data):
        """Process individual order"""
        # Validate order
        if not self._validate_order(order_data):
            raise ValueError(f"Invalid order data: {order_data}")

        # Process based on order type
        order_type = order_data.get('type', 'standard')

        if order_type == 'express':
            await self._process_express_order(order_data)
        elif order_type == 'bulk':
            await self._process_bulk_order(order_data)
        else:
            await self._process_standard_order(order_data)

    def _validate_order(self, order_data):
        """Validate order data"""
        required_fields = ['order_id', 'customer_id', 'items']
        return all(field in order_data for field in required_fields)

    async def _process_standard_order(self, order_data):
        """Process standard order"""
        # Update inventory
        await self._update_inventory(order_data['items'])

        # Create shipping label
        await self._create_shipping_label(order_data)

        # Send confirmation
        await self._send_confirmation(order_data)

        logger.info(f"Standard order processed: {order_data['order_id']}")

    async def _process_express_order(self, order_data):
        """Process express order"""
        # Priority processing
        await self._update_inventory(order_data['items'])

        # Expedited shipping
        await self._create_express_shipping_label(order_data)

        # Priority confirmation
        await self._send_express_confirmation(order_data)

        logger.info(f"Express order processed: {order_data['order_id']}")

    async def _process_bulk_order(self, order_data):
        """Process bulk order"""
        # Bulk inventory update
        await self._bulk_update_inventory(order_data['items'])

        # Bulk shipping arrangement
        await self._arrange_bulk_shipping(order_data)

        # Bulk confirmation
        await self._send_bulk_confirmation(order_data)

        logger.info(f"Bulk order processed: {order_data['order_id']}")

    # Helper methods (mock implementations)
    async def _update_inventory(self, items):
        for item in items:
            logger.info(f"Updating inventory: {item['product_id']} -{item['quantity']}")

    async def _create_shipping_label(self, order_data):
        logger.info(f"Creating shipping label for {order_data['order_id']}")

    async def _send_confirmation(self, order_data):
        logger.info(f"Sending confirmation for {order_data['order_id']}")

    async def _create_express_shipping_label(self, order_data):
        logger.info(f"Creating express shipping label for {order_data['order_id']}")

    async def _send_express_confirmation(self, order_data):
        logger.info(f"Sending express confirmation for {order_data['order_id']}")

    async def _bulk_update_inventory(self, items):
        logger.info(f"Bulk updating inventory for {len(items)} items")

    async def _arrange_bulk_shipping(self, order_data):
        logger.info(f"Arranging bulk shipping for {order_data['order_id']}")

    async def _send_bulk_confirmation(self, order_data):
        logger.info(f"Sending bulk confirmation for {order_data['order_id']}")

class OrderEventTopic:
    def __init__(self, connection_string):
        self.client = ServiceBusClient.from_connection_string(connection_string)

    async def publish_order_event(self, topic_name, event_type, order_data):
        """Publish order event to topic"""
        try:
            async with self.client:
                sender = self.client.get_topic_sender(topic_name=topic_name)

                # Create message
                message_body = json.dumps({
                    'event_type': event_type,
                    'order_data': order_data,
                    'timestamp': str(asyncio.get_event_loop().time())
                })

                message = ServiceBusMessage(message_body)
                message.properties['event_type'] = event_type
                message.properties['order_id'] = order_data['order_id']

                async with sender:
                    await sender.send_messages(message)

                logger.info(f"Event published to topic: {event_type} for order {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error publishing event: {str(e)}")
            raise

    async def subscribe_to_events(self, topic_name, subscription_name):
        """Subscribe to order events"""
        try:
            async with self.client:
                receiver = self.client.get_subscription_receiver(
                    topic_name=topic_name,
                    subscription_name=subscription_name
                )

                async with receiver:
                    received_msgs = await receiver.receive_messages(
                        max_message_count=10,
                        max_wait_time=5
                    )

                    for msg in received_msgs:
                        try:
                            event_data = json.loads(str(msg))
                            event_type = msg.properties.get('event_type')

                            logger.info(f"Received event: {event_type}")

                            # Process event
                            await self._process_event(event_type, event_data)

                            # Complete message
                            await receiver.complete_message(msg)

                        except Exception as e:
                            logger.error(f"Error processing event: {str(e)}")
                            await receiver.dead_letter_message(msg)

        except Exception as e:
            logger.error(f"Error subscribing to events: {str(e)}")
            raise

    async def _process_event(self, event_type, event_data):
        """Process event based on type"""
        if event_type == "order_created":
            await self._handle_order_created(event_data)
        elif event_type == "order_shipped":
            await self._handle_order_shipped(event_data)
        elif event_type == "order_cancelled":
            await self._handle_order_cancelled(event_data)

    async def _handle_order_created(self, event_data):
        logger.info(f"Handling order created: {event_data['order_data']['order_id']}")

    async def _handle_order_shipped(self, event_data):
        logger.info(f"Handling order shipped: {event_data['order_data']['order_id']}")

    async def _handle_order_cancelled(self, event_data):
        logger.info(f"Handling order cancelled: {event_data['order_data']['order_id']}")

# Usage example
async def main():
    CONNECTION_STRING = "your_servicebus_connection_string"

    # Queue operations
    queue = OrderMessageQueue(CONNECTION_STRING)

    sample_order = {
        'order_id': 'ORD-001',
        'customer_id': 'CUST-123',
        'type': 'standard',
        'items': [
            {'product_id': 'PROD-1', 'quantity': 1, 'price': 299.99}
        ]
    }

    # Send message to queue
    await queue.send_order_message('order-processing', sample_order)

    # Process messages from queue
    await queue.receive_and_process_orders('order-processing')

    # Topic operations
    topic = OrderEventTopic(CONNECTION_STRING)

    # Publish event
    await topic.publish_order_event('order-events', 'order_created', sample_order)

    # Subscribe to events
    await topic.subscribe_to_events('order-events', 'email-subscription')

if __name__ == "__main__":
    asyncio.run(main())
```

### Azure Functions with Event Triggers

```python
# Azure Functions triggered by events
import azure.functions as func
from azure.eventhub import EventData
from azure.servicebus import ServiceBusMessage
import json
import logging

app = func.FunctionApp()

# Event Hub triggered function
@app.function_name(name="ProcessOrderEvents")
@app.event_hub_message_trigger(
    arg_name="events",
    event_hub_name="orders",
    connection="EVENTHUB_CONNECTION"
)
def process_order_events(events: func.EventHubEvent):
    """Process order events from Event Hub"""
    for event in events:
        try:
            # Parse event data
            order_data = json.loads(event.get_body().decode('utf-8'))

            logging.info(f"Processing order event: {order_data['order_id']}")

            # Process order
            process_order(order_data)

        except Exception as e:
            logging.error(f"Error processing event: {str(e)}")
            raise

# Event Grid triggered function
@app.function_name(name="HandleOrderEvents")
@app.event_grid_trigger(arg_name="event")
def handle_order_events(event: func.EventGridEvent):
    """Handle order events from Event Grid"""
    try:
        event_type = event.event_type
        order_data = event.get_json()

        logging.info(f"Handling {event_type} for order {order_data['order_id']}")

        if event_type == "Order.Created":
            handle_order_created(order_data)
        elif event_type == "Order.Updated":
            handle_order_updated(order_data)
        elif event_type == "Order.Cancelled":
            handle_order_cancelled(order_data)

    except Exception as e:
        logging.error(f"Error handling event: {str(e)}")
        raise

# Service Bus queue triggered function
@app.function_name(name="ProcessOrderQueue")
@app.service_bus_queue_trigger(
    arg_name="message",
    queue_name="order-processing",
    connection="SERVICEBUS_CONNECTION"
)
def process_order_queue(message: func.ServiceBusMessage):
    """Process order messages from Service Bus queue"""
    try:
        order_data = json.loads(message.get_body().decode('utf-8'))

        logging.info(f"Processing queued order: {order_data['order_id']}")

        # Process order
        process_order(order_data)

    except Exception as e:
        logging.error(f"Error processing queue message: {str(e)}")
        raise

# Service Bus topic triggered function
@app.function_name(name="ProcessOrderNotifications")
@app.service_bus_topic_trigger(
    arg_name="message",
    topic_name="order-events",
    subscription_name="email-subscription",
    connection="SERVICEBUS_CONNECTION"
)
def process_order_notifications(message: func.ServiceBusMessage):
    """Process order notifications from Service Bus topic"""
    try:
        event_data = json.loads(message.get_body().decode('utf-8'))
        event_type = message.properties.get('event_type')

        logging.info(f"Processing {event_type} notification")

        if event_type == "order_created":
            send_order_confirmation_email(event_data['order_data'])
        elif event_type == "order_shipped":
            send_shipping_notification_email(event_data['order_data'])

    except Exception as e:
        logging.error(f"Error processing notification: {str(e)}")
        raise

# Timer triggered function for cleanup
@app.function_name(name="CleanupOldOrders")
@app.timer_trigger(schedule="0 0 * * * *")  # Every hour
def cleanup_old_orders(timer: func.TimerRequest):
    """Clean up old processed orders"""
    try:
        logging.info("Running order cleanup")

        # Clean up old orders from storage
        cleanup_processed_orders()

        logging.info("Order cleanup completed")

    except Exception as e:
        logging.error(f"Error in cleanup: {str(e)}")
        raise

# Helper functions
def process_order(order_data):
    """Process order (shared logic)"""
    # Validate order
    validate_order(order_data)

    # Update inventory
    update_inventory(order_data['items'])

    # Create shipment
    create_shipment(order_data)

    logging.info(f"Order processed: {order_data['order_id']}")

def handle_order_created(order_data):
    """Handle order created event"""
    # Additional logic for order creation
    logging.info(f"Order created: {order_data['order_id']}")

def handle_order_updated(order_data):
    """Handle order updated event"""
    # Additional logic for order updates
    logging.info(f"Order updated: {order_data['order_id']}")

def handle_order_cancelled(order_data):
    """Handle order cancelled event"""
    # Additional logic for order cancellation
    logging.info(f"Order cancelled: {order_data['order_id']}")

def send_order_confirmation_email(order_data):
    """Send order confirmation email"""
    logging.info(f"Sending confirmation email for order {order_data['order_id']}")

def send_shipping_notification_email(order_data):
    """Send shipping notification email"""
    logging.info(f"Sending shipping notification for order {order_data['order_id']}")

def cleanup_processed_orders():
    """Clean up old processed orders"""
    logging.info("Cleaning up old orders")

# Validation and business logic functions
def validate_order(order_data):
    """Validate order data"""
    required_fields = ['order_id', 'customer_id', 'items']
    if not all(field in order_data for field in required_fields):
        raise ValueError("Invalid order data")

def update_inventory(items):
    """Update inventory"""
    for item in items:
        logging.info(f"Inventory update: {item['product_id']} -{item['quantity']}")

def create_shipment(order_data):
    """Create shipment record"""
    logging.info(f"Creating shipment for order {order_data['order_id']}")
```

### Terraform Configuration

```hcl
# Azure Event Hubs
resource "azurerm_eventhub_namespace" "ecommerce" {
  name                = "ecommerce-events"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  sku                 = "Standard"
  capacity            = 2

  tags = {
    environment = "production"
  }
}

resource "azurerm_eventhub" "orders" {
  name                = "orders"
  namespace_name      = azurerm_eventhub_namespace.ecommerce.name
  resource_group_name = azurerm_resource_group.ecommerce.name
  partition_count     = 4
  message_retention   = 7
}

resource "azurerm_eventhub_consumer_group" "order_processor" {
  name                = "order-processor"
  namespace_name      = azurerm_eventhub_namespace.ecommerce.name
  eventhub_name       = azurerm_eventhub.orders.name
  resource_group_name = azurerm_resource_group.ecommerce.name
}

# Azure Event Grid
resource "azurerm_eventgrid_topic" "ecommerce" {
  name                = "ecommerce-events"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name

  tags = {
    environment = "production"
  }
}

resource "azurerm_eventgrid_event_subscription" "order_processing" {
  name  = "order-processing"
  scope = azurerm_eventgrid_topic.ecommerce.id

  webhook_endpoint {
    url = "https://ecommerce-functions.azurewebsites.net/api/OrderProcessor"
  }

  included_event_types = [
    "Order.Created",
    "Order.Updated",
    "Order.Cancelled"
  ]
}

# Azure Service Bus
resource "azurerm_servicebus_namespace" "ecommerce" {
  name                = "ecommerce-servicebus"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  sku                 = "Standard"

  tags = {
    environment = "production"
  }
}

resource "azurerm_servicebus_queue" "order_processing" {
  name                = "order-processing"
  namespace_name      = azurerm_servicebus_namespace.ecommerce.name
  resource_group_name = azurerm_resource_group.ecommerce.name
  max_delivery_count  = 3
  lock_duration       = "00:05:00"
  max_size_in_megabytes = 1024
}

resource "azurerm_servicebus_topic" "order_events" {
  name                = "order-events"
  namespace_name      = azurerm_servicebus_namespace.ecommerce.name
  resource_group_name = azurerm_servicebus_namespace.ecommerce.name
}

resource "azurerm_servicebus_subscription" "email_notifications" {
  name                = "email-notifications"
  topic_name          = azurerm_servicebus_topic.order_events.name
  namespace_name      = azurerm_servicebus_namespace.ecommerce.name
  resource_group_name = azurerm_resource_group.ecommerce.name
  max_delivery_count  = 3
}

resource "azurerm_servicebus_subscription_rule" "order_created" {
  name                = "order-created-rule"
  subscription_name   = azurerm_servicebus_subscription.email_notifications.name
  topic_name          = azurerm_servicebus_topic.order_events.name
  namespace_name      = azurerm_servicebus_namespace.ecommerce.name
  resource_group_name = azurerm_resource_group.ecommerce.name

  filter_type = "SqlFilter"
  sql_filter  = "eventType = 'Order.Created'"
}

# Azure Functions
resource "azurerm_function_app" "ecommerce" {
  name                       = "ecommerce-functions"
  location                   = azurerm_resource_group.ecommerce.location
  resource_group_name        = azurerm_resource_group.ecommerce.name
  app_service_plan_id        = azurerm_app_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "python"
    EVENTHUB_CONNECTION      = azurerm_eventhub_namespace.ecommerce.default_primary_connection_string
    SERVICEBUS_CONNECTION    = azurerm_servicebus_namespace.ecommerce.default_primary_connection_string
  }

  site_config {
    linux_fx_version = "PYTHON|3.9"
  }

  tags = {
    environment = "production"
  }
}

# Azure Logic Apps
resource "azurerm_logic_app_workflow" "order_fulfillment" {
  name                = "order-fulfillment-workflow"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name

  definition = jsonencode({
    "$schema" = "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#"
    "contentVersion" = "1.0.0.0"
    "parameters" = {
      "$connections" = {
        "defaultValue" = {}
        "type" = "Object"
      }
    }
    "triggers" = {
      "When_an_event_is_received_in_Event_Grid" = {
        "inputs" = {
          "body" = {
            "properties" = {
              "topic" = azurerm_eventgrid_topic.ecommerce.endpoint
            }
          }
        }
        "splitOn" = "@triggerBody()"
        "type" = "ApiConnection"
      }
    }
    "actions" = {
      "Process_order" = {
        "inputs" = {
          "body" = "@triggerBody()"
        }
        "type" = "Compose"
      }
    }
  })

  tags = {
    environment = "production"
  }
}
```

## Best Practices

- Choose appropriate event service based on throughput, latency, and delivery guarantees
- Implement proper error handling and dead-letter queues for failed message processing
- Use event versioning to handle schema evolution gracefully
- Implement idempotent message processing to handle duplicate events
- Use correlation IDs to track events across distributed systems
- Implement proper monitoring and alerting for event processing metrics
- Use Azure Monitor for comprehensive event analytics
- Implement proper security with Azure AD authentication and RBAC
- Use Azure Key Vault for managing connection strings and secrets
- Implement proper retry policies and circuit breakers
- Use Azure Policy for governance and compliance
- Implement proper logging and auditing for event processing
- Use Azure Advisor for performance and cost recommendations
- Implement proper backup and disaster recovery for event data
- Use Azure Purview for data governance and lineage
- Implement proper access controls and data masking
- Use Azure Information Protection for sensitive event data

### Performance Optimization

```bash
# Monitor Event Hubs performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventHub/namespaces/ecommerce-events \
  --metric "IncomingRequests" \
  --interval PT1M

# Scale Event Hubs throughput units
az eventhubs namespace update \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --capacity 4

# Monitor Event Grid delivery
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events \
  --metric "PublishSuccessCount" \
  --interval PT5M

# Monitor Service Bus performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.ServiceBus/namespaces/ecommerce-servicebus \
  --metric "IncomingRequests" \
  --interval PT1M
```

### Cost Optimization

```bash
# Set up Event Hubs auto-inflate
az eventhubs namespace update \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --enable-auto-inflate \
  --max-throughput-units 20

# Use Event Grid system topics for Azure services
az eventgrid system-topic create \
  --name storage-events \
  --resource-group ecommerce-rg \
  --topic-type Microsoft.Storage.StorageAccounts \
  --source /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage

# Monitor event processing costs
az costmanagement query \
  --type "Usage" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --dataset-granularity "Daily" \
  --dataset-aggregation '{"totalCost":{"name":"PreTaxCost","function":"Sum"}}' \
  --timeframe "MonthToDate"
```

## Security Considerations

- Use Azure AD authentication for all event services
- Implement proper RBAC with least privilege principle
- Use Azure Key Vault for managing connection strings and keys
- Enable encryption at rest and in transit
- Use private endpoints for secure access from virtual networks
- Implement proper network security with NSGs and firewalls
- Enable Azure Defender for event services
- Implement proper logging and monitoring for security events
- Use Azure Information Protection for sensitive event data
- Implement proper backup and disaster recovery procedures
- Use Azure Policy for compliance enforcement
- Implement proper access reviews and audits
- Use Azure Sentinel for security analytics and incident response

## Azure Event-Driven vs Other Cloud Providers

| Feature | Azure Event-Driven | AWS Event-Driven | GCP Event-Driven |
|---------|-------------------|------------------|-----------------|
| Event Ingestion | Event Hubs | Kinesis | Pub/Sub |
| Event Routing | Event Grid | EventBridge | Eventarc |
| Message Queuing | Service Bus | SQS/SNS | Pub/Sub |
| Serverless | Functions | Lambda | Cloud Functions |
| Workflow | Logic Apps | Step Functions | Workflows |
| Pricing Model | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |
| Global Scale | Excellent | Excellent | Excellent |

## Common Use Cases

- **Order Processing**: Real-time order validation, inventory updates, shipping triggers
- **IoT Data Processing**: Sensor data ingestion, real-time analytics, alerting
- **User Activity Tracking**: Clickstream analysis, personalization, recommendations
- **System Monitoring**: Log aggregation, anomaly detection, automated responses
- **Financial Transactions**: Fraud detection, payment processing, compliance monitoring
- **Supply Chain Management**: Inventory tracking, shipment updates, demand forecasting
- **Customer Notifications**: Order confirmations, shipping updates, promotional messages
- **Data Pipeline Orchestration**: ETL job triggers, data quality checks, reporting
- **Microservices Communication**: Service decoupling, event sourcing, CQRS patterns
- **Real-time Dashboards**: Live metrics, KPI monitoring, operational visibility