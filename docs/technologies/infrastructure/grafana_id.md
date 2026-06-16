# Grafana

## Overview

Grafana adalah platform open-source untuk visualisasi dan observability. Grafana terhubung ke data source (metrics, logs, traces), memungkinkan Anda membangun dashboard, dan dapat mengevaluasi alert rule berbasis query. Dalam banyak stack, Grafana berada “di atas” Prometheus untuk metrics dan log store seperti Elasticsearch atau Loki untuk logs.

Kekuatan Grafana adalah menyatukan beberapa sinyal ke satu UI: dashboard operasional untuk on-call, dan view bersama sebagai “source of truth” lintas tim. Grafana dapat diperluas dengan plugin, tetapi untuk produksi biasanya lebih aman bertahan pada data source dan panel yang didukung dengan baik.

## Key concepts

- **Data source**: Backend yang di-query Grafana (Prometheus, Elasticsearch, Loki, dll.)
- **Dashboard / panel**: Building block utama UI (graph, table, stat, heatmap)
- **Variables**: Input query dinamis untuk memfilter dashboard (misalnya `$service`)
- **Annotations**: Marker event di atas time series (deploy, insiden)
- **Alerting**: Rule yang dievaluasi Grafana untuk memicu notifikasi
- **Organizations / folders**: Primitif multi-tenant dan governance

## When to use

- Anda ingin **UI bersama** untuk metrics/logs/traces lintas tim
- Anda butuh **dashboard** untuk incident response dan monitoring SLO/SLA
- Anda butuh **alerting** di atas satu atau lebih data source (atau ingin memusatkannya)

## When not to use

- Anda hanya butuh chart sederhana dan dashboard bukan requirement
- Organisasi Anda belum siap mengelola governance dashboard (sprawl, penamaan tidak konsisten, alert tanpa owner)

## Trade-offs

- **Pros**: Mendukung banyak backend; UX dashboard bagus; ekosistem besar
- **Cons**: Dashboard bisa cepat “menyebar” tanpa konvensi; semantik alerting berbeda antar data source; biaya query dapat meningkat pada skala besar

## Examples

### Menjalankan Grafana dengan Docker

```yaml
version: "3.8"
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
volumes:
  grafana_data:
```

### Provision data source Prometheus

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### Dashboard minimal (snippet JSON model)

```json
{
  "dashboard": {
    "title": "Service Overview",
    "tags": ["service", "overview"],
    "panels": [
      {
        "title": "Request rate",
        "type": "timeseries",
        "targets": [
          { "expr": "sum(rate(app_requests_total[5m])) by (route)", "legendFormat": "{{route}}" }
        ]
      }
    ],
    "refresh": "30s"
  }
}
```

## Related

- `docs/technologies/infrastructure/prometheus_id.md`
- `docs/technologies/infrastructure/elk-stack_id.md`

## References

- Grafana documentation: https://grafana.com/docs/
- Provisioning: https://grafana.com/docs/grafana/latest/administration/provisioning/
