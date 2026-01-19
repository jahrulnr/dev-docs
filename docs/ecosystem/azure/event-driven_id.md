# Layanan Event-Driven Azure

## Gambaran Umum

Layanan Event-Driven Azure menyediakan platform komprehensif untuk membangun aplikasi reaktif berbasis event yang dapat merespons perubahan secara real-time. Layanan ini memungkinkan decoupling komponen aplikasi, memungkinkan arsitektur yang dapat diskalakan dan tangguh yang dapat menangani pemrosesan event volume tinggi.

## Konsep Utama

### Layanan Inti
- **Azure Event Hubs**: Layanan ingestion event throughput tinggi, latensi rendah
- **Azure Event Grid**: Layanan routing event cerdas untuk pemrograman reaktif
- **Azure Service Bus**: Messaging enterprise dengan fitur-fitur canggih seperti antrian dan topik
- **Azure Functions**: Komputasi serverless yang dipicu oleh event
- **Azure Logic Apps**: Otomasi alur kerja dengan pemicu event

### Pola Event
- **Event Streaming**: Aliran event yang berkelanjutan dari producer ke consumer
- **Event Routing**: Distribusi event yang cerdas berdasarkan konten dan metadata
- **Message Queuing**: Pengiriman pesan yang andal dengan berbagai jaminan pengiriman
- **Event-Driven Compute**: Eksekusi serverless yang dipicu oleh event
- **Workflow Automation**: Proses bisnis yang kompleks yang dipicu oleh event

### Model Pemrosesan Event
- **At-Least-Once**: Event dikirimkan setidaknya sekali, mungkin ada duplikat
- **At-Most-Once**: Event dikirimkan paling banyak sekali, mungkin kehilangan event
- **Exactly-Once**: Event dikirimkan tepat sekali, paling andal tetapi kompleks
- **Event Sourcing**: Menyimpan perubahan state sebagai urutan event
- **CQRS**: Command Query Responsibility Segregation untuk sistem event-driven

## Kapan Menggunakan

- **Event Hubs**: Telemetri volume tinggi, agregasi log, analitik real-time
- **Event Grid**: Integrasi lintas-service, alur kerja serverless, event IoT
- **Service Bus**: Messaging enterprise, routing kompleks, pengiriman terjamin
- **Functions**: Pemrosesan event, transformasi data, integrasi API
- **Logic Apps**: Otomasi proses bisnis, alur kerja multi-langkah

## Contoh

### Azure Event Hubs

```bash
# Membuat namespace Event Hubs
az eventhubs namespace create \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard \
  --capacity 2

# Membuat Event Hub
az eventhubs eventhub create \
  --name orders \
  --namespace-name ecommerce-events \
  --resource-group ecommerce-rg \
  --partition-count 4 \
  --retention-time-in-hours 168 \
  --cleanup-policy Delete

# Membuat consumer group
az eventhubs eventhub consumer-group create \
  --name order-processor \
  --eventhub-name orders \
  --namespace-name ecommerce-events \
  --resource-group ecommerce-rg

# Mendapatkan connection string
CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
  --resource-group ecommerce-rg \
  --namespace-name ecommerce-events \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

echo $CONNECTION_STRING
```

```python
# Script Python untuk producer dan consumer Event Hubs
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
        """Mengirim event pesanan ke Event Hub"""
        try:
            async with self.producer:
                # Membuat batch data event
                event_data_batch = await self.producer.create_batch()

                for order in orders:
                    # Membuat data event
                    event_data = EventData(json.dumps(order))

                    # Menambahkan properti kustom
                    event_data.properties = {
                        'event_type': 'order_created',
                        'customer_id': order['customer_id'],
                        'order_total': order['total_amount']
                    }

                    # Menambahkan ke batch
                    event_data_batch.add(event_data)

                # Mengirim batch
                await self.producer.send_batch(event_data_batch)

                logger.info(f"Mengirim {len(orders)} event pesanan ke Event Hub")

        except Exception as e:
            logger.error(f"Error mengirim event: {str(e)}")
            raise

    def send_single_order(self, order):
        """Mengirim event pesanan tunggal secara sinkron"""
        try:
            event_data = EventData(json.dumps(order))
            event_data.properties = {
                'event_type': 'order_created',
                'customer_id': order['customer_id'],
                'order_total': order['total_amount']
            }

            with self.producer:
                self.producer.send_event(event_data)

            logger.info(f"Mengirim event pesanan: {order['order_id']}")

        except Exception as e:
            logger.error(f"Error mengirim event tunggal: {str(e)}")
            raise

class OrderEventConsumer:
    def __init__(self, connection_string, eventhub_name, consumer_group, storage_connection_string, container_name):
        # Menginisialisasi checkpoint store
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
        """Memproses event dari Event Hub"""
        try:
            async def on_event(partition_context, event):
                try:
                    # Parse data event
                    order_data = json.loads(event.body_as_str())

                    logger.info(f"Menerima event pesanan: {order_data['order_id']}")

                    # Memproses pesanan
                    await self._process_order(order_data)

                    # Update checkpoint
                    await partition_context.update_checkpoint(event)

                except Exception as e:
                    logger.error(f"Error memproses event: {str(e)}")

            async with self.consumer:
                await self.consumer.receive(
                    on_event=on_event,
                    starting_position="-1"  # Mulai dari awal
                )

        except Exception as e:
            logger.error(f"Error dalam pemrosesan event: {str(e)}")
            raise

    async def _process_order(self, order_data):
        """Memproses pesanan individual (implementasi mock)"""
        # Validasi pesanan
        if not self._validate_order(order_data):
            raise ValueError(f"Data pesanan tidak valid: {order_data}")

        # Update inventory
        await self._update_inventory(order_data['items'])

        # Kirim konfirmasi
        await self._send_order_confirmation(order_data)

        # Trigger proses downstream
        await self._trigger_fulfillment(order_data)

        logger.info(f"Pesanan berhasil diproses: {order_data['order_id']}")

    def _validate_order(self, order_data):
        """Validasi data pesanan"""
        required_fields = ['order_id', 'customer_id', 'items', 'total_amount']
        return all(field in order_data for field in required_fields)

    async def _update_inventory(self, items):
        """Update inventory (implementasi mock)"""
        for item in items:
            logger.info(f"Update inventory untuk {item['product_id']}: -{item['quantity']}")

    async def _send_order_confirmation(self, order_data):
        """Kirim konfirmasi pesanan (implementasi mock)"""
        logger.info(f"Mengirim konfirmasi untuk pesanan {order_data['order_id']}")

    async def _trigger_fulfillment(self, order_data):
        """Trigger proses fulfillment pesanan (implementasi mock)"""
        logger.info(f"Trigger fulfillment untuk pesanan {order_data['order_id']}")

# Contoh penggunaan
async def main():
    # Konfigurasi
    EVENTHUB_CONNECTION = "your_eventhub_connection_string"
    EVENTHUB_NAME = "orders"
    CONSUMER_GROUP = "order-processor"
    STORAGE_CONNECTION = "your_storage_connection_string"
    CONTAINER_NAME = "checkpoints"

    # Sample pesanan
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

    # Kirim event
    producer = OrderEventProducer(EVENTHUB_CONNECTION, EVENTHUB_NAME)
    await producer.send_order_events(sample_orders)

    # Proses event
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
# Membuat Event Grid topic
az eventgrid topic create \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --location eastus

# Membuat Event Grid subscription untuk event pesanan
az eventgrid event-subscription create \
  --name order-processing \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "https://ecommerce-functions.azurewebsites.net/api/OrderProcessor" \
  --endpoint-type webhook \
  --included-event-types "Order.Created" "Order.Updated" "Order.Cancelled"

# Membuat subscription untuk Azure Functions
az eventgrid event-subscription create \
  --name inventory-updates \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-functions/functions/InventoryUpdater" \
  --endpoint-type azurefunction \
  --included-event-types "Order.Created"

# Membuat subscription untuk Service Bus queue
az eventgrid event-subscription create \
  --name email-notifications \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events" \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.ServiceBus/namespaces/ecommerce-servicebus/queues/email-queue" \
  --endpoint-type servicebusqueue \
  --included-event-types "Order.Created" "Order.Shipped"
```

```python
# Script Python untuk publisher dan handler Event Grid
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
        """Publish event pesanan ke Event Grid"""
        try:
            # Membuat event
            event = EventGridEvent(
                event_type=event_type,
                subject=f"order/{order_data['order_id']}",
                data=order_data,
                data_version="1.0"
            )

            # Publish event
            self.publisher.send([event])

            logger.info(f"Published {event_type} event untuk pesanan {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error publishing event: {str(e)}")
            raise

    def publish_order_created(self, order_data):
        """Publish event pesanan dibuat"""
        self.publish_order_event("Order.Created", order_data)

    def publish_order_updated(self, order_data):
        """Publish event pesanan diupdate"""
        self.publish_order_event("Order.Updated", order_data)

    def publish_order_cancelled(self, order_data):
        """Publish event pesanan dibatalkan"""
        self.publish_order_event("Order.Cancelled", order_data)

    def publish_order_shipped(self, order_data):
        """Publish event pesanan dikirim"""
        self.publish_order_event("Order.Shipped", order_data)

# Azure Functions event handler
def order_processor_function(req: HttpRequest) -> HttpResponse:
    """Azure Function untuk memproses event pesanan dari Event Grid"""
    try:
        # Parse Event Grid events
        events = req.get_json()

        for event in events:
            event_type = event['eventType']
            order_data = event['data']

            logger.info(f"Memproses {event_type} untuk pesanan {order_data['order_id']}")

            if event_type == "Order.Created":
                # Proses pesanan baru
                process_new_order(order_data)
            elif event_type == "Order.Updated":
                # Proses update pesanan
                process_order_update(order_data)
            elif event_type == "Order.Cancelled":
                # Proses pembatalan pesanan
                process_order_cancellation(order_data)
            elif event_type == "Order.Shipped":
                # Proses pengiriman pesanan
                process_order_shipment(order_data)

        return HttpResponse("Event berhasil diproses", status_code=200)

    except Exception as e:
        logger.error(f"Error memproses event: {str(e)}")
        return HttpResponse(f"Error: {str(e)}", status_code=500)

def process_new_order(order_data):
    """Memproses pesanan baru"""
    try:
        # Validasi pesanan
        validate_order(order_data)

        # Update inventory
        update_inventory(order_data['items'])

        # Buat record pengiriman
        create_shipment_record(order_data)

        # Kirim email konfirmasi
        send_confirmation_email(order_data)

        logger.info(f"Pesanan baru diproses: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error memproses pesanan baru: {str(e)}")
        raise

def process_order_update(order_data):
    """Memproses update pesanan"""
    try:
        # Update pesanan di database
        update_order_in_db(order_data)

        # Beritahu pihak terkait
        notify_order_update(order_data)

        logger.info(f"Pesanan diupdate: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error memproses update pesanan: {str(e)}")
        raise

def process_order_cancellation(order_data):
    """Memproses pembatalan pesanan"""
    try:
        # Batalkan pesanan di database
        cancel_order_in_db(order_data)

        # Kembalikan inventory
        restore_inventory(order_data['items'])

        # Proses refund
        process_refund(order_data)

        # Kirim notifikasi pembatalan
        send_cancellation_notification(order_data)

        logger.info(f"Pesanan dibatalkan: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error memproses pembatalan pesanan: {str(e)}")
        raise

def process_order_shipment(order_data):
    """Memproses pengiriman pesanan"""
    try:
        # Update status pengiriman
        update_shipment_status(order_data)

        # Kirim notifikasi pengiriman
        send_shipping_notification(order_data)

        # Update status pesanan
        update_order_status(order_data, "shipped")

        logger.info(f"Pesanan dikirim: {order_data['order_id']}")

    except Exception as e:
        logger.error(f"Error memproses pengiriman pesanan: {str(e)}")
        raise

# Fungsi helper (implementasi mock)
def validate_order(order_data):
    """Validasi data pesanan"""
    required_fields = ['order_id', 'customer_id', 'items']
    if not all(field in order_data for field in required_fields):
        raise ValueError("Field pesanan yang diperlukan hilang")

def update_inventory(items):
    """Update inventory"""
    for item in items:
        logger.info(f"Update inventory: {item['product_id']} -{item['quantity']}")

def create_shipment_record(order_data):
    """Buat record pengiriman (mock)"""
    logger.info(f"Membuat record pengiriman untuk pesanan {order_data['order_id']}")

def send_confirmation_email(order_data):
    """Kirim email konfirmasi"""
    logger.info(f"Mengirim email konfirmasi untuk pesanan {order_data['order_id']}")

def update_order_in_db(order_data):
    """Update pesanan di database (mock)"""
    logger.info(f"Update pesanan {order_data['order_id']} di database")

def notify_order_update(order_data):
    """Beritahu update pesanan (mock)"""
    logger.info(f"Memberitahu update pesanan untuk {order_data['order_id']}")

def cancel_order_in_db(order_data):
    """Batalkan pesanan di database (mock)"""
    logger.info(f"Membatalkan pesanan {order_data['order_id']} di database")

def restore_inventory(items):
    """Kembalikan inventory (mock)"""
    for item in items:
        logger.info(f"Mengembalikan inventory: {item['product_id']} +{item['quantity']}")

def process_refund(order_data):
    """Proses refund (mock)"""
    logger.info(f"Memproses refund untuk pesanan {order_data['order_id']}")

def send_cancellation_notification(order_data):
    """Kirim notifikasi pembatalan (mock)"""
    logger.info(f"Mengirim notifikasi pembatalan untuk {order_data['order_id']}")

def update_shipment_status(order_data):
    """Update status pengiriman (mock)"""
    logger.info(f"Update status pengiriman untuk pesanan {order_data['order_id']}")

def send_shipping_notification(order_data):
    """Kirim notifikasi pengiriman (mock)"""
    logger.info(f"Mengirim notifikasi pengiriman untuk pesanan {order_data['order_id']}")

def update_order_status(order_data, status):
    """Update status pesanan (mock)"""
    logger.info(f"Update pesanan {order_data['order_id']} status ke {status}")

# Contoh penggunaan
def main():
    # Konfigurasi
    TOPIC_ENDPOINT = "https://ecommerce-events.eastus-1.eventgrid.azure.net/api/events"
    TOPIC_KEY = "your_topic_key"

    # Buat publisher
    publisher = OrderEventPublisher(TOPIC_ENDPOINT, TOPIC_KEY)

    # Sample pesanan
    sample_order = {
        'order_id': 'ORD-001',
        'customer_id': 'CUST-123',
        'total_amount': 299.99,
        'items': [
            {'product_id': 'PROD-1', 'quantity': 1, 'price': 299.99}
        ]
    }

    # Publish event
    publisher.publish_order_created(sample_order)

    # Simulasi lifecycle pesanan
    import time
    time.sleep(2)
    publisher.publish_order_shipped(sample_order)

if __name__ == "__main__":
    main()
```

### Azure Service Bus

```bash
# Membuat Service Bus namespace
az servicebus namespace create \
  --name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard

# Membuat queue
az servicebus queue create \
  --name order-processing \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --max-delivery-count 3 \
  --lock-duration PT5M \
  --default-message-time-to-live P7D

# Membuat topic
az servicebus topic create \
  --name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg

# Membuat subscription
az servicebus topic subscription create \
  --name email-subscription \
  --topic-name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --max-delivery-count 3

# Membuat rule untuk subscription
az servicebus topic subscription rule create \
  --name order-created-rule \
  --subscription-name email-subscription \
  --topic-name order-events \
  --namespace-name ecommerce-servicebus \
  --resource-group ecommerce-rg \
  --filter-sql-expression "eventType = 'Order.Created'"
```

```python
# Script Python untuk messaging Service Bus
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
        """Kirim pesan pesanan ke queue"""
        try:
            async with self.client:
                sender = self.client.get_queue_sender(queue_name=queue_name)

                # Membuat pesan
                message_body = json.dumps(order_data)
                message = ServiceBusMessage(message_body)

                # Menambahkan properti kustom
                if message_properties:
                    for key, value in message_properties.items():
                        message.properties[key] = value

                # Menambahkan properti default
                message.properties['message_type'] = 'order'
                message.properties['priority'] = order_data.get('priority', 'normal')

                async with sender:
                    await sender.send_messages(message)

                logger.info(f"Pesan pesanan dikirim ke queue: {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error mengirim pesan: {str(e)}")
            raise

    async def receive_and_process_orders(self, queue_name):
        """Menerima dan memproses pesan pesanan dari queue"""
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
                            # Parse pesan
                            order_data = json.loads(str(msg))

                            logger.info(f"Memproses pesanan: {order_data['order_id']}")

                            # Proses pesanan
                            await self._process_order(order_data)

                            # Complete pesan
                            await receiver.complete_message(msg)

                        except Exception as e:
                            logger.error(f"Error memproses pesan: {str(e)}")
                            # Dead-letter pesan
                            await receiver.dead_letter_message(
                                msg,
                                reason="Pemrosesan gagal",
                                error_description=str(e)
                            )

        except Exception as e:
            logger.error(f"Error menerima pesan: {str(e)}")
            raise

    async def _process_order(self, order_data):
        """Memproses pesanan individual"""
        # Validasi pesanan
        if not self._validate_order(order_data):
            raise ValueError(f"Data pesanan tidak valid: {order_data}")

        # Proses berdasarkan tipe pesanan
        order_type = order_data.get('type', 'standard')

        if order_type == 'express':
            await self._process_express_order(order_data)
        elif order_type == 'bulk':
            await self._process_bulk_order(order_data)
        else:
            await self._process_standard_order(order_data)

    def _validate_order(self, order_data):
        """Validasi data pesanan"""
        required_fields = ['order_id', 'customer_id', 'items']
        return all(field in order_data for field in required_fields)

    async def _process_standard_order(self, order_data):
        """Memproses pesanan standar"""
        # Update inventory
        await self._update_inventory(order_data['items'])

        # Buat label pengiriman
        await self._create_shipping_label(order_data)

        # Kirim konfirmasi
        await self._send_confirmation(order_data)

        logger.info(f"Pesanan standar diproses: {order_data['order_id']}")

    async def _process_express_order(self, order_data):
        """Memproses pesanan express"""
        # Pemrosesan prioritas
        await self._update_inventory(order_data['items'])

        # Pengiriman dipercepat
        await self._create_express_shipping_label(order_data)

        # Konfirmasi prioritas
        await self._send_express_confirmation(order_data)

        logger.info(f"Pesanan express diproses: {order_data['order_id']}")

    async def _process_bulk_order(self, order_data):
        """Memproses pesanan bulk"""
        # Update inventory bulk
        await self._bulk_update_inventory(order_data['items'])

        # Pengaturan pengiriman bulk
        await self._arrange_bulk_shipping(order_data)

        # Konfirmasi bulk
        await self._send_bulk_confirmation(order_data)

        logger.info(f"Pesanan bulk diproses: {order_data['order_id']}")

    # Method helper (implementasi mock)
    async def _update_inventory(self, items):
        for item in items:
            logger.info(f"Update inventory: {item['product_id']} -{item['quantity']}")

    async def _create_shipping_label(self, order_data):
        logger.info(f"Membuat label pengiriman untuk {order_data['order_id']}")

    async def _send_confirmation(self, order_data):
        logger.info(f"Mengirim konfirmasi untuk {order_data['order_id']}")

    async def _create_express_shipping_label(self, order_data):
        logger.info(f"Membuat label pengiriman express untuk {order_data['order_id']}")

    async def _send_express_confirmation(self, order_data):
        logger.info(f"Mengirim konfirmasi express untuk {order_data['order_id']}")

    async def _bulk_update_inventory(self, items):
        logger.info(f"Update inventory bulk untuk {len(items)} item")

    async def _arrange_bulk_shipping(self, order_data):
        logger.info(f"Mengatur pengiriman bulk untuk {order_data['order_id']}")

    async def _send_bulk_confirmation(self, order_data):
        logger.info(f"Mengirim konfirmasi bulk untuk {order_data['order_id']}")

class OrderEventTopic:
    def __init__(self, connection_string):
        self.client = ServiceBusClient.from_connection_string(connection_string)

    async def publish_order_event(self, topic_name, event_type, order_data):
        """Publish event pesanan ke topic"""
        try:
            async with self.client:
                sender = self.client.get_topic_sender(topic_name=topic_name)

                # Membuat pesan
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

                logger.info(f"Event dipublish ke topic: {event_type} untuk pesanan {order_data['order_id']}")

        except Exception as e:
            logger.error(f"Error publish event: {str(e)}")
            raise

    async def subscribe_to_events(self, topic_name, subscription_name):
        """Subscribe ke event pesanan"""
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

                            logger.info(f"Menerima event: {event_type}")

                            # Proses event
                            await self._process_event(event_type, event_data)

                            # Complete pesan
                            await receiver.complete_message(msg)

                        except Exception as e:
                            logger.error(f"Error memproses event: {str(e)}")
                            await receiver.dead_letter_message(msg)

        except Exception as e:
            logger.error(f"Error subscribe ke event: {str(e)}")
            raise

    async def _process_event(self, event_type, event_data):
        """Proses event berdasarkan tipe"""
        if event_type == "order_created":
            await self._handle_order_created(event_data)
        elif event_type == "order_shipped":
            await self._handle_order_shipped(event_data)
        elif event_type == "order_cancelled":
            await self._handle_order_cancelled(event_data)

    async def _handle_order_created(self, event_data):
        logger.info(f"Menangani pesanan dibuat: {event_data['order_data']['order_id']}")

    async def _handle_order_shipped(self, event_data):
        logger.info(f"Menangani pesanan dikirim: {event_data['order_data']['order_id']}")

    async def _handle_order_cancelled(self, event_data):
        logger.info(f"Menangani pesanan dibatalkan: {event_data['order_data']['order_id']}")

# Contoh penggunaan
async def main():
    CONNECTION_STRING = "your_servicebus_connection_string"

    # Operasi queue
    queue = OrderMessageQueue(CONNECTION_STRING)

    sample_order = {
        'order_id': 'ORD-001',
        'customer_id': 'CUST-123',
        'type': 'standard',
        'items': [
            {'product_id': 'PROD-1', 'quantity': 1, 'price': 299.99}
        ]
    }

    # Kirim pesan ke queue
    await queue.send_order_message('order-processing', sample_order)

    # Proses pesan dari queue
    await queue.receive_and_process_orders('order-processing')

    # Operasi topic
    topic = OrderEventTopic(CONNECTION_STRING)

    # Publish event
    await topic.publish_order_event('order-events', 'order_created', sample_order)

    # Subscribe ke event
    await topic.subscribe_to_events('order-events', 'email-subscription')

if __name__ == "__main__":
    asyncio.run(main())
```

### Azure Functions dengan Event Triggers

```python
# Azure Functions yang dipicu oleh event
import azure.functions as func
from azure.eventhub import EventData
from azure.servicebus import ServiceBusMessage
import json
import logging

app = func.FunctionApp()

# Function yang dipicu Event Hub
@app.function_name(name="ProcessOrderEvents")
@app.event_hub_message_trigger(
    arg_name="events",
    event_hub_name="orders",
    connection="EVENTHUB_CONNECTION"
)
def process_order_events(events: func.EventHubEvent):
    """Memproses event pesanan dari Event Hub"""
    for event in events:
        try:
            # Parse data event
            order_data = json.loads(event.get_body().decode('utf-8'))

            logging.info(f"Memproses event pesanan: {order_data['order_id']}")

            # Proses pesanan
            process_order(order_data)

        except Exception as e:
            logging.error(f"Error memproses event: {str(e)}")
            raise

# Function yang dipicu Event Grid
@app.function_name(name="HandleOrderEvents")
@app.event_grid_trigger(arg_name="event")
def handle_order_events(event: func.EventGridEvent):
    """Menangani event pesanan dari Event Grid"""
    try:
        event_type = event.event_type
        order_data = event.get_json()

        logging.info(f"Menangani {event_type} untuk pesanan {order_data['order_id']}")

        if event_type == "Order.Created":
            handle_order_created(order_data)
        elif event_type == "Order.Updated":
            handle_order_updated(order_data)
        elif event_type == "Order.Cancelled":
            handle_order_cancelled(order_data)

    except Exception as e:
        logging.error(f"Error menangani event: {str(e)}")
        raise

# Function yang dipicu Service Bus queue
@app.function_name(name="ProcessOrderQueue")
@app.service_bus_queue_trigger(
    arg_name="message",
    queue_name="order-processing",
    connection="SERVICEBUS_CONNECTION"
)
def process_order_queue(message: func.ServiceBusMessage):
    """Memproses pesan pesanan dari Service Bus queue"""
    try:
        order_data = json.loads(message.get_body().decode('utf-8'))

        logging.info(f"Memproses pesanan queued: {order_data['order_id']}")

        # Proses pesanan
        process_order(order_data)

    except Exception as e:
        logging.error(f"Error memproses queue message: {str(e)}")
        raise

# Function yang dipicu Service Bus topic
@app.function_name(name="ProcessOrderNotifications")
@app.service_bus_topic_trigger(
    arg_name="message",
    topic_name="order-events",
    subscription_name="email-subscription",
    connection="SERVICEBUS_CONNECTION"
)
def process_order_notifications(message: func.ServiceBusMessage):
    """Memproses notifikasi pesanan dari Service Bus topic"""
    try:
        event_data = json.loads(message.get_body().decode('utf-8'))
        event_type = message.properties.get('event_type')

        logging.info(f"Memproses notifikasi {event_type}")

        if event_type == "order_created":
            send_order_confirmation_email(event_data['order_data'])
        elif event_type == "order_shipped":
            send_shipping_notification_email(event_data['order_data'])

    except Exception as e:
        logging.error(f"Error memproses notifikasi: {str(e)}")
        raise

# Function yang dipicu timer untuk cleanup
@app.function_name(name="CleanupOldOrders")
@app.timer_trigger(schedule="0 0 * * * *")  # Setiap jam
def cleanup_old_orders(timer: func.TimerRequest):
    """Membersihkan pesanan lama yang sudah diproses"""
    try:
        logging.info("Menjalankan cleanup pesanan")

        # Bersihkan pesanan lama dari storage
        cleanup_processed_orders()

        logging.info("Cleanup pesanan selesai")

    except Exception as e:
        logging.error(f"Error dalam cleanup: {str(e)}")
        raise

# Fungsi helper
def process_order(order_data):
    """Proses pesanan (logika bersama)"""
    # Validasi pesanan
    validate_order(order_data)

    # Update inventory
    update_inventory(order_data['items'])

    # Buat pengiriman
    create_shipment(order_data)

    logging.info(f"Pesanan diproses: {order_data['order_id']}")

def handle_order_created(order_data):
    """Menangani event pesanan dibuat"""
    # Logika tambahan untuk pembuatan pesanan
    logging.info(f"Pesanan dibuat: {order_data['order_id']}")

def handle_order_updated(order_data):
    """Menangani event pesanan diupdate"""
    # Logika tambahan untuk update pesanan
    logging.info(f"Pesanan diupdate: {order_data['order_id']}")

def handle_order_cancelled(order_data):
    """Menangani event pesanan dibatalkan"""
    # Logika tambahan untuk pembatalan pesanan
    logging.info(f"Pesanan dibatalkan: {order_data['order_id']}")

def send_order_confirmation_email(order_data):
    """Kirim email konfirmasi pesanan"""
    logging.info(f"Mengirim email konfirmasi untuk pesanan {order_data['order_id']}")

def send_shipping_notification_email(order_data):
    """Kirim email notifikasi pengiriman"""
    logging.info(f"Mengirim notifikasi pengiriman untuk pesanan {order_data['order_id']}")

def cleanup_processed_orders():
    """Bersihkan pesanan lama yang sudah diproses"""
    logging.info("Membersihkan pesanan lama")

# Fungsi validasi dan bisnis
def validate_order(order_data):
    """Validasi data pesanan"""
    required_fields = ['order_id', 'customer_id', 'items']
    if not all(field in order_data for field in required_fields):
        raise ValueError("Data pesanan tidak valid")

def update_inventory(items):
    """Update inventory"""
    for item in items:
        logging.info(f"Update inventory: {item['product_id']} -{item['quantity']}")

def create_shipment(order_data):
    """Buat record pengiriman"""
    logging.info(f"Membuat pengiriman untuk pesanan {order_data['order_id']}")
```

### Konfigurasi Terraform

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

## Praktik Terbaik

- Pilih layanan event yang sesuai berdasarkan throughput, latensi, dan jaminan pengiriman
- Implementasikan penanganan error yang proper dan dead-letter queues untuk pesan yang gagal diproses
- Gunakan versioning event untuk menangani evolusi skema dengan graceful
- Implementasikan pemrosesan pesan idempotent untuk menangani event duplikat
- Gunakan correlation IDs untuk melacak event di seluruh sistem terdistribusi
- Implementasikan monitoring dan alerting yang proper untuk metrik pemrosesan event
- Gunakan Azure Monitor untuk analitik event komprehensif
- Implementasikan keamanan yang proper dengan autentikasi Azure AD dan RBAC
- Gunakan Azure Key Vault untuk mengelola connection strings dan secrets
- Implementasikan retry policies dan circuit breakers
- Gunakan Azure Policy untuk governance dan compliance
- Implementasikan logging dan auditing yang proper untuk pemrosesan event
- Gunakan Azure Advisor untuk rekomendasi performa dan biaya
- Implementasikan backup dan disaster recovery yang proper untuk data event
- Gunakan Azure Purview untuk governance data dan lineage
- Implementasikan access controls dan data masking yang proper
- Gunakan Azure Information Protection untuk data event sensitif

### Optimasi Performa

```bash
# Monitor performa Event Hubs
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventHub/namespaces/ecommerce-events \
  --metric "IncomingRequests" \
  --interval PT1M

# Scale throughput units Event Hubs
az eventhubs namespace update \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --capacity 4

# Monitor delivery Event Grid
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.EventGrid/topics/ecommerce-events \
  --metric "PublishSuccessCount" \
  --interval PT5M

# Monitor performa Service Bus
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.ServiceBus/namespaces/ecommerce-servicebus \
  --metric "IncomingRequests" \
  --interval PT1M
```

### Optimasi Biaya

```bash
# Setup auto-inflate Event Hubs
az eventhubs namespace update \
  --name ecommerce-events \
  --resource-group ecommerce-rg \
  --enable-auto-inflate \
  --max-throughput-units 20

# Gunakan system topics Event Grid untuk layanan Azure
az eventgrid system-topic create \
  --name storage-events \
  --resource-group ecommerce-rg \
  --topic-type Microsoft.Storage.StorageAccounts \
  --source /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage

# Monitor biaya pemrosesan event
az costmanagement query \
  --type "Usage" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --dataset-granularity "Daily" \
  --dataset-aggregation '{"totalCost":{"name":"PreTaxCost","function":"Sum"}}' \
  --timeframe "MonthToDate"
```

## Pertimbangan Keamanan

- Gunakan autentikasi Azure AD untuk semua layanan event
- Implementasikan RBAC yang proper dengan prinsip least privilege
- Gunakan Azure Key Vault untuk mengelola connection strings dan keys
- Aktifkan enkripsi at rest dan in transit
- Gunakan private endpoints untuk akses aman dari virtual networks
- Implementasikan network security yang proper dengan NSGs dan firewalls
- Aktifkan Azure Defender untuk layanan event
- Implementasikan logging dan monitoring yang proper untuk event keamanan
- Gunakan Azure Information Protection untuk data event sensitif
- Implementasikan prosedur backup dan disaster recovery yang proper
- Gunakan Azure Policy untuk enforcement compliance
- Implementasikan access reviews dan audits yang proper
- Gunakan Azure Sentinel untuk analitik keamanan dan incident response

## Perbandingan Azure Event-Driven dengan Provider Cloud Lain

| Fitur | Azure Event-Driven | AWS Event-Driven | GCP Event-Driven |
|-------|-------------------|------------------|-----------------|
| Event Ingestion | Event Hubs | Kinesis | Pub/Sub |
| Event Routing | Event Grid | EventBridge | Eventarc |
| Message Queuing | Service Bus | SQS/SNS | Pub/Sub |
| Serverless | Functions | Lambda | Cloud Functions |
| Workflow | Logic Apps | Step Functions | Workflows |
| Model Harga | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |
| Skala Global | Excellent | Excellent | Excellent |

## Kasus Penggunaan Umum

- **Pemrosesan Pesanan**: Validasi pesanan real-time, update inventory, trigger pengiriman
- **Pemrosesan Data IoT**: Ingestion data sensor, analitik real-time, alerting
- **Pelacakan Aktivitas User**: Analitik clickstream, personalisasi, rekomendasi
- **Monitoring Sistem**: Agregasi log, deteksi anomali, respons otomatis
- **Transaksi Finansial**: Deteksi fraud, pemrosesan pembayaran, compliance monitoring
- **Manajemen Supply Chain**: Pelacakan inventory, update pengiriman, forecasting demand
- **Notifikasi Customer**: Konfirmasi pesanan, update pengiriman, pesan promosi
- **Orkestrasi Data Pipeline**: Trigger job ETL, pemeriksaan kualitas data, reporting
- **Komunikasi Microservices**: Decoupling service, event sourcing, pola CQRS
- **Dashboard Real-time**: Metrik live, monitoring KPI, visibility operasional