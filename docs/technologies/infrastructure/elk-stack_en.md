# ELK Stack

## Overview

The ELK Stack is a log analytics stack built around **Elasticsearch**, **Logstash**, and **Kibana**. In modern Elastic terminology you’ll also see “Elastic Stack”, which often includes **Beats** (lightweight shippers) and other components. The core workflow is ingest events, normalize them, index them for search/aggregations, and visualize/explore them.

ELK is a good fit when logs are a primary signal for debugging, security investigation, and operational visibility, and you need flexible querying and aggregations over semi-structured data.

## Key components

- **Elasticsearch**: Distributed search and analytics engine (indexes documents)
- **Logstash**: Ingestion/processing pipeline (parse, enrich, transform)
- **Kibana**: UI for search, dashboards, and exploration
- **Beats / agents**: Lightweight shippers (e.g. filebeat) that send events to Logstash/Elasticsearch

## When to use

- Centralized log management and fast search across many services
- Incident response and troubleshooting (correlate errors by time/service/trace id)
- Security monitoring (SIEM-like workflows) and audit logging
- Analytics on log/event data via aggregations and dashboards

## When not to use

- Your primary need is **metrics** (consider Prometheus + Grafana)
- You need extremely cheap, long-term retention with minimal query needs
- You cannot invest in lifecycle management (ILM), mappings/schema hygiene, and query governance

## Trade-offs

- **Pros**: Powerful search + aggregations; flexible ingestion; widely used ecosystem
- **Cons**: Operational/cost complexity at scale (storage, shards, mappings); mapping mistakes are painful; high-cardinality fields can hurt performance

## Examples

### Basic stack with Docker

```yaml
version: "3.8"
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5044:5044"
      - "5000:5000"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
volumes:
  elasticsearch_data:
```

### Logstash pipeline (generic JSON events)

```ruby
input {
  beats { port => 5044 }
  tcp { port => 5000 codec => json }
}

filter {
  if [service] {
    mutate { lowercase => ["service"] }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

## Related

- `docs/technologies/infrastructure/grafana_en.md`
- `docs/technologies/infrastructure/prometheus_en.md`

## References

- Elastic Stack documentation: https://www.elastic.co/guide/index.html
- Elasticsearch mapping: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
