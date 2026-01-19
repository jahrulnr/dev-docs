# Google BigQuery

## Overview

Google BigQuery is a fully-managed, serverless data warehouse that enables super-fast SQL queries using the processing power of Google's infrastructure. It can handle petabytes of data and provides real-time analytics capabilities with minimal operational overhead.

## Key Concepts

### Architecture
- **Datasets**: Containers for tables and views
- **Tables**: Structured data storage with schemas
- **Views**: Virtual tables based on SQL queries
- **Materialized Views**: Pre-computed views for performance
- **Partitions**: Data organization by date/time or range
- **Clustering**: Data sorting for query optimization

### Data Ingestion
- **Batch Loading**: Import data from Cloud Storage, local files
- **Streaming Inserts**: Real-time data ingestion via API
- **Data Transfer Service**: Automated data movement from various sources
- **External Tables**: Query data without importing

### Query Engine
- **Standard SQL**: ANSI SQL with BigQuery extensions
- **User-Defined Functions**: Custom JavaScript or SQL functions
- **Scripting**: Multi-statement queries with variables
- **Cached Results**: Automatic query result caching
- **Query History**: Track and analyze query performance

## When to Use

- Large-scale data analytics and business intelligence
- Real-time dashboards and reporting
- Machine learning model training and prediction
- Log analysis and monitoring
- Data warehousing and ETL processes
- Ad-hoc analytical queries
- Integration with BI tools and visualization platforms
- IoT data processing and analytics
- Customer behavior analysis and personalization
- Fraud detection and risk analysis

## Examples

### Basic Table Operations

```sql
-- Create dataset
CREATE SCHEMA ecommerce_analytics
OPTIONS (
  location = 'US',
  description = 'E-commerce analytics and reporting'
);

-- Create partitioned table for orders
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
  description = 'Customer orders with partitioning and clustering'
);

-- Insert sample data
INSERT INTO ecommerce_analytics.orders VALUES
('ORD-001', 'CUST-123', '2024-01-15', 299.99, 'completed',
 [STRUCT('PROD-001', 2, 149.99), STRUCT('PROD-002', 1, 0.01)],
 STRUCT('123 Main St', 'Anytown', 'CA', '12345'),
 '2024-01-15 10:30:00 UTC');

-- Create view for active customers
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

### Advanced Analytics Queries

```sql
-- Customer segmentation analysis
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

-- Product performance analysis
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

### Real-time Data Streaming

```python
# BigQuery streaming inserts for real-time analytics
from google.cloud import bigquery
import json
from datetime import datetime

class OrderAnalyticsStreamer:
    def __init__(self, project_id, dataset_id):
        self.client = bigquery.Client(project=project_id)
        self.dataset_id = dataset_id
        self.table_id = f"{project_id}.{dataset_id}.order_events"

    def stream_order_event(self, order_data):
        """Stream order event to BigQuery"""
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
            print(f"Errors occurred: {errors}")
        else:
            print(f"Order event streamed: {order_data['order_id']}")

    def create_order_events_table(self):
        """Create table for order events"""
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
        print(f"Created table {table.table_id}")

# Usage example
streamer = OrderAnalyticsStreamer("my-project", "ecommerce_analytics")

# Stream order created event
order_created = {
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'event_type': 'order_created',
    'total_amount': 299.99,
    'items': ['PROD-001', 'PROD-002']
}
streamer.stream_order_event(order_created)

# Stream order shipped event
order_shipped = {
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'event_type': 'order_shipped',
    'tracking_number': 'TRK123456789',
    'carrier': 'FedEx'
}
streamer.stream_order_event(order_shipped)
```

### Data Transfer and ETL

```python
# Automated data transfer from Cloud Storage to BigQuery
from google.cloud import bigquery, storage
import pandas as pd

class DataPipeline:
    def __init__(self, project_id):
        self.project_id = project_id
        self.bq_client = bigquery.Client()
        self.storage_client = storage.Client()

    def load_csv_from_gcs(self, bucket_name, blob_name, dataset_id, table_id):
        """Load CSV data from Cloud Storage to BigQuery"""
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

        load_job.result()  # Wait for the job to complete
        print(f"Loaded {load_job.output_rows} rows into {table_ref}")

    def export_query_results(self, query, bucket_name, blob_name):
        """Export query results to Cloud Storage"""
        query_job = self.bq_client.query(query)
        results = query_job.result()

        # Convert to DataFrame
        df = results.to_dataframe()

        # Save to Cloud Storage as CSV
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.upload_from_string(df.to_csv(index=False), content_type='text/csv')

        print(f"Exported results to gs://{bucket_name}/{blob_name}")

    def create_ml_model(self, dataset_id, model_name):
        """Create BigQuery ML model for customer churn prediction"""
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
        print(f"Created ML model: {model_name}")

# Usage
pipeline = DataPipeline("my-ecommerce-project")

# Load customer data
pipeline.load_csv_from_gcs(
    "ecommerce-data-bucket",
    "customers/2024-01-15/customers.csv",
    "ecommerce_analytics",
    "customers"
)

# Export sales report
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

# Create ML model
pipeline.create_ml_model("ecommerce_analytics", "churn_prediction_model")
```

### Terraform Configuration

```hcl
# BigQuery dataset configuration
resource "google_bigquery_dataset" "ecommerce_analytics" {
  dataset_id    = "ecommerce_analytics"
  friendly_name = "E-commerce Analytics"
  description   = "Dataset for e-commerce analytics and reporting"
  location      = "US"

  labels = {
    environment = "production"
    team        = "data"
  }
}

# Orders table with partitioning and clustering
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

# Scheduled query for daily reports
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

## Best Practices

- Use partitioning and clustering for query performance
- Optimize queries with proper indexing and data structures
- Use appropriate data types and compression
- Implement proper access controls with IAM
- Monitor query costs and performance
- Use cached results when possible
- Implement proper error handling and retry logic
- Use materialized views for frequently accessed data
- Schedule expensive queries during off-peak hours
- Regularly audit and optimize table schemas
- Use appropriate storage formats (Parquet, ORC) for large datasets

### Performance Optimization

```sql
-- Use approximate functions for large datasets
SELECT
  APPROX_COUNT_DISTINCT(customer_id) as unique_customers,
  APPROX_TOP_COUNT(product_id, 10) as top_products
FROM ecommerce_analytics.order_items;

-- Optimize JOINs with proper ordering
SELECT
  o.order_id,
  c.customer_name,
  o.total_amount
FROM ecommerce_analytics.orders o
INNER JOIN ecommerce_analytics.customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';

-- Use window functions efficiently
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

### Cost Management

```bash
# Monitor query costs
bq show --format=prettyjson --job_id=your-job-id

# Set up billing alerts
gcloud alpha billing budgets create bigquery-budget \
  --billing-account=123456-789012-345678 \
  --display-name="BigQuery Budget" \
  --budget-amount=5000 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100

# Use dry-run to estimate costs
bq query --dry_run --format=prettyjson 'SELECT * FROM ecommerce_analytics.orders LIMIT 1000'

# Optimize storage costs with partitioning
bq update --time_partitioning_type=DAY ecommerce_analytics.orders
```

## Security Considerations

- Implement proper IAM roles and permissions
- Use customer-managed encryption keys (CMEK)
- Enable audit logging for compliance
- Use VPC Service Controls for network security
- Implement data classification and labeling
- Use authorized views for data sharing
- Enable query logging and monitoring
- Implement proper access controls for datasets
- Use service accounts with minimal required permissions
- Regularly audit and review access patterns

## BigQuery vs Other Analytics Platforms

| Feature | BigQuery | Redshift | Snowflake | Athena |
|---------|----------|----------|-----------|--------|
| Serverless | Yes | No | Yes | Yes |
| SQL Support | Standard SQL | PostgreSQL | Standard SQL | Standard SQL |
| Scaling | Automatic | Manual | Automatic | Automatic |
| Storage | Decoupled | Coupled | Decoupled | Decoupled |
| ML Built-in | Yes | No | Yes | No |
| Real-time | Streaming | Limited | Limited | Batch |
| Cost Model | Per TB processed | Per hour | Per TB processed | Per TB processed |

## Common Use Cases

- **Business Intelligence**: Dashboards and executive reporting
- **Customer Analytics**: Segmentation and personalization
- **Fraud Detection**: Real-time anomaly detection
- **Recommendation Systems**: Collaborative filtering
- **Log Analysis**: Centralized application monitoring
- **IoT Analytics**: Sensor data processing and insights
- **Financial Reporting**: Regulatory compliance and auditing
- **Marketing Analytics**: Campaign performance and ROI analysis
- **Supply Chain**: Inventory optimization and demand forecasting
- **Product Analytics**: User behavior and feature usage analysis