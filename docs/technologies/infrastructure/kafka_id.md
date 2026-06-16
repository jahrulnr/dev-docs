# Apache Kafka

## Gambaran Umum

Apache Kafka adalah platform streaming event terdistribusi yang dirancang untuk throughput tinggi, fault-tolerant, dan scalable untuk pemrosesan data real-time. Awalnya dikembangkan oleh LinkedIn dan kemudian di-open-source melalui Apache Software Foundation, Kafka telah menjadi standar de facto untuk membangun data pipeline real-time dan aplikasi streaming.

Kafka unggul dalam menangani data stream ber-volume tinggi, menyediakan penyimpanan pesan yang durable, dan memungkinkan pemrosesan real-time dari events. Kafka umum digunakan untuk agregasi log, event sourcing, stream processing, dan membangun arsitektur event-driven.

## Konsep Utama

- **Topics**: Kategori atau feed tempat records dipublikasikan
- **Partitions**: Topics dibagi menjadi partitions untuk skalabilitas dan paralelisme
- **Producers**: Aplikasi yang mempublikasikan records ke Kafka topics
- **Consumers**: Aplikasi yang berlangganan ke topics dan memproses records
- **Consumer Groups**: Grup consumers yang berbagi pemrosesan records
- **Brokers**: Server Kafka yang menyimpan dan melayani data
- **ZooKeeper**: Layanan koordinasi untuk mengelola metadata cluster Kafka
- **Replication**: Duplikasi data di seluruh multiple brokers untuk fault tolerance
- **Retention**: Berapa lama pesan disimpan di Kafka topics
- **Offsets**: Penanda posisi untuk melacak progress consumer
- **Schema Registry**: Repository terpusat untuk skema data

## Kapan Digunakan

- Data pipeline real-time dan proses ETL
- Komunikasi microservices yang event-driven
- Agregasi log dan centralized logging
- Stream processing dan analytics
- Pola event sourcing dan CQRS
- Message queuing dengan kebutuhan throughput tinggi
- Integrasi data di seluruh multiple sistem
- Monitoring dan alerting real-time
- Pemrosesan data IoT dan analytics
- Pemrosesan transaksi ber-volume tinggi
- Membangun aplikasi reactive dan event-driven

## Contoh

### Producer Kafka Dasar

```java
// Contoh Producer Java
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

        // Event order
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
            "orders",
            "ORD-12345",
            orderEvent
        );

        producer.send(record, (metadata, exception) -> {
            if (exception == null) {
                System.out.println("Order berhasil dikirim ke partition " +
                    metadata.partition() + " pada offset " + metadata.offset());
            } else {
                System.err.println("Gagal mengirim order: " + exception.getMessage());
            }
        });

        producer.close();
    }
}
```

### Consumer Kafka Dasar

```java
// Contoh Consumer Java
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
        consumer.subscribe(Collections.singletonList("orders"));

        try {
            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

                for (ConsumerRecord<String, String> record : records) {
                    System.out.println("Memproses order: " + record.key() +
                        " dari partition " + record.partition() +
                        " pada offset " + record.offset());

                    // Proses order (update inventory, pemrosesan pembayaran, dll.)
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
        // Logika pemrosesan order
        System.out.println("Memproses order: " + orderJson);
    }
}
```

### Pemrosesan Kafka Streams

```java
// Kafka Streams untuk Analytics Real-time
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

        // Stream order
        KStream<String, String> orders = builder.stream("orders");

        // Hitung revenue berdasarkan produk
        KTable<String, Double> productRevenue = orders
            .mapValues(OrderAnalyticsStream::parseOrder)
            .flatMapValues(order -> order.getItems())
            .groupBy((key, item) -> item.getProductId())
            .aggregate(
                () -> 0.0,
                (key, item, total) -> total + (item.getPrice() * item.getQuantity()),
                Materialized.as("product-revenue-store")
            );

        // Publikasikan hasil ke topic
        productRevenue.toStream().to("product-revenue", Produced.with(Serdes.String(), Serdes.Double()));

        // Alert real-time untuk order bernilai tinggi
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
        // Parse JSON dan return object Order
        return new Order(); // Implementasi dihilangkan untuk singkatnya
    }
}
```

### Konfigurasi Kafka Connect

```properties
# Konfigurasi Kafka Connect Source
name=postgresql-source-connector
connector.class=io.confluent.connect.jdbc.JdbcSourceConnector
tasks.max=1

# Koneksi database
connection.url=jdbc:postgresql://localhost:5432/appdb
connection.user=app_user
connection.password=app_password

# Tabel untuk monitoring
table.whitelist=orders,order_items,customers

# Mapping topic
topic.prefix=app-

# Konfigurasi polling
mode=timestamp
timestamp.column.name=updated_at
poll.interval.ms=5000

# Konfigurasi schema
key.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=false
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=true
```

```properties
# Konfigurasi Kafka Connect Sink
name=elasticsearch-sink-connector
connector.class=io.confluent.connect.elasticsearch.ElasticsearchSinkConnector
tasks.max=1

# Topics untuk sink
topics=orders,customers

# Koneksi Elasticsearch
connection.url=http://localhost:9200
connection.username=elastic
connection.password=elastic_password

# Konfigurasi index
key.ignore=true
schema.ignore=true
type.name=_doc

# Konfigurasi write
write.method=upsert
behavior.on.null.values=delete
```

### Schema Registry dengan Avro

```java
// Producer dengan Schema Registry
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

        // Definisikan schema Avro
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
            new ProducerRecord<>("orders-avro", "ORD-12345", order);

        producer.send(record);
        producer.close();
    }
}
```

### Konfigurasi Kafka

```properties
# server.properties - Konfigurasi Kafka Broker
# Identitas broker
broker.id=1
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://localhost:9092

# Konfigurasi log
log.dirs=/var/lib/kafka/data
num.partitions=3
default.replication.factor=3
min.insync.replicas=2

# Kebijakan retention
log.retention.hours=168
log.retention.bytes=1073741824
log.segment.bytes=1073741824
log.cleanup.policy=delete

# Tuning performa
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Keamanan (SASL/SSL)
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

### Setup Docker Compose

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

### Monitoring dengan JMX

```java
// Contoh Monitoring JMX
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

        // Dapatkan metrics broker
        ObjectName brokerMetrics = new ObjectName(
            "kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec"
        );

        Double messagesInRate = (Double) mbsc.getAttribute(brokerMetrics, "OneMinuteRate");

        // Dapatkan lag consumer group
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

## Praktik Terbaik

- Desain topics dengan strategi partitioning yang sesuai
- Gunakan konvensi penamaan topic yang bermakna
- Konfigurasi replication factor yang tepat untuk fault tolerance
- Implementasikan error handling dan retry logic yang proper
- Gunakan consumer groups untuk pemrosesan yang scalable
- Monitor consumer lag dan broker metrics
- Implementasikan serialisasi yang proper dengan Schema Registry
- Konfigurasi retention policies yang sesuai
- Gunakan producers idempotent untuk semantik exactly-once
- Implementasikan keamanan yang proper dengan SSL dan SASL
- Lakukan backup dan test disaster recovery secara regular
- Gunakan Kafka Connect untuk integrasi data
- Monitor dan tune performa berdasarkan kebutuhan use case

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

### Konfigurasi Keamanan

```properties
# Konfigurasi SSL
ssl.keystore.location=/etc/kafka/ssl/kafka.server.keystore.jks
ssl.keystore.password=kafka123
ssl.key.password=kafka123
ssl.truststore.location=/etc/kafka/ssl/kafka.server.truststore.jks
ssl.truststore.password=kafka123
ssl.client.auth=required

# Konfigurasi SASL
security.inter.broker.protocol=SASL_SSL
sasl.mechanism.inter.broker.protocol=PLAIN
sasl.enabled.mechanisms=PLAIN,SCRAM-SHA-256,SCRAM-SHA-512

# Authorization
authorizer.class.name=kafka.security.auth.SimpleAclAuthorizer
super.users=User:kafka
```

## Pertimbangan Keamanan

- Aktifkan SSL/TLS untuk komunikasi terenkripsi
- Implementasikan autentikasi yang proper dengan SASL
- Gunakan authorization dengan ACLs untuk kontrol akses
- Amankan ZooKeeper dengan kontrol akses yang proper
- Lakukan rotasi sertifikat dan kredensial secara regular
- Monitor upaya akses yang tidak sah
- Implementasikan segmentasi jaringan
- Gunakan konfigurasi aman untuk deployment production
- Lakukan audit dan update versi Kafka secara regular
- Implementasikan logging dan monitoring yang proper
- Gunakan enkripsi at rest untuk data sensitif

## Kafka vs Sistem Messaging Lain

| Fitur | Kafka | RabbitMQ | ActiveMQ | Redis Pub/Sub |
|-------|-------|----------|----------|---------------|
| Throughput | Sangat Tinggi | Tinggi | Sedang | Sangat Tinggi |
| Persistence | Ya | Ya | Ya | Opsional |
| Ordering | Per Partition | Per Queue | Per Queue | Tidak |
| Scalability | Excellent | Baik | Baik | Terbatas |
| Ukuran Pesan | Besar | Sedang | Sedang | Kecil |
| Delivery | At-least-once | Beragam | Beragam | At-most-once |
| Use Case | Big Data | Umum | Umum | Caching |

## Use Case Umum

- **Event Streaming**: Pemrosesan dan analytics event real-time
- **Log Aggregation**: Centralized logging dari multiple services
- **Data Pipeline**: Proses ETL dan integrasi data
- **Event Sourcing**: Menyimpan state aplikasi sebagai events
- **Komunikasi Microservices**: Komunikasi service asynchronous
- **Pemrosesan Data IoT**: Pemrosesan data sensor ber-volume tinggi
- **Real-time Analytics**: Analytics streaming dan dashboard
- **Change Data Capture**: Streaming event perubahan database
- **Sistem Notifikasi**: Notifikasi dan alert real-time
- **Audit Logging**: Manajemen audit trail yang komprehensif