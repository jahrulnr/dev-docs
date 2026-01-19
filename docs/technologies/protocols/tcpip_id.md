# TCP/IP (Transmission Control Protocol/Internet Protocol)

## Gambaran Umum

TCP/IP adalah suite protokol komunikasi fundamental yang membentuk tulang punggung internet dan sebagian besar jaringan modern. Dikembangkan pada 1970-an sebagai bagian dari proyek ARPANET, TCP/IP telah menjadi standar untuk komunikasi jaringan di seluruh dunia. Ia terdiri dari multiple protokol yang bekerja bersama untuk memungkinkan transmisi data yang reliable across networks.

Model TCP/IP terdiri dari empat layer: Network Interface, Internet, Transport, dan Application. Tidak seperti model OSI yang memiliki tujuh layer, TCP/IP menyediakan framework yang lebih praktis yang telah terbukti sangat sukses untuk komunikasi internet.

## Konsep Utama

- **TCP (Transmission Control Protocol)**: Transport protokol berorientasi koneksi, reliable yang memastikan pengiriman data
- **IP (Internet Protocol)**: Protokol tanpa koneksi yang bertanggung jawab untuk addressing dan routing packets
- **Port Numbers**: Angka 16-bit yang mengidentifikasi aplikasi atau service spesifik pada host
- **Sockets**: Kombinasi IP address dan port number yang uniquely mengidentifikasi network endpoint
- **Three-Way Handshake**: Proses TCP connection establishment (SYN, SYN-ACK, ACK)
- **Packet**: Unit data yang ditransmisikan melalui network (juga disebut datagram di IP)
- **MTU (Maximum Transmission Unit)**: Ukuran maksimum packet yang dapat ditransmisikan
- **TTL (Time To Live)**: Counter yang mencegah packets bersirkulasi tanpa batas
- **Checksum**: Mekanisme error-detection untuk memastikan data integrity

## Kapan Digunakan

- Transmisi data reliable yang memerlukan guaranteed delivery
- Aplikasi yang butuh ordered data delivery
- Komunikasi jaringan dimana data integrity sangat kritis
- Aplikasi client-server dengan persistent connections
- File transfers dan email delivery
- Web browsing dan HTTP communication
- Database connections dan remote procedure calls
- Aplikasi apa pun yang memerlukan reliable, ordered data streams

## Contoh

### Basic TCP Client (Python)

```python
import socket

def tcp_client(host='127.0.0.1', port=8080):
    # Create TCP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        # Connect to server
        client_socket.connect((host, port))
        print(f"Connected to {host}:{port}")
        
        # Send data
        message = "Hello, TCP Server!"
        client_socket.send(message.encode())
        
        # Receive response
        response = client_socket.recv(1024)
        print(f"Received: {response.decode()}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()

tcp_client()
```

### Basic TCP Server (Python)

```python
import socket

def tcp_server(host='127.0.0.1', port=8080):
    # Create TCP socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        # Bind socket to address
        server_socket.bind((host, port))
        
        # Listen for connections
        server_socket.listen(5)
        print(f"Server listening on {host}:{port}")
        
        while True:
            # Accept connection
            client_socket, client_address = server_socket.accept()
            print(f"Connection from {client_address}")
            
            # Handle client
            handle_client(client_socket)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server_socket.close()

def handle_client(client_socket):
    try:
        # Receive data
        data = client_socket.recv(1024)
        print(f"Received: {data.decode()}")
        
        # Send response
        response = "Hello from TCP Server!"
        client_socket.send(response.encode())
        
    except Exception as e:
        print(f"Client error: {e}")
    finally:
        client_socket.close()

tcp_server()
```

### TCP Connection States

```python
# TCP state machine representation
TCP_STATES = {
    'CLOSED': 'Connection closed',
    'LISTEN': 'Waiting for connection',
    'SYN_SENT': 'SYN sent, waiting for SYN-ACK',
    'SYN_RECEIVED': 'SYN received, waiting for ACK',
    'ESTABLISHED': 'Connection established',
    'FIN_WAIT_1': 'FIN sent, waiting for ACK',
    'FIN_WAIT_2': 'FIN acknowledged, waiting for FIN',
    'CLOSE_WAIT': 'FIN received, waiting for application close',
    'CLOSING': 'Both sides sent FIN, waiting for ACK',
    'LAST_ACK': 'FIN received, ACK sent, waiting for ACK',
    'TIME_WAIT': 'Waiting for network to clear'
}
```

### Node.js TCP Server dengan Connection Pooling

```javascript
const net = require('net');

class TCPServer {
    constructor(port = 8080, host = '127.0.0.1') {
        this.port = port;
        this.host = host;
        this.server = null;
        this.connections = new Set();
    }
    
    start() {
        this.server = net.createServer((socket) => {
            console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);
            this.connections.add(socket);
            
            // Handle data
            socket.on('data', (data) => {
                console.log(`Received: ${data.toString()}`);
                
                // Echo back
                socket.write(`Echo: ${data.toString()}`);
            });
            
            // Handle connection close
            socket.on('close', () => {
                console.log('Connection closed');
                this.connections.delete(socket);
            });
            
            // Handle errors
            socket.on('error', (err) => {
                console.error('Socket error:', err);
                this.connections.delete(socket);
            });
        });
        
        this.server.listen(this.port, this.host, () => {
            console.log(`TCP Server listening on ${this.host}:${this.port}`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('Shutting down server...');
            this.connections.forEach(socket => socket.destroy());
            this.server.close();
        });
    }
    
    broadcast(message) {
        this.connections.forEach(socket => {
            socket.write(message);
        });
    }
}

// Usage
const server = new TCPServer();
server.start();
```

### TCP Socket Options Configuration

```python
import socket

def create_optimized_tcp_socket():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # Set socket options for better performance
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)  # Disable Nagle's algorithm
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)  # Enable keep-alive
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)  # Keep-alive idle time
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)  # Keep-alive interval
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)  # Keep-alive count
    
    # Set buffer sizes
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)  # Receive buffer
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)  # Send buffer
    
    return sock
```

## Praktik Terbaik

- Gunakan socket options yang sesuai untuk use case Anda
- Implementasikan proper error handling dan connection management
- Gunakan connection pooling untuk high-performance applications
- Implementasikan timeouts untuk prevent hanging connections
- Handle network interruptions gracefully dengan reconnection logic
- Gunakan TCP untuk reliable data transmission, UDP untuk speed-critical applications
- Monitor connection states dan implementasikan health checks
- Gunakan SSL/TLS untuk secure communication
- Implementasikan proper resource cleanup
- Pertimbangkan menggunakan higher-level protocols yang built on TCP/IP

### Connection Management

```python
import socket
import time

class TCPConnectionManager:
    def __init__(self, host, port, max_retries=3, timeout=5):
        self.host = host
        self.port = port
        self.max_retries = max_retries
        self.timeout = timeout
        self.socket = None
        
    def connect(self):
        for attempt in range(self.max_retries):
            try:
                self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.socket.settimeout(self.timeout)
                self.socket.connect((self.host, self.port))
                print(f"Connected to {self.host}:{self.port}")
                return True
            except socket.error as e:
                print(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return False
    
    def send(self, data):
        if not self.socket:
            return False
        try:
            self.socket.sendall(data.encode())
            return True
        except socket.error:
            self.reconnect()
            return False
    
    def receive(self, buffer_size=1024):
        if not self.socket:
            return None
        try:
            return self.socket.recv(buffer_size).decode()
        except socket.error:
            self.reconnect()
            return None
    
    def reconnect(self):
        if self.socket:
            self.socket.close()
        print("Attempting to reconnect...")
        return self.connect()
    
    def close(self):
        if self.socket:
            self.socket.close()
            self.socket = None
```

### Performance Optimization

- **TCP_NODELAY**: Disable Nagle's algorithm untuk real-time applications
- **SO_KEEPALIVE**: Enable keep-alive packets untuk detect broken connections
- **SO_REUSEADDR**: Allow socket reuse untuk faster restarts
- **TCP_CORK**: Buffer small packets (Linux only)
- **Buffer Sizes**: Optimize SO_RCVBUF dan SO_SNDBUF
- **Connection Pooling**: Reuse connections untuk better performance
- **Async I/O**: Use non-blocking sockets untuk high concurrency

### Security Considerations

- Gunakan TLS/SSL untuk encrypted communication
- Implementasikan proper authentication dan authorization
- Validate input data untuk prevent injection attacks
- Gunakan firewalls untuk restrict access
- Monitor untuk suspicious connection patterns
- Implementasikan rate limiting
- Gunakan secure socket options
- Regularly update underlying libraries

## TCP/IP dalam Modern Applications

TCP/IP berfungsi sebagai fondasi untuk countless applications:

- **Web Services**: HTTP/HTTPS over TCP
- **Email**: SMTP, POP3, IMAP over TCP
- **File Transfer**: FTP over TCP
- **Remote Access**: SSH, Telnet over TCP
- **Database Connections**: MySQL, PostgreSQL over TCP
- **API Communication**: REST, GraphQL, gRPC over TCP
- **Streaming**: Video/audio streaming protocols
- **IoT Communication**: MQTT, CoAP over TCP/IP
- **Cloud Services**: All major cloud platforms use TCP/IP

### TCP/IP Protocol Stack

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  HTTP, FTP, SMTP, DNS, DHCP, etc.   │
├─────────────────────────────────────┤
│         Transport Layer             │
│  TCP (reliable) / UDP (unreliable)  │
├─────────────────────────────────────┤
│         Internet Layer              │
│  IP, ICMP, ARP, IGMP, etc.          │
├─────────────────────────────────────┤
│         Network Interface Layer     │
│  Ethernet, Wi-Fi, PPP, etc.         │
└─────────────────────────────────────┘
```

### Common TCP/IP Ports

| Port | Protocol | Service |
|------|----------|---------|
| 20/21 | TCP | FTP |
| 22 | TCP | SSH |
| 23 | TCP | Telnet |
| 25 | TCP | SMTP |
| 53 | TCP/UDP | DNS |
| 80 | TCP | HTTP |
| 110 | TCP | POP3 |
| 143 | TCP | IMAP |
| 443 | TCP | HTTPS |
| 3306 | TCP | MySQL |
| 5432 | TCP | PostgreSQL |