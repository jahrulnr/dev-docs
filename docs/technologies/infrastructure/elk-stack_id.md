# ELK Stack

## Gambaran Umum

ELK Stack adalah stack analisis log yang dibangun dari **Elasticsearch**, **Logstash**, dan **Kibana**. Dalam terminologi Elastic modern, Anda juga akan melihat istilah “Elastic Stack”, yang sering mencakup **Beats** (shipper ringan) dan komponen lainnya. Alur intinya adalah ingest event, normalisasi, index untuk search/aggregations, lalu visualisasi/eksplorasi.

ELK cocok ketika log adalah sinyal utama untuk debugging, investigasi keamanan, dan visibilitas operasional, dan Anda butuh query + aggregations yang fleksibel pada data semi-terstruktur.

## Key components

- **Elasticsearch**: Distributed search dan analytics engine (mengindeks dokumen)
- **Logstash**: Pipeline ingest/pemrosesan (parse, enrich, transform)
- **Kibana**: UI untuk search, dashboard, dan eksplorasi
- **Beats / agents**: Shipper ringan (misalnya filebeat) yang mengirim event ke Logstash/Elasticsearch

## When to use

- Centralized log management dan pencarian cepat lintas banyak service
- Incident response dan troubleshooting (korelasi error berdasarkan waktu/service/trace id)
- Security monitoring (workflow mirip SIEM) dan audit logging
- Analitik pada data log/event melalui aggregations dan dashboard

## When not to use

- Kebutuhan utama Anda adalah **metrics** (pertimbangkan Prometheus + Grafana)
- Anda butuh retention sangat murah untuk jangka panjang dengan kebutuhan query minimal
- Anda belum siap berinvestasi pada lifecycle management (ILM), mapping/schema hygiene, dan governance query

## Trade-offs

- **Pros**: Search + aggregations kuat; ingest fleksibel; ekosistem luas
- **Cons**: Kompleksitas operasional dan cost di skala besar (storage, shards, mappings); kesalahan mapping sulit diperbaiki; field high-cardinality bisa menurunkan performa

## Examples

### Stack dasar dengan Docker

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

### Pipeline Logstash (event JSON generik)

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

- `docs/technologies/infrastructure/grafana_id.md`
- `docs/technologies/infrastructure/prometheus_id.md`

## References

- Elastic Stack documentation: https://www.elastic.co/guide/index.html
- Elasticsearch mapping: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
