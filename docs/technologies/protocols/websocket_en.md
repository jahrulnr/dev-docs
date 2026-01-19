# WebSocket

## Overview

WebSocket is a communication protocol that provides full-duplex, bidirectional communication channels over a single TCP connection. Unlike HTTP which follows a request-response pattern, WebSocket enables real-time, persistent connections where both client and server can send messages to each other at any time.

WebSocket starts with an HTTP handshake (upgrade request) and then switches to the WebSocket protocol. This allows it to work through firewalls and proxies that support HTTP. Once established, the connection remains open for continuous data exchange.

## Key Concepts

- **Handshake**: Initial HTTP request to upgrade to WebSocket protocol
- **Frames**: Binary data units sent over WebSocket connection
- **Subprotocols**: Application-specific protocols (e.g., STOMP, MQTT over WebSocket)
- **Connection States**: Connecting, Open, Closing, Closed
- **Ping/Pong**: Keep-alive mechanism to maintain connections
- **Close Codes**: Standardized codes for connection termination

## When to Use

- Real-time applications requiring instant updates
- Chat applications and messaging
- Live collaboration tools
- Gaming and multiplayer interactions
- Financial trading platforms
- IoT device monitoring
- Live sports scores and updates
- Notification systems

## Examples

### WebSocket Handshake

```http
GET /websocket HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### JavaScript Client Example

```javascript
// Create WebSocket connection
const socket = new WebSocket('ws://localhost:8080');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket');
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server:', event.data);
});

// Connection closed
socket.addEventListener('close', function (event) {
    console.log('Connection closed');
});

// Error handling
socket.addEventListener('error', function (event) {
    console.error('WebSocket error:', event);
});
```

### Node.js Server Example

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    // Send welcome message
    ws.send('Welcome to WebSocket server!');

    // Listen for messages
    ws.on('message', function incoming(message) {
        console.log('Received:', message);
        
        // Echo back
        ws.send(`Echo: ${message}`);
    });

    // Handle disconnection
    ws.on('close', function() {
        console.log('Client disconnected');
    });
});
```

## Best Practices

- Implement proper connection limits and rate limiting
- Use secure WebSocket (WSS) for production
- Handle connection drops gracefully with reconnection logic
- Implement heartbeat/ping-pong for connection monitoring
- Use subprotocols for complex message routing
- Compress messages for better performance
- Implement authentication and authorization
- Handle backpressure to prevent memory issues
- Use connection pooling for high-traffic applications
- Monitor connection metrics and health

### Security Considerations

- Validate Origin headers to prevent CSRF
- Implement proper authentication (tokens, cookies)
- Use WSS (WebSocket Secure) in production
- Sanitize all incoming messages
- Implement rate limiting per connection
- Handle malicious disconnection attempts

### Performance Optimization

- Use binary frames for large data transfers
- Implement message compression (permessage-deflate)
- Batch small messages when possible
- Monitor and limit concurrent connections
- Use connection pooling for server resources
- Implement proper backpressure handling

## Integration with Ecommerce

WebSocket is essential for modern ecommerce platforms requiring real-time features:

- **Live Chat Support**: Real-time customer service communication
- **Inventory Updates**: Instant stock level notifications
- **Price Alerts**: Real-time price change notifications
- **Order Tracking**: Live order status updates
- **Auction Systems**: Real-time bidding updates
- **Cart Synchronization**: Cross-device cart updates
- **Live Product Demos**: Interactive product presentations
- **Customer Notifications**: Instant alerts for promotions, restocks
- **Collaborative Shopping**: Shared shopping experiences
- **Real-time Analytics**: Live dashboard updates

### Ecommerce WebSocket Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Web Client    │◄──────────────►│  WebSocket      │
│                 │                │  Server/Gateway │
└─────────────────┘                └─────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │   Message       │
                               │   Broker       │
                               │   (Redis/Kafka)│
                               └─────────────────┘
                                        │
                               ┌─────────────────┐
                               │   Microservices │
                               │   (Order,       │
                               │    Inventory,   │
                               │    Payment)     │
                               └─────────────────┘
```

### Common Ecommerce WebSocket Events

```javascript
// Client sends
{
  "type": "subscribe",
  "channels": ["product:123", "inventory:electronics"]
}

// Server sends
{
  "type": "inventory_update",
  "product_id": "123",
  "new_stock": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}

{
  "type": "price_change",
  "product_id": "123",
  "old_price": 99.99,
  "new_price": 89.99,
  "reason": "flash_sale"
}

{
  "type": "order_update",
  "order_id": "ORD-456",
  "status": "shipped",
  "tracking_number": "1Z999AA1234567890"
}
```