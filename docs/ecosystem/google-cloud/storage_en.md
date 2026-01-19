# Google Cloud Storage

## Overview

Google Cloud Storage is a unified object storage service for developers and enterprises that provides massively scalable, durable, and highly available storage for any amount of data. It offers multiple storage classes to optimize costs and performance based on data access patterns.

## Key Concepts

### Storage Classes
- **Standard Storage**: For frequently accessed data with low latency
- **Nearline Storage**: For data accessed less than once a month
- **Coldline Storage**: For data accessed less than once a quarter
- **Archive Storage**: For long-term archival with minimal access

### Features
- **Buckets**: Containers for storing objects
- **Objects**: Individual pieces of data stored in buckets
- **Lifecycle Policies**: Automatic data management and cost optimization
- **Versioning**: Keep multiple versions of objects
- **Retention Policies**: Prevent accidental deletion
- **Signed URLs**: Time-limited access to private objects

### Integration Points
- **Cloud CDN**: Global content delivery
- **Cloud IAM**: Fine-grained access control
- **Cloud Audit Logs**: Comprehensive logging
- **Cloud Storage Transfer Service**: Data migration tools

## When to Use

- Static website hosting and content delivery
- Backup and disaster recovery storage
- Big data analytics and processing
- Application data storage and sharing
- Media streaming and distribution
- Log storage and analysis
- Archive and compliance data retention
- Machine learning model storage
- Mobile application content delivery

## Examples

### Basic Bucket Operations

```bash
# Create a bucket
gsutil mb -p my-project -c standard -l us-central1 gs://my-ecommerce-bucket/

# Upload files
gsutil cp product-images/*.jpg gs://my-ecommerce-bucket/products/
gsutil cp -r static-assets/ gs://my-ecommerce-bucket/static/

# Set bucket permissions
gsutil iam ch serviceAccount:storage-admin@my-project.iam.gserviceaccount.com:objectAdmin gs://my-ecommerce-bucket/

# Enable versioning
gsutil versioning set on gs://my-ecommerce-bucket/

# Set lifecycle policy
cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
      "condition": {
        "age": 30,
        "matchesStorageClass": ["STANDARD"]
      }
    },
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 365,
        "matchesStorageClass": ["NEARLINE"]
      }
    }
  ]
}
EOF

gsutil lifecycle set lifecycle.json gs://my-ecommerce-bucket/
```

### Static Website Hosting

```bash
# Create bucket for static website
gsutil mb -c standard gs://my-website-bucket/

# Upload website files
gsutil cp -r website-content/* gs://my-website-bucket/

# Make files public
gsutil iam ch allUsers:objectViewer gs://my-website-bucket/

# Configure website
gsutil web set -m index.html -e 404.html gs://my-website-bucket/

# Set up custom domain (requires domain ownership verification)
gcloud dns managed-zones create my-zone --dns-name=mywebsite.com --description="Website zone"
gcloud dns record-sets create mywebsite.com --zone=my-zone --type=A --rrdatas=192.0.2.1
```

### Client Library Usage (Node.js)

```javascript
// Cloud Storage client for e-commerce product management
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const bucketName = 'ecommerce-products';
const bucket = storage.bucket(bucketName);

class ProductStorageService {
  async uploadProductImage(productId, imageBuffer, mimeType) {
    const fileName = `products/${productId}/${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: {
          productId: productId,
          uploadedAt: new Date().toISOString()
        }
      },
      public: true,
      resumable: false
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        resolve(`https://storage.googleapis.com/${bucketName}/${fileName}`);
      });
      stream.end(imageBuffer);
    });
  }

  async getProductImages(productId) {
    const [files] = await bucket.getFiles({
      prefix: `products/${productId}/`
    });

    return files.map(file => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
      metadata: file.metadata
    }));
  }

  async deleteProductImage(productId, imageName) {
    const fileName = `products/${productId}/${imageName}`;
    await bucket.file(fileName).delete();
  }

  async generateSignedUrl(fileName, expirationMinutes = 60) {
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });
    return url;
  }
}

module.exports = ProductStorageService;
```

### Python Client for Data Backup

```python
# Cloud Storage backup service
from google.cloud import storage
import os
from datetime import datetime

class BackupService:
    def __init__(self, project_id, bucket_name):
        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)

    def upload_database_backup(self, local_file_path, database_name):
        """Upload database backup to Cloud Storage"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        blob_name = f'backups/database/{database_name}/{timestamp}.sql.gz'

        blob = self.bucket.blob(blob_name)
        blob.metadata = {
            'database': database_name,
            'backup_type': 'full',
            'created_at': datetime.now().isoformat()
        }

        blob.upload_from_filename(local_file_path)
        print(f'Backup uploaded: {blob_name}')

        return blob_name

    def upload_log_files(self, log_directory):
        """Upload application logs"""
        for root, dirs, files in os.walk(log_directory):
            for file in files:
                if file.endswith('.log'):
                    local_path = os.path.join(root, file)
                    relative_path = os.path.relpath(local_path, log_directory)
                    blob_name = f'logs/{datetime.now().date()}/{relative_path}'

                    blob = self.bucket.blob(blob_name)
                    blob.upload_from_filename(local_path)

                    # Set retention policy for logs
                    blob.retention = timedelta(days=90)

        print('Log files uploaded successfully')

    def list_backups(self, database_name=None):
        """List available backups"""
        prefix = f'backups/database/{database_name}/' if database_name else 'backups/'

        blobs = self.bucket.list_blobs(prefix=prefix)
        backups = []

        for blob in blobs:
            backups.append({
                'name': blob.name,
                'size': blob.size,
                'created': blob.time_created,
                'metadata': blob.metadata
            })

        return sorted(backups, key=lambda x: x['created'], reverse=True)

    def download_backup(self, blob_name, local_path):
        """Download backup file"""
        blob = self.bucket.blob(blob_name)
        blob.download_to_filename(local_path)
        print(f'Backup downloaded to: {local_path}')
```

### Terraform Configuration

```hcl
# Cloud Storage bucket configuration
resource "google_storage_bucket" "ecommerce_assets" {
  name          = "ecommerce-assets-${var.project_id}"
  location      = "US"
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

# Bucket IAM binding
resource "google_storage_bucket_iam_binding" "public_read" {
  bucket = google_storage_bucket.ecommerce_assets.name
  role   = "roles/storage.objectViewer"
  members = [
    "allUsers",
  ]
}

# Static website configuration
resource "google_storage_bucket" "website" {
  name          = "website-${var.project_id}"
  location      = "US"
  storage_class = "STANDARD"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}
```

## Best Practices

- Choose appropriate storage classes based on access patterns
- Use lifecycle policies to optimize costs automatically
- Implement proper IAM permissions and bucket policies
- Enable versioning for critical data
- Use signed URLs for temporary access to private objects
- Implement proper error handling and retry logic
- Use Cloud CDN for frequently accessed content
- Monitor storage costs and usage patterns
- Implement backup and disaster recovery strategies
- Use labels and metadata for organization
- Regularly audit and clean up unused objects

### Cost Optimization

```bash
# Analyze storage usage
gsutil du -sh gs://my-bucket/

# Find old files
gsutil find gs://my-bucket/ -mtime +365

# Move old files to cheaper storage class
gsutil rewrite -s NEARLINE gs://my-bucket/old-data/*

# Set up automated lifecycle
gsutil lifecycle set lifecycle.json gs://my-bucket/

# Monitor costs with billing alerts
gcloud alpha billing budgets create my-budget \
  --billing-account=123456-789012-345678 \
  --display-name="Storage Budget" \
  --budget-amount=1000 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Security Configuration

```bash
# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://my-bucket/

# Set up Cloud KMS encryption
gcloud kms keyrings create my-keyring --location=global
gcloud kms keys create my-key --keyring=my-keyring --location=global --purpose=encryption

# Configure bucket with CMEK
gsutil kms authorize -k projects/my-project/locations/global/keyRings/my-keyring/cryptoKeys/my-key gs://my-bucket/
gsutil defstorageclass set STANDARD gs://my-bucket/
gsutil kms encryption -k projects/my-project/locations/global/keyRings/my-keyring/cryptoKeys/my-key gs://my-bucket/

# Set up VPC Service Controls
gcloud access-context-manager policies create my-policy \
  --organization=123456789 \
  --title="Storage Security Policy"
```

## Security Considerations

- Use customer-managed encryption keys (CMEK) for sensitive data
- Implement proper IAM roles and bucket policies
- Enable Cloud Audit Logs for compliance monitoring
- Use VPC Service Controls for network security
- Implement data retention policies to prevent accidental deletion
- Regularly rotate access keys and service accounts
- Use signed URLs instead of making objects public
- Enable versioning to protect against ransomware
- Implement proper logging and monitoring
- Use Cloud Security Scanner for web applications

## Cloud Storage vs Other Object Storage

| Feature | Cloud Storage | S3 | Azure Blob | DigitalOcean Spaces |
|---------|---------------|----|------------|-------------------|
| Storage Classes | 4 classes | 7 classes | 4 tiers | 1 class |
| Global CDN | Cloud CDN | CloudFront | CDN | Spaces CDN |
| Multi-region | Yes | Yes | Yes | No |
| Versioning | Yes | Yes | Yes | No |
| Lifecycle | Advanced | Advanced | Basic | Basic |
| Pricing Model | Class-based | Storage/requests | Tier-based | Simple |

## Common Use Cases

- **Static Website Hosting**: Host SPAs and static content
- **Media Distribution**: Stream videos and serve images globally
- **Backup Storage**: Long-term data retention and disaster recovery
- **Data Lake**: Store raw data for analytics and ML
- **Application Assets**: Store user uploads and generated content
- **Log Storage**: Centralized logging for multiple services
- **Software Distribution**: Host installation packages and updates
- **Machine Learning**: Store models, datasets, and training data
- **IoT Data**: Ingest and store sensor data at scale
- **Compliance Archives**: Long-term data retention for regulatory requirements