# Azure Storage Services

## Overview

Azure Storage provides highly available, massively scalable, durable, and secure cloud storage for a variety of data objects in the cloud. It offers a comprehensive set of storage services that support modern data lake solutions, analytics platforms, high-performance computing, and machine learning applications.

## Key Concepts

### Core Services
- **Blob Storage**: Object storage for unstructured data like images, videos, and documents
- **File Storage**: Managed file shares using SMB protocol
- **Queue Storage**: Message queuing for reliable messaging between application components
- **Table Storage**: NoSQL key-value store for rapid development using large semi-structured datasets
- **Disk Storage**: Persistent, high-performance block storage for Azure VMs

### Storage Tiers
- **Hot**: Frequently accessed data with low latency and high throughput
- **Cool**: Infrequently accessed data with lower storage costs
- **Archive**: Rarely accessed data with lowest storage costs but higher access costs
- **Premium**: SSD-based storage for high-performance workloads

### Data Management
- **Lifecycle Management**: Automatic data movement between tiers based on access patterns
- **Data Protection**: Built-in redundancy, backup, and disaster recovery
- **Security**: Encryption at rest and in transit, role-based access control
- **Monitoring**: Comprehensive metrics and logging for storage operations

## When to Use

- **Blob Storage**: Media files, backups, data lakes, static website hosting
- **File Storage**: Lift-and-shift applications, shared file access, legacy applications
- **Queue Storage**: Decoupling application components, load leveling, asynchronous processing
- **Table Storage**: User data, device information, metadata, IoT data
- **Disk Storage**: VM boot disks, application data, databases

## Examples

### Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --name ecommerceblobstorage \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group ecommerce-rg \
  --account-name ecommerceblobstorage \
  --query '[0].value' -o tsv)

# Create container
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
# Python script for Azure Blob Storage operations
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
        """Create a container if it doesn't exist"""
        try:
            container_client = self.blob_service_client.get_container_client(container_name)
            container_client.create_container()
            self.logger.info(f"Container '{container_name}' created successfully")
        except ResourceExistsError:
            self.logger.info(f"Container '{container_name}' already exists")
        except Exception as e:
            self.logger.error(f"Error creating container: {str(e)}")
            raise

    def upload_product_image(self, container_name, product_id, image_path, metadata=None):
        """Upload product image to blob storage"""
        try:
            blob_name = f"products/{product_id}/image.jpg"

            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            # Set content type
            content_settings = ContentSettings(content_type='image/jpeg')

            # Upload with metadata
            with open(image_path, 'rb') as data:
                blob_client.upload_blob(
                    data,
                    overwrite=True,
                    content_settings=content_settings,
                    metadata=metadata or {}
                )

            self.logger.info(f"Product image uploaded: {blob_name}")
            return blob_name

        except Exception as e:
            self.logger.error(f"Error uploading product image: {str(e)}")
            raise

    def generate_sas_url(self, container_name, blob_name, expiry_hours=24):
        """Generate SAS URL for blob access"""
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
            self.logger.error(f"Error generating SAS URL: {str(e)}")
            raise

    def download_blob_to_file(self, container_name, blob_name, download_path):
        """Download blob to local file"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            with open(download_path, 'wb') as download_file:
                download_stream = blob_client.download_blob()
                download_file.write(download_stream.readall())

            self.logger.info(f"Blob downloaded to: {download_path}")

        except Exception as e:
            self.logger.error(f"Error downloading blob: {str(e)}")
            raise

    def list_blobs_with_metadata(self, container_name, prefix=None):
        """List blobs with their metadata"""
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
            self.logger.error(f"Error listing blobs: {str(e)}")
            raise

    def set_blob_tier(self, container_name, blob_name, tier):
        """Set blob access tier (Hot, Cool, Archive)"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            blob_client.set_standard_blob_tier(tier)
            self.logger.info(f"Blob {blob_name} tier set to {tier}")

        except Exception as e:
            self.logger.error(f"Error setting blob tier: {str(e)}")
            raise

    def delete_blob(self, container_name, blob_name):
        """Delete a blob"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            blob_client.delete_blob()
            self.logger.info(f"Blob deleted: {blob_name}")

        except ResourceNotFoundError:
            self.logger.warning(f"Blob not found: {blob_name}")
        except Exception as e:
            self.logger.error(f"Error deleting blob: {str(e)}")
            raise

    def copy_blob(self, source_container, source_blob, dest_container, dest_blob):
        """Copy blob between containers"""
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

            self.logger.info(f"Blob copied from {source_container}/{source_blob} to {dest_container}/{dest_blob}")

        except Exception as e:
            self.logger.error(f"Error copying blob: {str(e)}")
            raise

# Usage example
def main():
    # Initialize storage client
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    storage = EcommerceBlobStorage(connection_string)

    # Create containers
    storage.create_container('product-images')
    storage.create_container('user-uploads')

    # Upload product image
    storage.upload_product_image(
        'product-images',
        'PROD-123',
        './product-image.jpg',
        metadata={'category': 'electronics', 'price': '299.99'}
    )

    # Generate SAS URL for access
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
# Create storage account with file storage
az storage account create \
  --name ecommercestorage \
  --resource-group ecommerce-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group ecommerce-rg \
  --account-name ecommercestorage \
  --query '[0].value' -o tsv)

# Create file share
az storage share create \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --name shared-files \
  --quota 1024

# Upload file to share
az storage file upload \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --share-name shared-files \
  --source ./config.json \
  --path config/config.json

# Create directory
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
# Python script for Azure File Storage
from azure.storage.fileshare import ShareServiceClient, ShareClient, ShareFileClient
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
import os
import logging

class EcommerceFileStorage:
    def __init__(self, connection_string):
        self.share_service_client = ShareServiceClient.from_connection_string(connection_string)
        self.logger = logging.getLogger(__name__)

    def create_share(self, share_name, quota_gb=1024):
        """Create file share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            share_client.create_share(quota=quota_gb)
            self.logger.info(f"Share '{share_name}' created with quota {quota_gb}GB")
        except ResourceExistsError:
            self.logger.info(f"Share '{share_name}' already exists")
        except Exception as e:
            self.logger.error(f"Error creating share: {str(e)}")
            raise

    def create_directory(self, share_name, directory_path):
        """Create directory in share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            directory_client = share_client.get_directory_client(directory_path)
            directory_client.create_directory()
            self.logger.info(f"Directory created: {directory_path}")
        except ResourceExistsError:
            self.logger.info(f"Directory already exists: {directory_path}")
        except Exception as e:
            self.logger.error(f"Error creating directory: {str(e)}")
            raise

    def upload_file(self, share_name, local_file_path, remote_file_path):
        """Upload file to share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(remote_file_path)

            with open(local_file_path, 'rb') as source_file:
                file_client.upload_file(source_file)

            self.logger.info(f"File uploaded: {remote_file_path}")

        except Exception as e:
            self.logger.error(f"Error uploading file: {str(e)}")
            raise

    def download_file(self, share_name, remote_file_path, local_file_path):
        """Download file from share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(remote_file_path)

            with open(local_file_path, 'wb') as download_file:
                download_stream = file_client.download_file()
                download_file.write(download_stream.readall())

            self.logger.info(f"File downloaded: {local_file_path}")

        except Exception as e:
            self.logger.error(f"Error downloading file: {str(e)}")
            raise

    def list_files(self, share_name, directory_path=""):
        """List files in directory"""
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
            self.logger.error(f"Error listing files: {str(e)}")
            raise

    def delete_file(self, share_name, file_path):
        """Delete file from share"""
        try:
            share_client = self.share_service_client.get_share_client(share_name)
            file_client = share_client.get_file_client(file_path)
            file_client.delete_file()
            self.logger.info(f"File deleted: {file_path}")
        except ResourceNotFoundError:
            self.logger.warning(f"File not found: {file_path}")
        except Exception as e:
            self.logger.error(f"Error deleting file: {str(e)}")
            raise

    def get_file_properties(self, share_name, file_path):
        """Get file properties"""
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
            self.logger.error(f"Error getting file properties: {str(e)}")
            raise

# Usage example
def main():
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    file_storage = EcommerceFileStorage(connection_string)

    # Create share
    file_storage.create_share('shared-configs', quota_gb=10)

    # Create directory
    file_storage.create_directory('shared-configs', 'app-configs')

    # Upload configuration file
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
# Azure Queue Storage for order processing
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
        """Create queue if it doesn't exist"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            queue_client.create_queue()
            self.logger.info(f"Queue '{queue_name}' created successfully")
        except ResourceExistsError:
            self.logger.info(f"Queue '{queue_name}' already exists")
        except Exception as e:
            self.logger.error(f"Error creating queue: {str(e)}")
            raise

    def send_order_message(self, queue_name, order_data):
        """Send order to queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)

            # Convert order data to JSON
            message_content = json.dumps(order_data)

            # Send message
            queue_client.send_message(message_content)

            self.logger.info(f"Order message sent to queue: {order_data.get('order_id')}")

        except Exception as e:
            self.logger.error(f"Error sending order message: {str(e)}")
            raise

    def receive_and_process_orders(self, queue_name, max_messages=10, visibility_timeout=30):
        """Receive and process orders from queue"""
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
                    self.logger.info(f"Order processed: {order_data.get('order_id')}")

                except Exception as e:
                    self.logger.error(f"Error processing order: {str(e)}")
                    # Message will become visible again after visibility timeout

            return processed_count

        except Exception as e:
            self.logger.error(f"Error receiving messages: {str(e)}")
            raise

    def peek_messages(self, queue_name, max_messages=5):
        """Peek at messages without removing them"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            messages = queue_client.peek_messages(max_messages=max_messages)

            peeked_orders = []
            for message in messages:
                order_data = json.loads(message.content)
                peeked_orders.append(order_data)

            return peeked_orders

        except Exception as e:
            self.logger.error(f"Error peeking messages: {str(e)}")
            raise

    def get_queue_length(self, queue_name):
        """Get approximate number of messages in queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            properties = queue_client.get_queue_properties()
            return properties.approximate_message_count

        except Exception as e:
            self.logger.error(f"Error getting queue length: {str(e)}")
            raise

    def clear_queue(self, queue_name):
        """Clear all messages from queue"""
        try:
            queue_client = self.queue_service_client.get_queue_client(queue_name)
            queue_client.clear_messages()
            self.logger.info(f"Queue '{queue_name}' cleared")

        except Exception as e:
            self.logger.error(f"Error clearing queue: {str(e)}")
            raise

    def _process_order(self, order_data):
        """Process individual order (mock implementation)"""
        # Validate order
        if not self._validate_order(order_data):
            raise ValueError(f"Invalid order data: {order_data}")

        # Update inventory
        self._update_inventory(order_data.get('items', []))

        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in order_data.get('items', []))

        # Send confirmation email
        self._send_confirmation_email(order_data, total)

        # Log processing
        self.logger.info(f"Order {order_data['order_id']} processed successfully")

    def _validate_order(self, order_data):
        """Validate order data"""
        required_fields = ['order_id', 'customer_id', 'items']
        return all(field in order_data for field in required_fields)

    def _update_inventory(self, items):
        """Update inventory (mock implementation)"""
        for item in items:
            self.logger.info(f"Updating inventory for {item['product_id']}: -{item['quantity']}")

    def _send_confirmation_email(self, order_data, total):
        """Send order confirmation email (mock implementation)"""
        self.logger.info(f"Sending confirmation email for order {order_data['order_id']}")

# Usage example
def main():
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    queue_processor = OrderQueueProcessor(connection_string)

    # Create order queue
    queue_processor.create_queue('orders')

    # Send sample orders
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

    # Check queue length
    queue_length = queue_processor.get_queue_length('orders')
    print(f"Orders in queue: {queue_length}")

    # Process orders
    processed = queue_processor.receive_and_process_orders('orders', max_messages=5)
    print(f"Processed {processed} orders")

if __name__ == '__main__':
    main()
```

### Terraform Configuration

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

## Best Practices

- Choose appropriate storage account type (General Purpose v2, BlobStorage, etc.)
- Use appropriate replication options (LRS, ZRS, GRS, RA-GRS) based on durability needs
- Implement proper access controls using SAS tokens and stored access policies
- Use lifecycle management to optimize costs by moving data to appropriate tiers
- Enable soft delete for blob and file data protection
- Implement proper monitoring and alerting for storage metrics
- Use Azure Backup for critical data protection
- Implement encryption at rest and in transit
- Use Azure AD authentication for storage accounts
- Implement proper network security with service endpoints and private endpoints
- Use Azure Monitor for comprehensive storage analytics
- Implement proper tagging for cost tracking and resource management
- Use Azure Policy for governance and compliance
- Implement proper backup and disaster recovery strategies
- Use Azure Storage Explorer for management and troubleshooting
- Implement proper error handling and retry logic in applications
- Use batch operations for bulk data transfers
- Monitor storage costs and usage patterns regularly

### Performance Optimization

```bash
# Monitor storage performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage \
  --metric "Availability" \
  --interval PT1H

# Enable blob analytics logging
az storage logging update \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --services b \
  --log rwd \
  --retention 7

# Set CORS for web applications
az storage cors add \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --services b \
  --methods GET POST PUT DELETE \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600

# Configure static website
az storage blob service-properties update \
  --account-name ecommercestorage \
  --account-key $ACCOUNT_KEY \
  --static-website \
  --index-document index.html \
  --error-document-404-path 404.html
```

### Cost Optimization

```bash
# Get storage usage and costs
az storage account show-usage \
  --location eastus \
  --query "[].{name:name.currentValue, limit:limit, unit:unit}"

# Set up cost alerts
az monitor metrics alert create \
  --name "storage-cost-alert" \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage \
  --condition "total Egress > 1000000" \
  --action /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/microsoft.insights/actionGroups/storage-alerts \
  --description "Alert when egress exceeds 1TB"

# Use reserved capacity for premium storage
az storage account update \
  --name ecommercestorage \
  --resource-group ecommerce-rg \
  --access-tier Cool

# Enable lifecycle management
az storage account management-policy create \
  --account-name ecommercestorage \
  --resource-group ecommerce-rg \
  --policy @lifecycle-policy.json
```

## Security Considerations

- Use Azure AD authentication instead of access keys when possible
- Implement proper RBAC with least privilege principle
- Use SAS tokens with minimal required permissions and short expiration times
- Enable encryption at rest (default) and in transit
- Use private endpoints for secure access from virtual networks
- Implement proper network security with NSGs and firewalls
- Enable Azure Defender for Storage for threat detection
- Use Azure Key Vault for managing encryption keys
- Implement proper logging and monitoring for security events
- Use Azure Information Protection for data classification
- Implement proper backup and disaster recovery procedures
- Use Azure Policy for compliance enforcement
- Implement proper access reviews and audits
- Use Azure Sentinel for security analytics and incident response

## Azure Storage vs Other Cloud Providers

| Feature | Azure Storage | AWS S3 | GCP Cloud Storage |
|---------|---------------|--------|------------------|
| Object Storage | Blob Storage | S3 | Cloud Storage |
| File Storage | Azure Files | EFS/FSx | Filestore |
| Queue Service | Queue Storage | SQS | Pub/Sub |
| Table Storage | Table Storage | DynamoDB | Firestore |
| Pricing Model | Competitive | Competitive | Competitive |
| Global CDN | Azure CDN | CloudFront | Cloud CDN |
| Analytics | Storage Analytics | S3 Analytics | Storage Insights |
| Security | Azure AD, SAS | IAM, Pre-signed URLs | IAM, Signed URLs |

## Common Use Cases

- **Static Website Hosting**: Host static websites with global CDN
- **Media Streaming**: Store and stream video/audio content
- **Backup and Archive**: Long-term data retention with lifecycle policies
- **Big Data Analytics**: Data lake storage for analytics workloads
- **IoT Data Storage**: Store telemetry data from IoT devices
- **Application Logs**: Centralized logging with retention policies
- **User-Generated Content**: Store user uploads and media files
- **Database Backups**: Automated backup storage with geo-redundancy
- **Shared File Access**: SMB file shares for legacy applications
- **Message Queuing**: Decouple application components with queues
- **Session Storage**: Store user session data in tables
- **Configuration Management**: Store application configurations
- **Disaster Recovery**: Geo-redundant storage for business continuity