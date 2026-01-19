# Apache Kafka

## Overview

Apache Kafka is a distributed event streaming platform designed for high-throughput, fault-tolerant, and scalable real-time data processing. Originally developed by LinkedIn and later open-sourced through the Apache Software Foundation, Kafka has become the de facto standard for building real-time data pipelines and streaming applications.

Kafka excels at handling high-volume data streams, providing durable message storage, and enabling real-time processing of events. It's commonly used for log aggregation, event sourcing, stream processing, and building event-driven architectures.

## Key Concepts

- **Topics**: Categories or feeds to which records are published
- **Partitions**: Topics are divided into partitions for scalability and parallelism
- **Producers**: Applications that publish records to Kafka topics
- **Consumers**: Applications that subscribe to topics and process records
- **Consumer Groups**: Group of consumers that share the processing of records
- **Brokers**: Kafka servers that store and serve data
- **ZooKeeper**: Coordination service for managing Kafka cluster metadata
- **Replication**: Data duplication across multiple brokers for fault tolerance
- **Retention**: How long messages are kept in Kafka topics
- **Offsets**: Position markers for tracking consumer progress
- **Schema Registry**: Centralized repository for data schemas

## When to Use

- Real-time data pipelines and ETL processes
- Event-driven microservices communication
- Log aggregation and centralized logging
- Stream processing and analytics
- Event sourcing and CQRS patterns
- Message queuing with high throughput requirements
- Data integration across multiple systems
- Real-time monitoring and alerting
- IoT data processing and analytics
- High-volume transaction processing
- Building reactive and event-driven applications

## Examples

### Basic Kafka Producer

```java
// Java Producer Example
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class EcommerceOrderProducer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("acks", "all");
        props.put("retries", 3);
        props.put("batch.size", 16384);
        props.put("linger.ms", 1);
        props.put("buffer.memory", 33554432);

        Producer<String, String> producer = new KafkaProducer<>(props);

        // Order event
        String orderEvent = """
            {
                "orderId": "ORD-12345",
                "customerId": "CUST-67890",
                "items": [
                    {"productId": "PROD-001", "quantity": 2, "price": 29.99},
                    {"productId": "PROD-002", "quantity": 1, "price": 49.99}
                ],
                "totalAmount": 109.97,
                "timestamp": "2024-01-15T10:30:00Z"
            }
            """;

        ProducerRecord<String, String> record = new ProducerRecord<>(
            "ecommerce-orders",
            "ORD-12345",
            orderEvent
        );

        producer.send(record, (metadata, exception) -> {
            if (exception == null) {
                System.out.println("Order sent successfully to partition " +
                    metadata.partition() + " at offset " + metadata.offset());
            } else {
                System.err.println("Failed to send order: " + exception.getMessage());
            }
        });

        producer.close();
    }
}
```

### Basic Kafka Consumer

```java
// Java Consumer Example
import org.apache.kafka.clients.consumer.*;
import java.time.Duration;
import java.util.Collections;
import java.util.Properties;

public class OrderProcessingConsumer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("group.id", "order-processor-group");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("auto.offset.reset", "earliest");
        props.put("enable.auto.commit", false);

        Consumer<String, String> consumer = new KafkaConsumer<>(props);
        consumer.subscribe(Collections.singletonList("ecommerce-orders"));

        try {
            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

                for (ConsumerRecord<String, String> record : records) {
                    System.out.println("Processing order: " + record.key() +
                        " from partition " + record.partition() +
                        " at offset " + record.offset());

                    // Process order (inventory update, payment processing, etc.)
                    processOrder(record.value());

                    // Manual commit
                    consumer.commitSync();
                }
            }
        } finally {
            consumer.close();
        }
    }

    private static void processOrder(String orderJson) {
        // Order processing logic
        System.out.println("Processing order: " + orderJson);
    }
}
```

### Kafka Streams Processing

```java
// Kafka Streams for Real-time Analytics
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.kstream.*;
import java.util.Properties;

public class OrderAnalyticsStream {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-analytics");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();

        // Order stream
        KStream<String, String> orders = builder.stream("ecommerce-orders");

        // Calculate revenue by product
        KTable<String, Double> productRevenue = orders
            .mapValues(OrderAnalyticsStream::parseOrder)
            .flatMapValues(order -> order.getItems())
            .groupBy((key, item) -> item.getProductId())
            .aggregate(
                () -> 0.0,
                (key, item, total) -> total + (item.getPrice() * item.getQuantity()),
                Materialized.as("product-revenue-store")
            );

        // Publish results to topic
        productRevenue.toStream().to("product-revenue", Produced.with(Serdes.String(), Serdes.Double()));

        // Real-time alerts for high-value orders
        orders
            .mapValues(OrderAnalyticsStream::parseOrder)
            .filter((key, order) -> order.getTotalAmount() > 1000.0)
            .mapValues(order -> "HIGH_VALUE_ORDER: " + order.getOrderId())
            .to("order-alerts");

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();

        // Graceful shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));
    }

    private static Order parseOrder(String orderJson) {
        // Parse JSON and return Order object
        return new Order(); // Implementation omitted for brevity
    }
}
```

### Kafka Connect Configuration

```properties
# Kafka Connect Source Configuration
name=postgresql-source-connector
connector.class=io.confluent.connect.jdbc.JdbcSourceConnector
tasks.max=1

# Database connection
connection.url=jdbc:postgresql://localhost:5432/ecommerce
connection.user=ecommerce_user
connection.password=ecommerce_password

# Table to monitor
table.whitelist=orders,order_items,customers

# Topic mapping
topic.prefix=ecommerce-

# Polling configuration
mode=timestamp
timestamp.column.name=updated_at
poll.interval.ms=5000

# Schema configuration
key.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=false
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=true
```

```properties
# Kafka Connect Sink Configuration
name=elasticsearch-sink-connector
connector.class=io.confluent.connect.elasticsearch.ElasticsearchSinkConnector
tasks.max=1

# Topics to sink
topics=ecommerce-orders,ecommerce-customers

# Elasticsearch connection
connection.url=http://localhost:9200
connection.username=elastic
connection.password=elastic_password

# Index configuration
key.ignore=true
schema.ignore=true
type.name=_doc

# Write configuration
write.method=upsert
behavior.on.null.values=delete
```

### Schema Registry with Avro

```java
// Producer with Schema Registry
import io.confluent.kafka.serializers.KafkaAvroSerializer;
import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;

public class AvroOrderProducer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("schema.registry.url", "http://localhost:8081");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", KafkaAvroSerializer.class.getName());

        Producer<String, GenericRecord> producer = new KafkaProducer<>(props);

        // Define Avro schema
        String schemaString = """
            {
                "type": "record",
                "name": "Order",
                "fields": [
                    {"name": "orderId", "type": "string"},
                    {"name": "customerId", "type": "string"},
                    {"name": "totalAmount", "type": "double"},
                    {"name": "timestamp", "type": "long"}
                ]
            }
            """;

        Schema schema = new Schema.Parser().parse(schemaString);
        GenericRecord order = new GenericData.Record(schema);
        order.put("orderId", "ORD-12345");
        order.put("customerId", "CUST-67890");
        order.put("totalAmount", 109.97);
        order.put("timestamp", System.currentTimeMillis());

        ProducerRecord<String, GenericRecord> record =
            new ProducerRecord<>("ecommerce-orders-avro", "ORD-12345", order);

        producer.send(record);
        producer.close();
    }
}
```

### Kafka Configuration

```properties
# server.properties - Kafka Broker Configuration
# Broker identity
broker.id=1
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://localhost:9092

# Log configuration
log.dirs=/var/lib/kafka/data
num.partitions=3
default.replication.factor=3
min.insync.replicas=2

# Retention policies
log.retention.hours=168
log.retention.bytes=1073741824
log.segment.bytes=1073741824
log.cleanup.policy=delete

# Performance tuning
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Security (SASL/SSL)
security.inter.broker.protocol=SASL_PLAINTEXT
sasl.mechanism.inter.broker.protocol=PLAIN
sasl.enabled.mechanisms=PLAIN
ssl.keystore.location=/var/ssl/kafka.server.keystore.jks
ssl.keystore.password=kafka123
ssl.key.password=kafka123
ssl.truststore.location=/var/ssl/kafka.server.truststore.jks
ssl.truststore.password=kafka123

# Monitoring
metric.reporters=io.confluent.metrics.reporter.ConfluentMetricsReporter
confluent.metrics.reporter.bootstrap.servers=localhost:9092
confluent.metrics.reporter.topic.replicas=3
```

### Docker Compose Setup

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0

  schema-registry:
    image: confluentinc/cp-schema-registry:7.4.0
    depends_on:
      - kafka
    ports:
      - "8081:8081"
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKA_BROKER_LIST: kafka:9092

  kafka-connect:
    image: confluentinc/cp-kafka-connect:7.4.0
    depends_on:
      - kafka
      - schema-registry
    ports:
      - "8083:8083"
    environment:
      CONNECT_BOOTSTRAP_SERVERS: kafka:9092
      CONNECT_REST_ADVERTISED_HOST_NAME: kafka-connect
      CONNECT_REST_PORT: 8083
      CONNECT_GROUP_ID: kafka-connect-group
      CONNECT_CONFIG_STORAGE_TOPIC: _kafka-connect-configs
      CONNECT_OFFSET_STORAGE_TOPIC: _kafka-connect-offsets
      CONNECT_STATUS_STORAGE_TOPIC: _kafka-connect-status
      CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_INTERNAL_KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_INTERNAL_VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_PLUGIN_PATH: /usr/share/java,/usr/share/confluent-hub-components
```

### Monitoring with JMX

```java
// JMX Monitoring Example
import javax.management.*;
import javax.management.remote.*;
import java.util.Set;

public class KafkaJMXMonitor {
    public static void main(String[] args) throws Exception {
        JMXServiceURL url = new JMXServiceURL(
            "service:jmx:rmi:///jndi/rmi://localhost:9999/jmxrmi"
        );

        JMXConnector jmxc = JMXConnectorFactory.connect(url, null);
        MBeanServerConnection mbsc = jmxc.getMBeanServerConnection();

        // Get broker metrics
        ObjectName brokerMetrics = new ObjectName(
            "kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec"
        );

        Double messagesInRate = (Double) mbsc.getAttribute(brokerMetrics, "OneMinuteRate");

        // Get consumer group lag
        ObjectName consumerLag = new ObjectName(
            "kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,topic=*,partition=*"
        );

        Set<ObjectName> consumerMetrics = mbsc.queryNames(consumerLag, null);
        for (ObjectName metric : consumerMetrics) {
            Long lag = (Long) mbsc.getAttribute(metric, "records-lag");
            System.out.println("Consumer lag: " + lag);
        }

        jmxc.close();
    }
}
```

## Best Practices

- Design topics with appropriate partitioning strategy
- Use meaningful topic naming conventions
- Configure proper replication factor for fault tolerance
- Implement proper error handling and retry logic
- Use consumer groups for scalable processing
- Monitor consumer lag and broker metrics
- Implement proper serialization with Schema Registry
- Configure appropriate retention policies
- Use idempotent producers for exactly-once semantics
- Implement proper security with SSL and SASL
- Regularly backup and test disaster recovery procedures
- Use Kafka Connect for data integration
- Monitor and tune performance based on use case requirements

### Performance Tuning

```properties
# Producer Performance Tuning
batch.size=32768
linger.ms=10
compression.type=snappy
max.in.flight.requests.per.connection=5
enable.idempotence=true
acks=all

# Consumer Performance Tuning
fetch.min.bytes=1024
fetch.max.wait.ms=500
max.poll.records=500
session.timeout.ms=30000
heartbeat.interval.ms=3000

# Broker Performance Tuning
num.network.threads=9
num.io.threads=16
socket.send.buffer.bytes=1048576
socket.receive.buffer.bytes=1048576
replica.fetch.max.bytes=1048576
num.replica.fetchers=2
```

### Security Configuration

```properties
# SSL Configuration
ssl.keystore.location=/etc/kafka/ssl/kafka.server.keystore.jks
ssl.keystore.password=kafka123
ssl.key.password=kafka123
ssl.truststore.location=/etc/kafka/ssl/kafka.server.truststore.jks
ssl.truststore.password=kafka123
ssl.client.auth=required

# SASL Configuration
security.inter.broker.protocol=SASL_SSL
sasl.mechanism.inter.broker.protocol=PLAIN
sasl.enabled.mechanisms=PLAIN,SCRAM-SHA-256,SCRAM-SHA-512

# Authorization
authorizer.class.name=kafka.security.auth.SimpleAclAuthorizer
super.users=User:kafka
```

## Security Considerations

- Enable SSL/TLS for encrypted communication
- Implement proper authentication with SASL
- Use authorization with ACLs for access control
- Secure ZooKeeper with proper access controls
- Regularly rotate certificates and credentials
- Monitor for unauthorized access attempts
- Implement network segmentation
- Use secure configurations for production deployments
- Regularly audit and update Kafka versions
- Implement proper logging and monitoring
- Use encryption at rest for sensitive data

## Kafka vs Other Messaging Systems

| Feature | Kafka | RabbitMQ | ActiveMQ | Redis Pub/Sub |
|---------|-------|----------|----------|---------------|
| Throughput | Very High | High | Medium | Very High |
| Persistence | Yes | Yes | Yes | Optional |
| Ordering | Per Partition | Per Queue | Per Queue | No |
| Scalability | Excellent | Good | Good | Limited |
| Message Size | Large | Medium | Medium | Small |
| Delivery | At-least-once | Various | Various | At-most-once |
| Use Case | Big Data | General | General | Caching |

## Common Use Cases

- **Event Streaming**: Real-time event processing and analytics
- **Log Aggregation**: Centralized logging from multiple services
- **Data Pipeline**: ETL processes and data integration
- **Event Sourcing**: Storing application state as events
- **Microservices Communication**: Asynchronous service communication
- **IoT Data Processing**: High-volume sensor data processing
- **Real-time Analytics**: Streaming analytics and dashboards
- **Change Data Capture**: Database change event streaming
- **Notification Systems**: Real-time notifications and alerts
- **Audit Logging**: Comprehensive audit trail management