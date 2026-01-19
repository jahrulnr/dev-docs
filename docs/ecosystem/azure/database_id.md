# Layanan Database Azure

## Gambaran Umum

Layanan Database Azure menyediakan rangkaian lengkap database terkelola yang dapat diskalakan dan aman yang mendukung berbagai model data dan beban kerja. Layanan ini menghilangkan kebutuhan manajemen infrastruktur sambil memberikan performa enterprise-grade, keamanan, dan kepatuhan fitur.

## Konsep Utama

### Tipe Database
- **Database Relasional**: Data terstruktur dengan transaksi ACID
- **Database NoSQL**: Skema fleksibel untuk data tidak terstruktur dan semi-terstruktur
- **Data Warehouse**: Database yang dioptimalkan untuk analitik dan pelaporan
- **Database In-Memory**: Akses data ultra-cepat dengan caching
- **Database Graph**: Pemodelan data berfokus pada hubungan

### Model Layanan
- **PaaS (Platform as a Service)**: Database terkelola penuh dengan penskalaan otomatis
- **IaaS (Infrastructure as a Service)**: Mesin virtual dengan perangkat lunak database
- **Serverless**: Penskalaan berbasis konsumsi tanpa manajemen infrastruktur

### Fitur Utama
- **High Availability**: Redundansi bawaan dan failover otomatis
- **Keamanan**: Enkripsi, kontrol akses, dan sertifikasi kepatuhan
- **Performa**: Penyetelan otomatis, pengindeksan, dan optimasi query
- **Skalabilitas**: Kemampuan penskalaan vertikal dan horizontal
- **Backup & Recovery**: Backup otomatis dan pemulihan point-in-time
- **Monitoring**: Metrik komprehensif dan alerting

## Kapan Menggunakan

- **Azure SQL Database**: Beban kerja relasional tradisional, query kompleks, transaksi ACID
- **Azure Database for PostgreSQL**: Kompatibilitas PostgreSQL open-source, data geospasial
- **Azure Database for MySQL**: Kompatibilitas MySQL, aplikasi web, stack LAMP
- **Azure Cosmos DB**: Distribusi global, model data multi, persyaratan latensi rendah
- **Azure Synapse Analytics**: Analitik skala besar, data warehousing, pemrosesan big data
- **Azure Cache for Redis**: Caching performa tinggi, penyimpanan session, analitik real-time
- **Azure Database for MariaDB**: Kompatibilitas MariaDB, fitur didorong komunitas

## Contoh

### Azure SQL Database

```bash
# Membuat Azure SQL Server
az sql server create \
  --name ecommerce-sql-server \
  --resource-group ecommerce-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password "ComplexPassword123!"

# Membuat Azure SQL Database
az sql db create \
  --resource-group ecommerce-rg \
  --server ecommerce-sql-server \
  --name ecommerce-db \
  --service-objective S1 \
  --backup-storage-redundancy Local

# Mengkonfigurasi firewall rules
az sql server firewall-rule create \
  --resource-group ecommerce-rg \
  --server ecommerce-sql-server \
  --name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Membuat skema database
sqlcmd -S ecommerce-sql-server.database.windows.net \
  -U sqladmin@ecommerce-sql-server \
  -P "ComplexPassword123!" \
  -d ecommerce-db \
  -i create_schema.sql

# Mengaktifkan Advanced Data Security
az sql db threat-policy update \
  --resource-group ecommerce-rg \
  --server ecommerce-sql-server \
  --name ecommerce-db \
  --state Enabled \
  --email-account-admins true
```

```sql
-- Skema database untuk e-commerce
CREATE DATABASE ECommerceDB;
GO

USE ECommerceDB;
GO

-- Membuat tabel customers
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Phone NVARCHAR(20),
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedDate DATETIME2 DEFAULT GETUTCDATE()
);

-- Membuat tabel products
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    SKU NVARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Category NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedDate DATETIME2 DEFAULT GETUTCDATE()
);

-- Membuat tabel orders
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
    OrderDate DATETIME2 DEFAULT GETUTCDATE(),
    Status NVARCHAR(50) DEFAULT 'Pending',
    TotalAmount DECIMAL(10,2) NOT NULL,
    ShippingAddress NVARCHAR(MAX),
    BillingAddress NVARCHAR(MAX),
    PaymentMethod NVARCHAR(100),
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedDate DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

-- Membuat tabel order items
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Membuat indeks untuk performa
CREATE INDEX IX_Customers_Email ON Customers(Email);
CREATE INDEX IX_Products_Category ON Products(Category);
CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
CREATE INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);

-- Membuat stored procedures
CREATE PROCEDURE GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SELECT
        o.OrderID,
        o.OrderNumber,
        o.OrderDate,
        o.Status,
        o.TotalAmount,
        COUNT(oi.OrderItemID) as ItemCount
    FROM Orders o
    LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
    WHERE o.CustomerID = @CustomerID
    GROUP BY o.OrderID, o.OrderNumber, o.OrderDate, o.Status, o.TotalAmount
    ORDER BY o.OrderDate DESC;
END;
GO

CREATE PROCEDURE UpdateProductStock
    @ProductID INT,
    @QuantityChange INT
AS
BEGIN
    UPDATE Products
    SET StockQuantity = StockQuantity + @QuantityChange,
        UpdatedDate = GETUTCDATE()
    WHERE ProductID = @ProductID;
END;
GO

-- Membuat triggers untuk audit logging
CREATE TABLE AuditLog (
    AuditID INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(100),
    Operation NVARCHAR(10),
    RecordID INT,
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    ChangedBy NVARCHAR(100),
    ChangedDate DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TRIGGER TR_Customers_Audit
ON Customers
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    DECLARE @Operation NVARCHAR(10);
    DECLARE @RecordID INT;

    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @Operation = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @Operation = 'INSERT';
    ELSE IF EXISTS(SELECT * FROM deleted)
        SET @Operation = 'DELETE';

    IF @Operation IN ('INSERT', 'UPDATE')
        SELECT @RecordID = CustomerID FROM inserted;
    ELSE
        SELECT @RecordID = CustomerID FROM deleted;

    INSERT INTO AuditLog (TableName, Operation, RecordID, ChangedBy)
    VALUES ('Customers', @Operation, @RecordID, SYSTEM_USER);
END;
GO
```

```python
# Script Python untuk operasi Azure SQL Database
import pyodbc
import json
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from contextlib import contextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Customer:
    customer_id: Optional[int]
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]

@dataclass
class Product:
    product_id: Optional[int]
    sku: str
    name: str
    description: Optional[str]
    price: float
    stock_quantity: int
    category: Optional[str]
    is_active: bool

@dataclass
class Order:
    order_id: Optional[int]
    customer_id: int
    order_number: str
    status: str
    total_amount: float
    shipping_address: Optional[str]
    billing_address: Optional[str]
    payment_method: Optional[str]

class ECommerceDatabase:
    def __init__(self, server: str, database: str, username: str, password: str):
        self.connection_string = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
            "Encrypt=yes;"
            "TrustServerCertificate=no;"
            "Connection Timeout=30;"
        )

    @contextmanager
    def get_connection(self):
        """Context manager untuk koneksi database"""
        conn = None
        try:
            conn = pyodbc.connect(self.connection_string)
            yield conn
        except Exception as e:
            logger.error(f"Error koneksi database: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()

    def create_customer(self, customer: Customer) -> int:
        """Membuat customer baru"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO Customers (Email, FirstName, LastName, Phone)
                    VALUES (?, ?, ?, ?);
                    SELECT SCOPE_IDENTITY();
                """, (customer.email, customer.first_name,
                      customer.last_name, customer.phone))

                customer_id = cursor.fetchone()[0]
                conn.commit()

                logger.info(f"Customer dibuat: {customer_id}")
                return customer_id

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat customer: {str(e)}")
                raise

    def get_customer(self, customer_id: int) -> Optional[Customer]:
        """Mendapatkan customer berdasarkan ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT CustomerID, Email, FirstName, LastName, Phone
                FROM Customers
                WHERE CustomerID = ?
            """, (customer_id,))

            row = cursor.fetchone()
            if row:
                return Customer(*row)
            return None

    def create_product(self, product: Product) -> int:
        """Membuat produk baru"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO Products (SKU, Name, Description, Price, StockQuantity, Category, IsActive)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                    SELECT SCOPE_IDENTITY();
                """, (product.sku, product.name, product.description,
                      product.price, product.stock_quantity,
                      product.category, product.is_active))

                product_id = cursor.fetchone()[0]
                conn.commit()

                logger.info(f"Produk dibuat: {product_id}")
                return product_id

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat produk: {str(e)}")
                raise

    def update_product_stock(self, product_id: int, quantity_change: int) -> bool:
        """Update jumlah stok produk"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    EXEC UpdateProductStock @ProductID = ?, @QuantityChange = ?
                """, (product_id, quantity_change))

                conn.commit()
                logger.info(f"Stok produk {product_id} diupdate: {quantity_change}")
                return True

            except Exception as e:
                conn.rollback()
                logger.error(f"Error update stok produk: {str(e)}")
                raise

    def create_order(self, order: Order, items: List[Dict]) -> int:
        """Membuat order baru dengan items"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                # Membuat order
                cursor.execute("""
                    INSERT INTO Orders (CustomerID, OrderNumber, Status, TotalAmount,
                                      ShippingAddress, BillingAddress, PaymentMethod)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                    SELECT SCOPE_IDENTITY();
                """, (order.customer_id, order.order_number, order.status,
                      order.total_amount, order.shipping_address,
                      order.billing_address, order.payment_method))

                order_id = cursor.fetchone()[0]

                # Membuat order items
                for item in items:
                    cursor.execute("""
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice, TotalPrice)
                        VALUES (?, ?, ?, ?, ?)
                    """, (order_id, item['product_id'], item['quantity'],
                          item['unit_price'], item['total_price']))

                    # Update stok produk
                    self.update_product_stock(item['product_id'], -item['quantity'])

                conn.commit()

                logger.info(f"Order dibuat: {order_id}")
                return order_id

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat order: {str(e)}")
                raise

    def get_customer_orders(self, customer_id: int) -> List[Dict]:
        """Mendapatkan semua order untuk customer"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                EXEC GetCustomerOrders @CustomerID = ?
            """, (customer_id,))

            columns = [column[0] for column in cursor.description]
            orders = []

            for row in cursor.fetchall():
                order_dict = dict(zip(columns, row))
                orders.append(order_dict)

            return orders

    def get_sales_report(self, start_date: str, end_date: str) -> Dict:
        """Membuat laporan penjualan"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    COUNT(DISTINCT o.OrderID) as TotalOrders,
                    COUNT(oi.OrderItemID) as TotalItemsSold,
                    SUM(o.TotalAmount) as TotalRevenue,
                    AVG(o.TotalAmount) as AverageOrderValue,
                    COUNT(DISTINCT o.CustomerID) as UniqueCustomers
                FROM Orders o
                LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
                WHERE o.OrderDate BETWEEN ? AND ?
                AND o.Status = 'Completed'
            """, (start_date, end_date))

            row = cursor.fetchone()
            if row:
                return {
                    'total_orders': row[0],
                    'total_items_sold': row[1],
                    'total_revenue': float(row[2]) if row[2] else 0,
                    'average_order_value': float(row[3]) if row[3] else 0,
                    'unique_customers': row[4]
                }
            return {}

# Contoh penggunaan
def main():
    # Konfigurasi database
    db = ECommerceDatabase(
        server="ecommerce-sql-server.database.windows.net",
        database="ecommerce-db",
        username="sqladmin@ecommerce-sql-server",
        password="ComplexPassword123!"
    )

    # Membuat customer
    customer = Customer(
        customer_id=None,
        email="john.doe@example.com",
        first_name="John",
        last_name="Doe",
        phone="+1234567890"
    )

    customer_id = db.create_customer(customer)
    print(f"Customer dibuat dengan ID: {customer_id}")

    # Membuat produk
    products = [
        Product(None, "PROD-001", "Wireless Headphones", "High-quality wireless headphones",
               199.99, 100, "Electronics", True),
        Product(None, "PROD-002", "Bluetooth Speaker", "Portable Bluetooth speaker",
               79.99, 50, "Electronics", True)
    ]

    product_ids = []
    for product in products:
        product_id = db.create_product(product)
        product_ids.append(product_id)
        print(f"Produk dibuat dengan ID: {product_id}")

    # Membuat order
    order = Order(
        order_id=None,
        customer_id=customer_id,
        order_number="ORD-001",
        status="Pending",
        total_amount=279.98,
        shipping_address="123 Main St, City, State 12345",
        billing_address="123 Main St, City, State 12345",
        payment_method="Credit Card"
    )

    order_items = [
        {'product_id': product_ids[0], 'quantity': 1, 'unit_price': 199.99, 'total_price': 199.99},
        {'product_id': product_ids[1], 'quantity': 1, 'unit_price': 79.99, 'total_price': 79.99}
    ]

    order_id = db.create_order(order, order_items)
    print(f"Order dibuat dengan ID: {order_id}")

    # Mendapatkan order customer
    orders = db.get_customer_orders(customer_id)
    print(f"Order customer: {len(orders)}")

    # Membuat laporan penjualan
    from datetime import datetime, timedelta
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    report = db.get_sales_report(start_date, end_date)
    print(f"Laporan penjualan: {report}")

if __name__ == "__main__":
    main()
```

### Azure Cosmos DB

```bash
# Membuat Azure Cosmos DB account
az cosmosdb create \
  --name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --locations regionName="East US" failoverPriority=0 \
  --default-consistency-level "Session" \
  --enable-multiple-write-locations false

# Membuat database
az cosmosdb sql database create \
  --account-name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --name ECommerceDB

# Membuat containers
az cosmosdb sql container create \
  --account-name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --database-name ECommerceDB \
  --name Products \
  --partition-key-path "/category" \
  --throughput 400

az cosmosdb sql container create \
  --account-name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --database-name ECommerceDB \
  --name Orders \
  --partition-key-path "/customerId" \
  --throughput 1000

# Mendapatkan connection string
CONNECTION_STRING=$(az cosmosdb keys list \
  --name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --type connection-strings \
  --query connectionStrings[0].connectionString -o tsv)

echo $CONNECTION_STRING
```

```python
# Script Python untuk operasi Azure Cosmos DB
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.cosmos.database import DatabaseProxy
from azure.cosmos.container import ContainerProxy
import json
import uuid
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CosmosDBService:
    def __init__(self, endpoint: str, key: str, database_name: str):
        self.client = CosmosClient(endpoint, key)
        self.database_name = database_name
        self.database = self._get_or_create_database()
        self.products_container = self._get_or_create_container("Products", "/category")
        self.orders_container = self._get_or_create_container("Orders", "/customerId")
        self.customers_container = self._get_or_create_container("Customers", "/id")

    def _get_or_create_database(self) -> DatabaseProxy:
        """Mendapatkan atau membuat database"""
        try:
            return self.client.create_database_if_not_exists(id=self.database_name)
        except exceptions.CosmosResourceExistsError:
            return self.client.get_database_client(self.database_name)

    def _get_or_create_container(self, container_name: str, partition_key_path: str) -> ContainerProxy:
        """Mendapatkan atau membuat container"""
        try:
            return self.database.create_container_if_not_exists(
                id=container_name,
                partition_key=PartitionKey(path=partition_key_path),
                offer_throughput=400
            )
        except exceptions.CosmosResourceExistsError:
            return self.database.get_container_client(container_name)

    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Membuat produk baru"""
        try:
            product_data['id'] = str(uuid.uuid4())
            product_data['type'] = 'product'
            product_data['createdDate'] = datetime.utcnow().isoformat()
            product_data['updatedDate'] = datetime.utcnow().isoformat()

            response = self.products_container.create_item(body=product_data)
            logger.info(f"Produk dibuat: {response['id']}")
            return response

        except Exception as e:
            logger.error(f"Error membuat produk: {str(e)}")
            raise

    def get_product(self, product_id: str, category: str) -> Optional[Dict[str, Any]]:
        """Mendapatkan produk berdasarkan ID"""
        try:
            query = "SELECT * FROM c WHERE c.id = @id AND c.type = 'product'"
            parameters = [{"name": "@id", "value": product_id}]

            items = list(self.products_container.query_items(
                query=query,
                parameters=parameters,
                partition_key=category
            ))

            return items[0] if items else None

        except Exception as e:
            logger.error(f"Error mendapatkan produk: {str(e)}")
            raise

    def update_product_stock(self, product_id: str, category: str, stock_change: int) -> bool:
        """Update stok produk"""
        try:
            # Mendapatkan produk saat ini
            product = self.get_product(product_id, category)
            if not product:
                raise ValueError(f"Produk tidak ditemukan: {product_id}")

            # Update stok
            product['stockQuantity'] = (product.get('stockQuantity', 0) + stock_change)
            product['updatedDate'] = datetime.utcnow().isoformat()

            # Ganti item
            self.products_container.replace_item(
                item=product_id,
                body=product,
                partition_key=category
            )

            logger.info(f"Stok produk {product_id} diupdate: {stock_change}")
            return True

        except Exception as e:
            logger.error(f"Error update stok produk: {str(e)}")
            raise

    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Membuat customer baru"""
        try:
            customer_id = str(uuid.uuid4())
            customer_data['id'] = customer_id
            customer_data['type'] = 'customer'
            customer_data['createdDate'] = datetime.utcnow().isoformat()
            customer_data['updatedDate'] = datetime.utcnow().isoformat()

            response = self.customers_container.create_item(body=customer_data)
            logger.info(f"Customer dibuat: {customer_id}")
            return response

        except Exception as e:
            logger.error(f"Error membuat customer: {str(e)}")
            raise

    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Membuat order baru"""
        try:
            order_id = str(uuid.uuid4())
            order_data['id'] = order_id
            order_data['type'] = 'order'
            order_data['orderDate'] = datetime.utcnow().isoformat()
            order_data['createdDate'] = datetime.utcnow().isoformat()
            order_data['updatedDate'] = datetime.utcnow().isoformat()

            # Menghitung total amount jika tidak disediakan
            if 'totalAmount' not in order_data:
                total = sum(item['totalPrice'] for item in order_data.get('items', []))
                order_data['totalAmount'] = total

            response = self.orders_container.create_item(body=order_data)

            # Update stok produk untuk setiap item
            for item in order_data.get('items', []):
                self.update_product_stock(
                    item['productId'],
                    item['category'],
                    -item['quantity']
                )

            logger.info(f"Order dibuat: {order_id}")
            return response

        except Exception as e:
            logger.error(f"Error membuat order: {str(e)}")
            raise

    def get_customer_orders(self, customer_id: str) -> List[Dict[str, Any]]:
        """Mendapatkan semua order untuk customer"""
        try:
            query = """
                SELECT * FROM c
                WHERE c.customerId = @customerId AND c.type = 'order'
                ORDER BY c.orderDate DESC
            """
            parameters = [{"name": "@customerId", "value": customer_id}]

            items = list(self.orders_container.query_items(
                query=query,
                parameters=parameters,
                partition_key=customer_id
            ))

            return items

        except Exception as e:
            logger.error(f"Error mendapatkan order customer: {str(e)}")
            raise

    def get_products_by_category(self, category: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """Mendapatkan produk berdasarkan kategori dengan paginasi"""
        try:
            query = """
                SELECT * FROM c
                WHERE c.category = @category AND c.type = 'product'
                ORDER BY c.name
                OFFSET @skip LIMIT @limit
            """
            parameters = [
                {"name": "@category", "value": category},
                {"name": "@skip", "value": skip},
                {"name": "@limit", "value": limit}
            ]

            items = list(self.products_container.query_items(
                query=query,
                parameters=parameters,
                partition_key=category
            ))

            return items

        except Exception as e:
            logger.error(f"Error mendapatkan produk berdasarkan kategori: {str(e)}")
            raise

    def search_products(self, search_term: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Mencari produk berdasarkan nama atau deskripsi"""
        try:
            if category:
                query = """
                    SELECT * FROM c
                    WHERE c.type = 'product'
                    AND c.category = @category
                    AND (CONTAINS(c.name, @searchTerm) OR CONTAINS(c.description, @searchTerm))
                """
                parameters = [
                    {"name": "@category", "value": category},
                    {"name": "@searchTerm", "value": search_term}
                ]
                items = list(self.products_container.query_items(
                    query=query,
                    parameters=parameters,
                    partition_key=category
                ))
            else:
                # Query cross-partition
                query = """
                    SELECT * FROM c
                    WHERE c.type = 'product'
                    AND (CONTAINS(c.name, @searchTerm) OR CONTAINS(c.description, @searchTerm))
                """
                parameters = [{"name": "@searchTerm", "value": search_term}]
                items = list(self.products_container.query_items(
                    query=query,
                    parameters=parameters,
                    enable_cross_partition_query=True
                ))

            return items

        except Exception as e:
            logger.error(f"Error mencari produk: {str(e)}")
            raise

    def get_sales_analytics(self) -> Dict[str, Any]:
        """Mendapatkan analitik penjualan"""
        try:
            # Mendapatkan total order
            query_orders = """
                SELECT VALUE COUNT(1) FROM c WHERE c.type = 'order'
            """
            total_orders = list(self.orders_container.query_items(
                query=query_orders,
                enable_cross_partition_query=True
            ))[0]

            # Mendapatkan total revenue
            query_revenue = """
                SELECT VALUE SUM(c.totalAmount) FROM c WHERE c.type = 'order'
            """
            total_revenue = list(self.orders_container.query_items(
                query=query_revenue,
                enable_cross_partition_query=True
            ))[0] or 0

            # Mendapatkan order berdasarkan status
            query_status = """
                SELECT c.status, COUNT(1) as count
                FROM c
                WHERE c.type = 'order'
                GROUP BY c.status
            """
            status_counts = list(self.orders_container.query_items(
                query=query_status,
                enable_cross_partition_query=True
            ))

            return {
                'totalOrders': total_orders,
                'totalRevenue': total_revenue,
                'ordersByStatus': {item['status']: item['count'] for item in status_counts}
            }

        except Exception as e:
            logger.error(f"Error mendapatkan analitik penjualan: {str(e)}")
            raise

# Contoh penggunaan
def main():
    # Konfigurasi Cosmos DB
    cosmos_service = CosmosDBService(
        endpoint="https://ecommerce-cosmos.documents.azure.com:443/",
        key="your_cosmos_key",
        database_name="ECommerceDB"
    )

    # Membuat produk
    products = [
        {
            'sku': 'PROD-001',
            'name': 'Wireless Headphones',
            'description': 'High-quality wireless headphones',
            'price': 199.99,
            'stockQuantity': 100,
            'category': 'Electronics',
            'isActive': True
        },
        {
            'sku': 'PROD-002',
            'name': 'Bluetooth Speaker',
            'description': 'Portable Bluetooth speaker',
            'price': 79.99,
            'stockQuantity': 50,
            'category': 'Electronics',
            'isActive': True
        }
    ]

    created_products = []
    for product in products:
        created_product = cosmos_service.create_product(product)
        created_products.append(created_product)
        print(f"Produk dibuat: {created_product['name']}")

    # Membuat customer
    customer_data = {
        'email': 'john.doe@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'phone': '+1234567890'
    }

    customer = cosmos_service.create_customer(customer_data)
    print(f"Customer dibuat: {customer['id']}")

    # Membuat order
    order_data = {
        'customerId': customer['id'],
        'orderNumber': 'ORD-001',
        'status': 'Pending',
        'items': [
            {
                'productId': created_products[0]['id'],
                'category': 'Electronics',
                'quantity': 1,
                'unitPrice': 199.99,
                'totalPrice': 199.99
            },
            {
                'productId': created_products[1]['id'],
                'category': 'Electronics',
                'quantity': 1,
                'unitPrice': 79.99,
                'totalPrice': 79.99
            }
        ],
        'shippingAddress': '123 Main St, City, State 12345',
        'billingAddress': '123 Main St, City, State 12345',
        'paymentMethod': 'Credit Card'
    }

    order = cosmos_service.create_order(order_data)
    print(f"Order dibuat: {order['id']}")

    # Mendapatkan order customer
    orders = cosmos_service.get_customer_orders(customer['id'])
    print(f"Customer memiliki {len(orders)} order")

    # Mencari produk
    search_results = cosmos_service.search_products('wireless')
    print(f"Ditemukan {len(search_results)} produk yang cocok dengan 'wireless'")

    # Mendapatkan analitik penjualan
    analytics = cosmos_service.get_sales_analytics()
    print(f"Analitik penjualan: {analytics}")

if __name__ == "__main__":
    main()
```

### Azure Database for PostgreSQL

```bash
# Membuat Azure Database for PostgreSQL server
az postgres server create \
  --name ecommerce-postgres \
  --resource-group ecommerce-rg \
  --location eastus \
  --admin-user postgresadmin \
  --admin-password "ComplexPassword123!" \
  --sku-name GP_Gen5_2 \
  --storage-size 51200 \
  --backup-retention 7 \
  --geo-redundant-backup Disabled \
  --version 13

# Mengkonfigurasi firewall
az postgres server firewall-rule create \
  --resource-group ecommerce-rg \
  --server ecommerce-postgres \
  --name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Membuat database
az postgres db create \
  --resource-group ecommerce-rg \
  --server-name ecommerce-postgres \
  --name ecommerce_db

# Mengaktifkan connection pooling dengan PgBouncer
az postgres server configuration set \
  --name pgbouncer.enabled \
  --resource-group ecommerce-rg \
  --server ecommerce-postgres \
  --value true

# Mengaktifkan query store
az postgres server configuration set \
  --name query_store_capture_mode \
  --resource-group ecommerce-rg \
  --server ecommerce-postgres \
  --value ALL
```

```sql
-- Skema PostgreSQL untuk e-commerce
CREATE DATABASE ecommerce_db;
\c ecommerce_db;

-- Membuat extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Membuat tabel customers
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel products
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100),
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    weight_kg DECIMAL(5,2),
    dimensions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel orders
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(100),
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel order items
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat indeks
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Membuat functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Membuat triggers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Membuat stored procedures
CREATE OR REPLACE PROCEDURE update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity + p_quantity_change,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_customer_orders(p_customer_id UUID)
RETURNS TABLE (
    order_id UUID,
    order_number VARCHAR(50),
    order_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    total_amount DECIMAL(10,2),
    item_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.order_id,
        o.order_number,
        o.order_date,
        o.status,
        o.total_amount,
        COUNT(oi.order_item_id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.order_id, o.order_number, o.order_date, o.status, o.total_amount
    ORDER BY o.order_date DESC;
END;
$$;

-- Membuat views
CREATE VIEW product_inventory AS
SELECT
    product_id,
    sku,
    name,
    stock_quantity,
    CASE
        WHEN stock_quantity = 0 THEN 'Out of Stock'
        WHEN stock_quantity < 10 THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products
WHERE is_active = true;

CREATE VIEW sales_summary AS
SELECT
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE status = 'delivered'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;

-- Memasukkan data sample
INSERT INTO customers (email, first_name, last_name, phone) VALUES
('john.doe@example.com', 'John', 'Doe', '+1234567890'),
('jane.smith@example.com', 'Jane', 'Smith', '+1234567891');

INSERT INTO products (sku, name, description, price, stock_quantity, category, tags) VALUES
('PROD-001', 'Wireless Headphones', 'High-quality wireless headphones', 199.99, 100, 'Electronics', ARRAY['audio', 'wireless']),
('PROD-002', 'Bluetooth Speaker', 'Portable Bluetooth speaker', 79.99, 50, 'Electronics', ARRAY['audio', 'bluetooth', 'portable']),
('PROD-003', 'USB Cable', 'High-speed USB charging cable', 9.99, 200, 'Accessories', ARRAY['usb', 'charging']);
```

```python
# Script Python untuk Azure Database for PostgreSQL
import psycopg2
import psycopg2.extras
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from contextlib import contextmanager
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PostgreSQLService:
    def __init__(self, host: str, database: str, user: str, password: str, port: int = 5432):
        self.connection_params = {
            'host': host,
            'database': database,
            'user': user,
            'password': password,
            'port': port
        }

    @contextmanager
    def get_connection(self):
        """Context manager untuk koneksi database"""
        conn = None
        try:
            conn = psycopg2.connect(**self.connection_params)
            yield conn
        except Exception as e:
            logger.error(f"Error koneksi database: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()

    @contextmanager
    def get_cursor(self):
        """Context manager untuk cursor database"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                yield cursor, conn
            except Exception as e:
                conn.rollback()
                logger.error(f"Error operasi database: {str(e)}")
                raise
            finally:
                cursor.close()

    def create_customer(self, customer_data: Dict[str, Any]) -> str:
        """Membuat customer baru"""
        with self.get_cursor() as (cursor, conn):
            try:
                cursor.execute("""
                    INSERT INTO customers (email, first_name, last_name, phone, date_of_birth)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING customer_id
                """, (
                    customer_data['email'],
                    customer_data.get('firstName'),
                    customer_data.get('lastName'),
                    customer_data.get('phone'),
                    customer_data.get('dateOfBirth')
                ))

                customer_id = cursor.fetchone()['customer_id']
                conn.commit()

                logger.info(f"Customer dibuat: {customer_id}")
                return str(customer_id)

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat customer: {str(e)}")
                raise

    def create_product(self, product_data: Dict[str, Any]) -> str:
        """Membuat produk baru"""
        with self.get_cursor() as (cursor, conn):
            try:
                cursor.execute("""
                    INSERT INTO products (sku, name, description, price, stock_quantity,
                                       category, tags, weight_kg, dimensions)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING product_id
                """, (
                    product_data['sku'],
                    product_data['name'],
                    product_data.get('description'),
                    product_data['price'],
                    product_data.get('stockQuantity', 0),
                    product_data.get('category'),
                    product_data.get('tags', []),
                    product_data.get('weightKg'),
                    json.dumps(product_data.get('dimensions')) if product_data.get('dimensions') else None
                ))

                product_id = cursor.fetchone()['product_id']
                conn.commit()

                logger.info(f"Produk dibuat: {product_id}")
                return str(product_id)

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat produk: {str(e)}")
                raise

    def update_product_stock(self, product_id: str, quantity_change: int) -> bool:
        """Update stok produk"""
        with self.get_cursor() as (cursor, conn):
            try:
                cursor.execute("CALL update_product_stock(%s, %s)", (product_id, quantity_change))
                conn.commit()

                logger.info(f"Stok produk {product_id} diupdate: {quantity_change}")
                return True

            except Exception as e:
                conn.rollback()
                logger.error(f"Error update stok produk: {str(e)}")
                raise

    def create_order(self, order_data: Dict[str, Any]) -> str:
        """Membuat order baru"""
        with self.get_cursor() as (cursor, conn):
            try:
                # Membuat order
                cursor.execute("""
                    INSERT INTO orders (customer_id, order_number, status, total_amount,
                                      shipping_address, billing_address, payment_method,
                                      shipping_method, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING order_id
                """, (
                    order_data['customerId'],
                    order_data['orderNumber'],
                    order_data.get('status', 'pending'),
                    order_data['totalAmount'],
                    json.dumps(order_data.get('shippingAddress')),
                    json.dumps(order_data.get('billingAddress')),
                    order_data.get('paymentMethod'),
                    order_data.get('shippingMethod'),
                    order_data.get('notes')
                ))

                order_id = cursor.fetchone()['order_id']

                # Membuat order items
                for item in order_data.get('items', []):
                    cursor.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        order_id,
                        item['productId'],
                        item['quantity'],
                        item['unitPrice'],
                        item['totalPrice']
                    ))

                    # Update stok produk
                    self.update_product_stock(item['productId'], -item['quantity'])

                conn.commit()

                logger.info(f"Order dibuat: {order_id}")
                return str(order_id)

            except Exception as e:
                conn.rollback()
                logger.error(f"Error membuat order: {str(e)}")
                raise

    def get_customer_orders(self, customer_id: str) -> List[Dict[str, Any]]:
        """Mendapatkan order customer"""
        with self.get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM get_customer_orders(%s)", (customer_id,))
            orders = [dict(row) for row in cursor.fetchall()]
            return orders

    def search_products(self, search_term: str, category: Optional[str] = None,
                       min_price: Optional[float] = None, max_price: Optional[float] = None) -> List[Dict[str, Any]]:
        """Mencari produk dengan filter"""
        with self.get_cursor() as (cursor, conn):
            query = """
                SELECT product_id, sku, name, description, price, stock_quantity, category, tags
                FROM products
                WHERE is_active = true
                AND (name ILIKE %s OR description ILIKE %s)
            """
            params = [f'%{search_term}%', f'%{search_term}%']

            if category:
                query += " AND category = %s"
                params.append(category)

            if min_price is not None:
                query += " AND price >= %s"
                params.append(min_price)

            if max_price is not None:
                query += " AND price <= %s"
                params.append(max_price)

            query += " ORDER BY name"

            cursor.execute(query, params)
            products = [dict(row) for row in cursor.fetchall()]
            return products

    def get_inventory_status(self) -> List[Dict[str, Any]]:
        """Mendapatkan status inventory"""
        with self.get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM product_inventory")
            inventory = [dict(row) for row in cursor.fetchall()]
            return inventory

    def get_sales_summary(self, months: int = 12) -> List[Dict[str, Any]]:
        """Mendapatkan ringkasan penjualan untuk N bulan terakhir"""
        with self.get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT * FROM sales_summary
                WHERE month >= CURRENT_DATE - INTERVAL '%s months'
            """, (months,))
            summary = [dict(row) for row in cursor.fetchall()]
            return summary

    def get_popular_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Mendapatkan produk populer berdasarkan penjualan"""
        with self.get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT
                    p.product_id,
                    p.name,
                    p.sku,
                    SUM(oi.quantity) as total_sold,
                    SUM(oi.total_price) as total_revenue
                FROM products p
                JOIN order_items oi ON p.product_id = oi.product_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE o.status = 'delivered'
                GROUP BY p.product_id, p.name, p.sku
                ORDER BY total_sold DESC
                LIMIT %s
            """, (limit,))
            products = [dict(row) for row in cursor.fetchall()]
            return products

# Contoh penggunaan
def main():
    # Konfigurasi PostgreSQL
    pg_service = PostgreSQLService(
        host="ecommerce-postgres.postgres.database.azure.com",
        database="ecommerce_db",
        user="postgresadmin@ecommerce-postgres",
        password="ComplexPassword123!",
        port=5432
    )

    # Membuat customer
    customer_data = {
        'email': 'john.doe@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'phone': '+1234567890'
    }

    customer_id = pg_service.create_customer(customer_data)
    print(f"Customer dibuat: {customer_id}")

    # Membuat produk
    products_data = [
        {
            'sku': 'PROD-001',
            'name': 'Wireless Headphones',
            'description': 'High-quality wireless headphones',
            'price': 199.99,
            'stockQuantity': 100,
            'category': 'Electronics',
            'tags': ['audio', 'wireless'],
            'weightKg': 0.3,
            'dimensions': {'length': 20, 'width': 15, 'height': 8}
        },
        {
            'sku': 'PROD-002',
            'name': 'Bluetooth Speaker',
            'description': 'Portable Bluetooth speaker',
            'price': 79.99,
            'stockQuantity': 50,
            'category': 'Electronics',
            'tags': ['audio', 'bluetooth', 'portable']
        }
    ]

    product_ids = []
    for product in products_data:
        product_id = pg_service.create_product(product)
        product_ids.append(product_id)
        print(f"Produk dibuat: {product_id}")

    # Membuat order
    order_data = {
        'customerId': customer_id,
        'orderNumber': 'ORD-001',
        'status': 'pending',
        'totalAmount': 279.98,
        'items': [
            {
                'productId': product_ids[0],
                'quantity': 1,
                'unitPrice': 199.99,
                'totalPrice': 199.99
            },
            {
                'productId': product_ids[1],
                'quantity': 1,
                'unitPrice': 79.99,
                'totalPrice': 79.99
            }
        ],
        'shippingAddress': {
            'street': '123 Main St',
            'city': 'Anytown',
            'state': 'CA',
            'zipCode': '12345'
        },
        'billingAddress': {
            'street': '123 Main St',
            'city': 'Anytown',
            'state': 'CA',
            'zipCode': '12345'
        },
        'paymentMethod': 'Credit Card',
        'shippingMethod': 'Standard'
    }

    order_id = pg_service.create_order(order_data)
    print(f"Order dibuat: {order_id}")

    # Mencari produk
    search_results = pg_service.search_products('wireless')
    print(f"Ditemukan {len(search_results)} produk yang cocok dengan 'wireless'")

    # Mendapatkan status inventory
    inventory = pg_service.get_inventory_status()
    print(f"Status inventory: {len(inventory)} produk")

    # Mendapatkan ringkasan penjualan
    sales_summary = pg_service.get_sales_summary(6)
    print(f"Ringkasan penjualan untuk 6 bulan terakhir: {len(sales_summary)} record")

    # Mendapatkan produk populer
    popular_products = pg_service.get_popular_products(5)
    print(f"5 produk populer: {len(popular_products)}")

if __name__ == "__main__":
    main()
```

### Konfigurasi Terraform

```hcl
# Azure SQL Database
resource "azurerm_sql_server" "ecommerce" {
  name                         = "ecommerce-sql-server"
  resource_group_name          = azurerm_resource_group.ecommerce.name
  location                     = azurerm_resource_group.ecommerce.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = "ComplexPassword123!"

  tags = {
    environment = "production"
  }
}

resource "azurerm_sql_database" "ecommerce" {
  name                = "ecommerce-db"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  server_name         = azurerm_sql_server.ecommerce.name
  edition             = "Standard"
  requested_service_objective_name = "S1"

  tags = {
    environment = "production"
  }
}

resource "azurerm_sql_firewall_rule" "allow_azure" {
  name                = "AllowAllAzureIPs"
  resource_group_name = azurerm_resource_group.ecommerce.name
  server_name         = azurerm_sql_server.ecommerce.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Azure Cosmos DB
resource "azurerm_cosmosdb_account" "ecommerce" {
  name                = "ecommerce-cosmos"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  enable_automatic_failover = false

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.ecommerce.location
    failover_priority = 0
  }

  tags = {
    environment = "production"
  }
}

resource "azurerm_cosmosdb_sql_database" "ecommerce" {
  name                = "ECommerceDB"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.ecommerce.name
}

resource "azurerm_cosmosdb_sql_container" "products" {
  name                = "Products"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.ecommerce.name
  database_name       = azurerm_cosmosdb_sql_database.ecommerce.name
  partition_key_path  = "/category"
  throughput          = 400
}

resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "Orders"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.ecommerce.name
  database_name       = azurerm_cosmosdb_sql_database.ecommerce.name
  partition_key_path  = "/customerId"
  throughput          = 1000
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_server" "ecommerce" {
  name                = "ecommerce-postgres"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name

  sku_name = "GP_Gen5_2"

  storage_mb                   = 51200
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  auto_grow_enabled            = true

  administrator_login          = "postgresadmin"
  administrator_login_password = "ComplexPassword123!"
  version                      = "13"
  ssl_enforcement_enabled      = true

  tags = {
    environment = "production"
  }
}

resource "azurerm_postgresql_database" "ecommerce" {
  name                = "ecommerce_db"
  resource_group_name = azurerm_resource_group.ecommerce.name
  server_name         = azurerm_postgresql_server.ecommerce.name
  charset             = "UTF8"
  collation           = "English_United States.1252"
}

resource "azurerm_postgresql_firewall_rule" "allow_azure" {
  name                = "AllowAllAzureIPs"
  resource_group_name = azurerm_resource_group.ecommerce.name
  server_name         = azurerm_postgresql_server.ecommerce.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "ecommerce" {
  name                = "ecommerce-redis"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = {
    environment = "production"
  }
}
```

## Praktik Terbaik

- Pilih layanan database yang sesuai berdasarkan struktur data, persyaratan konsistensi, dan skalabilitas
- Implementasikan strategi pengindeksan yang proper untuk performa query
- Gunakan connection pooling untuk mengelola koneksi database secara efisien
- Implementasikan penanganan error dan logika retry yang proper untuk operasi database
- Gunakan parameterized queries untuk mencegah serangan SQL injection
- Implementasikan strategi backup dan disaster recovery yang proper
- Monitor metrik performa database dan setup alerting
- Gunakan Azure Advisor untuk rekomendasi optimasi performa dan biaya
- Implementasikan langkah-langkah keamanan termasuk enkripsi dan kontrol akses
- Gunakan Azure Key Vault untuk mengelola kredensial database
- Implementasikan logging dan auditing yang proper untuk operasi database
- Gunakan Azure Policy untuk governance dan compliance
- Implementasikan strategi partisi data dan sharding yang proper
- Gunakan Azure Monitor untuk monitoring database komprehensif
- Implementasikan strategi caching yang proper untuk mengurangi beban database
- Gunakan Azure Backup untuk solusi backup otomatis
- Implementasikan kebijakan arsip dan retensi data yang proper
- Gunakan Azure Information Protection untuk data sensitif
- Implementasikan manajemen perubahan yang proper untuk update skema database
- Gunakan Azure DevOps untuk otomasi deployment database
- Implementasikan strategi testing yang proper untuk perubahan database
- Gunakan Azure Cost Management untuk monitoring biaya database
- Implementasikan validasi data dan constraint yang proper
- Gunakan Azure Sentinel untuk monitoring keamanan dan deteksi ancaman

### Optimasi Performa

```bash
# Monitor performa Azure SQL Database
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Sql/servers/ecommerce-sql-server/databases/ecommerce-db \
  --metric "DTUPercentage" \
  --interval PT5M

# Scale Azure SQL Database
az sql db update \
  --resource-group ecommerce-rg \
  --server ecommerce-sql-server \
  --name ecommerce-db \
  --service-objective S2

# Monitor performa Cosmos DB
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.DocumentDB/databaseAccounts/ecommerce-cosmos \
  --metric "TotalRequests" \
  --interval PT5M

# Monitor performa PostgreSQL
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.DBforPostgreSQL/servers/ecommerce-postgres \
  --metric "cpu_percent" \
  --interval PT5M

# Scale PostgreSQL
az postgres server update \
  --name ecommerce-postgres \
  --resource-group ecommerce-rg \
  --sku-name GP_Gen5_4
```

### Optimasi Biaya

```bash
# Setup auto-pausing Azure SQL Database
az sql db update \
  --resource-group ecommerce-rg \
  --server ecommerce-sql-server \
  --name ecommerce-db \
  --auto-pause-delay 60

# Gunakan serverless tier untuk Cosmos DB
az cosmosdb sql container update \
  --account-name ecommerce-cosmos \
  --resource-group ecommerce-rg \
  --database-name ECommerceDB \
  --name Products \
  --autoscale-max-throughput 4000

# Monitor biaya database
az costmanagement query \
  --type "Usage" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --dataset-granularity "Daily" \
  --dataset-aggregation '{"totalCost":{"name":"PreTaxCost","function":"Sum"}}' \
  --timeframe "MonthToDate" \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceType\",\"operator\":\"In\",\"values\":[\"microsoft.sql/servers\",\"microsoft.documentdb/databaseaccounts\",\"microsoft.dbforpostgresql/servers\"]}}]}"
```

## Pertimbangan Keamanan

- Gunakan autentikasi Azure AD untuk akses database
- Implementasikan RBAC dengan prinsip least privilege
- Aktifkan enkripsi at rest dan in transit
- Gunakan Azure Key Vault untuk mengelola kredensial database
- Implementasikan keamanan jaringan dengan integrasi VNet
- Aktifkan Azure Defender untuk SQL dan Cosmos DB
- Implementasikan logging dan monitoring untuk event keamanan
- Gunakan Azure Information Protection untuk data sensitif
- Implementasikan enkripsi backup dan kontrol akses
- Gunakan Azure Policy untuk enforcement compliance
- Implementasikan review akses dan audit yang proper
- Gunakan Azure Sentinel untuk analitik keamanan
- Implementasikan masking data untuk informasi sensitif
- Gunakan Azure Private Link untuk konektivitas aman
- Implementasikan aturan firewall dan restriksi IP yang proper
- Gunakan Azure WAF untuk perlindungan aplikasi web
- Implementasikan konfigurasi SSL/TLS yang proper
- Gunakan enkripsi Azure Backup
- Implementasikan klasifikasi data yang proper
- Gunakan label Azure Information Protection
- Implementasikan audit logging yang proper
- Gunakan Azure Monitor untuk monitoring keamanan

## Perbandingan Azure Database dengan Provider Cloud Lain

| Fitur | Azure Database | AWS Database | GCP Database |
|-------|----------------|--------------|--------------|
| SQL Database | Azure SQL DB | RDS SQL Server | Cloud SQL |
| NoSQL | Cosmos DB | DynamoDB | Firestore |
| PostgreSQL | Azure DB for PostgreSQL | RDS PostgreSQL | Cloud SQL PostgreSQL |
| MySQL | Azure DB for MySQL | RDS MySQL | Cloud SQL MySQL |
| Redis | Azure Cache for Redis | ElastiCache | Memorystore |
| Analytics | Azure Synapse | Redshift | BigQuery |
| Serverless | Ya | Aurora Serverless | Cloud Run SQL |
| Distribusi Global | Cosmos DB | DynamoDB Global Tables | Firestore |
| Model Harga | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |
| Backup | Otomatis | Otomatis | Otomatis |

## Kasus Penggunaan Umum

- **Katalog Produk E-commerce**: Informasi produk, manajemen inventory, fungsi pencarian
- **Manajemen Pesanan**: Pemrosesan pesanan, riwayat pesanan, pelacakan status pesanan
- **Manajemen Customer**: Profil customer, preferensi, riwayat pembelian
- **Manajemen Inventory**: Level stok, titik reorder, manajemen supplier
- **Analitik dan Pelaporan**: Laporan penjualan, insight customer, metrik performa
- **Manajemen Konten**: Posting blog, review produk, konten yang dibuat user
- **Manajemen Session**: Session user, persistensi shopping cart, preferensi user
- **Data Real-time**: Update inventory live, analitik real-time, dashboard live
- **Penyimpanan Data IoT**: Data sensor, telemetri device, data time-series
- **Aplikasi Geospasial**: Layanan berbasis lokasi, mapping, geofencing
- **Manajemen Dokumen**: Penyimpanan file, manajemen metadata, fungsi pencarian
- **Layer Caching**: Penyimpanan session, data yang sering diakses, response API
- **Data Warehousing**: Analisis data historis, business intelligence, pelaporan
- **Machine Learning**: Penyimpanan data training, serving model, hasil prediksi
- **Aplikasi Multi-tenant**: Isolasi tenant, partisi data, manajemen resource
- **Event Sourcing**: Penyimpanan event, audit trail, query temporal