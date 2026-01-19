# Grafana

## Overview

Grafana is an open-source platform for monitoring and observability that allows you to query, visualize, alert on, and understand your metrics no matter where they are stored. It provides tools to turn your time-series database (TSDB) data into beautiful graphs and visualizations. Grafana supports multiple data sources including Prometheus, InfluxDB, Elasticsearch, and many others.

The platform excels at creating dashboards that bring together metrics from multiple sources, enabling comprehensive monitoring of complex systems. Grafana's plugin architecture allows for extensive customization and integration with various data sources and visualization types.

## Key Concepts

- **Dashboards**: Collections of panels that visualize metrics
- **Panels**: Individual visualization components (graphs, tables, heatmaps)
- **Data Sources**: Backends that provide metric data (Prometheus, InfluxDB, etc.)
- **Queries**: Expressions that retrieve data from data sources
- **Variables**: Dynamic values that can be used in queries and panels
- **Templates**: Reusable dashboard components
- **Annotations**: Events or markers overlaid on graphs
- **Alerts**: Notifications based on metric thresholds
- **Plugins**: Extensions that add new data sources or panel types
- **Organizations**: Multi-tenant isolation within Grafana

## When to Use

- Creating comprehensive monitoring dashboards
- Visualizing time-series data from multiple sources
- Building business intelligence dashboards
- Real-time monitoring and alerting
- Analyzing application and infrastructure metrics
- Creating executive dashboards for KPIs
- Troubleshooting system issues with visual data
- Sharing monitoring insights across teams
- Building custom monitoring solutions
- Integrating with existing monitoring stacks
- Creating interactive data exploration interfaces

## Examples

### Basic Grafana Installation with Docker

```yaml
# docker-compose.yml - Grafana setup
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring

volumes:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

### Data Source Configuration

```yaml
# provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: InfluxDB
    type: influxdb
    access: proxy
    url: http://influxdb:8086
    database: metrics
    editable: true

  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: "[logstash-]YYYY.MM.DD"
    jsonData:
      timeField: "@timestamp"
      logMessageField: "message"
      logLevelField: "level"
```

### Dashboard JSON Model

```json
{
  "dashboard": {
    "title": "E-commerce Overview",
    "tags": ["ecommerce", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 5
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### Advanced Dashboard with Variables

```json
{
  "dashboard": {
    "title": "Service Metrics",
    "tags": ["service", "metrics"],
    "templating": {
      "list": [
        {
          "name": "service",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(service)",
          "refresh": 1,
          "includeAll": false,
          "multi": false
        },
        {
          "name": "instance",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(instance, service=\"$service\")",
          "refresh": 1,
          "includeAll": true,
          "multi": true
        }
      ]
    },
    "panels": [
      {
        "title": "CPU Usage by Instance",
        "type": "bargauge",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\", instance=~\"$instance\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "table",
        "targets": [
          {
            "expr": "100 * (1 - node_memory_MemAvailable_bytes{instance=~\"$instance\"} / node_memory_MemTotal_bytes{instance=~\"$instance\"})",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": {
                "id": "byName",
                "options": "Value"
              },
              "properties": [
                {
                  "id": "unit",
                  "value": "percent"
                },
                {
                  "id": "thresholds",
                  "value": {
                    "mode": "absolute",
                    "steps": [
                      {
                        "color": "green",
                        "value": null
                      },
                      {
                        "color": "orange",
                        "value": 70
                      },
                      {
                        "color": "red",
                        "value": 90
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

### Complex E-commerce Dashboard

```json
{
  "dashboard": {
    "title": "E-commerce Performance Dashboard",
    "description": "Comprehensive view of e-commerce platform performance",
    "tags": ["ecommerce", "performance", "business"],
    "panels": [
      {
        "id": 1,
        "title": "Revenue Trend",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(order_total_amount[5m]))",
            "legendFormat": "Revenue $/min"
          }
        ],
        "yAxes": [
          {
            "unit": "currencyUSD",
            "format": "currency"
          }
        ]
      },
      {
        "id": 2,
        "title": "Order Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(orders_processed_total{status=\"success\"}[5m]) / rate(orders_processed_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "orange", "value": 95},
                {"color": "green", "value": 99}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Top Products by Sales",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (product_name) (rate(product_sales_total[1h])))",
            "legendFormat": "{{product_name}}"
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": {"id": "byName", "options": "Value"},
              "properties": [{"id": "unit", "value": "currencyUSD"}]
            }
          ]
        }
      },
      {
        "id": 4,
        "title": "User Journey Funnel",
        "type": "bargauge",
        "targets": [
          {
            "expr": "rate(page_views_total{page=\"home\"}[5m])",
            "legendFormat": "Home Page Views"
          },
          {
            "expr": "rate(product_views_total[5m])",
            "legendFormat": "Product Views"
          },
          {
            "expr": "rate(cart_additions_total[5m])",
            "legendFormat": "Cart Additions"
          },
          {
            "expr": "rate(checkout_started_total[5m])",
            "legendFormat": "Checkout Started"
          },
          {
            "expr": "rate(orders_completed_total[5m])",
            "legendFormat": "Orders Completed"
          }
        ]
      },
      {
        "id": 5,
        "title": "Geographic Sales Distribution",
        "type": "geomap",
        "targets": [
          {
            "expr": "sum by (country) (rate(order_total_amount[1h]))",
            "legendFormat": "{{country}}"
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": {"id": "byName", "options": "Value"},
              "properties": [{"id": "unit", "value": "currencyUSD"}]
            }
          ]
        }
      },
      {
        "id": 6,
        "title": "System Health Overview",
        "type": "status-history",
        "targets": [
          {
            "expr": "up{job=\"api-server\"}",
            "legendFormat": "API Server"
          },
          {
            "expr": "up{job=\"database\"}",
            "legendFormat": "Database"
          },
          {
            "expr": "up{job=\"cache\"}",
            "legendFormat": "Cache"
          },
          {
            "expr": "up{job=\"payment-gateway\"}",
            "legendFormat": "Payment Gateway"
          }
        ]
      }
    ],
    "time": {"from": "now-24h", "to": "now"},
    "refresh": "1m",
    "timepicker": {
      "refresh_intervals": ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"]
    }
  }
}
```

### Alerting Configuration

```yaml
# alerting rules in Grafana
{
  "alertRule": {
    "title": "High Error Rate",
    "condition": "C",
    "data": [
      {
        "refId": "A",
        "queryType": "",
        "relativeTimeRange": {
          "from": 600,
          "to": 0
        },
        "datasourceUid": "prometheus",
        "model": {
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
          "legendFormat": "__auto"
        }
      },
      {
        "refId": "B",
        "queryType": "",
        "relativeTimeRange": {
          "from": 600,
          "to": 0
        },
        "datasourceUid": "__expr__",
        "model": {
          "type": "reduce",
          "expression": "A",
          "reducer": "mean"
        }
      },
      {
        "refId": "C",
        "queryType": "",
        "relativeTimeRange": {
          "from": 600,
          "to": 0
        },
        "datasourceUid": "__expr__",
        "model": {
          "type": "threshold",
          "expression": "B",
          "conditions": [
            {
              "type": "query",
              "evaluator": {
                "params": [5],
                "type": "gt"
              }
            }
          ]
        }
      }
    ],
    "noDataState": "NoData",
    "execErrState": "Error",
    "for": "5m",
    "labels": {
      "severity": "warning"
    },
    "annotations": {
      "summary": "High error rate detected",
      "description": "Error rate is {{ $values.B.Value }}%"
    },
    "notification_settings": {
      "receiver": "slack-notifications"
    }
  }
}
```

### Custom Plugin Development

```javascript
// plugins/my-custom-panel/module.ts
import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'text',
      name: 'Simple text option',
      description: 'Description of panel option',
      defaultValue: 'Default value of text input option',
    })
    .addBooleanSwitch({
      path: 'showSeriesCount',
      name: 'Show series counter',
      defaultValue: false,
    });
});
```

```typescript
// plugins/my-custom-panel/SimplePanel.tsx
import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from './types';

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  return (
    <div style={{ width, height }}>
      <h2>{options.text}</h2>
      {options.showSeriesCount && (
        <p>Series count: {data.series.length}</p>
      )}
      {/* Custom visualization logic */}
    </div>
  );
};
```

### Grafana with Loki for Log Aggregation

```yaml
# docker-compose.yml - Grafana + Loki stack
version: '3.8'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - promtail_config:/etc/promtail
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_INSTALL_PLUGINS=grafana-lokiexplore-app

volumes:
  loki_data:
  promtail_config:
  grafana_data:
```

## Best Practices

- Use consistent naming conventions for dashboards and panels
- Implement proper user roles and permissions
- Use variables for dynamic dashboards
- Create reusable dashboard templates
- Implement proper alerting hierarchies
- Use appropriate refresh intervals based on data volatility
- Organize dashboards with folders and tags
- Implement dashboard versioning and backup
- Use annotations for important events
- Optimize queries for performance
- Implement proper data source authentication

### Dashboard Organization

```
📁 Dashboards/
├── 📁 Infrastructure/
│   ├── System Overview
│   ├── Network Monitoring
│   └── Database Performance
├── 📁 Applications/
│   ├── E-commerce API
│   ├── Payment Gateway
│   └── User Service
├── 📁 Business/
│   ├── Revenue Dashboard
│   ├── User Analytics
│   └── Product Performance
└── 📁 Templates/
    ├── Service Template
    └── Infrastructure Template
```

### Performance Optimization

```json
{
  "dashboard": {
    "title": "Optimized Dashboard",
    "timepicker": {
      "refresh_intervals": ["30s", "1m", "5m", "15m", "30m", "1h"]
    },
    "panels": [
      {
        "title": "Efficient Query",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (status)",
            "interval": "1m",
            "legendFormat": "{{status}}"
          }
        ],
        "cacheTimeout": "30s"
      }
    ]
  }
}
```

### Security Configuration

```yaml
# grafana.ini - Security settings
[security]
admin_user = admin
admin_password = ${GF_SECURITY_ADMIN_PASSWORD}

[auth]
disable_login_form = false
disable_signout_menu = false

[auth.anonymous]
enabled = false

[auth.basic]
enabled = false

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
auto_sign_up = true

[database]
type = postgres
host = postgres:5432
name = grafana
user = grafana
password = ${GF_DATABASE_PASSWORD}
ssl_mode = require
```

## Security Considerations

- Implement proper authentication and authorization
- Use HTTPS for all Grafana access
- Configure proper session management
- Implement role-based access control (RBAC)
- Secure data source connections
- Regular security updates and patches
- Audit dashboard access and changes
- Implement proper network segmentation
- Use secure secrets management
- Monitor Grafana access logs

## Grafana vs Other Visualization Tools

| Feature | Grafana | Kibana | Tableau | Power BI |
|---------|---------|--------|---------|----------|
| Data Sources | Many | Elasticsearch | Many | Many |
| Real-time | Excellent | Good | Limited | Limited |
| Customization | High | Medium | High | Medium |
| Cost | Free | Free | Paid | Paid |
| Learning Curve | Medium | Medium | High | Medium |
| Alerting | Built-in | Limited | Limited | Limited |
| Community | Large | Large | Large | Large |

## Common Use Cases

- **Infrastructure Monitoring**: Server metrics, network performance, system health
- **Application Monitoring**: Request rates, error rates, response times
- **Business Intelligence**: Revenue tracking, user analytics, KPI dashboards
- **DevOps Monitoring**: CI/CD pipelines, deployment tracking, incident response
- **Database Monitoring**: Query performance, connection pools, replication status
- **Network Monitoring**: Bandwidth usage, latency, packet loss
- **Security Monitoring**: Threat detection, access patterns, anomaly detection
- **IoT Monitoring**: Device metrics, sensor data, equipment health
- **Cloud Monitoring**: Multi-cloud metrics, cost analysis, resource utilization
- **Log Analysis**: Centralized logging with Loki, error pattern analysis