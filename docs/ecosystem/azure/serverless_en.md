# Azure Serverless Services

## Overview

Azure serverless services provide a fully managed platform for building and deploying applications without managing infrastructure. These services automatically scale based on demand and you only pay for the compute resources you consume.

## Key Concepts

### Serverless Computing Models
- **Functions as a Service (FaaS)**: Execute code in response to events
- **Backend as a Service (BaaS)**: Managed backend services and APIs
- **Container as a Service (CaaS)**: Run containers without managing servers
- **Platform as a Service (PaaS)**: Complete application platforms

### Scaling Types
- **Event-driven scaling**: Scale based on incoming events or requests
- **HTTP request scaling**: Scale based on web traffic
- **Queue-based scaling**: Scale based on message queue depth
- **Timer-based scaling**: Scale based on scheduled intervals

### Execution Environments
- **Consumption plan**: Pay only for execution time
- **Premium plan**: Faster cold starts, VNet integration
- **Dedicated plan**: Predictable costs, custom configurations
- **Containerized**: Custom runtimes and dependencies

## When to Use

- **Azure Functions**: Event-driven processing, API endpoints, scheduled tasks
- **Azure Container Apps**: Microservices, API backends, background jobs
- **Azure Static Web Apps**: Frontend applications, SPAs, static content
- **Azure API Management**: API gateways, rate limiting, authentication
- **Azure Logic Apps**: Workflow automation, integration scenarios
- **Azure Event Grid**: Event routing, pub/sub messaging
- **Azure App Service**: Web apps, REST APIs, mobile backends

## Examples

### Azure Functions

```bash
# Create Azure Functions app
az functionapp create \
  --name ecommerce-functions \
  --resource-group ecommerce-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --storage-account ecommerce-storage

# Create function with HTTP trigger
az functionapp function create \
  --name ecommerce-functions \
  --resource-group ecommerce-rg \
  --function-name ProcessOrder \
  --trigger-type http

# Configure application settings
az functionapp config appsettings set \
  --name ecommerce-functions \
  --resource-group ecommerce-rg \
  --setting CosmosDB_ConnectionString="AccountEndpoint=https://ecommerce-cosmos.documents.azure.com:443/;AccountKey=your-key;"

# Enable Application Insights
az monitor app-insights component create \
  --app ecommerce-insights \
  --location eastus \
  --resource-group ecommerce-rg \
  --application-type web

az functionapp config appsettings set \
  --name ecommerce-functions \
  --resource-group ecommerce-rg \
  --setting APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

```python
# Azure Functions for order processing
import azure.functions as func
import json
import logging
from azure.cosmos import CosmosClient
from azure.storage.queue import QueueServiceClient
from typing import List, Dict, Any
import os

app = func.FunctionApp()

# Initialize clients
cosmos_client = CosmosClient.from_connection_string(os.environ['CosmosDB_ConnectionString'])
database = cosmos_client.get_database_client('ECommerceDB')
orders_container = database.get_container_client('Orders')
products_container = database.get_container_client('Products')

queue_client = QueueServiceClient.from_connection_string(os.environ['AzureWebJobsStorage'])
order_queue = queue_client.get_queue_client('order-processing')

@func.http_trigger(route="orders", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def create_order(req: func.HttpRequest) -> func.HttpResponse:
    """Create new order via HTTP trigger"""
    logging.info('Processing order creation request')

    try:
        req_body = req.get_json()
        order_data = req_body.get('order')

        # Validate order data
        if not validate_order_data(order_data):
            return func.HttpResponse(
                json.dumps({"error": "Invalid order data"}),
                status_code=400,
                mimetype="application/json"
            )

        # Check product availability
        if not check_product_availability(order_data['items']):
            return func.HttpResponse(
                json.dumps({"error": "Insufficient product inventory"}),
                status_code=400,
                mimetype="application/json"
            )

        # Create order in Cosmos DB
        order_id = create_order_record(order_data)

        # Add to processing queue
        queue_message = {
            'orderId': order_id,
            'action': 'process_payment',
            'timestamp': func.datetime.datetime.utcnow().isoformat()
        }
        order_queue.send_message(json.dumps(queue_message))

        return func.HttpResponse(
            json.dumps({
                "orderId": order_id,
                "status": "Order created and queued for processing"
            }),
            status_code=201,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )

@func.queue_trigger(arg_name="msg", queue_name="order-processing",
                   connection="AzureWebJobsStorage")
def process_order_queue(msg: func.QueueMessage) -> None:
    """Process orders from queue"""
    logging.info('Processing order from queue')

    try:
        message_body = json.loads(msg.get_body().decode('utf-8'))
        order_id = message_body['orderId']
        action = message_body['action']

        if action == 'process_payment':
            # Process payment logic
            payment_result = process_payment(order_id)

            if payment_result['success']:
                # Update order status
                update_order_status(order_id, 'paid')

                # Send confirmation email
                send_order_confirmation(order_id)

                # Queue for fulfillment
                fulfillment_message = {
                    'orderId': order_id,
                    'action': 'fulfill_order',
                    'timestamp': func.datetime.datetime.utcnow().isoformat()
                }
                order_queue.send_message(json.dumps(fulfillment_message))
            else:
                # Payment failed
                update_order_status(order_id, 'payment_failed')

        elif action == 'fulfill_order':
            # Fulfillment logic
            fulfill_order(order_id)
            update_order_status(order_id, 'shipped')

    except Exception as e:
        logging.error(f"Error processing order queue: {str(e)}")
        # Implement retry logic or dead letter queue

@func.timer_trigger(schedule="0 */5 * * * *")
def inventory_check_timer(timer: func.TimerRequest) -> None:
    """Scheduled inventory check every 5 minutes"""
    logging.info('Running scheduled inventory check')

    try:
        # Check low inventory products
        low_stock_products = check_low_inventory()

        if low_stock_products:
            # Send alerts
            send_inventory_alert(low_stock_products)

        # Update inventory analytics
        update_inventory_analytics()

    except Exception as e:
        logging.error(f"Error in inventory check: {str(e)}")

@func.event_hub_trigger(arg_name="events", event_hub_name="product-events",
                       connection="EventHubConnectionString")
def process_product_events(events: List[func.EventData]) -> None:
    """Process product-related events"""
    logging.info(f'Processing {len(events)} product events')

    for event in events:
        try:
            event_data = json.loads(event.get_body().decode('utf-8'))
            event_type = event_data.get('eventType')

            if event_type == 'product_updated':
                # Update product cache
                update_product_cache(event_data['productId'])

            elif event_type == 'product_deleted':
                # Remove from cache
                remove_product_from_cache(event_data['productId'])

            elif event_type == 'price_changed':
                # Update price alerts
                update_price_alerts(event_data['productId'], event_data['newPrice'])

        except Exception as e:
            logging.error(f"Error processing product event: {str(e)}")

@func.cosmos_db_trigger(arg_name="documents", database_name="ECommerceDB",
                       collection_name="Orders", connection_string_setting="CosmosDB_ConnectionString",
                       lease_collection_name="leases", create_lease_collection_if_not_exists="true")
def process_order_changes(documents: List[Dict[str, Any]]) -> None:
    """Process order document changes in Cosmos DB"""
    logging.info(f'Processing {len(documents)} order changes')

    for doc in documents:
        try:
            order_id = doc['id']
            status = doc.get('status')

            if status == 'cancelled':
                # Process order cancellation
                process_order_cancellation(order_id)

            elif status == 'refunded':
                # Process refund
                process_refund(order_id)

        except Exception as e:
            logging.error(f"Error processing order change: {str(e)}")

# Helper functions
def validate_order_data(order_data: Dict[str, Any]) -> bool:
    """Validate order data structure"""
    required_fields = ['customerId', 'items', 'totalAmount']
    return all(field in order_data for field in required_fields)

def check_product_availability(items: List[Dict[str, Any]]) -> bool:
    """Check if products are available in inventory"""
    for item in items:
        product_id = item['productId']
        quantity = item['quantity']

        # Query product from Cosmos DB
        product = products_container.read_item(item=product_id, partition_key=product_id[:1])

        if product['stockQuantity'] < quantity:
            return False

    return True

def create_order_record(order_data: Dict[str, Any]) -> str:
    """Create order record in Cosmos DB"""
    import uuid

    order_id = str(uuid.uuid4())
    order_data['id'] = order_id
    order_data['orderDate'] = func.datetime.datetime.utcnow().isoformat()
    order_data['status'] = 'pending'

    orders_container.create_item(body=order_data)
    return order_id

def process_payment(order_id: str) -> Dict[str, Any]:
    """Mock payment processing"""
    # In real implementation, integrate with payment gateway
    return {'success': True, 'transactionId': f'txn_{order_id}'}

def update_order_status(order_id: str, status: str) -> None:
    """Update order status in Cosmos DB"""
    # Read current order
    order = orders_container.read_item(item=order_id, partition_key=order_id[:1])

    # Update status
    order['status'] = status
    order['updatedDate'] = func.datetime.datetime.utcnow().isoformat()

    # Replace item
    orders_container.replace_item(item=order_id, body=order)

def send_order_confirmation(order_id: str) -> None:
    """Send order confirmation email"""
    # Integrate with Azure Communication Services or SendGrid
    logging.info(f'Sending confirmation email for order {order_id}')

def fulfill_order(order_id: str) -> None:
    """Process order fulfillment"""
    # Integrate with shipping provider
    logging.info(f'Processing fulfillment for order {order_id}')

def check_low_inventory() -> List[Dict[str, Any]]:
    """Check for low inventory products"""
    query = "SELECT * FROM c WHERE c.stockQuantity < 10"
    items = list(products_container.query_items(query=query, enable_cross_partition_query=True))
    return items

def send_inventory_alert(products: List[Dict[str, Any]]) -> None:
    """Send inventory alerts"""
    # Integrate with Azure Monitor or email service
    logging.warning(f'Low inventory alert for {len(products)} products')

def update_inventory_analytics() -> None:
    """Update inventory analytics"""
    # Update analytics data
    logging.info('Updating inventory analytics')

def update_product_cache(product_id: str) -> None:
    """Update product cache"""
    # Update Redis cache
    logging.info(f'Updating cache for product {product_id}')

def remove_product_from_cache(product_id: str) -> None:
    """Remove product from cache"""
    # Remove from Redis cache
    logging.info(f'Removing product {product_id} from cache')

def update_price_alerts(product_id: str, new_price: float) -> None:
    """Update price alerts"""
    # Update price monitoring
    logging.info(f'Price changed for product {product_id}: ${new_price}')

def process_order_cancellation(order_id: str) -> None:
    """Process order cancellation"""
    # Restore inventory, process refund, etc.
    logging.info(f'Processing cancellation for order {order_id}')

def process_refund(order_id: str) -> None:
    """Process refund"""
    # Process refund through payment gateway
    logging.info(f'Processing refund for order {order_id}')
```

### Azure Container Apps

```bash
# Create Azure Container Apps environment
az containerapp env create \
  --name ecommerce-container-env \
  --resource-group ecommerce-rg \
  --location eastus

# Create container app for API backend
az containerapp create \
  --name ecommerce-api \
  --resource-group ecommerce-rg \
  --environment ecommerce-container-env \
  --image ecommerce/api:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars DATABASE_URL="postgresql://..." REDIS_URL="redis://..." \
  --secrets database-secret="postgresql://..." redis-secret="redis://..."

# Create container app for background processing
az containerapp create \
  --name ecommerce-worker \
  --resource-group ecommerce-rg \
  --environment ecommerce-container-env \
  --image ecommerce/worker:latest \
  --min-replicas 0 \
  --max-replicas 5 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --env-vars QUEUE_CONNECTION="AzureWebJobsStorage" \
  --secrets queue-secret="DefaultEndpointsProtocol=https;..."

# Configure scaling rules
az containerapp update \
  --name ecommerce-api \
  --resource-group ecommerce-rg \
  --scale-rules-name http-scaling \
  --scale-rules '{
    "http": {
      "metadata": {
        "concurrentRequests": "10"
      },
      "type": "http"
    }
  }'

# Setup Dapr integration
az containerapp dapr enable \
  --name ecommerce-api \
  --resource-group ecommerce-rg \
  --dapr-app-id ecommerce-api \
  --dapr-app-port 80

# Configure service-to-service communication
az containerapp update \
  --name ecommerce-worker \
  --resource-group ecommerce-rg \
  --service-bindings '[
    {
      "name": "api-binding",
      "serviceId": "/subscriptions/.../resourceGroups/ecommerce-rg/providers/Microsoft.App/containerApps/ecommerce-api"
    }
  ]'
```

```yaml
# Docker Compose for local development
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ecommerce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ecommerce
      - REDIS_URL=redis://redis:6379
      - QUEUE_NAME=order-processing
    depends_on:
      - postgres
      - redis
      - api
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```python
# FastAPI application for containerized API
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncpg
import redis.asyncio as redis
import json
import logging
import os
from datetime import datetime

app = FastAPI(title="E-Commerce API", version="1.0.0")

# Initialize Redis client
redis_client = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379'))

# Database connection pool
db_pool = None

class OrderItem(BaseModel):
    productId: str
    quantity: int
    unitPrice: float
    totalPrice: float

class Order(BaseModel):
    customerId: str
    orderNumber: str
    items: List[OrderItem]
    totalAmount: float
    shippingAddress: Dict[str, Any]
    billingAddress: Dict[str, Any]
    paymentMethod: str

class OrderResponse(BaseModel):
    orderId: str
    status: str
    message: str

@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool"""
    global db_pool
    db_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/ecommerce')
    db_pool = await asyncpg.create_pool(db_url, min_size=1, max_size=10)

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool"""
    if db_pool:
        await db_pool.close()

@app.post("/orders", response_model=OrderResponse)
async def create_order(order: Order, background_tasks: BackgroundTasks):
    """Create new order"""
    try:
        # Validate order data
        await validate_order_data(order)

        # Check product availability
        await check_inventory_availability(order.items)

        # Create order in database
        order_id = await create_order_in_db(order)

        # Add to processing queue
        await queue_order_for_processing(order_id)

        # Add background task for email notification
        background_tasks.add_task(send_confirmation_email, order_id)

        return OrderResponse(
            orderId=order_id,
            status="Order created successfully",
            message="Your order has been placed and is being processed"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/orders/{order_id}")
async def get_order_status(order_id: str):
    """Get order status"""
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT order_id, order_number, status, total_amount, created_at
                FROM orders WHERE order_id = $1
            """, order_id)

            if not row:
                raise HTTPException(status_code=404, detail="Order not found")

            return dict(row)

    except Exception as e:
        logging.error(f"Error getting order status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/products/search")
async def search_products(q: str, category: Optional[str] = None, limit: int = 20):
    """Search products"""
    try:
        # Check cache first
        cache_key = f"search:{q}:{category}:{limit}"
        cached_result = await redis_client.get(cache_key)

        if cached_result:
            return json.loads(cached_result)

        # Search in database
        async with db_pool.acquire() as conn:
            if category:
                rows = await conn.fetch("""
                    SELECT product_id, name, description, price, category
                    FROM products
                    WHERE category = $1 AND (name ILIKE $2 OR description ILIKE $2)
                    LIMIT $3
                """, category, f'%{q}%', limit)
            else:
                rows = await conn.fetch("""
                    SELECT product_id, name, description, price, category
                    FROM products
                    WHERE name ILIKE $1 OR description ILIKE $1
                    LIMIT $2
                """, f'%{q}%', limit)

            results = [dict(row) for row in rows]

            # Cache results for 5 minutes
            await redis_client.setex(cache_key, 300, json.dumps(results))

            return results

    except Exception as e:
        logging.error(f"Error searching products: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Background tasks
async def send_confirmation_email(order_id: str):
    """Send order confirmation email"""
    # Integrate with Azure Communication Services or SendGrid
    logging.info(f"Sending confirmation email for order {order_id}")

# Helper functions
async def validate_order_data(order: Order):
    """Validate order data"""
    if not order.items:
        raise ValueError("Order must contain at least one item")

    if order.totalAmount <= 0:
        raise ValueError("Total amount must be greater than 0")

    # Additional validation logic...

async def check_inventory_availability(items: List[OrderItem]):
    """Check if products are available"""
    async with db_pool.acquire() as conn:
        for item in items:
            row = await conn.fetchrow("""
                SELECT stock_quantity FROM products WHERE product_id = $1
            """, item.productId)

            if not row or row['stock_quantity'] < item.quantity:
                raise ValueError(f"Insufficient inventory for product {item.productId}")

async def create_order_in_db(order: Order) -> str:
    """Create order in database"""
    import uuid

    order_id = str(uuid.uuid4())

    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # Insert order
            await conn.execute("""
                INSERT INTO orders (order_id, customer_id, order_number, status, total_amount,
                                  shipping_address, billing_address, payment_method)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, order_id, order.customerId, order.orderNumber, 'pending', order.totalAmount,
                json.dumps(order.shippingAddress), json.dumps(order.billingAddress), order.paymentMethod)

            # Insert order items
            for item in order.items:
                await conn.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                    VALUES ($1, $2, $3, $4, $5)
                """, order_id, item.productId, item.quantity, item.unitPrice, item.totalPrice)

                # Update inventory
                await conn.execute("""
                    UPDATE products SET stock_quantity = stock_quantity - $1
                    WHERE product_id = $2
                """, item.quantity, item.productId)

    return order_id

async def queue_order_for_processing(order_id: str):
    """Add order to processing queue"""
    queue_message = {
        'orderId': order_id,
        'action': 'process_payment',
        'timestamp': datetime.utcnow().isoformat()
    }

    # Add to Redis queue
    await redis_client.lpush('order-processing', json.dumps(queue_message))

# Worker process for background tasks
async def process_order_queue():
    """Process orders from queue (to be run in worker container)"""
    while True:
        try:
            # Get message from queue
            message_data = await redis_client.brpop('order-processing', timeout=1)
            if not message_data:
                continue

            message = json.loads(message_data[1])
            order_id = message['orderId']
            action = message['action']

            if action == 'process_payment':
                # Process payment
                payment_success = await process_payment(order_id)

                if payment_success:
                    # Update order status
                    await update_order_status(order_id, 'paid')

                    # Queue for fulfillment
                    fulfillment_message = {
                        'orderId': order_id,
                        'action': 'fulfill_order',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                    await redis_client.lpush('order-processing', json.dumps(fulfillment_message))
                else:
                    await update_order_status(order_id, 'payment_failed')

        except Exception as e:
            logging.error(f"Error processing order queue: {str(e)}")

async def process_payment(order_id: str) -> bool:
    """Process payment (mock implementation)"""
    # Integrate with payment gateway like Stripe
    logging.info(f"Processing payment for order {order_id}")
    return True  # Mock success

async def update_order_status(order_id: str, status: str):
    """Update order status"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE order_id = $2
        """, status, order_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

### Azure Static Web Apps

```bash
# Create Azure Static Web Apps
az staticwebapp create \
  --name ecommerce-frontend \
  --resource-group ecommerce-rg \
  --location eastus \
  --source https://github.com/username/ecommerce-frontend \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --login-with-github

# Set environment variables
az staticwebapp environment set \
  --name ecommerce-frontend \
  --resource-group ecommerce-rg \
  --environment-name production \
  --vars API_URL="https://ecommerce-api.azurewebsites.net" STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Configure custom domains
az staticwebapp hostname set \
  --name ecommerce-frontend \
  --resource-group ecommerce-rg \
  --domain www.ecommerce.com

# Setup staging environment
az staticwebapp environment set \
  --name ecommerce-frontend \
  --resource-group ecommerce-rg \
  --environment-name staging \
  --vars API_URL="https://ecommerce-api-staging.azurewebsites.net"

# Configure authentication
az staticwebapp users invite \
  --name ecommerce-frontend \
  --resource-group ecommerce-rg \
  --authentication-provider github \
  --user-details "user@example.com" \
  --roles admin \
  --num-hours-to-expiration 168
```

```javascript
// React application for e-commerce frontend
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './App.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Router>
      <div className="App">
        <Elements stripe={stripePromise}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Routes>
        </Elements>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>Welcome to E-Commerce Store</h1>
      <p>Discover amazing products at great prices!</p>
    </div>
  );
}

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products/search`, {
        params: { q: searchTerm, limit: 20 }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="product-list">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const addToCart = () => {
    // Add to cart logic
    console.log('Adding to cart:', product.product_id);
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">${product.price}</p>
      <button onClick={addToCart}>Add to Cart</button>
    </div>
  );
}

function ShoppingCart() {
  const [cart, setCart] = useState([]);

  // Cart management logic would go here

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div>
          {cart.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
          <button>Proceed to Checkout</button>
        </div>
      )}
    </div>
  );
}

function Checkout() {
  const [orderData, setOrderData] = useState({
    customerId: '',
    items: [],
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'card'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/orders`, {
        order: orderData
      });
      console.log('Order created:', response.data);
      // Redirect to success page
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit}>
        {/* Checkout form fields */}
        <button type="submit">Place Order</button>
      </form>
    </div>
  );
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      // This would typically get customer ID from auth context
      const customerId = 'customer-123';
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders/customer/${customerId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="order-history">
      <h2>Order History</h2>
      {orders.map(order => (
        <OrderItem key={order.order_id} order={order} />
      ))}
    </div>
  );
}

export default App;
```

### Terraform Configuration

```hcl
# Azure Functions
resource "azurerm_function_app" "ecommerce" {
  name                       = "ecommerce-functions"
  location                   = azurerm_resource_group.ecommerce.location
  resource_group_name        = azurerm_resource_group.ecommerce.name
  app_service_plan_id        = azurerm_app_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  version                    = "~4"

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME       = "python"
    AzureWebJobsStorage            = azurerm_storage_account.functions.primary_connection_string
    CosmosDB_ConnectionString      = azurerm_cosmosdb_account.ecommerce.connection_strings[0]
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.ecommerce.instrumentation_key
  }

  site_config {
    linux_fx_version = "PYTHON|3.9"
  }

  tags = {
    environment = "production"
  }
}

# Azure Container Apps Environment
resource "azurerm_container_app_environment" "ecommerce" {
  name                = "ecommerce-container-env"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name

  tags = {
    environment = "production"
  }
}

# API Container App
resource "azurerm_container_app" "api" {
  name                = "ecommerce-api"
  container_app_environment_id = azurerm_container_app_environment.ecommerce.id
  resource_group_name = azurerm_resource_group.ecommerce.name
  revision_mode       = "Single"

  template {
    min_replicas = 1
    max_replicas = 10

    container {
      name   = "api"
      image  = "ecommerce/api:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${azurerm_postgresql_server.ecommerce.administrator_login}@${azurerm_postgresql_server.ecommerce.name}:${azurerm_postgresql_server.ecommerce.fully_qualified_domain_name}/${azurerm_postgresql_database.ecommerce.name}"
      }

      env {
        name  = "REDIS_URL"
        value = "redis://${azurerm_redis_cache.ecommerce.hostname}:${azurerm_redis_cache.ecommerce.ssl_port}"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = {
    environment = "production"
  }
}

# Worker Container App
resource "azurerm_container_app" "worker" {
  name                = "ecommerce-worker"
  container_app_environment_id = azurerm_container_app_environment.ecommerce.id
  resource_group_name = azurerm_resource_group.ecommerce.name
  revision_mode       = "Single"

  template {
    min_replicas = 0
    max_replicas = 5

    container {
      name   = "worker"
      image  = "ecommerce/worker:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "AzureWebJobsStorage"
        value = azurerm_storage_account.functions.primary_connection_string
      }
    }
  }

  tags = {
    environment = "production"
  }
}

# Azure Static Web App
resource "azurerm_static_site" "ecommerce" {
  name                = "ecommerce-frontend"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  sku_tier            = "Standard"
  sku_size            = "Standard"

  tags = {
    environment = "production"
  }
}

# Custom domain for Static Web App
resource "azurerm_static_site_custom_domain" "ecommerce" {
  static_site_id  = azurerm_static_site.ecommerce.id
  domain_name     = "www.ecommerce.com"
  validation_type = "cname-delegation"
}

# API Management
resource "azurerm_api_management" "ecommerce" {
  name                = "ecommerce-apim"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  publisher_name      = "E-Commerce Company"
  publisher_email     = "admin@ecommerce.com"
  sku_name            = "Consumption_0"

  tags = {
    environment = "production"
  }
}

# API Management API
resource "azurerm_api_management_api" "ecommerce" {
  name                = "ecommerce-api"
  resource_group_name = azurerm_resource_group.ecommerce.name
  api_management_name = azurerm_api_management.ecommerce.name
  revision            = "1"
  display_name        = "E-Commerce API"
  path                = "api"
  protocols           = ["https"]

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/api-spec.yaml")
  }
}

# API Management backend
resource "azurerm_api_management_backend" "ecommerce" {
  name                = "ecommerce-backend"
  resource_group_name = azurerm_resource_group.ecommerce.name
  api_management_name = azurerm_api_management.ecommerce.name
  protocol            = "http"
  url                 = "https://${azurerm_container_app.api.ingress[0].fqdn}"

  credentials {
    header = {
      "Authorization" = "Bearer ${var.api_key}"
    }
  }
}
```

## Best Practices

- Choose the right serverless service based on your use case and requirements
- Implement proper error handling and retry logic for transient failures
- Use environment variables for configuration and secrets management
- Implement monitoring and logging for all serverless functions
- Use Azure Application Insights for performance monitoring and diagnostics
- Implement proper authentication and authorization for API endpoints
- Use Azure API Management for API governance and throttling
- Implement circuit breaker patterns for resilient service communication
- Use Azure Key Vault for secrets management
- Implement proper cold start optimization techniques
- Use Azure Front Door for global distribution and CDN capabilities
- Implement proper logging and tracing for distributed systems
- Use Azure Monitor for comprehensive monitoring and alerting
- Implement proper security headers and CORS policies
- Use Azure Policy for governance and compliance
- Implement proper backup and disaster recovery strategies
- Use Azure Cost Management for cost optimization and budgeting
- Implement proper testing strategies for serverless applications
- Use Azure DevOps for CI/CD pipelines and deployment automation
- Implement proper versioning strategies for APIs and functions
- Use Azure Resource Manager templates for infrastructure as code
- Implement proper data validation and sanitization
- Use Azure Sentinel for security monitoring and threat detection
- Implement proper rate limiting and throttling mechanisms
- Use Azure Advisor for performance and cost optimization recommendations
- Implement proper caching strategies to reduce latency and costs
- Use Azure Backup for data protection and compliance
- Implement proper session management and state handling
- Use Azure Information Protection for data classification and protection
- Implement proper audit logging and compliance reporting
- Use Azure Policy for automated governance and compliance
- Implement proper disaster recovery and business continuity plans
- Use Azure Lighthouse for multi-tenant management scenarios
- Implement proper performance testing and load testing strategies
- Use Azure Chaos Studio for chaos engineering and resilience testing
- Implement proper documentation and API specifications
- Use Azure API Center for API discovery and management
- Implement proper versioning and deprecation strategies
- Use Azure Front Door for global load balancing and failover
- Implement proper health checks and monitoring endpoints
- Use Azure Monitor Workbooks for custom dashboards and reporting
- Implement proper error tracking and user feedback mechanisms
- Use Azure Communication Services for multi-channel communication
- Implement proper data encryption at rest and in transit
- Use Azure Private Link for secure service communication
- Implement proper identity and access management
- Use Azure Managed Identities for secure authentication
- Implement proper network security and segmentation
- Use Azure Firewall for advanced network security
- Implement proper compliance and regulatory requirements
- Use Azure Information Protection for data labeling and protection
- Implement proper change management and deployment strategies
- Use Azure Blueprints for consistent environment deployment
- Implement proper cost allocation and chargeback mechanisms
- Use Azure Cost Management APIs for programmatic cost analysis
- Implement proper sustainability and carbon footprint tracking
- Use Azure Advisor for environmental impact recommendations

### Performance Optimization

```bash
# Monitor Azure Functions performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-functions \
  --metric "FunctionExecutionCount" \
  --interval PT1H

# Scale Container Apps
az containerapp update \
  --name ecommerce-api \
  --resource-group ecommerce-rg \
  --min-replicas 2 \
  --max-replicas 20

# Monitor Static Web App performance
az monitor metrics list \
  --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg/providers/Microsoft.Web/staticSites/ecommerce-frontend \
  --metric "BytesServed" \
  --interval PT1H

# Enable Azure Front Door for Static Web App
az afd endpoint create \
  --endpoint-name ecommerce-frontend \
  --profile-name ecommerce-cdn \
  --resource-group ecommerce-rg \
  --origin-host-header ecommerce-frontend.azurestaticapps.net \
  --origin-host-name ecommerce-frontend.azurestaticapps.net
```

### Cost Optimization

```bash
# Set up consumption plan budget alerts
az monitor action-group create \
  --name budget-alerts \
  --resource-group ecommerce-rg \
  --action email admin@ecommerce.com

az consumption budget create \
  --budget-name serverless-budget \
  --amount 1000 \
  --time-grain Monthly \
  --category Cost \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/ecommerce-rg" \
  --notifications '{
    "actual_GreaterThan_80_Percent": {
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 80,
      "contactEmails": ["admin@ecommerce.com"],
      "contactGroups": [],
      "contactRoles": []
    }
  }'

# Optimize Azure Functions scaling
az functionapp config appsettings set \
  --name ecommerce-functions \
  --resource-group ecommerce-rg \
  --setting WEBSITE_MAX_DYNAMIC_APPLICATION_SCALE_OUT=10

# Monitor serverless costs
az costmanagement query \
  --type "Usage" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --dataset-granularity "Daily" \
  --dataset-aggregation '{"totalCost":{"name":"PreTaxCost","function":"Sum"}}' \
  --timeframe "MonthToDate" \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceType\",\"operator\":\"In\",\"values\":[\"microsoft.web/sites\",\"microsoft.app/containerapps\",\"microsoft.web/staticsites\"]}}]}"
```

## Security Considerations

- Implement proper authentication and authorization for all endpoints
- Use Azure Active Directory for identity management
- Implement OAuth 2.0 and OpenID Connect for API security
- Use Azure API Management for API security and throttling
- Implement proper input validation and sanitization
- Use Azure Key Vault for secrets management
- Implement proper encryption for data at rest and in transit
- Use Azure Private Link for secure service communication
- Implement proper network security and segmentation
- Use Azure Firewall for advanced security
- Implement proper logging and monitoring for security events
- Use Azure Sentinel for security analytics and threat detection
- Implement proper access controls and least privilege principles
- Use Azure Policy for security governance and compliance
- Implement proper session management and token handling
- Use Azure Information Protection for data classification
- Implement proper audit logging and compliance reporting
- Use Azure Security Center for security posture management
- Implement proper vulnerability management and patching
- Use Azure Defender for threat protection
- Implement proper incident response and recovery procedures
- Use Azure Backup for data protection and recovery
- Implement proper disaster recovery and business continuity
- Use Azure Lighthouse for secure multi-tenant scenarios
- Implement proper compliance with industry standards
- Use Azure Information Protection for data labeling
- Implement proper change management and approval processes
- Use Azure Blueprints for secure environment deployment
- Implement proper identity governance and administration
- Use Azure AD Privileged Identity Management
- Implement proper network isolation and micro-segmentation
- Use Azure Firewall Manager for centralized firewall management
- Implement proper encryption key management
- Use Azure Key Vault for cryptographic operations
- Implement proper certificate management
- Use Azure App Configuration for secure configuration management
- Implement proper secrets rotation and management
- Use Azure Managed Identities for secure authentication
- Implement proper role-based access control (RBAC)
- Use Azure Policy for automated security compliance
- Implement proper security monitoring and alerting
- Use Azure Monitor for security telemetry
- Implement proper threat intelligence and analysis
- Use Azure Sentinel for advanced threat hunting
- Implement proper security training and awareness
- Use Azure Security Benchmark for security best practices
- Implement proper penetration testing and vulnerability assessment
- Use Azure Defender for DevOps for CI/CD security
- Implement proper supply chain security
- Use Azure Container Registry for secure container management
- Implement proper image scanning and vulnerability assessment
- Use Azure Policy for container security governance
- Implement proper runtime security for containers
- Use Azure Defender for Containers for container threat protection
- Implement proper serverless security best practices
- Use Azure Functions security best practices
- Implement proper API security and rate limiting
- Use Azure API Management security features
- Implement proper web application firewall (WAF)
- Use Azure Front Door for DDoS protection
- Implement proper bot management and protection
- Use Azure Cognitive Services for fraud detection
- Implement proper data loss prevention (DLP)
- Use Azure Information Protection for data protection
- Implement proper data masking and anonymization
- Use Azure SQL Database security features
- Implement proper database encryption and access controls
- Use Azure Key Vault for database secrets
- Implement proper audit logging for database operations
- Use Azure Monitor for database security monitoring
- Implement proper backup encryption and security
- Use Azure Backup security features
- Implement proper compliance monitoring and reporting
- Use Azure Policy for compliance automation
- Implement proper risk assessment and management
- Use Azure Security Center for risk management
- Implement proper incident management and response
- Use Azure Sentinel for incident response
- Implement proper forensic analysis capabilities
- Use Azure Monitor Logs for security forensics
- Implement proper business continuity and disaster recovery
- Use Azure Site Recovery for disaster recovery
- Implement proper backup and recovery procedures
- Use Azure Backup for automated backups
- Implement proper testing and validation of backups
- Use Azure Chaos Studio for resilience testing
- Implement proper capacity planning and management
- Use Azure Advisor for security recommendations
- Implement proper cost optimization for security controls
- Use Azure Cost Management for security cost analysis
- Implement proper sustainability and environmental security
- Use Azure Advisor for environmental security recommendations

## Comparison with Other Cloud Providers

| Feature | Azure Serverless | AWS Serverless | GCP Serverless |
|---------|------------------|----------------|----------------|
| Functions | Azure Functions | AWS Lambda | Cloud Functions |
| Containers | Container Apps | Fargate | Cloud Run |
| Static Web | Static Web Apps | Amplify | Firebase Hosting |
| API Gateway | API Management | API Gateway | API Gateway |
| Workflows | Logic Apps | Step Functions | Workflows |
| Event Processing | Event Grid | EventBridge | Eventarc |
| Scaling | Automatic | Automatic | Automatic |
| Languages | Multiple | Multiple | Multiple |
| Cold Starts | Optimized | Standard | Optimized |
| Pricing | Pay-per-use | Pay-per-use | Pay-per-use |
| Integration | Extensive | Extensive | Extensive |
| Monitoring | Application Insights | CloudWatch | Cloud Monitoring |
| Security | Azure AD | IAM | IAM |
| Global Reach | 60+ regions | 25+ regions | 28+ regions |
| Vendor Lock-in | Moderate | Moderate | Moderate |

## Common Use Cases

- **Real-time Data Processing**: Process streaming data from IoT devices, user events, or application logs
- **API Backends**: Build scalable REST APIs and GraphQL endpoints for web and mobile applications
- **Background Processing**: Handle asynchronous tasks like email sending, image processing, or data synchronization
- **Scheduled Tasks**: Run periodic jobs for data cleanup, report generation, or system maintenance
- **Event-driven Architectures**: Respond to events from various sources like databases, queues, or external services
- **Microservices**: Deploy independent services that can scale independently
- **Web Applications**: Host static websites and single-page applications with global CDN
- **Mobile Backends**: Provide backend services for mobile applications with offline sync
- **IoT Applications**: Process and analyze data from IoT devices at scale
- **Chatbots and AI**: Integrate with AI services for intelligent conversational interfaces
- **File Processing**: Handle file uploads, image resizing, video transcoding, and document processing
- **Notification Systems**: Send push notifications, emails, and SMS messages
- **Authentication Services**: Implement custom authentication and authorization logic
- **Payment Processing**: Handle payment transactions and integrations with payment gateways
- **Search Services**: Implement full-text search and indexing capabilities
- **Analytics and Reporting**: Generate real-time analytics and business intelligence reports
- **Machine Learning**: Deploy and serve machine learning models for prediction and classification
- **Blockchain Applications**: Build decentralized applications and smart contracts
- **Gaming Backends**: Provide scalable backends for multiplayer games
- **E-commerce Platforms**: Handle product catalogs, shopping carts, and order processing
- **Content Management**: Build headless CMS systems for content-driven applications
- **Integration Platforms**: Connect disparate systems and APIs through workflows
- **DevOps Automation**: Automate deployment, testing, and monitoring pipelines
- **Security Services**: Implement custom security scanning and compliance checking
- **Monitoring and Alerting**: Build custom monitoring dashboards and alerting systems
- **Data Processing Pipelines**: Create ETL pipelines for data transformation and loading
- **Recommendation Engines**: Build personalized recommendation systems
- **Social Media Integration**: Integrate with social media platforms for sharing and authentication
- **Geospatial Applications**: Process location-based data and provide mapping services
- **Voice Applications**: Build voice-enabled applications with speech recognition
- **Augmented Reality**: Provide AR content and experiences through serverless backends
- **Virtual Reality**: Support VR applications with scalable backend services
- **Edge Computing**: Deploy serverless functions at the edge for low-latency processing
- **Multi-cloud Deployments**: Deploy applications across multiple cloud providers
- **Hybrid Cloud**: Integrate on-premises systems with cloud serverless services
- **Serverless Databases**: Use serverless database offerings for variable workloads
- **Caching Layers**: Implement distributed caching for improved performance
- **Queue Processing**: Handle message queues for asynchronous processing
- **Stream Processing**: Process real-time data streams and analytics
- **Batch Processing**: Run large-scale batch jobs and data processing tasks
- **Data Lake Processing**: Process and analyze data in data lakes
- **Log Processing**: Parse and analyze application and system logs
- **Metrics Aggregation**: Collect and aggregate metrics from multiple sources
- **Alert Management**: Manage and route alerts from various monitoring systems
- **Incident Response**: Automate incident response and remediation processes
- **Compliance Automation**: Automate compliance checks and reporting
- **Cost Optimization**: Implement automated cost optimization strategies
- **Resource Provisioning**: Automate infrastructure provisioning and deprovisioning
- **Configuration Management**: Manage application configurations across environments
- **Secret Management**: Securely manage and rotate secrets and credentials
- **Certificate Management**: Automate SSL certificate provisioning and renewal
- **DNS Management**: Automate DNS record management and updates
- **Load Balancing**: Implement intelligent load balancing and traffic routing
- **Rate Limiting**: Implement rate limiting and throttling for APIs
- **Circuit Breaking**: Implement circuit breaker patterns for resilient services
- **Service Discovery**: Implement dynamic service discovery and registration
- **Health Checking**: Implement comprehensive health checks and monitoring
- **Tracing and Observability**: Implement distributed tracing and observability
- **Performance Monitoring**: Monitor application performance and bottlenecks
- **Error Tracking**: Track and analyze application errors and exceptions
- **User Analytics**: Track and analyze user behavior and engagement
- **A/B Testing**: Implement A/B testing and feature flag management
- **Feature Toggles**: Manage feature releases and rollbacks
- **Blue-Green Deployments**: Implement zero-downtime deployments
- **Canary Deployments**: Implement gradual rollout strategies
- **Rollback Automation**: Automate rollback procedures for failed deployments
- **Chaos Engineering**: Implement chaos engineering for resilience testing
- **Synthetic Monitoring**: Implement synthetic monitoring for availability testing
- **Real User Monitoring**: Monitor real user experiences and performance
- **Application Performance Monitoring**: Monitor application performance metrics
- **Infrastructure Monitoring**: Monitor infrastructure health and utilization
- **Log Aggregation**: Aggregate and analyze logs from multiple sources
- **Security Monitoring**: Monitor security events and threats
- **Compliance Monitoring**: Monitor compliance with regulatory requirements
- **Cost Monitoring**: Monitor and analyze cloud costs and usage
- **Sustainability Monitoring**: Monitor environmental impact and carbon footprint