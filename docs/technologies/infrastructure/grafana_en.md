# Grafana

## Overview

Grafana is an open-source visualization and observability platform. It connects to data sources (metrics, logs, traces), lets you build dashboards, and can evaluate alert rules based on queries. In many stacks, Grafana sits “on top of” Prometheus for metrics and a log store such as Elasticsearch or Loki for logs.

Grafana’s strength is unifying multiple signals into one UI: operational dashboards for on-call use, and shared “source of truth” views for teams. It is extensible via plugins, but most production usage stays within well-supported official data sources and panel types.

## Key concepts

- **Data source**: A backend Grafana queries (Prometheus, Elasticsearch, Loki, etc.)
- **Dashboard / panel**: The main UI building blocks (graphs, tables, stat, heatmaps)
- **Variables**: Dynamic query inputs used to filter dashboards (e.g. `$service`)
- **Annotations**: Event markers overlaid on time series (deploys, incidents)
- **Alerting**: Rules evaluated by Grafana to trigger notifications
- **Organizations / folders**: Multi-tenant and governance primitives

## When to use

- You want a **shared UI** for metrics/logs/traces across teams
- You need **dashboards** for incident response and SLO/SLA monitoring
- You need **alerting** on top of one or more data sources (or want to centralize it)

## When not to use

- You need a single-purpose charting tool and dashboards are not a requirement
- Your org cannot support dashboard governance (sprawl, inconsistent naming, unowned alerts)

## Trade-offs

- **Pros**: Works with many backends; strong dashboard UX; large ecosystem
- **Cons**: Dashboards can sprawl without conventions; alerting semantics differ by data source; query cost can become significant at scale

## Examples

### Run Grafana with Docker

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

### Provision a Prometheus data source

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

### Minimal dashboard (JSON model snippet)

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

- `docs/technologies/infrastructure/prometheus_en.md`
- `docs/technologies/infrastructure/elk-stack_en.md`

## References

- Grafana documentation: https://grafana.com/docs/
- Provisioning: https://grafana.com/docs/grafana/latest/administration/provisioning/
