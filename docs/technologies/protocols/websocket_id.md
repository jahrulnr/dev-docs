# WebSocket

## Gambaran Umum

WebSocket adalah protokol komunikasi yang menyediakan kanal komunikasi full-duplex, bidirectional melalui single TCP connection. Tidak seperti HTTP yang mengikuti pola request-response, WebSocket memungkinkan koneksi real-time, persistent dimana client dan server bisa saling kirim pesan kapan saja.

WebSocket dimulai dengan HTTP handshake (upgrade request) lalu beralih ke protokol WebSocket. Ini memungkinkan bekerja melalui firewall dan proxy yang support HTTP. Setelah established, koneksi tetap terbuka untuk continuous data exchange.

## Konsep Utama

- **Handshake**: Request HTTP awal untuk upgrade ke protokol WebSocket
- **Frames**: Unit data binary yang dikirim melalui koneksi WebSocket
- **Subprotocols**: Protokol spesifik aplikasi (e.g., STOMP, MQTT over WebSocket)
- **Connection States**: Connecting, Open, Closing, Closed
- **Ping/Pong**: Mekanisme keep-alive untuk maintain koneksi
- **Close Codes**: Kode standar untuk terminasi koneksi

## Kapan Digunakan

- Aplikasi real-time yang butuh update instant
- Aplikasi chat dan messaging
- Tools kolaborasi live
- Gaming dan interaksi multiplayer
- Platform trading finansial
- Monitoring perangkat IoT
- Live sports scores dan updates
- Sistem notifikasi

## Contoh

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

### Contoh JavaScript Client

```javascript
// Buat koneksi WebSocket
const socket = new WebSocket('ws://localhost:8080');

// Koneksi terbuka
socket.addEventListener('open', function (event) {
    console.log('Terhubung ke WebSocket');
    socket.send('Hello Server!');
});

// Listen untuk pesan
socket.addEventListener('message', function (event) {
    console.log('Pesan dari server:', event.data);
});

// Koneksi tertutup
socket.addEventListener('close', function (event) {
    console.log('Koneksi tertutup');
});

// Error handling
socket.addEventListener('error', function (event) {
    console.error('WebSocket error:', event);
});
```

### Contoh Server Node.js

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('Client terhubung');

    // Kirim pesan welcome
    ws.send('Welcome to WebSocket server!');

    // Listen untuk pesan
    ws.on('message', function incoming(message) {
        console.log('Received:', message);
        
        // Echo back
        ws.send(`Echo: ${message}`);
    });

    // Handle disconnection
    ws.on('close', function() {
        console.log('Client terputus');
    });
});
```

## Praktik Terbaik

- Implementasikan proper connection limits dan rate limiting
- Gunakan secure WebSocket (WSS) untuk production
- Handle connection drops gracefully dengan reconnection logic
- Implementasikan heartbeat/ping-pong untuk monitoring koneksi
- Gunakan subprotocols untuk complex message routing
- Kompres pesan untuk performa lebih baik
- Implementasikan authentication dan authorization
- Handle backpressure untuk prevent memory issues
- Gunakan connection pooling untuk high-traffic applications
- Monitor connection metrics dan health

### Pertimbangan Security

- Validasi Origin headers untuk prevent CSRF
- Implementasikan proper authentication (tokens, cookies)
- Gunakan WSS (WebSocket Secure) di production
- Sanitize semua incoming messages
- Implementasikan rate limiting per connection
- Handle malicious disconnection attempts

### Optimasi Performa

- Gunakan binary frames untuk transfer data besar
- Implementasikan message compression (permessage-deflate)
- Batch small messages jika memungkinkan
- Monitor dan limit concurrent connections
- Gunakan connection pooling untuk server resources
- Implementasikan proper backpressure handling

## Kasus penggunaan umum

- Dashboard real-time dan notifikasi live (fan-out SSE/WebSocket)
- Collaborative editing dan indikator presence
- Stream telemetri IoT dan status control plane
- Gaming, trading, atau tooling operasi yang tidak toleran polling latency

## Terkait

- [Server-Sent Events (SSE)](sse_id.md)
- [HTTP](http_id.md)
- [MQTT](mqtt_id.md)

## Referensi

- [RFC 6455 — The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
