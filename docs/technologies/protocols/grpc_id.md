# gRPC

## Gambaran Umum

gRPC adalah high-performance, open-source universal RPC framework yang dikembangkan oleh Google. Menggunakan HTTP/2 untuk transport, Protocol Buffers sebagai interface definition language, dan menyediakan fitur seperti authentication, load balancing, dan lainnya. Tidak seperti REST APIs yang menggunakan JSON over HTTP/1.1, gRPC dirancang untuk low latency, highly scalable, distributed systems.

gRPC mendukung multiple programming languages dan menyediakan empat tipe service methods: unary (simple request-response), server streaming, client streaming, dan bidirectional streaming. Sangat cocok untuk microservices architectures dan skenario komunikasi real-time.

## Konsep Utama

- **Protocol Buffers (protobuf)**: Mekanisme serialisasi data terstruktur yang language-neutral, platform-neutral, extensible
- **Service Definition**: Interface definition menggunakan .proto files yang mendefinisikan RPC methods
- **Unary RPC**: Pola request-response sederhana
- **Server Streaming**: Server mengirim multiple responses untuk single client request
- **Client Streaming**: Client mengirim multiple requests, server respond sekali
- **Bidirectional Streaming**: Client dan server mengirim multiple messages
- **Interceptors**: Middleware untuk cross-cutting concerns seperti logging, authentication
- **Channels**: Koneksi ke gRPC server endpoint
- **Stubs**: Representasi client-side dari gRPC service
- **Metadata**: Key-value pairs dikirim dengan RPC calls (mirip HTTP headers)

## Kapan Digunakan

- Komunikasi microservices yang butuh high performance
- Aplikasi streaming real-time
- APIs dengan complex data structures
- Environment multi-language
- Environment dengan network constraints (mobile, IoT)
- Komunikasi internal service-to-service
- APIs yang perlu evolve over time
- Sistem yang butuh strong typing dan code generation
- Aplikasi yang butuh advanced features seperti load balancing, tracing

## Contoh

### Protocol Buffer Definition

```protobuf
syntax = "proto3";

package example.orders.v1;

option java_multiple_files = true;
option java_package = "com.example.example.orders.v1";
option java_outer_classname = "OrdersProto";

// Import standard types
import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

// Product message
message Product {
  string id = 1;
  string name = 2;
  string description = 3;
  double price = 4;
  string currency = 5;
  int32 stock_quantity = 6;
  repeated string categories = 7;
  google.protobuf.Timestamp created_at = 8;
  google.protobuf.Timestamp updated_at = 9;
}

// Order message
message Order {
  string id = 1;
  string customer_id = 2;
  repeated OrderItem items = 3;
  double total_amount = 4;
  string currency = 5;
  string status = 6;
  google.protobuf.Timestamp created_at = 7;
  ShippingAddress shipping_address = 8;
}

message OrderItem {
  string product_id = 1;
  string product_name = 2;
  int32 quantity = 3;
  double unit_price = 4;
  double total_price = 5;
}

message ShippingAddress {
  string street = 1;
  string city = 2;
  string state = 3;
  string zip_code = 4;
  string country = 5;
}

// Request/Response messages
message GetProductRequest {
  string product_id = 1;
}

message ListProductsRequest {
  int32 page_size = 1;
  string page_token = 2;
  string category_filter = 3;
}

message ListProductsResponse {
  repeated Product products = 1;
  string next_page_token = 2;
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
  ShippingAddress shipping_address = 3;
}

message UpdateInventoryRequest {
  string product_id = 1;
  int32 quantity_change = 2;
  string reason = 3;
}

// gRPC Service definition
service ProductService {
  rpc GetProduct(GetProductRequest) returns (Product);
  rpc ListProducts(ListProductsRequest) returns (ListProductsResponse);
  rpc CreateProduct(Product) returns (Product);
  rpc UpdateProduct(Product) returns (Product);
  rpc DeleteProduct(GetProductRequest) returns (google.protobuf.Empty);
}

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (Order);
  rpc GetOrder(GetProductRequest) returns (Order);
  rpc ListCustomerOrders(ListProductsRequest) returns (ListProductsResponse);
  rpc UpdateOrderStatus(UpdateInventoryRequest) returns (Order);
}

service InventoryService {
  rpc UpdateInventory(UpdateInventoryRequest) returns (Product);
  rpc GetInventory(GetProductRequest) returns (Product);
  rpc StreamInventoryUpdates(google.protobuf.Empty) returns (stream Product);
}
```

### Go gRPC Server Implementation

```go
package main

import (
    "context"
    "log"
    "net"
    "time"

    pb "github.com/example/orders/v1"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type productServiceServer struct {
    pb.UnimplementedProductServiceServer
    products map[string]*pb.Product
}

func (s *productServiceServer) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
    product, exists := s.products[req.ProductId]
    if !exists {
        return nil, status.Errorf(codes.NotFound, "product not found")
    }
    return product, nil
}

func (s *productServiceServer) ListProducts(ctx context.Context, req *pb.ListProductsRequest) (*pb.ListProductsResponse, error) {
    var products []*pb.Product
    for _, product := range s.products {
        // Apply filters if needed
        if req.CategoryFilter != "" {
            hasCategory := false
            for _, category := range product.Categories {
                if category == req.CategoryFilter {
                    hasCategory = true
                    break
                }
            }
            if !hasCategory {
                continue
            }
        }
        products = append(products, product)
    }
    
    return &pb.ListProductsResponse{
        Products: products,
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    
    server := grpc.NewServer()
    pb.RegisterProductServiceServer(server, &productServiceServer{
        products: make(map[string]*pb.Product),
    })
    
    log.Println("gRPC server listening on :50051")
    if err := server.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

### JavaScript gRPC Client

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load protobuf definition
const packageDefinition = protoLoader.loadSync('orders.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const ordersProto = grpc.loadPackageDefinition(packageDefinition).example.orders.v1;

// Create client
const productClient = new ordersProto.ProductService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// Unary RPC — get product by ID
productClient.GetProduct({ product_id: 'PROD-001' }, (error, product) => {
    if (error) console.error(error);
    else console.log('Product:', product);
});
```

## gRPC vs REST

| Aspect | REST (JSON/HTTP1.1) | gRPC (Protobuf/HTTP2) |
|--------|-------------------|----------------------|
| Payload Size | Lebih besar (JSON text) | Lebih kecil (binary protobuf) |
| Performance | Lebih lambat parsing | Lebih cepat serialization |
| Streaming | Terbatas (SSE) | Native bidirectional |
| Type Safety | Runtime validation | Compile-time guarantees |
| API Evolution | Flexible tapi error-prone | Strict backward compatibility |
| Browser Support | Universal | Butuh grpc-web |
| Debugging | Mudah (text) | Butuh tools (binary) |
| Load Balancing | Basic | Advanced (connection-level) |

## Terkait

- [HTTP](http_id.md)
- [GraphQL](graphql_id.md)
- [Kubernetes](../infrastructure/kubernetes_id.md)

## Referensi

- [gRPC Documentation](https://grpc.io/docs/)
