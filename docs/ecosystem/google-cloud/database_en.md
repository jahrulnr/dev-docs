# Google Cloud SQL

## Overview

Google Cloud SQL is a fully-managed database service that makes it easy to set up, maintain, manage, and administer relational databases on Google Cloud Platform. It provides high performance, scalability, and convenience while reducing operational overhead.

## Key Concepts

### Database Engines
- **MySQL**: Open-source relational database, widely used for web applications
- **PostgreSQL**: Advanced open-source relational database with enterprise features
- **SQL Server**: Microsoft's relational database management system

### Instance Types
- **First Generation**: Basic instances with shared CPU and memory
- **Second Generation**: High-performance instances with dedicated CPU and memory
- **Enterprise Plus**: Premium tier with additional features and support

### Storage Options
- **SSD Persistent Disk**: High-performance SSD storage
- **HDD Persistent Disk**: Cost-effective HDD storage
- **Regional SSD**: Replicated SSD storage across zones

### High Availability
- **Failover replicas**: Automatic failover to standby instances
- **Read replicas**: Scale read operations with read-only replicas
- **Cross-region replication**: Disaster recovery across regions

## When to Use

- Traditional relational database workloads
- Web applications requiring ACID transactions
- E-commerce platforms with complex queries
- Applications migrating from on-premises databases
- Systems requiring strong consistency
- Applications needing advanced SQL features
- Multi-tenant SaaS applications
- Data warehousing and analytics (with BigQuery integration)
- Legacy applications requiring specific database engines
- Applications needing automated backups and maintenance

## Examples

### Basic Instance Creation and Connection

```python
# Python Connection Example
import sqlalchemy
from sqlalchemy import create_engine, text
import os

def create_cloud_sql_connection():
    """Create connection to Cloud SQL instance"""
    # Connection parameters
    db_user = os.getenv('DB_USER', 'ecommerce-user')
    db_pass = os.getenv('DB_PASS')
    db_name = os.getenv('DB_NAME', 'ecommerce_db')
    db_host = os.getenv('DB_HOST')  # Cloud SQL instance IP or connection name

    # For Cloud SQL with public IP
    connection_string = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}'

    # For Cloud SQL with Private IP (VPC)
    # connection_string = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}:3306/{db_name}'

    # For Cloud SQL with Cloud SQL Proxy
    # connection_string = f'mysql+pymysql://{db_user}:{db_pass}@127.0.0.1:3306/{db_name}'

    engine = create_engine(connection_string, pool_pre_ping=True)

    return engine

def initialize_database():
    """Initialize database schema"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Create products table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_price (price)
            )
        """))

        # Create orders table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shipping_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_customer (customer_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        """))

        # Create order_items table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id),
                INDEX idx_order (order_id),
                INDEX idx_product (product_id)
            )
        """))

        conn.commit()
        print("Database schema initialized successfully")

def insert_sample_data():
    """Insert sample e-commerce data"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Insert sample products
        products = [
            ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 50),
            ('Wireless Headphones', 'Premium noise-cancelling headphones', 199.99, 'Electronics', 100),
            ('Coffee Maker', 'Automatic drip coffee maker', 79.99, 'Appliances', 30),
            ('Running Shoes', 'Comfortable athletic shoes', 129.99, 'Sports', 75),
            ('Smart Watch', 'Fitness tracking smartwatch', 299.99, 'Electronics', 40)
        ]

        for product in products:
            conn.execute(text("""
                INSERT INTO products (name, description, price, category, stock_quantity)
                VALUES (%s, %s, %s, %s, %s)
            """), product)

        conn.commit()
        print("Sample products inserted successfully")

if __name__ == '__main__':
    initialize_database()
    insert_sample_data()
```

### Advanced Queries and Transactions

```python
# Advanced Database Operations
from sqlalchemy import create_engine, text
import json

def get_product_catalog(category=None, min_price=None, max_price=None, limit=20):
    """Get filtered product catalog"""
    engine = create_cloud_sql_connection()

    query = """
        SELECT id, name, description, price, category, stock_quantity
        FROM products
        WHERE 1=1
    """
    params = []

    if category:
        query += " AND category = %s"
        params.append(category)

    if min_price is not None:
        query += " AND price >= %s"
        params.append(min_price)

    if max_price is not None:
        query += " AND price <= %s"
        params.append(max_price)

    query += " ORDER BY price ASC LIMIT %s"
    params.append(limit)

    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        products = [dict(row) for row in result]

    return products

def create_order_with_transaction(customer_id, cart_items):
    """Create order with transaction handling"""
    engine = create_cloud_sql_connection()

    with engine.begin() as conn:  # Transaction context manager
        try:
            # Calculate total amount
            total_amount = 0
            for item in cart_items:
                product = conn.execute(text("""
                    SELECT price, stock_quantity FROM products WHERE id = %s FOR UPDATE
                """), (item['product_id'],)).fetchone()

                if not product:
                    raise ValueError(f"Product {item['product_id']} not found")

                if product.stock_quantity < item['quantity']:
                    raise ValueError(f"Insufficient stock for product {item['product_id']}")

                total_amount += product.price * item['quantity']

            # Create order
            order_result = conn.execute(text("""
                INSERT INTO orders (customer_id, total_amount, status, shipping_address)
                VALUES (%s, %s, 'pending', %s)
            """), (customer_id, total_amount, cart_items[0].get('shipping_address', '')))

            order_id = order_result.lastrowid

            # Create order items and update stock
            for item in cart_items:
                # Insert order item
                conn.execute(text("""
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                    VALUES (%s, %s, %s, (SELECT price FROM products WHERE id = %s))
                """), (order_id, item['product_id'], item['quantity'], item['product_id']))

                # Update stock
                conn.execute(text("""
                    UPDATE products
                    SET stock_quantity = stock_quantity - %s
                    WHERE id = %s
                """), (item['quantity'], item['product_id']))

            # Update order status
            conn.execute(text("""
                UPDATE orders SET status = 'processing' WHERE id = %s
            """), (order_id,))

            return {'order_id': order_id, 'total_amount': total_amount}

        except Exception as e:
            print(f"Transaction failed: {e}")
            raise

def get_order_details(order_id):
    """Get comprehensive order details"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Get order header
        order = conn.execute(text("""
            SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = %s
            GROUP BY o.id
        """), (order_id,)).fetchone()

        if not order:
            return None

        # Get order items with product details
        items = conn.execute(text("""
            SELECT oi.*, p.name, p.description, p.category
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
            ORDER BY oi.id
        """), (order_id,)).fetchall()

        return {
            'order': dict(order),
            'items': [dict(item) for item in items]
        }

def get_sales_analytics():
    """Get sales analytics and insights"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Total sales by category
        category_sales = conn.execute(text("""
            SELECT p.category,
                   COUNT(oi.id) as total_orders,
                   SUM(oi.total_price) as total_revenue,
                   AVG(oi.total_price) as avg_order_value
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.category
            ORDER BY total_revenue DESC
        """)).fetchall()

        # Daily sales trend
        daily_sales = conn.execute(text("""
            SELECT DATE(o.created_at) as sale_date,
                   COUNT(DISTINCT o.id) as orders_count,
                   SUM(o.total_amount) as daily_revenue
            FROM orders o
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            AND o.status != 'cancelled'
            GROUP BY DATE(o.created_at)
            ORDER BY sale_date DESC
        """)).fetchall()

        # Top selling products
        top_products = conn.execute(text("""
            SELECT p.name, p.category,
                   SUM(oi.quantity) as total_quantity,
                   SUM(oi.total_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.id, p.name, p.category
            ORDER BY total_quantity DESC
            LIMIT 10
        """)).fetchall()

        return {
            'category_sales': [dict(row) for row in category_sales],
            'daily_sales': [dict(row) for row in daily_sales],
            'top_products': [dict(row) for row in top_products]
        }
```

### Read Replica Configuration

```python
# Read Replica Operations
def setup_read_replica_operations():
    """Demonstrate read replica usage"""
    # Primary database connection
    primary_engine = create_cloud_sql_connection()

    # Read replica connection (different host/port)
    replica_engine = create_read_replica_connection()

    def get_product_inventory():
        """Read inventory from replica for performance"""
        with replica_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, stock_quantity, price
                FROM products
                WHERE stock_quantity > 0
                ORDER BY stock_quantity DESC
            """))
            return [dict(row) for row in result]

    def process_order_write_operation(order_data):
        """Write operations go to primary"""
        with primary_engine.begin() as conn:
            # Create order (write to primary)
            order_result = conn.execute(text("""
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (%s, %s, 'processing')
            """), (order_data['customer_id'], order_data['total_amount']))

            order_id = order_result.lastrowid

            # Update inventory (write to primary)
            for item in order_data['items']:
                conn.execute(text("""
                    UPDATE products
                    SET stock_quantity = stock_quantity - %s
                    WHERE id = %s AND stock_quantity >= %s
                """), (item['quantity'], item['product_id'], item['quantity']))

            return order_id

    def generate_reports():
        """Complex analytics queries use replica"""
        with replica_engine.connect() as conn:
            # Complex aggregation queries
            sales_report = conn.execute(text("""
                SELECT
                    YEAR(o.created_at) as year,
                    MONTH(o.created_at) as month,
                    COUNT(o.id) as total_orders,
                    SUM(o.total_amount) as monthly_revenue,
                    AVG(o.total_amount) as avg_order_value
                FROM orders o
                WHERE o.status = 'delivered'
                GROUP BY YEAR(o.created_at), MONTH(o.created_at)
                ORDER BY year DESC, month DESC
                LIMIT 12
            """)).fetchall()

            return [dict(row) for row in sales_report]

    return {
        'get_inventory': get_product_inventory,
        'process_order': process_order_write_operation,
        'generate_reports': generate_reports
    }

def create_read_replica_connection():
    """Create connection to read replica"""
    # In practice, this would connect to the replica instance
    # For demonstration, using same connection (in real scenario, different host)
    return create_cloud_sql_connection()
```

### Backup and Restore Operations

```python
# Backup and Restore Operations
import datetime
from google.cloud import storage

def create_manual_backup():
    """Create manual backup of Cloud SQL instance"""
    import subprocess

    instance_name = 'ecommerce-db-instance'
    backup_name = f"manual-backup-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # Create backup
    cmd = [
        'gcloud', 'sql', 'backups', 'create',
        backup_name,
        '--instance', instance_name,
        '--description', f'Manual backup created on {datetime.datetime.now()}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Backup created successfully: {backup_name}")
        return backup_name
    else:
        raise Exception(f"Backup failed: {result.stderr}")

def export_database_to_gcs():
    """Export database to Cloud Storage"""
    bucket_name = 'ecommerce-backups'
    instance_name = 'ecommerce-db-instance'
    database_name = 'ecommerce_db'

    export_file = f"gs://{bucket_name}/exports/{database_name}-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}.sql.gz"

    # Export database
    cmd = [
        'gcloud', 'sql', 'export', 'sql', instance_name,
        export_file,
        '--database', database_name,
        '--offload'  # Export without blocking database
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database exported to: {export_file}")
        return export_file
    else:
        raise Exception(f"Export failed: {result.stderr}")

def restore_from_backup(backup_name):
    """Restore from backup"""
    instance_name = 'ecommerce-db-instance'

    cmd = [
        'gcloud', 'sql', 'backups', 'restore', backup_name,
        '--restore-instance', instance_name,
        '--backup-instance', instance_name
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database restored from backup: {backup_name}")
    else:
        raise Exception(f"Restore failed: {result.stderr}")

def import_from_gcs(import_file):
    """Import database from Cloud Storage"""
    instance_name = 'ecommerce-db-instance'
    database_name = 'ecommerce_db'

    cmd = [
        'gcloud', 'sql', 'import', 'sql', instance_name,
        import_file,
        '--database', database_name
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database imported from: {import_file}")
    else:
        raise Exception(f"Import failed: {result.stderr}")

def setup_automated_backups():
    """Configure automated backup settings"""
    instance_name = 'ecommerce-db-instance'

    # Enable automated backups with 7-day retention
    cmd = [
        'gcloud', 'sql', 'instances', 'patch', instance_name,
        '--backup-start-time', '02:00',  # 2 AM daily
        '--retained-backups-count', '7'  # Keep 7 days of backups
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("Automated backups configured successfully")
    else:
        raise Exception(f"Backup configuration failed: {result.stderr}")
```

### Terraform Configuration

```hcl
# Cloud SQL Instance Configuration
resource "google_sql_database_instance" "ecommerce_db" {
  name             = "ecommerce-db-instance"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"  # Start small, scale up as needed

    disk_type = "PD_SSD"
    disk_size = 10  # GB

    backup_configuration {
      enabled    = true
      start_time = "02:00"  # Daily at 2 AM
      location   = "us-central1"
    }

    maintenance_window {
      day  = 7  # Sunday
      hour = 3  # 3 AM
    }

    ip_configuration {
      ipv4_enabled = true

      authorized_networks {
        name  = "office-network"
        value = "192.168.1.0/24"
      }

      # For VPC-only access
      # private_network = google_compute_network.vpc.self_link
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    database_flags {
      name  = "innodb_buffer_pool_size"
      value = "1073741824"  # 1GB
    }
  }

  deletion_protection = true
}

# Database Creation
resource "google_sql_database" "ecommerce_database" {
  name     = "ecommerce_db"
  instance = google_sql_database_instance.ecommerce_db.name
  charset  = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}

# Database User
resource "google_sql_user" "ecommerce_user" {
  name     = "ecommerce-user"
  instance = google_sql_database_instance.ecommerce_db.name
  password = var.db_password
}

# Read Replica
resource "google_sql_database_instance" "ecommerce_db_replica" {
  name                 = "ecommerce-db-replica"
  database_version     = "MYSQL_8_0"
  region               = "us-central1"
  master_instance_name = google_sql_database_instance.ecommerce_db.name

  settings {
    tier      = "db-f1-micro"
    disk_type = "PD_SSD"
    disk_size = 10

    ip_configuration {
      ipv4_enabled = false  # Replica can be private-only
    }
  }

  deletion_protection = false  # Replicas can be recreated
}

# High Availability Configuration
resource "google_sql_database_instance" "ecommerce_db_ha" {
  name             = "ecommerce-db-ha-instance"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-n1-standard-1"

    availability_type = "REGIONAL"  # High availability

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = "us-central1"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    disk_type = "PD_SSD"
    disk_size = 50

    maintenance_window {
      day  = 7
      hour = 3
    }
  }

  deletion_protection = true
}

# Private IP Configuration (VPC)
resource "google_compute_network" "vpc" {
  name                    = "ecommerce-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "ecommerce-subnet"
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
}

resource "google_sql_database_instance" "ecommerce_db_private" {
  name             = "ecommerce-db-private"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.vpc.self_link
    }
  }

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

resource "google_compute_global_address" "private_ip_address" {
  name          = "ecommerce-db-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.self_link
}

# Monitoring and Alerting
resource "google_monitoring_alert_policy" "db_cpu_alert" {
  display_name = "Database CPU Usage Alert"
  combiner     = "OR"

  conditions {
    display_name = "CPU usage > 80%"

    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND resource.type=\"cloudsql_database\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification Channel"
  type         = "email"

  labels = {
    email_address = "admin@ecommerce-company.com"
  }
}
```

## Best Practices

- Choose appropriate instance size based on workload requirements
- Use SSD storage for better performance
- Enable automated backups with appropriate retention
- Configure maintenance windows during low-traffic periods
- Use read replicas to scale read operations
- Implement connection pooling to manage database connections
- Monitor performance metrics and set up alerts
- Use private IP addresses for enhanced security
- Implement proper indexing for query optimization
- Regularly review and optimize slow queries
- Use database flags to tune performance
- Implement proper backup and disaster recovery strategies
- Monitor storage usage and plan for growth
- Use maintenance windows for updates and upgrades

### Performance Optimization

```bash
# Monitor database performance
gcloud sql instances describe ecommerce-db-instance --format="table(name,state,databaseVersion,settings.tier)"

# Check database flags
gcloud sql instances describe ecommerce-db-instance --format="table(settings.databaseFlags)"

# Monitor connections
gcloud sql instances describe ecommerce-db-instance --format="value(settings.maxConnections)"

# Check backup status
gcloud sql backups list --instance=ecommerce-db-instance

# Monitor disk usage
gcloud sql instances describe ecommerce-db-instance --format="value(settings.diskSize)"

# Scale instance up
gcloud sql instances patch ecommerce-db-instance --tier=db-n1-standard-2

# Enable query insights
gcloud sql instances patch ecommerce-db-instance --insights-config-query-insights-enabled

# Check slow queries
gcloud sql instances describe ecommerce-db-instance --format="value(settings.insightsConfig)"
```

### Cost Optimization

```bash
# Monitor Cloud SQL costs
gcloud billing accounts list
gcloud alpha billing budgets create cloudsql-budget \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Cloud SQL Budget" \
  --budget-amount=500 \
  --threshold-rule=percent=80

# Use committed use discounts for predictable workloads
gcloud sql instances patch ecommerce-db-instance --tier=db-n1-standard-1

# Schedule instance stop/start for development
gcloud sql instances patch ecommerce-db-instance --activation-policy=NEVER

# Use smaller instances during off-hours
gcloud sql instances patch ecommerce-db-instance --tier=db-f1-micro

# Monitor storage costs
gcloud sql instances describe ecommerce-db-instance --format="value(settings.diskSize)"
```

## Security Considerations

- Use private IP addresses and VPC peering
- Implement proper IAM roles and permissions
- Enable database auditing and logging
- Use customer-managed encryption keys
- Implement proper network security groups
- Regularly rotate database passwords
- Use SSL/TLS for database connections
- Implement proper access controls
- Enable Cloud SQL Auth Proxy for secure connections
- Monitor for unauthorized access attempts
- Use database firewalls and IP whitelisting
- Implement proper backup encryption
- Regularly apply security patches and updates

## Cloud SQL vs Other Database Services

| Feature | Cloud SQL | Cloud Spanner | BigQuery | Cloud Firestore |
|---------|-----------|---------------|----------|-----------------|
| Data Model | Relational | Relational | Analytical | Document |
| Consistency | Strong | Strong | Eventual | Strong |
| Scalability | Vertical | Horizontal | Massive | Horizontal |
| Transactions | ACID | ACID | No | ACID |
| SQL Support | Full | Full | SQL-like | No |
| Cost | Medium | High | Low | Medium |
| Use Case | OLTP | Global OLTP | Analytics | NoSQL apps |

## Common Use Cases

- **E-commerce Platforms**: Product catalogs, orders, inventory management
- **Content Management Systems**: User data, content storage, metadata
- **Financial Applications**: Transaction processing, audit trails
- **SaaS Applications**: Multi-tenant data isolation, user management
- **Analytics Applications**: Data warehousing, reporting databases
- **Legacy Application Migration**: Lift-and-shift database migrations
- **Web Applications**: User authentication, session management
- **IoT Applications**: Sensor data storage, time-series data
- **Gaming Applications**: Player data, game state, leaderboards
- **Healthcare Applications**: Patient records, medical data management