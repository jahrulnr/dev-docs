# UDP (User Datagram Protocol)

## Gambaran Umum

UDP adalah transport layer protocol yang connectionless, unreliable yang menyediakan cara sederhana, low-overhead untuk mengirim datagrams melalui IP network. Tidak seperti TCP yang menjamin reliable, ordered delivery, UDP fokus pada speed dan efficiency, menjadikannya ideal untuk aplikasi dimana occasional packet loss dapat diterima dan low latency sangat kritis.

UDP umum digunakan untuk real-time applications seperti video streaming, online gaming, VoIP, dan DNS queries dimana speed lebih penting daripada perfect reliability. Ia menambahkan minimal overhead ke IP packets dan tidak establish connections sebelum mengirim data.

## Konsep Utama

- **Datagram**: Self-contained packet of data yang dikirim melalui network
- **Connectionless**: Tidak ada handshake atau connection establishment yang diperlukan
- **Unreliable**: Tidak ada guarantee of delivery, ordering, atau duplicate protection
- **Stateless**: Server tidak maintain connection state untuk clients
- **Low Overhead**: Minimal protocol headers dan tidak ada acknowledgments
- **Multicast/Broadcast**: Dapat mengirim ke multiple recipients secara simultan
- **Port Numbers**: Digunakan untuk mengidentifikasi applications, sama seperti TCP
- **Checksum**: Optional error detection (dapat dinonaktifkan untuk performance)

## Kapan Digunakan

- Real-time applications yang memerlukan low latency
- Video dan audio streaming
- Online gaming dan multiplayer applications
- VoIP dan video conferencing
- DNS queries dan network discovery
- IoT sensor data transmission
- Network monitoring dan logging
- Time synchronization protocols (NTP)
- DHCP dan other discovery protocols
- Applications yang tolerant terhadap occasional data loss

## Contoh

### Basic UDP Client (Python)

```python
import socket

def udp_client(host='127.0.0.1', port=8080):
    # Create UDP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Send data (no connection needed)
        message = "Hello, UDP Server!"
        client_socket.sendto(message.encode(), (host, port))
        print(f"Sent: {message}")
        
        # Receive response
        response, server_address = client_socket.recvfrom(1024)
        print(f"Received from {server_address}: {response.decode()}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()

udp_client()
```

### Basic UDP Server (Python)

```python
import socket

def udp_server(host='127.0.0.1', port=8080):
    # Create UDP socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Bind socket to address
        server_socket.bind((host, port))
        print(f"UDP Server listening on {host}:{port}")
        
        while True:
            # Receive data
            data, client_address = server_socket.recvfrom(1024)
            print(f"Received from {client_address}: {data.decode()}")
            
            # Send response
            response = f"Hello from UDP Server to {client_address}!"
            server_socket.sendto(response.encode(), client_address)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server_socket.close()

udp_server()
```

### UDP Broadcast Example

```python
import socket

def udp_broadcast_sender(broadcast_port=8080):
    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # Enable broadcasting
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    
    try:
        message = "Broadcast message!"
        
        # Send to broadcast address
        sock.sendto(message.encode(), ('255.255.255.255', broadcast_port))
        print(f"Broadcast sent: {message}")
        
    except Exception as e:
        print(f"Broadcast error: {e}")
    finally:
        sock.close()

def udp_broadcast_receiver(broadcast_port=8080):
    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Bind to broadcast port
        sock.bind(('', broadcast_port))
        print(f"Listening for broadcasts on port {broadcast_port}")
        
        while True:
            data, addr = sock.recvfrom(1024)
            print(f"Broadcast from {addr}: {data.decode()}")
            
    except Exception as e:
        print(f"Receiver error: {e}")
    finally:
        sock.close()
```

### Node.js UDP Server dengan Multiple Clients

```javascript
const dgram = require('dgram');

class UDPServer {
    constructor(port = 8080, host = '127.0.0.1') {
        this.port = port;
        this.host = host;
        this.server = null;
        this.clients = new Map(); // Track clients by address
    }
    
    start() {
        this.server = dgram.createSocket('udp4');
        
        this.server.on('listening', () => {
            console.log(`UDP Server listening on ${this.host}:${this.port}`);
        });
        
        this.server.on('message', (msg, rinfo) => {
            const clientKey = `${rinfo.address}:${rinfo.port}`;
            console.log(`Message from ${clientKey}: ${msg.toString()}`);
            
            // Track client
            this.clients.set(clientKey, rinfo);
            
            // Echo back to sender
            const response = `Echo: ${msg.toString()}`;
            this.server.send(response, rinfo.port, rinfo.address);
        });
        
        this.server.on('error', (err) => {
            console.error(`UDP Server error: ${err.stack}`);
            this.server.close();
        });
        
        this.server.bind(this.port, this.host);
    }
    
    broadcast(message) {
        const msg = Buffer.from(message);
        this.clients.forEach((rinfo) => {
            this.server.send(msg, rinfo.port, rinfo.address);
        });
    }
    
    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// Usage
const server = new UDPServer();
server.start();

// Broadcast every 10 seconds
setInterval(() => {
    server.broadcast('Server broadcast message');
}, 10000);
```

### High-Performance UDP dengan Non-blocking I/O

```python
import socket
import select
import time

class HighPerformanceUDPServer:
    def __init__(self, host='127.0.0.1', port=8080, buffer_size=65536):
        self.host = host
        self.port = port
        self.buffer_size = buffer_size
        self.socket = None
        self.running = False
        
    def start(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, self.buffer_size)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, self.buffer_size)
        self.socket.setblocking(False)  # Non-blocking mode
        
        try:
            self.socket.bind((self.host, self.port))
            print(f"High-performance UDP server started on {self.host}:{self.port}")
            self.running = True
            self.run()
        except Exception as e:
            print(f"Failed to start server: {e}")
    
    def run(self):
        while self.running:
            try:
                # Use select for non-blocking receive
                ready = select.select([self.socket], [], [], 0.1)
                
                if ready[0]:
                    data, addr = self.socket.recvfrom(1024)
                    self.handle_message(data, addr)
                    
            except socket.error:
                continue
            except KeyboardInterrupt:
                self.stop()
    
    def handle_message(self, data, addr):
        message = data.decode()
        print(f"Received from {addr}: {message}")
        
        # Process message (implement your logic here)
        response = f"Processed: {message}"
        self.socket.sendto(response.encode(), addr)
    
    def stop(self):
        self.running = False
        if self.socket:
            self.socket.close()
        print("Server stopped")
```

## Praktik Terbaik

- Gunakan UDP ketika speed lebih penting daripada reliability
- Implementasikan application-level reliability jika diperlukan
- Gunakan buffer sizes yang sesuai untuk use case Anda
- Handle packet loss gracefully di aplikasi Anda
- Implementasikan timeouts untuk operations
- Gunakan broadcast/multicast ketika mengirim ke multiple recipients
- Monitor packet loss dan latency metrics
- Pertimbangkan TCP untuk applications yang memerlukan guaranteed delivery
- Gunakan UDP checksums untuk error detection
- Implementasikan proper resource cleanup

### Reliability Patterns untuk UDP

```python
import socket
import time
import random

class ReliableUDPClient:
    def __init__(self, host, port, max_retries=3, timeout=1.0):
        self.host = host
        self.port = port
        self.max_retries = max_retries
        self.timeout = timeout
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sequence_number = 0
        
    def send_reliable(self, data):
        """Send data with acknowledgment and retries"""
        packet = {
            'seq': self.sequence_number,
            'data': data,
            'timestamp': time.time()
        }
        
        packet_bytes = str(packet).encode()
        
        for attempt in range(self.max_retries):
            try:
                # Send packet
                self.socket.sendto(packet_bytes, (self.host, self.port))
                
                # Wait for acknowledgment
                self.socket.settimeout(self.timeout)
                ack, addr = self.socket.recvfrom(1024)
                
                ack_data = eval(ack.decode())  # Simple parsing
                
                if ack_data.get('seq') == self.sequence_number:
                    self.sequence_number += 1
                    return True
                    
            except socket.timeout:
                print(f"Timeout on attempt {attempt + 1}")
                continue
        
        return False
    
    def close(self):
        self.socket.close()
```

### Performance Optimization

- **Large Buffer Sizes**: Increase SO_RCVBUF dan SO_SNDBUF
- **Non-blocking I/O**: Use select/poll/epoll untuk high concurrency
- **Multicast**: Send ke multiple recipients efficiently
- **Packet Size Optimization**: Avoid fragmentation
- **CPU Affinity**: Pin threads ke specific CPU cores
- **Zero-copy Operations**: Minimize data copying
- **Batch Processing**: Handle multiple packets together

### Security Considerations

- UDP packets dapat di-spoof dengan mudah
- Implementasikan application-level authentication
- Gunakan encryption untuk sensitive data (DTLS)
- Validate packet sources
- Implementasikan rate limiting
- Monitor untuk UDP flood attacks
- Gunakan firewalls untuk restrict UDP traffic
- Pertimbangkan menggunakan TCP untuk secure communications

## UDP vs TCP Comparison

| Aspect | UDP | TCP |
|--------|-----|-----|
| Connection | Connectionless | Connection-oriented |
| Reliability | Unreliable | Reliable |
| Ordering | Not guaranteed | Guaranteed |
| Speed | Fast | Slower due to overhead |
| Overhead | Low (8 bytes) | High (20+ bytes) |
| Use Cases | Streaming, gaming, DNS | File transfer, web, email |
| Error Recovery | Application-level | Built-in |
| Congestion Control | None | Built-in |
| Packet Size | Limited by MTU | Can fragment |

## Common UDP Applications

- **DNS**: Domain name resolution
- **DHCP**: IP address assignment
- **NTP**: Network time synchronization
- **SNMP**: Network management
- **TFTP**: Simple file transfer
- **RIP**: Routing information protocol
- **VoIP**: Voice over IP (SIP, RTP)
- **Online Gaming**: Fast-paced multiplayer games
- **Video Streaming**: Real-time video delivery
- **IoT**: Sensor data transmission

### UDP Protocol Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length             |           Checksum            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                            Data                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Common UDP Ports

| Port | Service | Description |
|------|---------|-------------|
| 53 | DNS | Domain Name System |
| 67/68 | DHCP | Dynamic Host Configuration Protocol |
| 69 | TFTP | Trivial File Transfer Protocol |
| 123 | NTP | Network Time Protocol |
| 161 | SNMP | Simple Network Management Protocol |
| 500 | IKE | Internet Key Exchange (VPN) |
| 514 | Syslog | System Logging |
| 1812 | RADIUS | Remote Authentication Dial-In User Service |