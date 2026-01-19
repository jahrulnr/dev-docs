# Azure Compute Services

## Gambaran Umum

Azure Compute services menyediakan berbagai opsi untuk menjalankan aplikasi dan workload di cloud. Dari virtual machines hingga serverless computing, Azure menawarkan solusi compute yang fleksibel yang dapat diskalakan dengan kebutuhan bisnis Anda.

## Konsep Utama

### Layanan Inti
- **Virtual Machines (VMs)**: Infrastructure as a Service (IaaS) untuk kontrol penuh atas sumber daya compute
- **Azure Kubernetes Service (AKS)**: Kubernetes terkelola untuk orkestrasi container
- **Azure Functions**: Compute serverless untuk aplikasi event-driven
- **Azure App Service**: Platform as a Service (PaaS) untuk aplikasi web

### Opsi Compute
- **Virtual Machine Scale Sets**: Grup auto-scaling VMs
- **Azure Container Instances (ACI)**: Container serverless tanpa orkestrasi
- **Azure Batch**: Workload paralel dan HPC dalam skala besar
- **Azure Virtual Desktop**: Virtualisasi desktop

### Scaling dan Performa
- **Automatic scaling**: Scale berdasarkan metrik, jadwal, atau aturan kustom
- **Availability Sets/Zones**: Ketersediaan tinggi dan fault tolerance
- **Load balancing**: Distribusi traffic di seluruh instance
- **Performance monitoring**: Metrik real-time dan diagnostik

## Kapan Menggunakan

- **Virtual Machines**: Migrasi lift-and-shift, persyaratan OS kustom, kontrol penuh
- **AKS**: Mikro layanan terkontainerisasi, aplikasi Kubernetes-native
- **Azure Functions**: Pemrosesan event, API backend, tugas terjadwal
- **App Service**: Web apps, APIs, mobile backends
- **ACI**: Deployment container sederhana, batch jobs, development/testing
- **Scale Sets**: Auto-scaling web frontends, pemrosesan batch
- **Batch**: Workload HPC, rendering, pemrosesan data

## Contoh

### Azure Virtual Machines

```bash
# Buat resource group
az group create --name ecommerce-rg --location eastus

# Buat virtual machine
az vm create \
  --resource-group ecommerce-rg \
  --name ecommerce-vm \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_DS1_v2 \
  --public-ip-sku Standard

# Buka port 80 untuk traffic web
az vm open-port --resource-group ecommerce-rg --name ecommerce-vm --port 80

# Install web server
az vm run-command invoke \
  --resource-group ecommerce-rg \
  --name ecommerce-vm \
  --command-id RunShellScript \
  --scripts "sudo apt update && sudo apt install -y nginx"
```

```python
# Python script untuk mengelola Azure VMs
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.network import NetworkManagementClient
import os

def create_vm():
    # Initialize clients
    credential = DefaultAzureCredential()
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')

    compute_client = ComputeManagementClient(credential, subscription_id)
    network_client = NetworkManagementClient(credential, subscription_id)

    resource_group = 'ecommerce-rg'
    location = 'eastus'
    vm_name = 'ecommerce-web-vm'

    # VM configuration
    vm_parameters = {
        'location': location,
        'os_profile': {
            'computer_name': vm_name,
            'admin_username': 'azureuser',
            'linux_configuration': {
                'disable_password_authentication': True,
                'ssh': {
                    'public_keys': [{
                        'path': '/home/azureuser/.ssh/authorized_keys',
                        'key_data': 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...'
                    }]
                }
            }
        },
        'hardware_profile': {
            'vm_size': 'Standard_DS1_v2'
        },
        'storage_profile': {
            'image_reference': {
                'publisher': 'Canonical',
                'offer': 'UbuntuServer',
                'sku': '18.04-LTS',
                'version': 'latest'
            },
            'os_disk': {
                'name': f'{vm_name}-osdisk',
                'caching': 'ReadWrite',
                'create_option': 'FromImage',
                'disk_size_gb': 30
            }
        },
        'network_profile': {
            'network_interfaces': [{
                'id': f'/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Network/networkInterfaces/{vm_name}-nic',
                'properties': {
                    'primary': True
                }
            }]
        }
    }

    # Create VM
    async_vm_creation = compute_client.virtual_machines.begin_create_or_update(
        resource_group,
        vm_name,
        vm_parameters
    )

    vm_result = async_vm_creation.result()
    print(f'VM created: {vm_result.name}')

def list_vms():
    """List semua VMs di subscription"""
    credential = DefaultAzureCredential()
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')

    compute_client = ComputeManagementClient(credential, subscription_id)

    vms = compute_client.virtual_machines.list_all()

    for vm in vms:
        print(f'VM: {vm.name}, Status: {vm.instance_view.statuses[1].display_status}')

def start_stop_vm(vm_name, action='start'):
    """Start atau stop VM"""
    credential = DefaultAzureCredential()
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')

    compute_client = ComputeManagementClient(credential, subscription_id)
    resource_group = 'ecommerce-rg'

    if action == 'start':
        async_operation = compute_client.virtual_machines.begin_start(
            resource_group, vm_name)
    elif action == 'stop':
        async_operation = compute_client.virtual_machines.begin_power_off(
            resource_group, vm_name)

    async_operation.wait()
    print(f'VM {action}ed successfully')

if __name__ == '__main__':
    create_vm()
    list_vms()
```

### Azure Kubernetes Service (AKS)

```bash
# Buat AKS cluster
az aks create \
  --resource-group ecommerce-rg \
  --name ecommerce-aks \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --node-vm-size Standard_DS2_v2

# Dapatkan kredensial AKS
az aks get-credentials --resource-group ecommerce-rg --name ecommerce-aks

# Deploy aplikasi
kubectl apply -f ecommerce-deployment.yaml
```

```yaml
# ecommerce-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
  labels:
    app: ecommerce-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
    spec:
      containers:
      - name: api
        image: myregistry.azurecr.io/ecommerce-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_CONNECTION
          value: "Server=tcp:ecommerce-sql.database.windows.net;Database=ecommerce;User ID=admin;Password=password;"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api-service
spec:
  selector:
    app: ecommerce-api
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.ecommerce.com
    secretName: ecommerce-tls
  rules:
  - host: api.ecommerce.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ecommerce-api-service
            port:
              number: 80
```

```python
# Python AKS management
from azure.identity import DefaultAzureCredential
from azure.mgmt.containerservice import ContainerServiceClient
from kubernetes import client, config
import os

def create_aks_cluster():
    """Buat AKS cluster"""
    credential = DefaultAzureCredential()
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')

    aks_client = ContainerServiceClient(credential, subscription_id)

    resource_group = 'ecommerce-rg'
    cluster_name = 'ecommerce-aks'
    location = 'eastus'

    # AKS cluster configuration
    agent_pool_profiles = [{
        'name': 'agentpool',
        'count': 3,
        'vm_size': 'Standard_DS2_v2',
        'os_type': 'Linux',
        'mode': 'System'
    }]

    cluster_config = {
        'location': location,
        'kubernetes_version': '1.27.0',
        'dns_prefix': f'{cluster_name}-dns',
        'agent_pool_profiles': agent_pool_profiles,
        'enable_rbac': True,
        'enable_addons': [{
            'name': 'monitoring',
            'enabled': True
        }]
    }

    # Create cluster
    async_cluster_creation = aks_client.managed_clusters.begin_create_or_update(
        resource_group,
        cluster_name,
        cluster_config
    )

    cluster_result = async_cluster_creation.result()
    print(f'AKS cluster created: {cluster_result.name}')

def deploy_to_aks():
    """Deploy aplikasi ke AKS"""
    # Load kube config
    config.load_kube_config()

    # Create Kubernetes API client
    apps_v1 = client.AppsV1Api()

    # Deployment configuration
    deployment = client.V1Deployment(
        metadata=client.V1ObjectMeta(name='ecommerce-api'),
        spec=client.V1DeploymentSpec(
            replicas=3,
            selector=client.V1LabelSelector(
                match_labels={'app': 'ecommerce-api'}
            ),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(labels={'app': 'ecommerce-api'}),
                spec=client.V1PodSpec(
                    containers=[client.V1Container(
                        name='api',
                        image='myregistry.azurecr.io/ecommerce-api:latest',
                        ports=[client.V1ContainerPort(container_port=8080)],
                        env=[client.V1EnvVar(
                            name='DATABASE_CONNECTION',
                            value='Server=tcp:ecommerce-sql.database.windows.net;Database=ecommerce;User ID=admin;Password=password;'
                        )],
                        resources=client.V1ResourceRequirements(
                            requests={'memory': '256Mi', 'cpu': '250m'},
                            limits={'memory': '512Mi', 'cpu': '500m'}
                        )
                    )]
                )
            )
        )
    )

    # Create deployment
    apps_v1.create_namespaced_deployment(
        namespace='default',
        body=deployment
    )

    print('Deployment created successfully')

def scale_deployment(replicas):
    """Scale AKS deployment"""
    config.load_kube_config()
    apps_v1 = client.AppsV1Api()

    # Scale deployment
    apps_v1.patch_namespaced_deployment_scale(
        name='ecommerce-api',
        namespace='default',
        body=client.V1Scale(spec=client.V1ScaleSpec(replicas=replicas))
    )

    print(f'Deployment scaled to {replicas} replicas')
```

### Azure Functions

```python
# Azure Function untuk pemrosesan order
import azure.functions as func
import json
import logging
from azure.storage.blob import BlobServiceClient
from azure.cosmos import CosmosClient
import os

app = func.FunctionApp()

@app.function_name(name="ProcessOrder")
@app.service_bus_topic_trigger(
    arg_name="message",
    topic_name="orders",
    connection="SERVICEBUS_CONNECTION"
)
@app.cosmos_db_output(
    arg_name="outputDocument",
    database_name="ecommerce",
    collection_name="processed_orders",
    connection_string_setting="COSMOSDB_CONNECTION"
)
def process_order(message: func.ServiceBusMessage, outputDocument: func.Out[func.Document]):
    """Memproses order dari Service Bus"""
    try:
        # Parse order data
        order_data = json.loads(message.get_body().decode('utf-8'))

        logging.info(f'Processing order: {order_data["order_id"]}')

        # Validate order
        if not validate_order(order_data):
            logging.error(f'Invalid order data: {order_data["order_id"]}')
            return

        # Update inventory
        update_inventory(order_data['items'])

        # Calculate total
        total_amount = sum(item['price'] * item['quantity'] for item in order_data['items'])

        # Prepare processed order document
        processed_order = {
            'id': order_data['order_id'],
            'customer_id': order_data['customer_id'],
            'total_amount': total_amount,
            'status': 'processed',
            'items': order_data['items'],
            'processed_at': func.datetime.datetime.utcnow().isoformat(),
            'partition_key': order_data['customer_id']
        }

        # Output to Cosmos DB
        outputDocument.set(func.Document.from_dict(processed_order))

        # Send notification
        send_notification(order_data)

        logging.info(f'Order processed successfully: {order_data["order_id"]}')

    except Exception as e:
        logging.error(f'Error processing order: {str(e)}')
        raise

@app.function_name(name="GenerateReport")
@app.timer_trigger(schedule="0 0 * * * *")  # Setiap jam
@app.blob_output(
    arg_name="outputBlob",
    path="reports/daily-orders-{datetime}.json",
    connection="STORAGE_CONNECTION"
)
def generate_daily_report(outputBlob: func.Out[str]):
    """Generate laporan penjualan harian"""
    try:
        # Connect to Cosmos DB
        cosmos_client = CosmosClient.from_connection_string(os.getenv('COSMOSDB_CONNECTION'))
        database = cosmos_client.get_database_client('ecommerce')
        container = database.get_container_client('processed_orders')

        # Query today's orders
        today = func.datetime.datetime.utcnow().date()
        start_date = func.datetime.datetime(today.year, today.month, today.day)
        end_date = start_date + func.datetime.timedelta(days=1)

        query = f"""
        SELECT c.order_id, c.total_amount, c.customer_id, c.processed_at
        FROM c
        WHERE c.processed_at >= '{start_date.isoformat()}'
        AND c.processed_at < '{end_date.isoformat()}'
        """

        orders = list(container.query_items(query, enable_cross_partition_query=True))

        # Generate report
        report = {
            'date': today.isoformat(),
            'total_orders': len(orders),
            'total_revenue': sum(order['total_amount'] for order in orders),
            'orders': orders
        }

        # Save to blob storage
        outputBlob.set(json.dumps(report, indent=2, default=str))

        logging.info(f'Daily report generated for {today}')

    except Exception as e:
        logging.error(f'Error generating report: {str(e)}')
        raise

def validate_order(order_data):
    """Validate data order"""
    required_fields = ['order_id', 'customer_id', 'items']
    return all(field in order_data for field in required_fields)

def update_inventory(items):
    """Update inventory (mock implementation)"""
    # Dalam implementasi nyata, update inventory di database
    for item in items:
        logging.info(f'Updating inventory for product {item["product_id"]}: -{item["quantity"]}')

def send_notification(order_data):
    """Kirim notifikasi order (mock implementation)"""
    logging.info(f'Sending notification for order {order_data["order_id"]}')
```

### Azure App Service

```python
# Flask app untuk Azure App Service
from flask import Flask, request, jsonify
import os
import logging
from azure.storage.blob import BlobServiceClient
from azure.cosmos import CosmosClient
import json

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Azure clients
cosmos_client = CosmosClient.from_connection_string(os.getenv('COSMOSDB_CONNECTION'))
database = cosmos_client.get_database_client('ecommerce')
products_container = database.get_container_client('products')

blob_service_client = BlobServiceClient.from_connection_string(os.getenv('STORAGE_CONNECTION'))

@app.route('/')
def home():
    return jsonify({'message': 'E-commerce API running on Azure App Service'})

@app.route('/api/products', methods=['GET'])
def get_products():
    """Dapatkan produk dengan filtering"""
    try:
        category = request.args.get('category')
        limit = int(request.args.get('limit', 20))

        # Build query
        query = "SELECT * FROM c WHERE 1=1"
        parameters = []

        if category:
            query += " AND c.category = @category"
            parameters.append({'name': '@category', 'value': category})

        query += f" OFFSET 0 LIMIT {limit}"

        products = list(products_container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))

        return jsonify({'products': products})

    except Exception as e:
        logger.error(f'Error fetching products: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    """Buat produk baru"""
    try:
        product_data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'price', 'category']
        if not all(field in product_data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Add metadata
        product_data['id'] = str(uuid.uuid4())
        product_data['created_at'] = datetime.datetime.utcnow().isoformat()

        # Save to Cosmos DB
        products_container.create_item(product_data)

        logger.info(f'Product created: {product_data["id"]}')

        return jsonify(product_data), 201

    except Exception as e:
        logger.error(f'Error creating product: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/upload', methods=['POST'])
def upload_image():
    """Upload gambar produk"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        product_id = request.form.get('product_id')

        if not product_id or not file:
            return jsonify({'error': 'Product ID and file required'}), 400

        # Upload to blob storage
        blob_name = f'products/{product_id}/{file.filename}'
        blob_client = blob_service_client.get_blob_client(
            container='images',
            blob=blob_name
        )

        blob_client.upload_blob(file, overwrite=True)

        # Generate SAS URL
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name='images',
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission='r',
            expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        )

        image_url = f'https://{blob_service_client.account_name}.blob.core.windows.net/images/{blob_name}?{sas_token}'

        return jsonify({
            'filename': file.filename,
            'url': image_url,
            'blob_name': blob_name
        })

    except Exception as e:
        logger.error(f'Error uploading image: {str(e)}')
        return jsonify({'error': 'Upload failed'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.datetime.utcnow().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
```

### Konfigurasi Terraform

```hcl
# Azure Resource Group
resource "azurerm_resource_group" "ecommerce" {
  name     = "ecommerce-rg"
  location = "East US"
}

# Virtual Machine
resource "azurerm_virtual_machine" "web_server" {
  name                  = "ecommerce-web-vm"
  location              = azurerm_resource_group.ecommerce.location
  resource_group_name   = azurerm_resource_group.ecommerce.name
  network_interface_ids = [azurerm_network_interface.web_nic.id]
  vm_size               = "Standard_DS1_v2"

  storage_os_disk {
    name              = "web-os-disk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  os_profile {
    computer_name  = "webserver"
    admin_username = "azureuser"
  }

  os_profile_linux_config {
    disable_password_authentication = true
    ssh_keys {
      path     = "/home/azureuser/.ssh/authorized_keys"
      key_data = file("~/.ssh/id_rsa.pub")
    }
  }

  tags = {
    environment = "production"
    application = "ecommerce"
  }
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "ecommerce" {
  name                = "ecommerce-aks"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  dns_prefix          = "ecommerce-aks"

  default_node_pool {
    name       = "default"
    node_count = 3
    vm_size    = "Standard_DS2_v2"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = "production"
  }
}

# Azure Functions
resource "azurerm_function_app" "order_processor" {
  name                       = "ecommerce-order-processor"
  location                   = azurerm_resource_group.ecommerce.location
  resource_group_name        = azurerm_resource_group.ecommerce.name
  app_service_plan_id        = azurerm_app_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "python"
    SERVICEBUS_CONNECTION    = azurerm_servicebus_namespace.ecommerce.default_primary_connection_string
    COSMOSDB_CONNECTION      = azurerm_cosmosdb_account.ecommerce.connection_strings[0]
    STORAGE_CONNECTION       = azurerm_storage_account.functions.primary_connection_string
  }

  site_config {
    linux_fx_version = "PYTHON|3.9"
  }
}

# App Service
resource "azurerm_app_service" "ecommerce_api" {
  name                = "ecommerce-api"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  app_service_plan_id = azurerm_app_service_plan.web.id

  site_config {
    linux_fx_version = "PYTHON|3.9"

    app_settings = {
      COSMOSDB_CONNECTION = azurerm_cosmosdb_account.ecommerce.connection_strings[0]
      STORAGE_CONNECTION  = azurerm_storage_account.web.primary_connection_string
    }
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL      = "https://index.docker.io"
    DOCKER_REGISTRY_SERVER_USERNAME = ""
    DOCKER_REGISTRY_SERVER_PASSWORD = ""
  }
}

# Virtual Machine Scale Set
resource "azurerm_linux_virtual_machine_scale_set" "web_farm" {
  name                = "ecommerce-web-farm"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  sku                 = "Standard_DS1_v2"
  instances           = 2

  admin_username = "azureuser"

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "web-nic"
    primary = true

    ip_configuration {
      name      = "web-ipconfig"
      primary   = true
      subnet_id = azurerm_subnet.web.id
    }
  }

  automatic_os_upgrade_policy {
    disable_automatic_rollback  = false
    enable_automatic_os_upgrade = true
  }

  rolling_upgrade_policy {
    max_batch_instance_percent              = 20
    max_unhealthy_instance_percent          = 20
    max_unhealthy_upgraded_instance_percent = 5
    pause_time_between_batches              = "PT0S"
  }
}

# Auto-scaling untuk Scale Set
resource "azurerm_monitor_autoscale_setting" "web_autoscale" {
  name                = "web-autoscale"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.web_farm.id

  profile {
    name = "default"

    capacity {
      default = 2
      minimum = 1
      maximum = 10
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.web_farm.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 75
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT1M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.web_farm.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT10M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 25
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}
```

## Praktik Terbaik

- Pilih ukuran VM yang sesuai berdasarkan kebutuhan workload
- Gunakan managed disks untuk performa dan reliability yang lebih baik
- Implementasikan strategi backup dan disaster recovery yang tepat
- Gunakan Azure Monitor untuk monitoring dan alerting komprehensif
- Implementasikan keamanan yang tepat dengan NSGs dan Azure Firewall
- Gunakan Azure AD untuk identity dan access management
- Implementasikan auto-scaling untuk optimasi biaya dan performa
- Gunakan Azure Resource Manager templates untuk infrastructure as code
- Implementasikan tagging yang tepat untuk organisasi resource dan tracking biaya
- Gunakan Azure Advisor untuk rekomendasi optimasi
- Implementasikan logging dan diagnostik yang tepat
- Gunakan Azure Backup untuk perlindungan data
- Implementasikan segmentasi jaringan yang tepat
- Gunakan Azure Policy untuk governance dan compliance
- Monitor biaya dengan Azure Cost Management

### Optimasi Performa

```bash
# Monitor performa VM
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Compute/virtualMachines/ecommerce-vm \
  --metric "Percentage CPU" \
  --interval PT1M

# Scale AKS node pool
az aks nodepool scale \
  --resource-group ecommerce-rg \
  --cluster-name ecommerce-aks \
  --name agentpool \
  --node-count 5

# Update ukuran VM
az vm resize \
  --resource-group ecommerce-rg \
  --name ecommerce-vm \
  --size Standard_DS2_v2

# Periksa metrik Function App
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-functions \
  --metric "FunctionExecutionCount" \
  --interval PT1H
```

### Optimasi Biaya

```bash
# Gunakan rekomendasi Azure Advisor
az advisor recommendation list --category Cost

# Siapkan budget alerts
az consumption budget create \
  --budget-name "monthly-budget" \
  --amount 1000 \
  --time-grain Monthly \
  --start-date 2024-01-01 \
  --end-date 2024-12-31

# Gunakan reserved instances untuk VMs
az reservation catalog show --subscription-id $SUBSCRIPTION_ID --location eastus

# Aktifkan auto-shutdown untuk dev VMs
az vm auto-shutdown \
  --resource-group ecommerce-rg \
  --name ecommerce-dev-vm \
  --time 1800

# Gunakan spot instances untuk workload non-kritis
az vm create \
  --resource-group ecommerce-rg \
  --name spot-vm \
  --image Ubuntu2204 \
  --size Standard_DS1_v2 \
  --priority Spot \
  --max-price -1 \
  --eviction-policy Deallocate
```

## Pertimbangan Keamanan

- Gunakan Azure AD untuk manajemen identity dan RBAC
- Implementasikan network security groups (NSGs) untuk kontrol traffic
- Gunakan Azure Key Vault untuk manajemen secrets
- Aktifkan Azure Security Center untuk deteksi threat
- Implementasikan enkripsi yang tepat untuk data at rest dan in transit
- Gunakan Azure Firewall untuk keamanan jaringan lanjutan
- Implementasikan logging dan monitoring yang tepat dengan Azure Monitor
- Gunakan Azure Policy untuk enforcement compliance
- Implementasikan backup dan disaster recovery yang tepat
- Gunakan managed identities untuk komunikasi service-to-service yang aman
- Implementasikan kontrol akses dan prinsip least privilege
- Gunakan Azure Information Protection untuk klasifikasi data
- Implementasikan manajemen patch yang tepat
- Gunakan Azure Sentinel untuk security analytics
- Implementasikan prosedur incident response yang tepat

## Azure Compute vs Provider Cloud Lain

| Fitur | Azure VMs | AWS EC2 | GCP Compute Engine |
|-------|-----------|---------|-------------------|
| Tipe VM | Ekstensif | Ekstensif | Variasi bagus |
| Pricing | Kompetitif | Kompetitif | Kompetitif |
| Global Regions | 60+ | 25+ | 35+ |
| Dukungan Hybrid | Azure Arc | AWS Outposts | Anthos |
| Integrasi | Kuat dengan Microsoft | Ekosistem luas | Kuat dengan Google |
| Kubernetes | AKS | EKS | GKE |
| Serverless | Functions | Lambda | Cloud Functions |
| PaaS | App Service | Elastic Beanstalk | App Engine |

## Kasus Penggunaan Umum

- **Aplikasi Web**: App Service untuk deployment web app cepat
- **APIs dan Mikro layanan**: Functions dan AKS untuk APIs yang scalable
- **Pemrosesan Batch**: Batch service untuk compute jobs skala besar
- **High Performance Computing**: VMs khusus untuk workload HPC
- **Environment Development**: Dev VMs dengan auto-shutdown untuk kontrol biaya
- **Aplikasi Terkontainerisasi**: AKS untuk aplikasi Kubernetes-native
- **Pemrosesan Event-Driven**: Functions untuk pemrosesan event real-time
- **Migrasi Aplikasi Legacy**: VMs untuk migrasi lift-and-shift
- **Pemrosesan Big Data**: Scale sets untuk distributed computing
- **Gaming**: VMs low-latency untuk gaming servers
- **Workload AI/ML**: VMs dengan GPU untuk machine learning
- **Backend IoT**: Functions untuk pemrosesan data IoT
- **Mobile Backends**: App Service untuk APIs aplikasi mobile