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

## Typical use cases

- Real-time dashboards and live notifications (SSE/WebSocket fan-out)
- Collaborative editing and presence indicators
- IoT telemetry and control-plane status streams
- Gaming, trading, or ops tooling that cannot tolerate polling latency

## Related

- [Server-Sent Events](sse_en.md)
- [HTTP](http_en.md)
- [MQTT](mqtt_en.md)

## References

- [RFC 6455 — The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
