# ELK Stack

## Overview

ELK Stack is a powerful open-source log analysis platform consisting of three main components: Elasticsearch, Logstash, and Kibana. Together, these tools provide a complete solution for searching, analyzing, and visualizing log data from any source. The stack has evolved into the Elastic Stack with additional components like Beats for data shipping.

Elasticsearch serves as the search and analytics engine, Logstash processes and transforms data, and Kibana provides visualization and dashboard capabilities. The stack is highly scalable, distributed, and designed for real-time data processing and analysis.

## Key Concepts

- **Elasticsearch**: Distributed search and analytics engine
- **Logstash**: Data processing pipeline for ingesting, transforming, and shipping logs
- **Kibana**: Visualization and exploration tool for Elasticsearch data
- **Beats**: Lightweight data shippers for different data sources
- **Index**: Collection of documents with similar characteristics
- **Document**: JSON object containing data fields
- **Mapping**: Definition of how documents and fields are stored
- **Pipeline**: Series of processors that transform data in Logstash
- **Query DSL**: Elasticsearch's query language for complex searches
- **Aggregation**: Framework for data summarization and analytics

## When to Use

- Centralized log management and analysis
- Real-time monitoring and troubleshooting
- Security information and event management (SIEM)
- Business intelligence and analytics
- Full-text search capabilities
- Complex data analysis and visualization
- Log aggregation from multiple sources
- Compliance and audit logging
- Performance monitoring and alerting
- Machine learning and anomaly detection

## Examples

### Basic ELK Stack Setup with Docker

```yaml
# docker-compose.yml - Complete ELK stack
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    ports:
      - "5044:5044"
      - "5000:5000"
      - "9600:9600"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
    depends_on:
      - elasticsearch
    networks:
      - elk

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - elk

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: filebeat
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/log:/var/log:ro
    depends_on:
      - logstash
    networks:
      - elk

volumes:
  elasticsearch_data:

networks:
  elk:
    driver: bridge
```

### Logstash Pipeline Configuration

```ruby
# logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }

  tcp {
    port => 5000
    codec => json
  }

  http {
    port => 8080
    additional_codecs => {
      "application/json" => "json"
    }
  }
}

filter {
  if [type] == "apache" {
    grok {
      match => { "message" => "%{COMBINEDAPACHELOG}" }
    }
    date {
      match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ]
      target => "@timestamp"
    }
    geoip {
      source => "clientip"
      target => "geoip"
    }
  }

  if [type] == "ecommerce" {
    json {
      source => "message"
    }
    mutate {
      convert => {
        "amount" => "float"
        "quantity" => "integer"
      }
    }
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
  }

  mutate {
    remove_field => [ "host", "@version" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][beat]}-%{[@metadata][version]}-%{+YYYY.MM.dd}"
    document_type => "%{[@metadata][type]}"
  }

  stdout {
    codec => rubydebug
  }
}
```

### Filebeat Configuration

```yaml
# filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/apache2/*.log
    - /var/log/nginx/*.log
  fields:
    type: apache
  fields_under_root: true

- type: log
  enabled: true
  paths:
    - /var/log/application/*.log
  fields:
    type: ecommerce
  fields_under_root: true
  multiline:
    pattern: '^\['
    negate: true
    match: after

- type: docker
  enabled: true
  containers:
    path: "/var/lib/docker/containers"
    stream: "stdout"
    ids:
      - "*"
  fields:
    type: docker
  fields_under_root: true

output.logstash:
  hosts: ["logstash:5044"]
  loadbalance: true

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

### Elasticsearch Index Template

```json
PUT _template/ecommerce_template
{
  "index_patterns": ["ecommerce-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "index.codec": "best_compression"
  },
  "mappings": {
    "properties": {
      "@timestamp": {
        "type": "date"
      },
      "user_id": {
        "type": "keyword"
      },
      "session_id": {
        "type": "keyword"
      },
      "product_id": {
        "type": "keyword"
      },
      "product_name": {
        "type": "text",
        "analyzer": "standard"
      },
      "category": {
        "type": "keyword"
      },
      "price": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "quantity": {
        "type": "integer"
      },
      "total_amount": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "currency": {
        "type": "keyword"
      },
      "payment_method": {
        "type": "keyword"
      },
      "status": {
        "type": "keyword"
      },
      "user_agent": {
        "type": "text",
        "analyzer": "user_agent"
      },
      "ip_address": {
        "type": "ip"
      },
      "geo_location": {
        "type": "geo_point"
      },
      "device_type": {
        "type": "keyword"
      },
      "browser": {
        "type": "keyword"
      },
      "referrer": {
        "type": "keyword"
      },
      "campaign": {
        "type": "keyword"
      },
      "source": {
        "type": "keyword"
      },
      "medium": {
        "type": "keyword"
      }
    }
  }
}
```

### Kibana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "E-commerce Analytics Dashboard",
    "hits": 0,
    "description": "",
    "panelsJSON": [
      {
        "id": "revenue-chart",
        "type": "visualization",
        "title": "Revenue Over Time",
        "visState": {
          "title": "Revenue Over Time",
          "type": "line",
          "params": {
            "type": "line",
            "grid": {
              "categoryLines": false
            },
            "categoryAxes": [
              {
                "id": "CategoryAxis-1",
                "type": "category",
                "position": "bottom",
                "show": true,
                "style": {},
                "scale": {
                  "type": "linear"
                },
                "labels": {
                  "show": true,
                  "truncate": 100
                },
                "title": {}
              }
            ],
            "valueAxes": [
              {
                "id": "ValueAxis-1",
                "name": "LeftAxis-1",
                "type": "value",
                "position": "left",
                "show": true,
                "style": {},
                "scale": {
                  "type": "linear",
                  "mode": "normal"
                },
                "labels": {
                  "show": true,
                  "rotate": 0,
                  "filter": false,
                  "truncate": 100
                },
                "title": {
                  "text": "Revenue ($)"
                }
              }
            ],
            "seriesParams": [
              {
                "show": "true",
                "type": "line",
                "mode": "normal",
                "data": {
                  "label": "Revenue",
                  "id": "1"
                },
                "valueAxis": "ValueAxis-1",
                "drawLinesBetweenPoints": true,
                "showCircles": true
              }
            ]
          },
          "aggs": [
            {
              "id": "1",
              "enabled": true,
              "type": "date_histogram",
              "schema": "segment",
              "params": {
                "field": "@timestamp",
                "interval": "auto",
                "customInterval": "2h",
                "min_doc_count": 1,
                "extended_bounds": {},
                "customLabel": "Time"
              }
            },
            {
              "id": "2",
              "enabled": true,
              "type": "sum",
              "schema": "metric",
              "params": {
                "field": "total_amount",
                "customLabel": "Total Revenue"
              }
            }
          ]
        },
        "uiStateJSON": {},
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": {
            "index": "ecommerce-*",
            "query": {
              "query": "",
              "language": "lucene"
            },
            "filter": []
          }
        }
      }
    ],
    "optionsJSON": {
      "darkTheme": false,
      "useMargins": true,
      "hidePanelTitles": false
    },
    "uiStateJSON": {},
    "version": 1,
    "timeRestore": false,
    "kibanaSavedObjectMeta": {
      "searchSourceJSON": {
        "query": {
          "query": "",
          "language": "lucene"
        },
        "filter": []
      }
    }
  }
}
```

### Advanced Logstash Pipeline for E-commerce

```ruby
# Advanced e-commerce log processing
input {
  beats {
    port => 5044
  }

  kafka {
    bootstrap_servers => "kafka:9092"
    topics => ["user-events", "order-events", "payment-events"]
    codec => json
    consumer_threads => 3
    decorate_events => true
  }

  jdbc {
    jdbc_driver_library => "/usr/share/logstash/logstash-core/lib/jars/mysql-connector-java-8.0.33.jar"
    jdbc_driver_class => "com.mysql.jdbc.Driver"
    jdbc_connection_string => "jdbc:mysql://mysql:3306/ecommerce"
    jdbc_user => "logstash"
    jdbc_password => "${MYSQL_PASSWORD}"
    schedule => "*/5 * * * *"
    statement => "SELECT * FROM orders WHERE updated_at > :sql_last_value"
    tracking_column => "updated_at"
    use_column_value => true
    tracking_column_type => "timestamp"
    clean_run => true
  }
}

filter {
  # Parse user events
  if [kafka][topic] == "user-events" {
    json {
      source => "message"
    }

    fingerprint {
      source => ["user_id", "session_id"]
      target => "[@metadata][fingerprint]"
      method => "SHA256"
    }

    mutate {
      add_field => {
        "event_type" => "user_action"
        "index_prefix" => "user-events"
      }
    }
  }

  # Parse order events
  if [kafka][topic] == "order-events" {
    json {
      source => "message"
    }

    mutate {
      convert => {
        "total_amount" => "float"
        "item_count" => "integer"
      }
      add_field => {
        "event_type" => "order"
        "index_prefix" => "orders"
      }
    }

    # Enrich with product data
    translate {
      field => "product_ids"
      destination => "product_details"
      dictionary_path => "/etc/logstash/product_dictionary.yml"
      fallback => "unknown"
    }
  }

  # Parse payment events
  if [kafka][topic] == "payment-events" {
    json {
      source => "message"
    }

    mutate {
      add_field => {
        "event_type" => "payment"
        "index_prefix" => "payments"
      }
    }

    # Mask sensitive payment data
    mutate {
      gsub => [
        "card_number", "\d{12}(\d{4})", "****-****-****-\1"
      ]
    }
  }

  # Database records
  if [type] == "jdbc" {
    mutate {
      add_field => {
        "source" => "database"
        "event_type" => "order_sync"
      }
      convert => {
        "total_amount" => "float"
        "created_at" => "string"
        "updated_at" => "string"
      }
    }

    date {
      match => ["created_at", "yyyy-MM-dd HH:mm:ss"]
      target => "@timestamp"
    }
  }

  # Common transformations
  mutate {
    lowercase => ["payment_method", "status", "event_type"]
    remove_field => ["message", "kafka", "@version", "host"]
  }

  # Add geo information
  if [client_ip] {
    geoip {
      source => "client_ip"
      target => "geo"
      database => "/etc/logstash/GeoLite2-City.mmdb"
    }
  }

  # User agent parsing
  if [user_agent] {
    useragent {
      source => "user_agent"
      target => "user_agent_details"
    }
  }
}

output {
  if [event_type] == "user_action" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "%{index_prefix}-%{+YYYY.MM.dd}"
      document_id => "%{[@metadata][fingerprint]}"
      pipeline => "user_events_pipeline"
    }
  }

  if [event_type] == "order" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "%{index_prefix}-%{+YYYY.MM.dd}"
      pipeline => "order_events_pipeline"
    }
  }

  if [event_type] == "payment" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "%{index_prefix}-%{+YYYY.MM.dd}"
      pipeline => "payment_events_pipeline"
    }
  }

  if [source] == "database" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "db-orders-%{+YYYY.MM.dd}"
      action => "update"
      doc_as_upsert => true
      document_id => "%{order_id}"
    }
  }

  # Debug output
  if "_debug" in [tags] {
    stdout {
      codec => rubydebug
    }
  }
}
```

### Elasticsearch Ingest Pipeline

```json
PUT _ingest/pipeline/user_events_pipeline
{
  "description": "Pipeline for processing user events",
  "processors": [
    {
      "set": {
        "field": "event.ingested",
        "value": "{{_ingest.timestamp}}"
      }
    },
    {
      "lowercase": {
        "field": "user_action"
      }
    },
    {
      "set": {
        "field": "user.session_duration",
        "value": "{{user.session_end}} - {{user.session_start}}",
        "if": "ctx.user?.session_end != null && ctx.user?.session_start != null"
      }
    }
  ]
}

PUT _ingest/pipeline/order_events_pipeline
{
  "description": "Pipeline for processing order events",
  "processors": [
    {
      "set": {
        "field": "event.ingested",
        "value": "{{_ingest.timestamp}}"
      }
    },
    {
      "script": {
        "lang": "painless",
        "source": """
          if (ctx.items != null) {
            double total = 0;
            for (item in ctx.items) {
              total += item.price * item.quantity;
            }
            ctx.order.calculated_total = total;
          }
        """
      }
    }
  ]
}
```

### Kibana Canvas Workpad

```json
{
  "name": "E-commerce Real-time Dashboard",
  "pages": [
    {
      "elements": [
        {
          "id": "revenue-gauge",
          "position": {
            "left": 50,
            "top": 50,
            "width": 200,
            "height": 200,
            "angle": 0,
            "parent": null
          },
          "expression": """
            filters
            | essql
              query="SELECT SUM(total_amount) as revenue FROM \"orders-*\" WHERE \"@timestamp\" > NOW() - INTERVAL 1 HOUR"
            | metric \"Revenue\"
              metricFont={font size=48 family=\"Arial, sans-serif\" color=\"#000000\" align=\"center\"}
              labelFont={font size=14 family=\"Arial, sans-serif\" color=\"#000000\" align=\"center\"}
            | render
          """
        },
        {
          "id": "orders-chart",
          "position": {
            "left": 300,
            "top": 50,
            "width": 400,
            "height": 300,
            "angle": 0,
            "parent": null
          },
          "expression": """
            filters
            | essql
              query="SELECT DATE_TRUNC('minute', \"@timestamp\") as time, COUNT(*) as orders FROM \"orders-*\" WHERE \"@timestamp\" > NOW() - INTERVAL 1 HOUR GROUP BY DATE_TRUNC('minute', \"@timestamp\") ORDER BY time"
            | pointseries x=\"time\" y=\"orders\"
            | plot defaultStyle={seriesStyle lines=2 fill=1}
            | render
          """
        },
        {
          "id": "top-products",
          "position": {
            "left": 50,
            "top": 300,
            "width": 300,
            "height": 200,
            "angle": 0,
            "parent": null
          },
          "expression": """
            filters
            | essql
              query="SELECT product_name, SUM(quantity) as total_sold FROM \"orders-*\" WHERE \"@timestamp\" > NOW() - INTERVAL 24 HOUR GROUP BY product_name ORDER BY total_sold DESC LIMIT 10"
            | table
            | render
          """
        }
      ]
    }
  ]
}
```

## Best Practices

- Use appropriate index patterns and lifecycle management
- Implement proper mapping and field data types
- Use ingest pipelines for data transformation
- Implement proper security with X-Pack
- Use index templates for consistent mappings
- Implement proper retention policies
- Use aliases for seamless index management
- Monitor cluster health and performance
- Implement proper backup and disaster recovery
- Use appropriate shard and replica configuration
- Optimize queries and aggregations

### Index Lifecycle Management

```json
PUT _ilm/policy/ecommerce_logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "50gb",
            "max_age": "30d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "allocate": {
            "number_of_replicas": 1
          },
          "shrink": {
            "number_of_shards": 1
          }
        }
      },
      "cold": {
        "min_age": "90d",
        "actions": {
          "set_priority": {
            "priority": 0
          },
          "allocate": {
            "number_of_replicas": 0
          },
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "365d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### Security Configuration

```yaml
# elasticsearch.yml - Security settings
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: certs/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: certs/elastic-certificates.p12

xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.keystore.path: certs/elastic-certificates.p12

xpack.security.authc.realms.native.native1:
  order: 0

xpack.security.authc.realms.ldap.ldap1:
  order: 1
  url: "ldaps://ldap.example.com"
  bind_dn: "cn=elasticuser,ou=users,dc=example,dc=com"
  user_search.base_dn: "ou=users,dc=example,dc=com"
  group_search.base_dn: "ou=groups,dc=example,dc=com"
```

### Performance Optimization

```json
PUT ecommerce-logs-000001/_settings
{
  "index": {
    "refresh_interval": "30s",
    "number_of_replicas": 1,
    "translog": {
      "durability": "async",
      "sync_interval": "10s"
    },
    "merge": {
      "scheduler": {
        "max_thread_count": 1
      }
    }
  }
}

PUT _cluster/settings
{
  "transient": {
    "indices.memory.index_buffer_size": "10%",
    "indices.memory.min_index_buffer_size": "96mb"
  }
}
```

## Security Considerations

- Enable X-Pack security features
- Implement proper authentication and authorization
- Use TLS encryption for all communications
- Implement role-based access control (RBAC)
- Secure sensitive log data
- Regular security updates and patches
- Audit access and query logs
- Implement proper network segmentation
- Use encrypted connections to data sources
- Monitor for security threats and anomalies

## ELK Stack vs Other Log Analysis Tools

| Feature | ELK Stack | Splunk | Graylog | Sumo Logic |
|---------|-----------|--------|---------|------------|
| Cost | Open Source | Paid | Open Source | Paid |
| Scalability | High | High | Medium | Cloud |
| Real-time | Excellent | Excellent | Good | Excellent |
| Query Language | Lucene/ES DSL | SPL | Lucene | Custom |
| Visualization | Kibana | Built-in | Built-in | Built-in |
| Alerting | Watcher | Built-in | Built-in | Built-in |
| Learning Curve | Medium | Medium | Low | Low |

## Common Use Cases

- **Application Logging**: Centralized application logs and error tracking
- **Security Monitoring**: SIEM for threat detection and compliance
- **Infrastructure Monitoring**: Server logs, network logs, system events
- **Business Analytics**: User behavior analysis, conversion tracking
- **Compliance Auditing**: Regulatory compliance and audit trails
- **Performance Monitoring**: Application performance and bottleneck analysis
- **DevOps Monitoring**: CI/CD pipeline logs, deployment tracking
- **IoT Data Analysis**: Sensor data processing and analytics
- **E-commerce Analytics**: User journey tracking, sales analytics
- **Network Monitoring**: Firewall logs, traffic analysis, intrusion detection