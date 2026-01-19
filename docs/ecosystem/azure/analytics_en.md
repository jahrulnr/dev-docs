# Azure Analytics Services

## Overview

Azure Analytics provides a comprehensive suite of big data analytics, data warehousing, real-time analytics, and business intelligence tools that enable organizations to extract insights from massive volumes of data. These services support everything from traditional data warehousing to modern data lake analytics and real-time streaming.

## Key Concepts

### Core Services
- **Azure Synapse Analytics**: Unified analytics service combining big data and data warehousing
- **Azure Data Lake Storage**: Scalable data lake storage optimized for big data analytics
- **Azure Databricks**: Apache Spark-based analytics platform for big data processing
- **Azure Stream Analytics**: Real-time stream processing and analytics
- **Azure Analysis Services**: Enterprise-grade BI semantic modeling
- **Azure HDInsight**: Managed Hadoop, Spark, and other open-source analytics frameworks

### Data Processing Patterns
- **Batch Processing**: Process large volumes of data in scheduled batches
- **Stream Processing**: Real-time processing of continuous data streams
- **Interactive Analytics**: Ad-hoc querying and exploration of data
- **Machine Learning**: Advanced analytics and predictive modeling
- **Business Intelligence**: Dashboards, reports, and data visualization

### Data Architecture
- **Data Lakes**: Centralized repository for structured and unstructured data
- **Data Warehouses**: Optimized for analytical queries and reporting
- **Lakehouse Architecture**: Combines best of data lakes and warehouses
- **Real-time Analytics**: Streaming data processing and immediate insights

## When to Use

- **Azure Synapse Analytics**: Enterprise data warehousing, big data analytics, unified analytics
- **Azure Databricks**: Data engineering, machine learning, collaborative analytics
- **Azure Stream Analytics**: IoT analytics, real-time dashboards, fraud detection
- **Azure Analysis Services**: Power BI integration, complex analytical models
- **Azure HDInsight**: Hadoop/Spark workloads, custom analytics frameworks
- **Azure Data Lake Storage**: Big data storage, data lake analytics

## Examples

### Azure Synapse Analytics

```bash
# Create Synapse workspace
az synapse workspace create \
  --name ecommerce-synapse \
  --resource-group ecommerce-rg \
  --storage-account ecommercestorage \
  --file-system synapse-data \
  --sql-admin-login-user synapseadmin \
  --sql-admin-login-password "ComplexPassword123!" \
  --location eastus

# Create dedicated SQL pool
az synapse sql pool create \
  --resource-group ecommerce-rg \
  --workspace-name ecommerce-synapse \
  --name salesdw \
  --performance-level DW1000c

# Create Apache Spark pool
az synapse spark pool create \
  --name sparkpool \
  --workspace-name ecommerce-synapse \
  --resource-group ecommerce-rg \
  --node-count 3 \
  --node-size Small \
  --spark-version 3.2

# Load data from Azure Storage
az synapse dataset create \
  --workspace-name ecommerce-synapse \
  --name product-data \
  --linked-service-name storage-linked-service \
  --type DelimitedText \
  --properties '{
    "location": {
      "type": "AzureBlobStorageLocation",
      "container": "product-data",
      "fileName": "products.csv"
    },
    "columnDelimiter": ",",
    "encodingName": "UTF-8"
  }'
```

```sql
-- Create external table for data lake access
CREATE EXTERNAL TABLE [dbo].[ProductSales]
(
    [ProductID] int,
    [ProductName] nvarchar(100),
    [Category] nvarchar(50),
    [Price] decimal(10,2),
    [SalesDate] datetime2,
    [Quantity] int,
    [TotalAmount] decimal(10,2),
    [CustomerID] int
)
WITH (
    LOCATION = '/raw/product-sales/',
    DATA_SOURCE = [AzureDataLakeStorage],
    FILE_FORMAT = [CSVFormat]
);

-- Create dimension table
CREATE TABLE [dbo].[DimProduct]
WITH (
    DISTRIBUTION = HASH([ProductID]),
    CLUSTERED COLUMNSTORE INDEX
)
AS
SELECT DISTINCT
    ProductID,
    ProductName,
    Category,
    Price
FROM [dbo].[ProductSales];

-- Create fact table
CREATE TABLE [dbo].[FactSales]
WITH (
    DISTRIBUTION = HASH([ProductID]),
    CLUSTERED COLUMNSTORE INDEX,
    PARTITION (
        SalesDate RANGE RIGHT FOR VALUES (
            '2023-01-01', '2023-04-01', '2023-07-01', '2023-10-01', '2024-01-01'
        )
    )
)
AS
SELECT
    ProductID,
    CustomerID,
    SalesDate,
    Quantity,
    TotalAmount,
    YEAR(SalesDate) AS SalesYear,
    MONTH(SalesDate) AS SalesMonth
FROM [dbo].[ProductSales];

-- Sales analysis query
SELECT
    dp.Category,
    dp.ProductName,
    SUM(fs.TotalAmount) AS TotalSales,
    SUM(fs.Quantity) AS TotalQuantity,
    AVG(fs.TotalAmount / fs.Quantity) AS AvgPrice,
    COUNT(DISTINCT fs.CustomerID) AS UniqueCustomers
FROM [dbo].[FactSales] fs
JOIN [dbo].[DimProduct] dp ON fs.ProductID = dp.ProductID
WHERE fs.SalesDate >= '2024-01-01'
GROUP BY dp.Category, dp.ProductName
ORDER BY TotalSales DESC;

-- Customer segmentation analysis
WITH CustomerStats AS (
    SELECT
        CustomerID,
        SUM(TotalAmount) AS TotalSpent,
        COUNT(*) AS OrderCount,
        AVG(TotalAmount) AS AvgOrderValue,
        MAX(SalesDate) AS LastOrderDate,
        DATEDIFF(day, MIN(SalesDate), MAX(SalesDate)) AS CustomerLifespan
    FROM [dbo].[FactSales]
    GROUP BY CustomerID
)
SELECT
    CASE
        WHEN TotalSpent >= 1000 THEN 'High Value'
        WHEN TotalSpent >= 500 THEN 'Medium Value'
        ELSE 'Low Value'
    END AS CustomerSegment,
    COUNT(*) AS CustomerCount,
    AVG(TotalSpent) AS AvgTotalSpent,
    AVG(OrderCount) AS AvgOrderCount,
    AVG(AvgOrderValue) AS AvgOrderValue
FROM CustomerStats
GROUP BY
    CASE
        WHEN TotalSpent >= 1000 THEN 'High Value'
        WHEN TotalSpent >= 500 THEN 'Medium Value'
        ELSE 'Low Value'
    END;
```

```python
# PySpark analytics in Azure Synapse
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import logging

# Initialize Spark session
spark = SparkSession.builder \
    .appName("EcommerceAnalytics") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .getOrCreate()

logger = logging.getLogger(__name__)

def load_sales_data():
    """Load sales data from data lake"""
    try:
        # Define schema
        sales_schema = StructType([
            StructField("order_id", StringType(), True),
            StructField("customer_id", StringType(), True),
            StructField("product_id", StringType(), True),
            StructField("product_name", StringType(), True),
            StructField("category", StringType(), True),
            StructField("price", DoubleType(), True),
            StructField("quantity", IntegerType(), True),
            StructField("order_date", DateType(), True),
            StructField("total_amount", DoubleType(), True)
        ])

        # Load data from data lake
        sales_df = spark.read \
            .format("csv") \
            .option("header", "true") \
            .schema(sales_schema) \
            .load("abfss://sales-data@ecommercestorage.dfs.core.windows.net/raw/")

        logger.info(f"Loaded {sales_df.count()} sales records")
        return sales_df

    except Exception as e:
        logger.error(f"Error loading sales data: {str(e)}")
        raise

def perform_sales_analysis(sales_df):
    """Perform comprehensive sales analysis"""
    try:
        # Product performance analysis
        product_performance = sales_df.groupBy("product_id", "product_name", "category") \
            .agg(
                sum("total_amount").alias("total_sales"),
                sum("quantity").alias("total_quantity"),
                count("order_id").alias("order_count"),
                avg("price").alias("avg_price"),
                countDistinct("customer_id").alias("unique_customers")
            ) \
            .orderBy(desc("total_sales"))

        # Category analysis
        category_analysis = sales_df.groupBy("category") \
            .agg(
                sum("total_amount").alias("total_sales"),
                sum("quantity").alias("total_quantity"),
                count("order_id").alias("order_count"),
                avg("total_amount").alias("avg_order_value")
            ) \
            .orderBy(desc("total_sales"))

        # Customer segmentation
        customer_stats = sales_df.groupBy("customer_id") \
            .agg(
                sum("total_amount").alias("total_spent"),
                count("order_id").alias("order_count"),
                avg("total_amount").alias("avg_order_value"),
                max("order_date").alias("last_order_date"),
                min("order_date").alias("first_order_date")
            )

        # Add customer lifespan
        customer_stats = customer_stats.withColumn(
            "customer_lifespan_days",
            datediff(col("last_order_date"), col("first_order_date"))
        )

        # Segment customers
        customer_segments = customer_stats.withColumn(
            "segment",
            when(col("total_spent") >= 1000, "High Value")
            .when(col("total_spent") >= 500, "Medium Value")
            .otherwise("Low Value")
        )

        # Time series analysis
        daily_sales = sales_df.groupBy("order_date") \
            .agg(
                sum("total_amount").alias("daily_sales"),
                sum("quantity").alias("daily_quantity"),
                count("order_id").alias("daily_orders")
            ) \
            .orderBy("order_date")

        # Save results to Synapse SQL pool
        product_performance.write \
            .format("com.databricks.spark.sqldw") \
            .option("url", "jdbc:sqlserver://ecommerce-synapse.sql.azuresynapse.net:1433;database=salesdw") \
            .option("tempDir", "abfss://temp@ecommercestorage.dfs.core.windows.net/") \
            .option("forwardSparkAzureStorageCredentials", "true") \
            .option("dbTable", "ProductPerformance") \
            .mode("overwrite") \
            .save()

        category_analysis.write \
            .format("com.databricks.spark.sqldw") \
            .option("url", "jdbc:sqlserver://ecommerce-synapse.sql.azuresynapse.net:1433;database=salesdw") \
            .option("tempDir", "abfss://temp@ecommercestorage.dfs.core.windows.net/") \
            .option("forwardSparkAzureStorageCredentials", "true") \
            .option("dbTable", "CategoryAnalysis") \
            .mode("overwrite") \
            .save()

        logger.info("Sales analysis completed successfully")

        return {
            'product_performance': product_performance,
            'category_analysis': category_analysis,
            'customer_segments': customer_segments,
            'daily_sales': daily_sales
        }

    except Exception as e:
        logger.error(f"Error performing sales analysis: {str(e)}")
        raise

def create_real_time_dashboard_data(sales_df):
    """Create data for real-time dashboard"""
    try:
        # Current day sales
        current_date = sales_df.select(max("order_date")).collect()[0][0]

        today_sales = sales_df.filter(col("order_date") == current_date) \
            .agg(
                sum("total_amount").alias("today_sales"),
                sum("quantity").alias("today_quantity"),
                count("order_id").alias("today_orders")
            )

        # Top products today
        top_products_today = sales_df.filter(col("order_date") == current_date) \
            .groupBy("product_name") \
            .agg(sum("total_amount").alias("sales")) \
            .orderBy(desc("sales")) \
            .limit(10)

        # Sales by hour (mock data for demonstration)
        hourly_sales = sales_df.withColumn("hour", hour(col("order_date"))) \
            .groupBy("hour") \
            .agg(sum("total_amount").alias("hourly_sales")) \
            .orderBy("hour")

        logger.info("Real-time dashboard data created")

        return {
            'today_sales': today_sales,
            'top_products_today': top_products_today,
            'hourly_sales': hourly_sales
        }

    except Exception as e:
        logger.error(f"Error creating dashboard data: {str(e)}")
        raise

# Main execution
if __name__ == "__main__":
    try:
        # Load data
        sales_data = load_sales_data()

        # Perform analysis
        analysis_results = perform_sales_analysis(sales_data)

        # Create dashboard data
        dashboard_data = create_real_time_dashboard_data(sales_data)

        # Show sample results
        analysis_results['product_performance'].show(10)
        analysis_results['category_analysis'].show()

        logger.info("Analytics pipeline completed successfully")

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise
    finally:
        spark.stop()
```

### Azure Stream Analytics

```sql
-- Stream Analytics query for real-time order processing
SELECT
    System.Timestamp() AS EventTime,
    order_id,
    customer_id,
    product_id,
    quantity,
    price,
    total_amount,
    order_date,
    customer_region,
    payment_method
INTO
    [processed-orders]
FROM
    [order-input] TIMESTAMP BY order_date

-- Real-time sales aggregation
SELECT
    System.Timestamp() AS EventTime,
    TumblingWindow(second, 30) AS WindowEnd,
    product_id,
    SUM(quantity) AS TotalQuantity,
    SUM(total_amount) AS TotalSales,
    AVG(price) AS AvgPrice,
    COUNT(*) AS OrderCount
INTO
    [sales-aggregations]
FROM
    [order-input] TIMESTAMP BY order_date
GROUP BY
    product_id,
    TumblingWindow(second, 30)

-- Fraud detection - unusual order patterns
SELECT
    System.Timestamp() AS EventTime,
    customer_id,
    COUNT(*) AS OrdersInWindow,
    SUM(total_amount) AS TotalAmountInWindow,
    AVG(total_amount) AS AvgOrderAmount
INTO
    [fraud-alerts]
FROM
    [order-input] TIMESTAMP BY order_date
GROUP BY
    customer_id,
    SlidingWindow(minute, 5)
HAVING
    COUNT(*) > 10 OR SUM(total_amount) > 5000

-- Real-time inventory updates
SELECT
    System.Timestamp() AS EventTime,
    product_id,
    SUM(quantity) AS QuantitySold,
    'DECREMENT' AS Operation
INTO
    [inventory-updates]
FROM
    [order-input] TIMESTAMP BY order_date
GROUP BY
    product_id,
    TumblingWindow(second, 10)

-- Customer behavior analysis
SELECT
    System.Timestamp() AS EventTime,
    customer_id,
    product_id,
    category,
    total_amount,
    LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS PreviousOrderAmount,
    total_amount - LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS AmountDifference
INTO
    [customer-behavior]
FROM
    [order-input] TIMESTAMP BY order_date
WHERE
    LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) IS NOT NULL
```

```python
# Python script for Stream Analytics job management
from azure.mgmt.streamanalytics import StreamAnalyticsManagementClient
from azure.identity import DefaultAzureCredential
from azure.mgmt.streamanalytics.models import *
import json
import os

class StreamAnalyticsManager:
    def __init__(self, subscription_id):
        self.subscription_id = subscription_id
        self.credential = DefaultAzureCredential()
        self.client = StreamAnalyticsManagementClient(self.credential, subscription_id)
        self.resource_group = "ecommerce-rg"
        self.job_name = "ecommerce-stream-analytics"

    def create_stream_analytics_job(self):
        """Create Stream Analytics job"""
        try:
            job_properties = StreamingJob(
                location="eastus",
                sku=Sku(name="Standard", capacity=1),
                events_out_of_order_policy="Drop",
                output_error_policy="Drop",
                events_out_of_order_max_delay_in_seconds=0,
                events_late_arrival_max_delay_in_seconds=5,
                data_locale="en-US",
                compatibility_level="1.2",
                inputs=[],
                transformation=Transformation(
                    name="order-transformation",
                    streaming_units=1,
                    query="""
                    SELECT
                        System.Timestamp() AS EventTime,
                        order_id,
                        customer_id,
                        product_id,
                        quantity,
                        price,
                        total_amount,
                        order_date,
                        customer_region,
                        payment_method
                    INTO
                        [processed-orders]
                    FROM
                        [order-input] TIMESTAMP BY order_date
                    """
                ),
                outputs=[]
            )

            async_job = self.client.streaming_jobs.begin_create_or_replace(
                self.resource_group,
                self.job_name,
                job_properties
            )

            job_result = async_job.result()
            print(f"Stream Analytics job created: {job_result.name}")

        except Exception as e:
            print(f"Error creating Stream Analytics job: {str(e)}")
            raise

    def add_event_hub_input(self):
        """Add Event Hub as input"""
        try:
            input_properties = Input(
                name="order-input",
                type="Stream",
                serialization=JsonSerialization(
                    encoding="UTF8"
                ),
                datasource=EventHubStreamInputDataSource(
                    event_hub_name="orders",
                    service_bus_namespace="ecommerce-namespace",
                    shared_access_policy_name="RootManageSharedAccessKey",
                    shared_access_policy_key=os.getenv("EVENTHUB_KEY")
                )
            )

            self.client.inputs.create_or_replace(
                self.resource_group,
                self.job_name,
                "order-input",
                input_properties
            )

            print("Event Hub input added successfully")

        except Exception as e:
            print(f"Error adding Event Hub input: {str(e)}")
            raise

    def add_cosmos_db_output(self):
        """Add Cosmos DB as output"""
        try:
            output_properties = Output(
                name="processed-orders",
                type="DocumentDB",
                serialization=JsonSerialization(
                    encoding="UTF8"
                ),
                datasource=DocumentDbOutputDataSource(
                    account_id="/subscriptions/.../resourceGroups/ecommerce-rg/providers/Microsoft.DocumentDB/databaseAccounts/ecommerce-cosmos",
                    account_key=os.getenv("COSMOS_KEY"),
                    database="ecommerce",
                    collection_name_pattern="processed-orders",
                    partition_key="customer_id"
                )
            )

            self.client.outputs.create_or_replace(
                self.resource_group,
                self.job_name,
                "processed-orders",
                output_properties
            )

            print("Cosmos DB output added successfully")

        except Exception as e:
            print(f"Error adding Cosmos DB output: {str(e)}")
            raise

    def start_job(self):
        """Start the Stream Analytics job"""
        try:
            start_properties = StartStreamingJobParameters(
                output_start_mode="JobStartTime"
            )

            async_start = self.client.streaming_jobs.begin_start(
                self.resource_group,
                self.job_name,
                start_properties
            )

            async_start.wait()
            print("Stream Analytics job started successfully")

        except Exception as e:
            print(f"Error starting job: {str(e)}")
            raise

    def monitor_job(self):
        """Monitor job metrics"""
        try:
            metrics = self.client.streaming_jobs.get(
                self.resource_group,
                self.job_name
            )

            print(f"Job Status: {metrics.job_state}")
            print(f"Streaming Units: {metrics.transformation.streaming_units}")

            # Get metrics
            metric_definitions = self.client.streaming_jobs.list_metrics(
                self.resource_group,
                self.job_name
            )

            for metric in metric_definitions:
                print(f"Metric: {metric.name} - {metric.display_name}")

        except Exception as e:
            print(f"Error monitoring job: {str(e)}")
            raise

# Usage example
def main():
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')
    manager = StreamAnalyticsManager(subscription_id)

    # Create job
    manager.create_stream_analytics_job()

    # Add inputs and outputs
    manager.add_event_hub_input()
    manager.add_cosmos_db_output()

    # Start job
    manager.start_job()

    # Monitor job
    manager.monitor_job()

if __name__ == "__main__":
    main()
```

### Azure Databricks

```python
# Databricks notebook for advanced analytics
# Databricks setup and configuration
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.regression import LinearRegression
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.ml import Pipeline
import mlflow
import mlflow.spark
import pandas as pd
import matplotlib.pyplot as plt
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MLflow
mlflow.set_experiment("/ecommerce-analytics")

def load_and_prepare_data():
    """Load and prepare ecommerce data for analysis"""
    try:
        # Load sales data
        sales_df = spark.read \
            .format("delta") \
            .load("/mnt/ecommerce/sales/")

        # Load customer data
        customer_df = spark.read \
            .format("delta") \
            .load("/mnt/ecommerce/customers/")

        # Load product data
        product_df = spark.read \
            .format("delta") \
            .load("/mnt/ecommerce/products/")

        # Join datasets
        full_df = sales_df \
            .join(customer_df, "customer_id") \
            .join(product_df, "product_id")

        logger.info(f"Loaded {full_df.count()} records for analysis")
        return full_df

    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise

def perform_customer_segmentation(data_df):
    """Perform customer segmentation using RFM analysis"""
    try:
        with mlflow.start_run(run_name="customer_segmentation"):
            # Calculate RFM metrics
            rfm_df = data_df.groupBy("customer_id").agg(
                datediff(current_date(), max("order_date")).alias("recency"),
                count("order_id").alias("frequency"),
                sum("total_amount").alias("monetary")
            )

            # Calculate RFM scores
            rfm_scores = rfm_df.withColumn(
                "r_score",
                when(col("recency") <= 30, 5)
                .when(col("recency") <= 60, 4)
                .when(col("recency") <= 90, 3)
                .when(col("recency") <= 180, 2)
                .otherwise(1)
            ).withColumn(
                "f_score",
                when(col("frequency") >= 10, 5)
                .when(col("frequency") >= 5, 4)
                .when(col("frequency") >= 3, 3)
                .when(col("frequency") >= 1, 2)
                .otherwise(1)
            ).withColumn(
                "m_score",
                when(col("monetary") >= 1000, 5)
                .when(col("monetary") >= 500, 4)
                .when(col("monetary") >= 200, 3)
                .when(col("monetary") >= 50, 2)
                .otherwise(1)
            )

            # Calculate overall RFM score
            rfm_final = rfm_scores.withColumn(
                "rfm_score",
                col("r_score") + col("f_score") + col("m_score")
            )

            # Segment customers
            customer_segments = rfm_final.withColumn(
                "segment",
                when(col("rfm_score") >= 13, "Champions")
                .when(col("rfm_score") >= 10, "Loyal Customers")
                .when(col("rfm_score") >= 7, "Potential Loyalists")
                .when(col("rfm_score") >= 5, "At Risk")
                .otherwise("Lost")
            )

            # Log metrics
            segment_counts = customer_segments.groupBy("segment").count().collect()
            for row in segment_counts:
                mlflow.log_metric(f"{row['segment']}_count", row['count'])

            # Save results
            customer_segments.write \
                .format("delta") \
                .mode("overwrite") \
                .save("/mnt/ecommerce/customer_segments/")

            mlflow.log_artifacts("/mnt/ecommerce/customer_segments/")

            logger.info("Customer segmentation completed")
            return customer_segments

    except Exception as e:
        logger.error(f"Error in customer segmentation: {str(e)}")
        raise

def build_sales_prediction_model(data_df):
    """Build sales prediction model using ML"""
    try:
        with mlflow.start_run(run_name="sales_prediction"):
            # Prepare features
            feature_cols = ["price", "customer_age", "customer_region_encoded", "product_category_encoded"]

            # Encode categorical variables
            region_indexer = StringIndexer(inputCol="customer_region", outputCol="customer_region_encoded")
            category_indexer = StringIndexer(inputCol="category", outputCol="product_category_encoded")

            # Assemble features
            assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")

            # Create linear regression model
            lr = LinearRegression(
                featuresCol="features",
                labelCol="total_amount",
                predictionCol="predicted_amount"
            )

            # Create pipeline
            pipeline = Pipeline(stages=[region_indexer, category_indexer, assembler, lr])

            # Split data
            train_df, test_df = data_df.randomSplit([0.8, 0.2], seed=42)

            # Train model
            model = pipeline.fit(train_df)

            # Make predictions
            predictions = model.transform(test_df)

            # Evaluate model
            evaluator = RegressionEvaluator(
                labelCol="total_amount",
                predictionCol="predicted_amount",
                metricName="rmse"
            )

            rmse = evaluator.evaluate(predictions)
            mlflow.log_metric("rmse", rmse)

            # Log model
            mlflow.spark.log_model(model, "sales_prediction_model")

            # Save predictions
            predictions.select(
                "order_id", "customer_id", "product_id",
                "total_amount", "predicted_amount"
            ).write \
                .format("delta") \
                .mode("overwrite") \
                .save("/mnt/ecommerce/sales_predictions/")

            logger.info(f"Sales prediction model trained with RMSE: {rmse}")
            return model, predictions

    except Exception as e:
        logger.error(f"Error building prediction model: {str(e)}")
        raise

def create_analytics_dashboard(data_df, segments_df, predictions_df):
    """Create analytics dashboard data"""
    try:
        # Sales by category
        sales_by_category = data_df.groupBy("category") \
            .agg(
                sum("total_amount").alias("total_sales"),
                count("order_id").alias("order_count")
            ) \
            .orderBy(desc("total_sales"))

        # Sales trend over time
        sales_trend = data_df.groupBy(
            year("order_date").alias("year"),
            month("order_date").alias("month")
        ).agg(
            sum("total_amount").alias("monthly_sales"),
            count("order_id").alias("monthly_orders")
        ).orderBy("year", "month")

        # Customer segment distribution
        segment_distribution = segments_df.groupBy("segment") \
            .count() \
            .orderBy(desc("count"))

        # Top products
        top_products = data_df.groupBy("product_name") \
            .agg(sum("total_amount").alias("total_sales")) \
            .orderBy(desc("total_sales")) \
            .limit(10)

        # Save dashboard data
        dashboard_data = {
            "sales_by_category": sales_by_category,
            "sales_trend": sales_trend,
            "segment_distribution": segment_distribution,
            "top_products": top_products,
            "predictions_summary": predictions_df.agg(
                avg("total_amount").alias("avg_actual"),
                avg("predicted_amount").alias("avg_predicted"),
                count("*").alias("prediction_count")
            )
        }

        # Write to Delta tables for Power BI consumption
        for name, df in dashboard_data.items():
            df.write \
                .format("delta") \
                .mode("overwrite") \
                .save(f"/mnt/ecommerce/dashboard/{name}/")

        logger.info("Analytics dashboard data created")
        return dashboard_data

    except Exception as e:
        logger.error(f"Error creating dashboard: {str(e)}")
        raise

# Main execution
if __name__ == "__main__":
    try:
        # Load data
        ecommerce_data = load_and_prepare_data()

        # Perform customer segmentation
        customer_segments = perform_customer_segmentation(ecommerce_data)

        # Build prediction model
        prediction_model, predictions = build_sales_prediction_model(ecommerce_data)

        # Create dashboard data
        dashboard = create_analytics_dashboard(
            ecommerce_data,
            customer_segments,
            predictions
        )

        # Display results
        customer_segments.groupBy("segment").count().display()
        dashboard["sales_by_category"].display()
        dashboard["top_products"].display()

        logger.info("Advanced analytics pipeline completed successfully")

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise
```

### Terraform Configuration

```hcl
# Azure Synapse Analytics Workspace
resource "azurerm_synapse_workspace" "ecommerce" {
  name                                 = "ecommerce-synapse"
  resource_group_name                  = azurerm_resource_group.ecommerce.name
  location                             = azurerm_resource_group.ecommerce.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.synapse.id
  sql_administrator_login              = "synapseadmin"
  sql_administrator_login_password     = var.synapse_admin_password

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = "production"
    application = "ecommerce-analytics"
  }
}

# Dedicated SQL Pool
resource "azurerm_synapse_sql_pool" "sales" {
  name                 = "salesdw"
  synapse_workspace_id = azurerm_synapse_workspace.ecommerce.id
  sku_name             = "DW1000c"
  create_mode          = "Default"

  tags = {
    environment = "production"
  }
}

# Apache Spark Pool
resource "azurerm_synapse_spark_pool" "analytics" {
  name                 = "sparkpool"
  synapse_workspace_id = azurerm_synapse_workspace.ecommerce.id
  node_size_family     = "MemoryOptimized"
  node_size            = "Small"
  cache_size           = 100

  auto_scale {
    max_node_count = 10
    min_node_count = 3
  }

  auto_pause {
    delay_in_minutes = 15
  }

  tags = {
    environment = "production"
  }
}

# Azure Databricks Workspace
resource "azurerm_databricks_workspace" "ecommerce" {
  name                = "ecommerce-databricks"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  sku                 = "premium"

  tags = {
    environment = "production"
  }
}

# Azure Stream Analytics Job
resource "azurerm_stream_analytics_job" "orders" {
  name                = "ecommerce-stream-analytics"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  streaming_units     = 1

  transformation_query = <<QUERY
    SELECT
        System.Timestamp() AS EventTime,
        order_id,
        customer_id,
        product_id,
        quantity,
        price,
        total_amount,
        order_date,
        customer_region,
        payment_method
    INTO
        [processed-orders]
    FROM
        [order-input] TIMESTAMP BY order_date
  QUERY

  tags = {
    environment = "production"
  }
}

# Event Hub Input for Stream Analytics
resource "azurerm_stream_analytics_stream_input_eventhub" "orders" {
  name                         = "order-input"
  stream_analytics_job_name    = azurerm_stream_analytics_job.orders.name
  resource_group_name          = azurerm_resource_group.ecommerce.name
  eventhub_consumer_group_name = "$Default"
  eventhub_name                = azurerm_eventhub.orders.name
  servicebus_namespace         = azurerm_eventhub_namespace.ecommerce.name
  shared_access_policy_key     = azurerm_eventhub_namespace.ecommerce.default_primary_key
  shared_access_policy_name    = "RootManageSharedAccessKey"

  serialization {
    type     = "Json"
    encoding = "UTF8"
  }
}

# Cosmos DB Output for Stream Analytics
resource "azurerm_stream_analytics_output_cosmosdb" "processed_orders" {
  name                = "processed-orders"
  stream_analytics_job_name = azurerm_stream_analytics_job.orders.name
  resource_group_name = azurerm_resource_group.ecommerce.name
  cosmosdb_account_key = azurerm_cosmosdb_account.ecommerce.primary_key
  database_name       = "ecommerce"
  collection_name_template = "processed-orders"
  partition_key       = "customer_id"

  serialization {
    type = "Json"
  }
}

# Azure Analysis Services
resource "azurerm_analysis_services_server" "ecommerce" {
  name                = "ecommerce-analysis"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  sku                 = "S1"

  ipv4_firewall_rule {
    name        = "allow-azure"
    range_start = "0.0.0.0"
    range_end   = "255.255.255.255"
  }

  tags = {
    environment = "production"
  }
}

# Data Lake Storage for Analytics
resource "azurerm_storage_data_lake_gen2_filesystem" "analytics" {
  name               = "analytics-data"
  storage_account_id = azurerm_storage_account.ecommerce.id

  properties = {
    "analytics" = "true"
  }
}

# Synapse Linked Service to Storage
resource "azurerm_synapse_linked_service" "storage" {
  name                 = "storage-linked-service"
  synapse_workspace_id = azurerm_synapse_workspace.ecommerce.id

  type = "AzureBlobStorage"
  type_properties_json = jsonencode({
    connectionString = azurerm_storage_account.ecommerce.primary_connection_string
  })
}

# Synapse Dataset
resource "azurerm_synapse_dataset_delimited_text" "products" {
  name                 = "product-data"
  synapse_workspace_id = azurerm_synapse_workspace.ecommerce.id
  linked_service_name  = azurerm_synapse_linked_service.storage.name

  path = "/product-data"
  column_delimiter    = ","
  row_delimiter       = "\n"
  encoding_name       = "UTF-8"
  quote_character     = "\""
  escape_character    = "\\"
  first_row_as_header = true
}
```

## Best Practices

- Choose appropriate service based on data volume, velocity, and variety
- Implement proper data partitioning and indexing for performance
- Use Azure Monitor for comprehensive analytics monitoring
- Implement proper security with Azure AD authentication and RBAC
- Use Azure Key Vault for managing secrets and connection strings
- Implement proper backup and disaster recovery strategies
- Use Azure Cost Management for analytics cost optimization
- Implement proper data governance and compliance
- Use Azure Purview for data cataloging and lineage
- Implement proper error handling and retry logic
- Use Azure DevOps for CI/CD pipelines for analytics code
- Implement proper logging and auditing
- Use Azure Advisor for performance and cost recommendations
- Implement proper data quality checks and validation
- Use Azure Data Factory for data orchestration and ETL
- Implement proper access controls and data masking
- Use Azure Information Protection for sensitive data
- Implement proper change management processes
- Use Azure Policy for governance and compliance enforcement

### Performance Optimization

```bash
# Monitor Synapse performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Synapse/workspaces/ecommerce-synapse \
  --metric "DWUUsed" \
  --interval PT1H

# Scale Synapse SQL pool
az synapse sql pool update \
  --name salesdw \
  --workspace-name ecommerce-synapse \
  --resource-group ecommerce-rg \
  --sku-name DW2000c

# Monitor Stream Analytics
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.StreamAnalytics/streamingjobs/ecommerce-stream-analytics \
  --metric "AMLCalloutFailedEvents" \
  --interval PT5M

# Optimize Databricks cluster
az databricks cluster update \
  --cluster-id $CLUSTER_ID \
  --num-workers 5 \
  --cluster-name "analytics-cluster"
```

### Cost Optimization

```bash
# Set up auto-pause for Synapse
az synapse spark pool update \
  --name sparkpool \
  --workspace-name ecommerce-synapse \
  --resource-group ecommerce-rg \
  --delay 15

# Use reserved instances for Synapse
az reservations catalog show \
  --subscription-id $SUBSCRIPTION_ID \
  --location eastus \
  --resource-type "Microsoft.Synapse/workspaces"

# Monitor analytics costs
az costmanagement query \
  --type "Usage" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --dataset-granularity "Daily" \
  --dataset-aggregation '{"totalCost":{"name":"PreTaxCost","function":"Sum"}}' \
  --timeframe "MonthToDate"
```

## Security Considerations

- Use Azure AD authentication for all analytics services
- Implement proper RBAC with least privilege principle
- Use Azure Key Vault for managing secrets and keys
- Enable encryption at rest and in transit
- Use private endpoints for secure access
- Implement proper network security with NSGs and firewalls
- Enable Azure Defender for analytics services
- Implement proper logging and monitoring for security events
- Use Azure Information Protection for data classification
- Implement proper backup and disaster recovery procedures
- Use Azure Policy for compliance enforcement
- Implement proper access reviews and audits
- Use Azure Sentinel for security analytics and incident response
- Implement proper data masking and anonymization
- Use Azure Purview for data governance and lineage

## Azure Analytics vs Other Cloud Providers

| Feature | Azure Analytics | AWS Analytics | GCP Analytics |
|---------|-----------------|---------------|----------------|
| Data Warehouse | Synapse Analytics | Redshift | BigQuery |
| Data Lake | Data Lake Storage | S3 + Lake Formation | Cloud Storage |
| Stream Processing | Stream Analytics | Kinesis Analytics | Dataflow |
| Spark Platform | Databricks | EMR | Dataproc |
| BI Service | Analysis Services | QuickSight | Looker |
| ML Integration | Azure ML | SageMaker | Vertex AI |
| Pricing Model | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |
| Global Scale | Excellent | Excellent | Excellent |

## Common Use Cases

- **Sales Analytics**: Revenue analysis, product performance, customer segmentation
- **Real-time Monitoring**: Live dashboards, fraud detection, operational metrics
- **Customer Insights**: Behavior analysis, personalization, churn prediction
- **Inventory Optimization**: Demand forecasting, stock level monitoring
- **Fraud Detection**: Real-time anomaly detection, risk scoring
- **Recommendation Engine**: Product recommendations, cross-selling analysis
- **Marketing Analytics**: Campaign performance, customer acquisition analysis
- **Supply Chain Analytics**: Supplier performance, logistics optimization
- **Financial Reporting**: Revenue forecasting, budget analysis, financial KPIs
- **IoT Analytics**: Sensor data analysis, predictive maintenance
- **Log Analytics**: Application monitoring, error analysis, performance metrics
- **Clickstream Analysis**: User behavior tracking, conversion funnel analysis
- **A/B Testing**: Experiment analysis, statistical significance testing