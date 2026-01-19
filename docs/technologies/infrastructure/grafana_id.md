# Grafana

## Gambaran Umum

Grafana adalah platform open-source untuk monitoring dan observability yang memungkinkan Anda untuk query, visualisasi, alert, dan memahami metrik Anda tidak peduli di mana data tersebut disimpan. Platform ini menyediakan tools untuk mengubah data time-series database (TSDB) Anda menjadi grafik dan visualisasi yang indah. Grafana mendukung multiple data sources termasuk Prometheus, InfluxDB, Elasticsearch, dan banyak lainnya.

Platform ini unggul dalam membuat dashboard yang menggabungkan metrik dari multiple sources, memungkinkan monitoring komprehensif dari sistem yang kompleks. Arsitektur plugin Grafana memungkinkan kustomisasi ekstensif dan integrasi dengan berbagai data sources dan tipe visualisasi.

## Konsep Utama

- **Dashboards**: Koleksi panel yang memvisualisasikan metrik
- **Panels**: Komponen visualisasi individu (grafik, tabel, heatmap)
- **Data Sources**: Backend yang menyediakan data metrik (Prometheus, InfluxDB, dll)
- **Queries**: Ekspresi yang mengambil data dari data sources
- **Variables**: Nilai dinamis yang dapat digunakan dalam query dan panel
- **Templates**: Komponen dashboard yang dapat digunakan ulang
- **Annotations**: Event atau marker yang dilapiskan pada grafik
- **Alerts**: Notifikasi berdasarkan threshold metrik
- **Plugins**: Ekstensi yang menambahkan data sources atau tipe panel baru
- **Organizations**: Isolasi multi-tenant dalam Grafana

## Kapan Digunakan

- Membuat dashboard monitoring komprehensif
- Memvisualisasikan data time-series dari multiple sources
- Membangun dashboard business intelligence
- Monitoring dan alerting real-time
- Menganalisis metrik aplikasi dan infrastruktur
- Membuat dashboard executive untuk KPI
- Troubleshooting masalah sistem dengan data visual
- Berbagi insight monitoring di seluruh tim
- Membangun solusi monitoring kustom
- Mengintegrasikan dengan monitoring stack yang ada
- Membuat interface eksplorasi data interaktif

## Contoh

### Instalasi Grafana Dasar dengan Docker

```yaml
# docker-compose.yml - Setup Grafana
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

### Konfigurasi Data Source

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

### Model Dashboard JSON

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

### Dashboard Lanjutan dengan Variables

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

### Dashboard E-commerce Kompleks

```json
{
  "dashboard": {
    "title": "E-commerce Performance Dashboard",
    "description": "Tampilan komprehensif performa platform e-commerce",
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

### Konfigurasi Alerting

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

### Pengembangan Plugin Kustom

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

### Grafana dengan Loki untuk Log Aggregation

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

## Praktik Terbaik

- Gunakan konvensi penamaan yang konsisten untuk dashboard dan panel
- Implementasikan role dan permission user yang tepat
- Gunakan variables untuk dashboard dinamis
- Buat template dashboard yang dapat digunakan ulang
- Implementasikan hierarki alerting yang tepat
- Gunakan interval refresh yang sesuai berdasarkan volatilitas data
- Organisasikan dashboard dengan folder dan tags
- Implementasikan versioning dan backup dashboard
- Gunakan annotations untuk event penting
- Optimalkan query untuk performa
- Implementasikan autentikasi data source yang tepat

### Organisasi Dashboard

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

### Optimasi Performa

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

### Konfigurasi Keamanan

```yaml
# grafana.ini - Pengaturan keamanan
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

## Pertimbangan Keamanan

- Implementasikan autentikasi dan otorisasi yang tepat
- Gunakan HTTPS untuk semua akses Grafana
- Konfigurasi manajemen session yang tepat
- Implementasikan role-based access control (RBAC)
- Amankan koneksi data source
- Update keamanan dan patch secara regular
- Audit akses dan perubahan dashboard
- Implementasikan segmentasi jaringan yang tepat
- Gunakan manajemen secrets yang aman
- Monitor log akses Grafana

## Grafana vs Tools Visualisasi Lain

| Fitur | Grafana | Kibana | Tableau | Power BI |
|-------|---------|--------|---------|----------|
| Data Sources | Banyak | Elasticsearch | Banyak | Banyak |
| Real-time | Excellent | Good | Limited | Limited |
| Kustomisasi | Tinggi | Sedang | Tinggi | Sedang |
| Cost | Free | Free | Paid | Paid |
| Learning Curve | Sedang | Sedang | Tinggi | Sedang |
| Alerting | Built-in | Limited | Limited | Limited |
| Komunitas | Besar | Besar | Besar | Besar |

## Use Case Umum

- **Monitoring Infrastruktur**: Metrik server, performa network, health sistem
- **Monitoring Aplikasi**: Request rates, error rates, response times
- **Business Intelligence**: Tracking revenue, analytics user, dashboard KPI
- **Monitoring DevOps**: Pipeline CI/CD, tracking deployment, respons insiden
- **Monitoring Database**: Performa query, connection pools, status replikasi
- **Monitoring Network**: Penggunaan bandwidth, latency, packet loss
- **Monitoring Keamanan**: Deteksi threat, pola akses, deteksi anomali
- **Monitoring IoT**: Metrik device, data sensor, health equipment
- **Monitoring Cloud**: Metrik multi-cloud, analisis cost, utilisasi resource
- **Analisis Log**: Centralized logging dengan Loki, analisis pola error