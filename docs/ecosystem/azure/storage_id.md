# Azure Storage Services

## Gambaran Umum

Azure Storage menyediakan penyimpanan cloud yang sangat tersedia, massively scalable, durable, dan aman untuk berbagai objek data di cloud. Ini menawarkan rangkaian lengkap layanan penyimpanan yang mendukung solusi data lake modern, platform analytics, high-performance computing, dan aplikasi machine learning.

## Konsep Utama

### Layanan Inti
- **Blob Storage**: Penyimpanan objek untuk data tidak terstruktur seperti gambar, video, dan dokumen
- **File Storage**: File share terkelola menggunakan protokol SMB
- **Queue Storage**: Message queuing untuk messaging yang reliable antara komponen aplikasi
- **Table Storage**: NoSQL key-value store untuk pengembangan cepat menggunakan dataset semi-terstruktur yang besar
- **Disk Storage**: Persistent, high-performance block storage untuk Azure VMs

### Storage Tiers
- **Hot**: Data yang sering diakses dengan latency rendah dan throughput tinggi
- **Cool**: Data yang jarang diakses dengan biaya penyimpanan lebih rendah
- **Archive**: Data yang sangat jarang diakses dengan biaya penyimpanan terendah tetapi biaya akses lebih tinggi
- **Premium**: SSD-based storage untuk workload high-performance

### Data Management
- **Lifecycle Management**: Pergerakan data otomatis antar tier berdasarkan pola akses
- **Data Protection**: Built-in redundancy, backup, dan disaster recovery
- **Security**: Enkripsi saat rest dan in transit, role-based access control
- **Monitoring**: Metrik komprehensif dan logging untuk operasi storage

## Kapan Menggunakan

- **Blob Storage**: File media, backup, data lakes, hosting website statis
- **File Storage**: Lift-and-shift applications, akses file bersama, aplikasi legacy
- **Queue Storage**: Decoupling komponen aplikasi, load leveling, pemrosesan asynchronous
- **Table Storage**: Data user, informasi device, metadata, data IoT
- **Disk Storage**: VM boot disks, data aplikasi, database

## Contoh

### Azure Blob Storage

```bash
# Buat storage account
az storage account create \
  --name ecommerceblobstorage \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Dapatkan storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group ecommerce-rg \
  --account-name ecommerceblobstorage \
  --query '[0].value' -o tsv)

# Buat container
az storage container create \
  --name product-images \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY

# Upload file
az storage blob upload \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY \
  --container-name product-images \
  --name product-123.jpg \
  --file ./product-123.jpg \
  --metadata "category=electronics" "price=299.99"

# Set blob properties
az storage blob metadata update \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY \
  --container-name product-images \
  --name product-123.jpg \
  --metadata "updated=true"

# Generate SAS token
SAS_TOKEN=$(az storage blob generate-sas \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY \
  --container-name product-images \
  --name product-123.jpg \
  --permissions r \
  --expiry 2024-12-31T23:59Z \
  --https-only \
  --output tsv)

# Download blob
az storage blob download \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY \
  --container-name product-images \
  --name product-123.jpg \
  --file ./downloaded-product.jpg

# List blobs with pattern
az storage blob list \
  --account-name ecommerceblobstorage \
  --account-key $ACCOUNT_KEY \
  --container-name product-images \
  --query "[].{name:name, size:properties.contentLength, lastModified:properties.lastModified}" \
  --output table
```

```python
# Python script untuk operasi Azure Blob Storage
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.storage.blob.models import BlobSasPermissions, ContentSettings
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
import os
import datetime
import logging

class EcommerceBlobStorage:
    def __init__(self, connection_string):
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.logger = logging.getLogger(__name__)

    def create_container(self, container_name):
        """Buat container jika belum ada"""
        try:
            container_client = self.blob_service_client.get_container_client(container_name)
            container_client.create_container()
            self.logger.info(f"Container '{container_name}' berhasil dibuat")
        except ResourceExistsError:
            self.logger.info(f"Container '{container_name}' sudah ada")
        except Exception as e:
            self.logger.error(f"Error membuat container: {str(e)}")
            raise

    def upload_product_image(self, container_name, product_id, image_path, metadata=None):
        """Upload gambar produk ke blob storage"""
        try:
            blob_name = f"products/{product_id}/image.jpg"

            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            # Set content type
            content_settings = ContentSettings(content_type='image/jpeg')

            # Upload dengan metadata
            with open(image_path, 'rb') as data:
                blob_client.upload_blob(
                    data,
                    overwrite=True,
                    content_settings=content_settings,
                    metadata=metadata or {}
                )

            self.logger.info(f"Gambar produk diupload: {blob_name}")
            return blob_name

        except Exception as e:
            self.logger.error(f"Error upload gambar produk: {str(e)}")
            raise

    def generate_sas_url(self, container_name, blob_name, expiry_hours=24):
        """Generate SAS URL untuk akses blob"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            # Generate SAS token
            sas_token = blob_client.generate_shared_access_signature(
                permission=BlobSasPermissions(read=True),
                expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=expiry_hours)
            )

            # Construct full URL
            sas_url = f"{blob_client.url}?{sas_token}"
            return sas_url

        except Exception as e:
            self.logger.error(f"Error generate SAS URL: {str(e)}")
            raise

    def download_blob_to_file(self, container_name, blob_name, download_path):
        """Download blob ke file lokal"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            with open(download_path, 'wb') as download_file:
                download_stream = blob_client.download_blob()
                download_file.write(download_stream.readall())

            self.logger.info(f"Blob didownload ke: {download_path}")

        except Exception as e:
            self.logger.error(f"Error download blob: {str(e)}")
            raise

    def list_blobs_with_metadata(self, container_name, prefix=None):
        """List blobs dengan metadata"""
        try:
            container_client = self.blob_service_client.get_container_client(container_name)

            blobs = []
            for blob in container_client.list_blobs(name_starts_with=prefix):
                blob_info = {
                    'name': blob.name,
                    'size': blob.size,
                    'last_modified': blob.last_modified,
                    'metadata': blob.metadata or {}
                }
                blobs.append(blob_info)

            return blobs

        except Exception as e:
            self.logger.error(f"Error list blobs: {str(e)}")
            raise

    def set_blob_tier(self, container_name, blob_name, tier):
        """Set blob access tier (Hot, Cool, Archive)"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            blob_client.set_standard_blob_tier(tier)
            self.logger.info(f"Blob {blob_name} tier diubah ke {tier}")

        except Exception as e:
            self.logger.error(f"Error set blob tier: {str(e)}")
            raise

    def delete_blob(self, container_name, blob_name):
        """Hapus blob"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            blob_client.delete_blob()
            self.logger.info(f"Blob dihapus: {blob_name}")

        except ResourceNotFoundError:
            self.logger.warning(f"Blob tidak ditemukan: {blob_name}")
        except Exception as e:
            self.logger.error(f"Error hapus blob: {str(e)}")
            raise

    def copy_blob(self, source_container, source_blob, dest_container, dest_blob):
        """Copy blob antar container"""
        try:
            source_blob_client = self.blob_service_client.get_blob_client(
                container=source_container,
                blob=source_blob
            )

            dest_blob_client = self.blob_service_client.get_blob_client(
                container=dest_container,
                blob=dest_blob
            )

            # Start copy operation
            copy_operation = dest_blob_client.start_copy_from_url(source_blob_client.url)

            # Wait for completion
            while True:
                props = dest_blob_client.get_blob_properties()
                if props.copy.status != 'pending':
                    break

            self.logger.info(f"Blob dicopy dari {source_container}/{source_blob} ke {dest_container}/{dest_blob}")

        except Exception as e:
            self.logger.error(f"Error copy blob: {str(e)}")
            raise

# Contoh penggunaan
def main():
    # Initialize storage client
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    storage = EcommerceBlobStorage(connection_string)

    # Buat containers
    storage.create_container('product-images')
    storage.create_container('user-uploads')

    # Upload gambar produk
    storage.upload_product_image(
        'product-images',
        'PROD-123',
        './product-image.jpg',
        metadata={'category': 'electronics', 'price': '299.99'}
    )

    # Generate SAS URL untuk akses
    sas_url = storage.generate_sas_url('product-images', 'products/PROD-123/image.jpg')
    print(f"Access URL: {sas_url}")

    # List blobs
    blobs = storage.list_blobs_with_metadata('product-images')
    for blob in blobs:
        print(f"Blob: {blob['name']}, Size: {blob['size']} bytes")

if __name__ == '__main__':
    main()
```

### Azure File Storage

```bash
# Buat storage account dengan file storage
az storage account create \
  --name ecommercestorage \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Dapatkan storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group ecommerce-rg \
  --account-name ecommercestorage \
  --query '[0].value' -o tsv)

# Buat file share
az storage share create \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --name shared-files \
  --quota 1024

# Upload file ke share
az storage file upload \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --share-name shared-files \
  --source ./config.json \
  --path config/config.json

# Buat directory
az storage directory create \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --share-name shared-files \
  --name logs

# List files
az storage file list \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --share-name shared-files \
  --output table

# Download file
az storage file download \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --share-name shared-files \
  --path config/config.json \
  --dest ./downloaded-config.json
```

```python
# Python script untuk Azure File Storage
from azure.storage.fileshare import ShareServiceClient, ShareClient, ShareFileClient
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
import os
import logging

class EcommerceFileStorage:
    def __init__(self, connection_string):
        self.share_service_client = ShareServiceClient.from_connection_string(connection_string)
        self.logger = logging.getLogger(__name__)

    def create_share(self, share_name, quota_gb=1024):
        """Buat file share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            share_client.create_share(quota=quota_gb)
            self.logger.info(f"Share '{share_name}' dibuat dengan quota {quota_gb}GB")
        except ResourceExistsError:
            self.logger.info(f"Share '{share_name}' sudah ada")
        except Exception as e:
            self.logger.error(f"Error buat share: {str(e)}")
            raise

    def create_directory(self, share_name, directory_path):
        """Buat directory di share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            directory_client = share_client.get_directory_client(directory_path)
            directory_client.create_directory()
            self.logger.info(f"Directory dibuat: {directory_path}")
        except ResourceExistsError:
            self.logger.info(f"Directory sudah ada: {directory_path}")
        except Exception as e:
            self.logger.error(f"Error buat directory: {str(e)}")
            raise

    def upload_file(self, share_name, local_file_path, remote_file_path):
        """Upload file ke share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(remote_file_path)

            with open(local_file_path, 'rb') as source_file:
                file_client.upload_file(source_file)

            self.logger.info(f"File diupload: {remote_file_path}")

        except Exception as e:
            self.logger.error(f"Error upload file: {str(e)}")
            raise

    def download_file(self, share_name, remote_file_path, local_file_path):
        """Download file dari share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(remote_file_path)

            with open(local_file_path, 'wb') as download_file:
                download_stream = file_client.download_file()
                download_file.write(download_stream.readall())

            self.logger.info(f"File didownload: {local_file_path}")

        except Exception as e:
            self.logger.error(f"Error download file: {str(e)}")
            raise

    def list_files(self, share_name, directory_path=""):
        """List files di directory"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            directory_client = share_client.get_directory_client(directory_path)

            files = []
            for item in directory_client.list_directories_and_files():
                file_info = {
                    'name': item.name,
                    'is_directory': hasattr(item, 'is_directory') and item.is_directory,
                    'size': getattr(item, 'size', 0),
                    'last_modified': getattr(item, 'last_modified', None)
                }
                files.append(file_info)

            return files

        except Exception as e:
            self.logger.error(f"Error list files: {str(e)}")
            raise

    def delete_file(self, share_name, file_path):
        """Hapus file dari share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(file_path)
            file_client.delete_file()
            self.logger.info(f"File dihapus: {file_path}")
        except ResourceNotFoundError:
            self.logger.warning(f"File tidak ditemukan: {file_path}")
        except Exception as e:
            self.logger.error(f"Error hapus file: {str(e)}")
            raise

    def get_file_properties(self, share_name, file_path):
        """Dapatkan properti file"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(file_path)
            properties = file_client.get_file_properties()

            return {
                'size': properties.size,
                'last_modified': properties.last_modified,
                'content_type': properties.content_type,
                'metadata': properties.metadata
            }

        except Exception as e:
            self.logger.error(f"Error dapatkan properti file: {str(e)}")
            raise

# Contoh penggunaan
def main():
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    file_storage = EcommerceFileStorage(connection_string)

    # Buat share
    file_storage.create_share('shared-configs', quota_gb=10)

    # Buat directory
    file_storage.create_directory('shared-configs', 'app-configs')

    # Upload file konfigurasi
    file_storage.upload_file(
        'shared-configs',
        './app-config.json',
        'app-configs/production.json'
    )

    # List files
    files = file_storage.list_files('shared-configs', 'app-configs')
    for file_info in files:
        print(f"File: {file_info['name']}, Size: {file_info['size']} bytes")

if __name__ == '__main__':
    main()
```

### Azure Queue Storage

```python
# Azure Queue Storage untuk pemrosesan order
from azure.storage.queue import QueueServiceClient, QueueClient, BinaryBase64EncodePolicy, BinaryBase64DecodePolicy
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
import json
import logging
import time

class OrderQueueProcessor:
    def __init__(self, connection_string):
        self.queue_service_client = QueueServiceClient.from_connection_string(connection_string)
        self.logger = logging.getLogger(__name__)

    def create_queue(self, queue_name):
        """Buat queue jika belum ada"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            queue_client.create_queue()
            self.logger.info(f"Queue '{queue_name}' berhasil dibuat")
        except ResourceExistsError:
            self.logger.info(f"Queue '{queue_name}' sudah ada")
        except Exception as e:
            self.logger.error(f"Error buat queue: {str(e)}")
            raise

    def send_order_message(self, queue_name, order_data):
        """Kirim order ke queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)

            # Convert order data ke JSON
            message_content = json.dumps(order_data)

            # Send message
            queue_client.send_message(message_content)

            self.logger.info(f"Pesan order dikirim ke queue: {order_data.get('order_id')}")

        except Exception as e:
            self.logger.error(f"Error kirim pesan order: {str(e)}")
            raise

    def receive_and_process_orders(self, queue_name, max_messages=10, visibility_timeout=30):
        """Terima dan proses orders dari queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)

            # Receive messages
            messages = queue_client.receive_messages(
                max_messages=max_messages,
                visibility_timeout=visibility_timeout
            )

            processed_count = 0

            for message in messages:
                try:
                    # Parse order data
                    order_data = json.loads(message.content)

                    # Process order
                    self._process_order(order_data)

                    # Delete processed message
                    queue_client.delete_message(message.id, message.pop_receipt)

                    processed_count += 1
                    self.logger.info(f"Order diproses: {order_data.get('order_id')}")

                except Exception as e:
                    self.logger.error(f"Error proses order: {str(e)}")
                    # Message akan visible lagi setelah visibility timeout

            return processed_count

        except Exception as e:
            self.logger.error(f"Error terima messages: {str(e)}")
            raise

    def peek_messages(self, queue_name, max_messages=5):
        """Lihat messages tanpa menghapusnya"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            messages = queue_client.peek_messages(max_messages=max_messages)

            peeked_orders = []
            for message in messages:
                order_data = json.loads(message.content)
                peeked_orders.append(order_data)

            return peeked_orders

        except Exception as e:
            self.logger.error(f"Error peek messages: {str(e)}")
            raise

    def get_queue_length(self, queue_name):
        """Dapatkan jumlah pesan di queue secara approximate"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            properties = queue_client.get_queue_properties()
            return properties.approximate_message_count

        except Exception as e:
            self.logger.error(f"Error dapatkan panjang queue: {str(e)}")
            raise

    def clear_queue(self, queue_name):
        """Hapus semua pesan dari queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            queue_client.clear_messages()
            self.logger.info(f"Queue '{queue_name}' dikosongkan")

        except Exception as e:
            self.logger.error(f"Error kosongkan queue: {str(e)}")
            raise

    def _process_order(self, order_data):
        """Proses order individual (mock implementation)"""
        # Validate order
        if not self._validate_order(order_data):
            raise ValueError(f"Data order tidak valid: {order_data}")

        # Update inventory
        self._update_inventory(order_data.get('items', []))

        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in order_data.get('items', []))

        # Send confirmation email
        self._send_confirmation_email(order_data, total)

        # Log processing
        self.logger.info(f"Order {order_data['order_id']} berhasil diproses")

    def _validate_order(self, order_data):
        """Validate data order"""
        required_fields = ['order_id', 'customer_id', 'items']
        return all(field in order_data for field in required_fields)

    def _update_inventory(self, items):
        """Update inventory (mock implementation)"""
        for item in items:
            self.logger.info(f"Update inventory untuk {item['product_id']}: -{item['quantity']}")

    def _send_confirmation_email(self, order_data, total):
        """Kirim email konfirmasi order (mock implementation)"""
        self.logger.info(f"Kirim email konfirmasi untuk order {order_data['order_id']}")

# Contoh penggunaan
def main():
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    queue_processor = OrderQueueProcessor(connection_string)

    # Buat order queue
    queue_processor.create_queue('orders')

    # Kirim sample orders
    sample_orders = [
        {
            'order_id': 'ORD-001',
            'customer_id': 'CUST-123',
            'items': [
                {'product_id': 'PROD-1', 'quantity': 2, 'price': 29.99},
                {'product_id': 'PROD-2', 'quantity': 1, 'price': 49.99}
            ]
        },
        {
            'order_id': 'ORD-002',
            'customer_id': 'CUST-456',
            'items': [
                {'product_id': 'PROD-3', 'quantity': 1, 'price': 99.99}
            ]
        }
    ]

    for order in sample_orders:
        queue_processor.send_order_message('orders', order)

    # Check panjang queue
    queue_length = queue_processor.get_queue_length('orders')
    print(f"Orders di queue: {queue_length}")

    # Proses orders
    processed = queue_processor.receive_and_process_orders('orders', max_messages=5)
    print(f"Processed {processed} orders")

if __name__ == '__main__':
    main()
```

### Konfigurasi Terraform

```hcl
# Azure Storage Account
resource "azurerm_storage_account" "ecommerce" {
  name                     = "ecommercestorage"
  resource_group_name      = azurerm_resource_group.ecommerce.name
  location                 = azurerm_resource_group.ecommerce.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  # Enable static website hosting
  static_website {
    index_document = "index.html"
    error_404_document = "404.html"
  }

  # Enable blob versioning
  blob_properties {
    versioning_enabled = true

    # Configure lifecycle management
    delete_retention_policy {
      days = 7
    }

    # Storage analytics
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT", "DELETE"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  # File storage properties
  file_properties {
    # SMB settings
    smb {
      versions    = ["SMB3.1.1"]
      authentication_types = ["NTLMv2"]
      kerberos_ticket_encryption = ["AES-256"]
    }
  }

  # Queue properties
  queue_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["*"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }

    # Logging
    logging {
      delete                = true
      read                  = true
      write                 = true
      version               = "1.0"
      retention_policy_days = 7
    }
  }

  tags = {
    environment = "production"
    application = "ecommerce"
  }
}

# Blob Storage Containers
resource "azurerm_storage_container" "product_images" {
  name                  = "product-images"
  storage_account_name  = azurerm_storage_account.ecommerce.name
  container_access_type = "blob"

  metadata = {
    category = "media"
    purpose  = "product-images"
  }
}

resource "azurerm_storage_container" "user_uploads" {
  name                  = "user-uploads"
  storage_account_name  = azurerm_storage_account.ecommerce.name
  container_access_type = "private"

  metadata = {
    category = "user-content"
    purpose  = "user-uploads"
  }
}

resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.ecommerce.name
  container_access_type = "private"

  metadata = {
    category = "logs"
    purpose  = "application-logs"
  }
}

# File Shares
resource "azurerm_storage_share" "shared_configs" {
  name                 = "shared-configs"
  storage_account_name = azurerm_storage_account.ecommerce.name
  quota                = 10

  metadata = {
    category = "configuration"
    purpose  = "shared-application-configs"
  }
}

resource "azurerm_storage_share" "backup_data" {
  name                 = "backup-data"
  storage_account_name = azurerm_storage_account.ecommerce.name
  quota                = 100

  metadata = {
    category = "backup"
    purpose  = "database-backups"
  }
}

# Queues
resource "azurerm_storage_queue" "orders" {
  name                 = "orders"
  storage_account_name = azurerm_storage_account.ecommerce.name

  metadata = {
    category = "messaging"
    purpose  = "order-processing"
  }
}

resource "azurerm_storage_queue" "notifications" {
  name                 = "notifications"
  storage_account_name = azurerm_storage_account.ecommerce.name

  metadata = {
    category = "messaging"
    purpose  = "user-notifications"
  }
}

# Storage Account Network Rules
resource "azurerm_storage_account_network_rules" "ecommerce" {
  storage_account_id = azurerm_storage_account.ecommerce.id

  default_action             = "Deny"
  ip_rules                   = ["100.0.0.1"]
  virtual_network_subnet_ids = [azurerm_subnet.web.id]
  bypass                     = ["AzureServices"]
}

# Lifecycle Management Policy
resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.ecommerce.id

  rule {
    name    = "move-to-cool"
    enabled = true

    filters {
      prefix_match = ["product-images/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than  = 90
        delete_after_days_since_modification_greater_than          = 365
      }

      snapshot {
        delete_after_days_since_creation_greater_than = 30
      }
    }
  }

  rule {
    name    = "delete-logs"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 7
      }
    }
  }
}

# Storage Account Backup
resource "azurerm_backup_protected_file_share" "shared_configs" {
  resource_group_name       = azurerm_resource_group.ecommerce.name
  recovery_vault_name       = azurerm_recovery_services_vault.ecommerce.name
  source_storage_account_id = azurerm_storage_account.ecommerce.id
  source_file_share_name    = azurerm_storage_share.shared_configs.name
  backup_policy_id          = azurerm_backup_policy_file_share.daily.id
}
```

## Praktik Terbaik

- Pilih tipe storage account yang sesuai (General Purpose v2, BlobStorage, dll.)
- Gunakan opsi replikasi yang sesuai (LRS, ZRS, GRS, RA-GRS) berdasarkan kebutuhan durability
- Implementasikan kontrol akses yang tepat menggunakan SAS tokens dan stored access policies
- Gunakan lifecycle management untuk optimasi biaya dengan memindahkan data ke tier yang sesuai
- Aktifkan soft delete untuk perlindungan data blob dan file
- Implementasikan monitoring dan alerting yang tepat untuk metrik storage
- Gunakan Azure Backup untuk perlindungan data kritis
- Implementasikan enkripsi saat rest dan in transit
- Gunakan Azure AD authentication untuk storage accounts
- Implementasikan keamanan jaringan dengan service endpoints dan private endpoints
- Gunakan Azure Monitor untuk analytics storage komprehensif
- Implementasikan tagging yang tepat untuk tracking biaya dan manajemen resource
- Gunakan Azure Policy untuk governance dan compliance
- Implementasikan strategi backup dan disaster recovery yang tepat
- Gunakan Azure Storage Explorer untuk manajemen dan troubleshooting
- Implementasikan error handling dan retry logic yang tepat di aplikasi
- Gunakan batch operations untuk transfer data bulk
- Monitor biaya dan pola penggunaan storage secara regular

### Optimasi Performa

```bash
# Monitor performa storage
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage \
  --metric "Availability" \
  --interval PT1H

# Aktifkan blob analytics logging
az storage logging update \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --services b \
  --log rwd \
  --retention 7

# Set CORS untuk aplikasi web
az storage cors add \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --services b \
  --methods GET POST PUT DELETE \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600

# Konfigurasi static website
az storage blob service-properties update \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --static-website \
  --index-document index.html \
  --error-document-404-path 404.html
```

### Optimasi Biaya

```bash
# Dapatkan penggunaan dan biaya storage
az storage account show-usage \
  --location eastus \
  --query "[].{name:name.currentValue, limit:limit, unit:unit}"

# Set up cost alerts
az monitor metrics alert create \
  --name "storage-cost-alert" \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage \
  --condition "total Egress > 1000000" \
  --action /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/microsoft.insights/actionGroups/storage-alerts \
  --description "Alert ketika egress melebihi 1TB"

# Gunakan reserved capacity untuk premium storage
az storage account update \
  --name ecommercestorage \
  --resource-group ecommerce-rg \
  --access-tier Cool

# Aktifkan lifecycle management
az storage account management-policy create \
  --account-name ecommercestorage \
  --resource-group ecommerce-rg \
  --policy @lifecycle-policy.json
```

## Pertimbangan Keamanan

- Gunakan Azure AD authentication daripada access keys jika memungkinkan
- Implementasikan RBAC yang tepat dengan prinsip least privilege
- Gunakan SAS tokens dengan permission minimal yang diperlukan dan waktu kadaluarsa singkat
- Aktifkan enkripsi saat rest (default) dan in transit
- Gunakan private endpoints untuk akses aman dari virtual networks
- Implementasikan keamanan jaringan dengan NSGs dan firewalls
- Aktifkan Azure Defender for Storage untuk deteksi threat
- Gunakan Azure Key Vault untuk manajemen kunci enkripsi
- Implementasikan logging dan monitoring yang tepat untuk security events
- Gunakan Azure Information Protection untuk klasifikasi data
- Implementasikan prosedur backup dan disaster recovery yang tepat
- Gunakan Azure Policy untuk enforcement compliance
- Implementasikan access reviews dan audits yang tepat
- Gunakan Azure Sentinel untuk security analytics dan incident response

## Azure Storage vs Provider Cloud Lain

| Fitur | Azure Storage | AWS S3 | GCP Cloud Storage |
|-------|---------------|--------|------------------|
| Object Storage | Blob Storage | S3 | Cloud Storage |
| File Storage | Azure Files | EFS/FSx | Filestore |
| Queue Service | Queue Storage | SQS | Pub/Sub |
| Table Storage | Table Storage | DynamoDB | Firestore |
| Pricing Model | Kompetitif | Kompetitif | Kompetitif |
| Global CDN | Azure CDN | CloudFront | Cloud CDN |
| Analytics | Storage Analytics | S3 Analytics | Storage Insights |
| Security | Azure AD, SAS | IAM, Pre-signed URLs | IAM, Signed URLs |

## Kasus Penggunaan Umum

- **Static Website Hosting**: Host website statis dengan global CDN
- **Media Streaming**: Simpan dan stream konten video/audio
- **Backup and Archive**: Retensi data jangka panjang dengan lifecycle policies
- **Big Data Analytics**: Storage data lake untuk workload analytics
- **IoT Data Storage**: Simpan data telemetry dari device IoT
- **Application Logs**: Centralized logging dengan retention policies
- **User-Generated Content**: Simpan upload dan file media user
- **Database Backups**: Automated backup storage dengan geo-redundancy
- **Shared File Access**: SMB file shares untuk aplikasi legacy
- **Message Queuing**: Decouple komponen aplikasi dengan queues
- **Session Storage**: Simpan data session user di tables
- **Configuration Management**: Simpan konfigurasi aplikasi
- **Disaster Recovery**: Geo-redundant storage untuk business continuity