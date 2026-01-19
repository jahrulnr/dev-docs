# Google Cloud Storage

## Gambaran Umum

Google Cloud Storage adalah layanan penyimpanan objek terpadu untuk developer dan enterprise yang menyediakan penyimpanan massively scalable, durable, dan highly available untuk jumlah data apa pun. Layanan ini menawarkan multiple storage classes untuk mengoptimalkan biaya dan performa berdasarkan pola akses data.

## Konsep Utama

### Storage Classes
- **Standard Storage**: Untuk data yang sering diakses dengan low latency
- **Nearline Storage**: Untuk data yang diakses kurang dari sekali sebulan
- **Coldline Storage**: Untuk data yang diakses kurang dari sekali per kuartal
- **Archive Storage**: Untuk arsip jangka panjang dengan akses minimal

### Fitur
- **Buckets**: Container untuk menyimpan objek
- **Objects**: Potongan data individual yang disimpan di buckets
- **Lifecycle Policies**: Manajemen data otomatis dan optimasi biaya
- **Versioning**: Pertahankan multiple versi objek
- **Retention Policies**: Cegah penghapusan yang tidak disengaja
- **Signed URLs**: Akses terbatas waktu ke objek private

### Integration Points
- **Cloud CDN**: Content delivery global
- **Cloud IAM**: Kontrol akses fine-grained
- **Cloud Audit Logs**: Logging komprehensif
- **Cloud Storage Transfer Service**: Tools migrasi data

## Kapan Digunakan

- Hosting website statis dan content delivery
- Penyimpanan backup dan disaster recovery
- Analytics dan pemrosesan big data
- Penyimpanan dan berbagi data aplikasi
- Streaming media dan distribusi
- Penyimpanan dan analisis log
- Arsip dan retensi data compliance
- Penyimpanan model machine learning
- Content delivery aplikasi mobile

## Contoh

### Operasi Bucket Dasar

```bash
# Membuat bucket
gsutil mb -p my-project -c standard -l us-central1 gs://my-ecommerce-bucket/

# Upload file
gsutil cp product-images/*.jpg gs://my-ecommerce-bucket/products/
gsutil cp -r static-assets/ gs://my-ecommerce-bucket/static/

# Set permissions bucket
gsutil iam ch serviceAccount:storage-admin@my-project.iam.gserviceaccount.com:objectAdmin gs://my-ecommerce-bucket/

# Aktifkan versioning
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

### Hosting Website Statis

```bash
# Membuat bucket untuk website statis
gsutil mb -c standard gs://my-website-bucket/

# Upload file website
gsutil cp -r website-content/* gs://my-website-bucket/

# Buat file public
gsutil iam ch allUsers:objectViewer gs://my-website-bucket/

# Konfigurasi website
gsutil web set -m index.html -e 404.html gs://my-website-bucket/

# Setup custom domain (memerlukan verifikasi kepemilikan domain)
gcloud dns managed-zones create my-zone --dns-name=mywebsite.com --description="Website zone"
gcloud dns record-sets create mywebsite.com --zone=my-zone --type=A --rrdatas=192.0.2.1
```

### Penggunaan Client Library (Node.js)

```javascript
// Cloud Storage client untuk manajemen produk e-commerce
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

### Python Client untuk Backup Data

```python
# Layanan backup Cloud Storage
from google.cloud import storage
import os
from datetime import datetime

class BackupService:
    def __init__(self, project_id, bucket_name):
        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)

    def upload_database_backup(self, local_file_path, database_name):
        """Upload backup database ke Cloud Storage"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        blob_name = f'backups/database/{database_name}/{timestamp}.sql.gz'

        blob = self.bucket.blob(blob_name)
        blob.metadata = {
            'database': database_name,
            'backup_type': 'full',
            'created_at': datetime.now().isoformat()
        }

        blob.upload_from_filename(local_file_path)
        print(f'Backup diupload: {blob_name}')

        return blob_name

    def upload_log_files(self, log_directory):
        """Upload file log aplikasi"""
        for root, dirs, files in os.walk(log_directory):
            for file in files:
                if file.endswith('.log'):
                    local_path = os.path.join(root, file)
                    relative_path = os.path.relpath(local_path, log_directory)
                    blob_name = f'logs/{datetime.now().date()}/{relative_path}'

                    blob = self.bucket.blob(blob_name)
                    blob.upload_from_filename(local_path)

                    # Set retention policy untuk logs
                    blob.retention = timedelta(days=90)

        print('File log berhasil diupload')

    def list_backups(self, database_name=None):
        """List backup yang tersedia"""
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
        """Download file backup"""
        blob = self.bucket.blob(blob_name)
        blob.download_to_filename(local_path)
        print(f'Backup didownload ke: {local_path}')
```

### Konfigurasi Terraform

```hcl
# Konfigurasi bucket Cloud Storage
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

# Konfigurasi website statis
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

## Praktik Terbaik

- Pilih storage classes yang sesuai berdasarkan pola akses
- Gunakan lifecycle policies untuk optimasi biaya otomatis
- Implementasikan IAM permissions dan bucket policies yang proper
- Aktifkan versioning untuk data kritis
- Gunakan signed URLs untuk akses temporary ke objek private
- Implementasikan error handling dan retry logic yang proper
- Gunakan Cloud CDN untuk content yang sering diakses
- Monitor biaya dan pola penggunaan storage
- Implementasikan strategi backup dan disaster recovery
- Gunakan labels dan metadata untuk organisasi
- Audit dan bersihkan objek yang tidak terpakai secara regular

### Optimasi Biaya

```bash
# Analisis penggunaan storage
gsutil du -sh gs://my-bucket/

# Cari file lama
gsutil find gs://my-bucket/ -mtime +365

# Pindahkan file lama ke storage class lebih murah
gsutil rewrite -s NEARLINE gs://my-bucket/old-data/*

# Setup lifecycle otomatis
gsutil lifecycle set lifecycle.json gs://my-bucket/

# Monitor biaya dengan billing alerts
gcloud alpha billing budgets create my-budget \
  --billing-account=123456-789012-345678 \
  --display-name="Storage Budget" \
  --budget-amount=1000 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Konfigurasi Keamanan

```bash
# Aktifkan uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://my-bucket/

# Setup enkripsi Cloud KMS
gcloud kms keyrings create my-keyring --location=global
gcloud kms keys create my-key --keyring=my-keyring --location=global --purpose=encryption

# Konfigurasi bucket dengan CMEK
gsutil kms authorize -k projects/my-project/locations/global/keyRings/my-keyring/cryptoKeys/my-key gs://my-bucket/
gsutil defstorageclass set STANDARD gs://my-bucket/
gsutil kms encryption -k projects/my-project/locations/global/keyRings/my-keyring/cryptoKeys/my-key gs://my-bucket/

# Setup VPC Service Controls
gcloud access-context-manager policies create my-policy \
  --organization=123456789 \
  --title="Storage Security Policy"
```

## Pertimbangan Keamanan

- Gunakan customer-managed encryption keys (CMEK) untuk data sensitif
- Implementasikan IAM roles dan bucket policies yang proper
- Aktifkan Cloud Audit Logs untuk monitoring compliance
- Gunakan VPC Service Controls untuk keamanan jaringan
- Implementasikan data retention policies untuk mencegah penghapusan yang tidak disengaja
- Rotasi access keys dan service accounts secara regular
- Gunakan signed URLs daripada membuat objek public
- Aktifkan versioning untuk melindungi dari ransomware
- Implementasikan logging dan monitoring yang proper
- Gunakan Cloud Security Scanner untuk aplikasi web

## Cloud Storage vs Object Storage Lain

| Fitur | Cloud Storage | S3 | Azure Blob | DigitalOcean Spaces |
|-------|---------------|----|------------|-------------------|
| Storage Classes | 4 classes | 7 classes | 4 tiers | 1 class |
| Global CDN | Cloud CDN | CloudFront | CDN | Spaces CDN |
| Multi-region | Ya | Ya | Ya | Tidak |
| Versioning | Ya | Ya | Ya | Tidak |
| Lifecycle | Advanced | Advanced | Basic | Basic |
| Model Pricing | Class-based | Storage/requests | Tier-based | Simple |

## Use Case Umum

- **Hosting Website Statis**: Host SPA dan content statis
- **Distribusi Media**: Stream video dan serve gambar secara global
- **Penyimpanan Backup**: Retensi data jangka panjang dan disaster recovery
- **Data Lake**: Simpan raw data untuk analytics dan ML
- **Application Assets**: Simpan user uploads dan content yang dihasilkan
- **Penyimpanan Log**: Centralized logging untuk multiple services
- **Software Distribution**: Host paket instalasi dan updates
- **Machine Learning**: Simpan models, datasets, dan training data
- **IoT Data**: Ingest dan simpan sensor data dalam skala besar
- **Compliance Archives**: Retensi data jangka panjang untuk kebutuhan regulasi