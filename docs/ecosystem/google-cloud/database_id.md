# Google Cloud SQL

## Gambaran Umum

Google Cloud SQL adalah layanan database terkelola penuh yang memudahkan pengaturan, pemeliharaan, pengelolaan, dan administrasi database relasional di Google Cloud Platform. Layanan ini menyediakan performa tinggi, skalabilitas, dan kemudahan sambil mengurangi overhead operasional.

## Konsep Utama

### Mesin Database
- **MySQL**: Database relasional open-source, banyak digunakan untuk aplikasi web
- **PostgreSQL**: Database relasional open-source canggih dengan fitur enterprise
- **SQL Server**: Sistem manajemen database relasional Microsoft

### Tipe Instance
- **First Generation**: Instance dasar dengan CPU dan memori bersama
- **Second Generation**: Instance berperforma tinggi dengan CPU dan memori khusus
- **Enterprise Plus**: Tier premium dengan fitur tambahan dan dukungan

### Opsi Storage
- **SSD Persistent Disk**: Storage SSD berperforma tinggi
- **HDD Persistent Disk**: Storage HDD hemat biaya
- **Regional SSD**: Storage SSD yang direplikasi lintas zona

### Ketersediaan Tinggi
- **Failover replicas**: Failover otomatis ke instance standby
- **Read replicas**: Skalakan operasi baca dengan replica read-only
- **Cross-region replication**: Disaster recovery lintas region

## Kapan Menggunakan

- Workload database relasional tradisional
- Aplikasi web yang memerlukan transaksi ACID
- Platform e-commerce dengan query kompleks
- Aplikasi yang bermigrasi dari database on-premises
- Sistem yang memerlukan konsistensi kuat
- Aplikasi yang memerlukan fitur SQL canggih
- Aplikasi SaaS multi-tenant
- Data warehousing dan analitik (dengan integrasi BigQuery)
- Aplikasi legacy yang memerlukan mesin database spesifik
- Aplikasi yang memerlukan backup dan pemeliharaan otomatis

## Contoh

### Pembuatan Instance Dasar dan Koneksi

```python
# Contoh Koneksi Python
import sqlalchemy
from sqlalchemy import create_engine, text
import os

def create_cloud_sql_connection():
    """Buat koneksi ke instance Cloud SQL"""
    # Parameter koneksi
    db_user = os.getenv('DB_USER', 'ecommerce-user')
    db_pass = os.getenv('DB_PASS')
    db_name = os.getenv('DB_NAME', 'ecommerce_db')
    db_host = os.getenv('DB_HOST')  # IP instance Cloud SQL atau nama koneksi

    # Untuk Cloud SQL dengan public IP
    connection_string = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}'

    # Untuk Cloud SQL dengan Private IP (VPC)
    # connection_string = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}:3306/{db_name}'

    # Untuk Cloud SQL dengan Cloud SQL Proxy
    # connection_string = f'mysql+pymysql://{db_user}:{db_pass}@127.0.0.1:3306/{db_name}'

    engine = create_engine(connection_string, pool_pre_ping=True)

    return engine

def initialize_database():
    """Inisialisasi skema database"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Buat tabel products
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

        # Buat tabel orders
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

        # Buat tabel order_items
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
        print("Skema database berhasil diinisialisasi")

def insert_sample_data():
    """Masukkan data e-commerce contoh"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Masukkan produk contoh
        products = [
            ('Laptop Pro', 'Laptop berperforma tinggi untuk profesional', 1299.99, 'Electronics', 50),
            ('Wireless Headphones', 'Headphone premium noise-cancelling', 199.99, 'Electronics', 100),
            ('Coffee Maker', 'Mesin kopi drip otomatis', 79.99, 'Appliances', 30),
            ('Running Shoes', 'Sepatu olahraga yang nyaman', 129.99, 'Sports', 75),
            ('Smart Watch', 'Smartwatch pelacak kebugaran', 299.99, 'Electronics', 40)
        ]

        for product in products:
            conn.execute(text("""
                INSERT INTO products (name, description, price, category, stock_quantity)
                VALUES (%s, %s, %s, %s, %s)
            """), product)

        conn.commit()
        print("Produk contoh berhasil dimasukkan")

if __name__ == '__main__':
    initialize_database()
    insert_sample_data()
```

### Query Lanjutan dan Transaksi

```python
# Operasi Database Lanjutan
from sqlalchemy import create_engine, text
import json

def get_product_catalog(category=None, min_price=None, max_price=None, limit=20):
    """Dapatkan katalog produk terfilter"""
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
    """Buat order dengan penanganan transaksi"""
    engine = create_cloud_sql_connection()

    with engine.begin() as conn:  # Transaction context manager
        try:
            # Hitung total amount
            total_amount = 0
            for item in cart_items:
                product = conn.execute(text("""
                    SELECT price, stock_quantity FROM products WHERE id = %s FOR UPDATE
                """), (item['product_id'],)).fetchone()

                if not product:
                    raise ValueError(f"Produk {item['product_id']} tidak ditemukan")

                if product.stock_quantity < item['quantity']:
                    raise ValueError(f"Stok tidak cukup untuk produk {item['product_id']}")

                total_amount += product.price * item['quantity']

            # Buat order
            order_result = conn.execute(text("""
                INSERT INTO orders (customer_id, total_amount, status, shipping_address)
                VALUES (%s, %s, 'pending', %s)
            """), (customer_id, total_amount, cart_items[0].get('shipping_address', '')))

            order_id = order_result.lastrowid

            # Buat order items dan update stock
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

            # Update status order
            conn.execute(text("""
                UPDATE orders SET status = 'processing' WHERE id = %s
            """), (order_id,))

            return {'order_id': order_id, 'total_amount': total_amount}

        except Exception as e:
            print(f"Transaksi gagal: {e}")
            raise

def get_order_details(order_id):
    """Dapatkan detail order komprehensif"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Dapatkan header order
        order = conn.execute(text("""
            SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = %s
            GROUP BY o.id
        """), (order_id,)).fetchone()

        if not order:
            return None

        # Dapatkan order items dengan detail produk
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
    """Dapatkan analitik penjualan dan insights"""
    engine = create_cloud_sql_connection()

    with engine.connect() as conn:
        # Total penjualan berdasarkan kategori
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

        # Tren penjualan harian
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

        # Produk terlaris
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

### Konfigurasi Read Replica

```python
# Operasi Read Replica
def setup_read_replica_operations():
    """Demonstrasikan penggunaan read replica"""
    # Koneksi database primary
    primary_engine = create_cloud_sql_connection()

    # Koneksi read replica (host/port berbeda)
    replica_engine = create_read_replica_connection()

    def get_product_inventory():
        """Baca inventory dari replica untuk performa"""
        with replica_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, stock_quantity, price
                FROM products
                WHERE stock_quantity > 0
                ORDER BY stock_quantity DESC
            """))
            return [dict(row) for row in result]

    def process_order_write_operation(order_data):
        """Operasi write ke primary"""
        with primary_engine.begin() as conn:
            # Buat order (write ke primary)
            order_result = conn.execute(text("""
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (%s, %s, 'processing')
            """), (order_data['customer_id'], order_data['total_amount']))

            order_id = order_result.lastrowid

            # Update inventory (write ke primary)
            for item in order_data['items']:
                conn.execute(text("""
                    UPDATE products
                    SET stock_quantity = stock_quantity - %s
                    WHERE id = %s AND stock_quantity >= %s
                """), (item['quantity'], item['product_id'], item['quantity']))

            return order_id

    def generate_reports():
        """Query analitik kompleks menggunakan replica"""
        with replica_engine.connect() as conn:
            # Query agregasi kompleks
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
    """Buat koneksi ke read replica"""
    # Dalam praktiknya, ini akan connect ke instance replica
    # Untuk demonstrasi, menggunakan koneksi yang sama (dalam skenario nyata, host berbeda)
    return create_cloud_sql_connection()
```

### Operasi Backup dan Restore

```python
# Operasi Backup dan Restore
import datetime
from google.cloud import storage

def create_manual_backup():
    """Buat backup manual dari instance Cloud SQL"""
    import subprocess

    instance_name = 'ecommerce-db-instance'
    backup_name = f"manual-backup-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # Buat backup
    cmd = [
        'gcloud', 'sql', 'backups', 'create',
        backup_name,
        '--instance', instance_name,
        '--description', f'Backup manual dibuat pada {datetime.datetime.now()}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Backup berhasil dibuat: {backup_name}")
        return backup_name
    else:
        raise Exception(f"Backup gagal: {result.stderr}")

def export_database_to_gcs():
    """Export database ke Cloud Storage"""
    bucket_name = 'ecommerce-backups'
    instance_name = 'ecommerce-db-instance'
    database_name = 'ecommerce_db'

    export_file = f"gs://{bucket_name}/exports/{database_name}-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}.sql.gz"

    # Export database
    cmd = [
        'gcloud', 'sql', 'export', 'sql', instance_name,
        export_file,
        '--database', database_name,
        '--offload'  # Export tanpa blocking database
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database diexport ke: {export_file}")
        return export_file
    else:
        raise Exception(f"Export gagal: {result.stderr}")

def restore_from_backup(backup_name):
    """Restore dari backup"""
    instance_name = 'ecommerce-db-instance'

    cmd = [
        'gcloud', 'sql', 'backups', 'restore', backup_name,
        '--restore-instance', instance_name,
        '--backup-instance', instance_name
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database direstore dari backup: {backup_name}")
    else:
        raise Exception(f"Restore gagal: {result.stderr}")

def import_from_gcs(import_file):
    """Import database dari Cloud Storage"""
    instance_name = 'ecommerce-db-instance'
    database_name = 'ecommerce_db'

    cmd = [
        'gcloud', 'sql', 'import', 'sql', instance_name,
        import_file,
        '--database', database_name
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database diimport dari: {import_file}")
    else:
        raise Exception(f"Import gagal: {result.stderr}")

def setup_automated_backups():
    """Konfigurasi pengaturan backup otomatis"""
    instance_name = 'ecommerce-db-instance'

    # Aktifkan backup otomatis dengan retensi 7 hari
    cmd = [
        'gcloud', 'sql', 'instances', 'patch', instance_name,
        '--backup-start-time', '02:00',  # Harian pukul 2 pagi
        '--retained-backups-count', '7'  # Simpan 7 hari backup
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("Backup otomatis berhasil dikonfigurasi")
    else:
        raise Exception(f"Konfigurasi backup gagal: {result.stderr}")
```

### Konfigurasi Terraform

```hcl
# Konfigurasi Instance Cloud SQL
resource "google_sql_database_instance" "ecommerce_db" {
  name             = "ecommerce-db-instance"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"  # Mulai kecil, skalakan sesuai kebutuhan

    disk_type = "PD_SSD"
    disk_size = 10  # GB

    backup_configuration {
      enabled    = true
      start_time = "02:00"  # Harian pukul 2 pagi
      location   = "us-central1"
    }

    maintenance_window {
      day  = 7  # Minggu
      hour = 3  # Pukul 3 pagi
    }

    ip_configuration {
      ipv4_enabled = true

      authorized_networks {
        name  = "office-network"
        value = "192.168.1.0/24"
      }

      # Untuk akses VPC-only
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

# Pembuatan Database
resource "google_sql_database" "ecommerce_database" {
  name     = "ecommerce_database"
  instance = google_sql_database_instance.ecommerce_db.name
  charset  = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}

# User Database
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
      ipv4_enabled = false  # Replica bisa private-only
    }
  }

  deletion_protection = false  # Replica bisa dibuat ulang
}

# Konfigurasi Ketersediaan Tinggi
resource "google_sql_database_instance" "ecommerce_db_ha" {
  name             = "ecommerce-db-ha-instance"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-n1-standard-1"

    availability_type = "REGIONAL"  # Ketersediaan tinggi

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

# Konfigurasi Private IP (VPC)
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

# Monitoring dan Alerting
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

## Praktik Terbaik

- Pilih ukuran instance yang sesuai berdasarkan kebutuhan workload
- Gunakan storage SSD untuk performa lebih baik
- Aktifkan backup otomatis dengan retensi yang sesuai
- Konfigurasi maintenance window selama periode traffic rendah
- Gunakan read replicas untuk menskalakan operasi baca
- Implementasikan connection pooling untuk mengelola koneksi database
- Monitor metrik performa dan siapkan alerts
- Gunakan private IP addresses untuk keamanan yang lebih baik
- Implementasikan indexing yang tepat untuk optimasi query
- Secara teratur review dan optimasi slow queries
- Gunakan database flags untuk tune performa
- Implementasikan strategi backup dan disaster recovery yang tepat
- Monitor penggunaan storage dan rencanakan pertumbuhan
- Gunakan maintenance windows untuk updates dan upgrades

### Optimasi Performa

```bash
# Monitor performa database
gcloud sql instances describe ecommerce-db-instance --format="table(name,state,databaseVersion,settings.tier)"

# Periksa database flags
gcloud sql instances describe ecommerce-db-instance --format="table(settings.databaseFlags)"

# Monitor koneksi
gcloud sql instances describe ecommerce-db-instance --format="value(settings.maxConnections)"

# Periksa status backup
gcloud sql backups list --instance=ecommerce-db-instance

# Monitor penggunaan disk
gcloud sql instances describe ecommerce-db-instance --format="value(settings.diskSize)"

# Skalakan instance naik
gcloud sql instances patch ecommerce-db-instance --tier=db-n1-standard-2

# Aktifkan query insights
gcloud sql instances patch ecommerce-db-instance --insights-config-query-insights-enabled

# Periksa slow queries
gcloud sql instances describe ecommerce-db-instance --format="value(settings.insightsConfig)"
```

### Optimasi Biaya

```bash
# Monitor biaya Cloud SQL
gcloud billing accounts list
gcloud alpha billing budgets create cloudsql-budget \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Cloud SQL Budget" \
  --budget-amount=500 \
  --threshold-rule=percent=80

# Gunakan committed use discounts untuk workload predictable
gcloud sql instances patch ecommerce-db-instance --tier=db-n1-standard-1

# Jadwalkan stop/start instance untuk development
gcloud sql instances patch ecommerce-db-instance --activation-policy=NEVER

# Gunakan instance lebih kecil selama off-hours
gcloud sql instances patch ecommerce-db-instance --tier=db-f1-micro

# Monitor biaya storage
gcloud sql instances describe ecommerce-db-instance --format="value(settings.diskSize)"
```

## Pertimbangan Keamanan

- Gunakan private IP addresses dan VPC peering
- Implementasikan IAM roles dan permissions yang tepat
- Aktifkan database auditing dan logging
- Gunakan customer-managed encryption keys
- Implementasikan proper network security groups
- Putar password database secara teratur
- Gunakan SSL/TLS untuk koneksi database
- Implementasikan kontrol akses yang tepat
- Aktifkan Cloud SQL Auth Proxy untuk koneksi aman
- Monitor upaya akses tidak sah
- Gunakan database firewalls dan IP whitelisting
- Implementasikan enkripsi backup yang tepat
- Terapkan security patches dan updates secara teratur

## Cloud SQL vs Layanan Database Lain

| Fitur | Cloud SQL | Cloud Spanner | BigQuery | Cloud Firestore |
|-------|-----------|---------------|----------|-----------------|
| Model Data | Relasional | Relasional | Analitik | Dokumen |
| Konsistensi | Kuat | Kuat | Eventual | Kuat |
| Skalabilitas | Vertikal | Horizontal | Masif | Horizontal |
| Transaksi | ACID | ACID | Tidak | ACID |
| Dukungan SQL | Penuh | Penuh | SQL-like | Tidak |
| Biaya | Sedang | Tinggi | Rendah | Sedang |
| Kasus Penggunaan | OLTP | Global OLTP | Analitik | Aplikasi NoSQL |

## Kasus Penggunaan Umum

- **Platform E-commerce**: Katalog produk, orders, manajemen inventory
- **Sistem Manajemen Konten**: Data user, penyimpanan konten, metadata
- **Aplikasi Finansial**: Pemrosesan transaksi, audit trails
- **Aplikasi SaaS**: Isolasi data multi-tenant, manajemen user
- **Aplikasi Analitik**: Data warehousing, database reporting
- **Migrasi Aplikasi Legacy**: Lift-and-shift migrasi database
- **Aplikasi Web**: Autentikasi user, manajemen session
- **Aplikasi IoT**: Penyimpanan data sensor, data time-series
- **Aplikasi Gaming**: Data pemain, game state, leaderboards
- **Aplikasi Healthcare**: Rekam medis pasien, manajemen data medis