# Google BigQuery

## Gambaran Umum

Google BigQuery adalah data warehouse fully-managed dan serverless yang memungkinkan super-fast SQL queries menggunakan processing power dari infrastruktur Google. BigQuery dapat menangani petabytes data dan menyediakan kemampuan analytics real-time dengan operational overhead minimal.

## Konsep Utama

### Arsitektur
- **Datasets**: Container untuk tables dan views
- **Tables**: Penyimpanan data terstruktur dengan schemas
- **Views**: Tabel virtual berdasarkan SQL queries
- **Materialized Views**: Views yang sudah di-pre-compute untuk performa
- **Partitions**: Organisasi data berdasarkan date/time atau range
- **Clustering**: Sorting data untuk optimasi query

### Data Ingestion
- **Batch Loading**: Import data dari Cloud Storage, file lokal
- **Streaming Inserts**: Ingest data real-time via API
- **Data Transfer Service**: Pergerakan data otomatis dari berbagai sumber
- **External Tables**: Query data tanpa import

### Query Engine
- **Standard SQL**: ANSI SQL dengan ekstensi BigQuery
- **User-Defined Functions**: Fungsi kustom JavaScript atau SQL
- **Scripting**: Multi-statement queries dengan variabel
- **Cached Results**: Caching hasil query otomatis
- **Query History**: Track dan analisis performa query

## Kapan Digunakan

- Analytics dan business intelligence skala besar
- Dashboard dan reporting real-time
- Training dan prediction model machine learning
- Analisis log dan monitoring
- Proses data warehousing dan ETL
- Query analitik ad-hoc
- Integrasi dengan BI tools dan platform visualisasi
- Pemrosesan dan analytics data IoT
- Analisis perilaku customer dan personalisasi
- Deteksi fraud dan analisis risiko

## Contoh

### Operasi Tabel Dasar

```sql
-- Create dataset
CREATE SCHEMA ecommerce_analytics
OPTIONS (
  location = 'US',
  description = 'E-commerce analytics and reporting'
);

-- Create partitioned table untuk orders
CREATE TABLE ecommerce_analytics.orders (
  order_id STRING,
  customer_id STRING,
  order_date DATE,
  total_amount NUMERIC(10,2),
  status STRING,
  items ARRAY<STRUCT<product_id STRING, quantity INT64, price NUMERIC(10,2)>>,
  shipping_address STRUCT<street STRING, city STRING, state STRING, zip_code STRING>,
  created_at TIMESTAMP
)
PARTITION BY DATE(order_date)
CLUSTER BY customer_id, status
OPTIONS (
  description = 'Customer orders dengan partitioning dan clustering'
);

-- Insert sample data
INSERT INTO ecommerce_analytics.orders VALUES
('ORD-001', 'CUST-123', '2024-01-15', 299.99, 'completed',
 [STRUCT('PROD-001', 2, 149.99), STRUCT('PROD-002', 1, 0.01)],
 STRUCT('123 Main St', 'Anytown', 'CA', '12345'),
 '2024-01-15 10:30:00 UTC');

-- Create view untuk active customers
CREATE VIEW ecommerce_analytics.active_customers AS
SELECT
  customer_id,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_spent,
  MAX(order_date) as last_order_date,
  AVG(total_amount) as avg_order_value
FROM ecommerce_analytics.orders
WHERE status = 'completed'
  AND order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY customer_id
HAVING total_orders >= 2;
```

### Query Analytics Advanced

```sql
-- Analisis segmentasi customer
WITH customer_segments AS (
  SELECT
    customer_id,
    total_spent,
    total_orders,
    CASE
      WHEN total_spent >= 1000 THEN 'High Value'
      WHEN total_spent >= 500 THEN 'Medium Value'
      WHEN total_spent >= 100 THEN 'Low Value'
      ELSE 'New Customer'
    END as segment
  FROM ecommerce_analytics.active_customers
),
segment_summary AS (
  SELECT
    segment,
    COUNT(*) as customer_count,
    AVG(total_spent) as avg_spent,
    AVG(total_orders) as avg_orders,
    SUM(total_spent) as total_revenue
  FROM customer_segments
  GROUP BY segment
)
SELECT
  segment,
  customer_count,
  ROUND(avg_spent, 2) as avg_spent,
  ROUND(avg_orders, 2) as avg_orders,
  ROUND(total_revenue, 2) as total_revenue,
  ROUND(100.0 * customer_count / SUM(customer_count) OVER (), 2) as percentage
FROM segment_summary
ORDER BY total_revenue DESC;

-- Analisis performa produk
SELECT
  product_id,
  product_name,
  category,
  SUM(quantity) as total_sold,
  SUM(quantity * price) as total_revenue,
  AVG(price) as avg_price,
  COUNT(DISTINCT order_id) as order_count,
  COUNT(DISTINCT customer_id) as unique_customers,
  ROUND(SUM(quantity * price) / SUM(SUM(quantity * price)) OVER (PARTITION BY category), 4) as category_share
FROM (
  SELECT
    order_id,
    customer_id,
    item.product_id,
    item.quantity,
    item.price,
    p.name as product_name,
    p.category
  FROM ecommerce_analytics.orders o,
  UNNEST(items) as item
  LEFT JOIN ecommerce_analytics.products p ON item.product_id = p.product_id
  WHERE status = 'completed'
)
GROUP BY product_id, product_name, category
ORDER BY total_revenue DESC
LIMIT 20;
```

### Streaming Data Real-time

```python
# Streaming inserts BigQuery untuk analytics real-time
from google.cloud import bigquery
import json
from datetime import datetime

class OrderAnalyticsStreamer:
    def __init__(self, project_id, dataset_id):
        self.client = bigquery.Client(project=project_id)
        self.dataset_id = dataset_id
        self.table_id = f"{project_id}.{dataset_id}.order_events"

    def stream_order_event(self, order_data):
        """Stream event order ke BigQuery"""
        rows_to_insert = [{
            'order_id': order_data['order_id'],
            'customer_id': order_data['customer_id'],
            'event_type': order_data['event_type'],
            'event_data': json.dumps(order_data),
            'timestamp': datetime.utcnow().isoformat(),
            'processed_at': bigquery.AutoTimestamp()
        }]

        errors = self.client.insert_rows_json(self.table_id, rows_to_insert)
        if errors:
            print(f"Errors terjadi: {errors}")
        else:
            print(f"Event order di-stream: {order_data['order_id']}")

    def create_order_events_table(self):
        """Create table untuk order events"""
        schema = [
            bigquery.SchemaField("order_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("customer_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("event_type", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("event_data", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("processed_at", "TIMESTAMP", mode="NULLABLE"),
        ]

        table = bigquery.Table(self.table_id, schema=schema)
        table.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="timestamp"
        )

        table.clustering_fields = ["customer_id", "event_type"]

        table = self.client.create_table(table)
        print(f"Table dibuat {table.table_id}")

# Usage example
streamer = OrderAnalyticsStreamer("my-project", "ecommerce_analytics")

# Stream event order created
order_created = {
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'event_type': 'order_created',
    'total_amount': 299.99,
    'items': ['PROD-001', 'PROD-002']
}
streamer.stream_order_event(order_created)

# Stream event order shipped
order_shipped = {
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'event_type': 'order_shipped',
    'tracking_number': 'TRK123456789',
    'carrier': 'FedEx'
}
streamer.stream_order_event(order_shipped)
```

### Data Transfer dan ETL

```python
# Automated data transfer dari Cloud Storage ke BigQuery
from google.cloud import bigquery, storage
import pandas as pd

class DataPipeline:
    def __init__(self, project_id):
        self.project_id = project_id
        self.bq_client = bigquery.Client()
        self.storage_client = storage.Client()

    def load_csv_from_gcs(self, bucket_name, blob_name, dataset_id, table_id):
        """Load data CSV dari Cloud Storage ke BigQuery"""
        uri = f"gs://{bucket_name}/{blob_name}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,
            autodetect=True,
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        )

        table_ref = f"{self.project_id}.{dataset_id}.{table_id}"
        load_job = self.bq_client.load_table_from_uri(
            uri, table_ref, job_config=job_config
        )

        load_job.result()  # Tunggu job selesai
        print(f"Loaded {load_job.output_rows} rows ke {table_ref}")

    def export_query_results(self, query, bucket_name, blob_name):
        """Export hasil query ke Cloud Storage"""
        query_job = self.bq_client.query(query)
        results = query_job.result()

        # Convert ke DataFrame
        df = results.to_dataframe()

        # Save ke Cloud Storage sebagai CSV
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.upload_from_string(df.to_csv(index=False), content_type='text/csv')

        print(f"Hasil diekspor ke gs://{bucket_name}/{blob_name}")

    def create_ml_model(self, dataset_id, model_name):
        """Create model BigQuery ML untuk prediksi churn customer"""
        create_model_query = f"""
        CREATE OR REPLACE MODEL `{self.project_id}.{dataset_id}.{model_name}`
        OPTIONS (
          model_type='logistic_reg',
          input_label_cols=['churned'],
          data_split_method='auto_split'
        ) AS
        SELECT
          customer_id,
          total_orders,
          total_spent,
          days_since_last_order,
          avg_order_value,
          churned
        FROM `{self.project_id}.{dataset_id}.customer_features`
        """

        query_job = self.bq_client.query(create_model_query)
        query_job.result()
        print(f"Model ML dibuat: {model_name}")

# Usage
pipeline = DataPipeline("my-ecommerce-project")

# Load data customer
pipeline.load_csv_from_gcs(
    "ecommerce-data-bucket",
    "customers/2024-01-15/customers.csv",
    "ecommerce_analytics",
    "customers"
)

# Export laporan sales
sales_query = """
SELECT
  DATE(order_date) as date,
  COUNT(*) as orders,
  SUM(total_amount) as revenue,
  AVG(total_amount) as avg_order_value
FROM ecommerce_analytics.orders
WHERE order_date >= '2024-01-01'
GROUP BY DATE(order_date)
ORDER BY date
"""

pipeline.export_query_results(
    sales_query,
    "ecommerce-reports",
    "daily_sales_2024.csv"
)

# Create model ML
pipeline.create_ml_model("ecommerce_analytics", "churn_prediction_model")
```

### Konfigurasi Terraform

```hcl
# Konfigurasi dataset BigQuery
resource "google_bigquery_dataset" "ecommerce_analytics" {
  dataset_id    = "ecommerce_analytics"
  friendly_name = "E-commerce Analytics"
  description   = "Dataset untuk analytics dan reporting e-commerce"
  location      = "US"

  labels = {
    environment = "production"
    team        = "data"
  }
}

# Tabel orders dengan partitioning dan clustering
resource "google_bigquery_table" "orders" {
  dataset_id = google_bigquery_dataset.ecommerce_analytics.dataset_id
  table_id   = "orders"

  time_partitioning {
    type  = "DAY"
    field = "order_date"
  }

  clustering = ["customer_id", "status"]

  schema = <<EOF
[
  {
    "name": "order_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "customer_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "order_date",
    "type": "DATE",
    "mode": "REQUIRED"
  },
  {
    "name": "total_amount",
    "type": "NUMERIC",
    "mode": "REQUIRED"
  },
  {
    "name": "status",
    "type": "STRING",
    "mode": "NULLABLE"
  }
]
EOF
}

# Scheduled query untuk laporan harian
resource "google_bigquery_data_transfer_config" "daily_sales_report" {
  display_name   = "Daily Sales Report"
  data_source_id = "scheduled_query"
  schedule       = "every day 06:00"
  destination_dataset_id = google_bigquery_dataset.ecommerce_analytics.dataset_id

  params = {
    query = <<EOF
    SELECT
      DATE(order_date) as date,
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM `${google_bigquery_dataset.ecommerce_analytics.dataset_id}.orders`
    WHERE order_date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
    GROUP BY DATE(order_date)
    EOF
  }
}
```

## Praktik Terbaik

- Gunakan partitioning dan clustering untuk performa query
- Optimalkan queries dengan indexing dan struktur data yang proper
- Gunakan tipe data dan kompresi yang sesuai
- Implementasikan kontrol akses yang proper dengan IAM
- Monitor biaya dan performa query
- Gunakan cached results ketika memungkinkan
- Implementasikan error handling dan retry logic yang proper
- Gunakan materialized views untuk data yang sering diakses
- Schedule query mahal selama off-peak hours
- Audit dan optimalkan schema tabel secara regular
- Gunakan format storage yang sesuai (Parquet, ORC) untuk dataset besar

### Optimasi Performa

```sql
-- Gunakan fungsi approximate untuk dataset besar
SELECT
  APPROX_COUNT_DISTINCT(customer_id) as unique_customers,
  APPROX_TOP_COUNT(product_id, 10) as top_products
FROM ecommerce_analytics.order_items;

-- Optimalkan JOINs dengan ordering yang proper
SELECT
  o.order_id,
  c.customer_name,
  o.total_amount
FROM ecommerce_analytics.orders o
INNER JOIN ecommerce_analytics.customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';

-- Gunakan window functions secara efisien
SELECT
  product_id,
  sales_rank,
  total_sales,
  PERCENT_RANK() OVER (ORDER BY total_sales DESC) as percentile
FROM (
  SELECT
    product_id,
    SUM(quantity * price) as total_sales,
    RANK() OVER (ORDER BY SUM(quantity * price) DESC) as sales_rank
  FROM ecommerce_analytics.order_items
  GROUP BY product_id
) ranked_products;
```

### Manajemen Biaya

```bash
# Monitor biaya query
bq show --format=prettyjson --job_id=your-job-id

# Setup billing alerts
gcloud alpha billing budgets create bigquery-budget \
  --billing-account=123456-789012-345678 \
  --display-name="BigQuery Budget" \
  --budget-amount=5000 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100

# Gunakan dry-run untuk estimasi biaya
bq query --dry_run --format=prettyjson 'SELECT * FROM ecommerce_analytics.orders LIMIT 1000'

# Optimalkan biaya storage dengan partitioning
bq update --time_partitioning_type=DAY ecommerce_analytics.orders
```

## Pertimbangan Keamanan

- Implementasikan IAM roles dan permissions yang proper
- Gunakan customer-managed encryption keys (CMEK)
- Aktifkan audit logging untuk compliance
- Gunakan VPC Service Controls untuk keamanan jaringan
- Implementasikan klasifikasi data dan labeling
- Gunakan authorized views untuk berbagi data
- Aktifkan logging dan monitoring query
- Implementasikan kontrol akses yang proper untuk datasets
- Gunakan service accounts dengan permissions minimal yang diperlukan
- Audit dan review pola akses secara regular

## BigQuery vs Platform Analytics Lain

| Fitur | BigQuery | Redshift | Snowflake | Athena |
|-------|----------|----------|-----------|--------|
| Serverless | Ya | Tidak | Ya | Ya |
| SQL Support | Standard SQL | PostgreSQL | Standard SQL | Standard SQL |
| Scaling | Automatic | Manual | Automatic | Automatic |
| Storage | Decoupled | Coupled | Decoupled | Decoupled |
| ML Built-in | Ya | Tidak | Ya | Tidak |
| Real-time | Streaming | Limited | Limited | Batch |
| Cost Model | Per TB processed | Per hour | Per TB processed | Per TB processed |

## Use Case Umum

- **Business Intelligence**: Dashboard dan executive reporting
- **Customer Analytics**: Segmentasi dan personalisasi
- **Deteksi Fraud**: Deteksi anomaly real-time
- **Sistem Rekomendasi**: Collaborative filtering
- **Log Analysis**: Monitoring aplikasi terpusat
- **IoT Analytics**: Pemrosesan data sensor dan insights
- **Financial Reporting**: Compliance regulasi dan auditing
- **Marketing Analytics**: Performa campaign dan ROI analysis
- **Supply Chain**: Optimasi inventory dan demand forecasting
- **Product Analytics**: Analisis perilaku user dan penggunaan fitur