# STOMP (Streaming Text Oriented Messaging Protocol)

## Gambaran Umum

STOMP (Streaming Text Oriented Messaging Protocol) adalah protokol messaging sederhana berbasis teks untuk komunikasi antara klien dan message broker. Protokol ini menyediakan format wire yang interoperable yang memungkinkan klien STOMP berkomunikasi dengan message broker STOMP apa pun, menjadikannya pilihan populer untuk membangun aplikasi messaging. STOMP sering digunakan di atas WebSockets untuk menyediakan protokol messaging tingkat tinggi.

STOMP mendefinisikan serangkaian command dan frame untuk berinteraksi dengan message broker, termasuk mengirim dan menerima pesan, subscribe ke destination, dan mengelola transaksi. Protokol ini dirancang agar sederhana diimplementasikan sambil menyediakan fitur essential yang dibutuhkan untuk aplikasi messaging.

## Konsep Utama

- **Frames**: Unit komunikasi dasar di STOMP
- **Commands**: Operasi seperti CONNECT, SEND, SUBSCRIBE, dll
- **Headers**: Metadata untuk frame (destination, content-type, dll)
- **Body**: Payload pesan
- **Destinations**: Alamat untuk mengirim/menerima pesan
- **Subscriptions**: Registrasi klien untuk menerima pesan
- **Transactions**: Grouping multiple operasi secara atomik
- **Heartbeats**: Mekanisme keep-alive untuk koneksi

## Kapan Menggunakan

- Membangun aplikasi chat dan messaging real-time
- Mengimplementasikan pola messaging publish/subscribe
- Membuat sistem notifikasi
- Mengembangkan aplikasi kolaboratif
- Membangun arsitektur event-driven
- Mengintegrasikan dengan message broker (RabbitMQ, ActiveMQ)
- Membuat dashboard real-time dan sistem monitoring
- Mengimplementasikan job queue dan background processing
- Mengembangkan game multiplayer dengan update real-time
- Membangun sistem messaging IoT

## Contoh

### STOMP over WebSocket Dasar (JavaScript)

#### Implementasi Klien

```html
<!DOCTYPE html>
<html>
<head>
    <title>STOMP Chat Demo</title>
    <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js"></script>
</head>
<body>
    <h1>STOMP Chat</h1>
    <div id="messages"></div>
    
    <input type="text" id="messageInput" placeholder="Ketik pesan...">
    <button id="sendButton">Kirim</button>
    
    <div id="status">Terputus</div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const statusDiv = document.getElementById('status');

        let stompClient = null;

        function connect() {
            // Buat koneksi WebSocket
            const socket = new WebSocket('ws://localhost:8080/ws');
            
            // Buat klien STOMP di atas WebSocket
            stompClient = new StompJs.Client({
                webSocketFactory: () => socket,
                debug: (str) => console.log(str),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000
            });

            stompClient.onConnect = (frame) => {
                console.log('Terhubung:', frame);
                statusDiv.textContent = 'Terhubung';
                statusDiv.style.color = 'green';

                // Subscribe ke chat publik
                stompClient.subscribe('/topic/chat', (message) => {
                    const body = JSON.parse(message.body);
                    displayMessage(body.username, body.content, body.timestamp);
                });

                // Subscribe ke pesan privat
                stompClient.subscribe('/user/queue/messages', (message) => {
                    const body = JSON.parse(message.body);
                    displayMessage('Privat: ' + body.from, body.content, body.timestamp);
                });
            };

            stompClient.onStompError = (frame) => {
                console.error('Error STOMP:', frame);
                statusDiv.textContent = 'Error: ' + frame.headers['message'];
                statusDiv.style.color = 'red';
            };

            stompClient.onWebSocketClose = () => {
                console.log('WebSocket ditutup');
                statusDiv.textContent = 'Terputus';
                statusDiv.style.color = 'red';
            };

            stompClient.activate();
        }

        function disconnect() {
            if (stompClient) {
                stompClient.deactivate();
            }
        }

        function sendMessage() {
            const content = messageInput.value.trim();
            if (content && stompClient && stompClient.connected) {
                const message = {
                    username: 'User' + Math.floor(Math.random() * 1000),
                    content: content,
                    timestamp: new Date().toISOString()
                };

                stompClient.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify(message)
                });

                messageInput.value = '';
            }
        }

        function displayMessage(username, content, timestamp) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <strong>${username}</strong> 
                <span class="timestamp">${new Date(timestamp).toLocaleTimeString()}</span><br>
                ${content}
            `;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Event listeners
        sendButton.onclick = sendMessage;
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        };

        // Connect saat page load
        connect();

        // Cleanup saat page unload
        window.onbeforeunload = disconnect;
    </script>

    <style>
        .message {
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
            background-color: #f5f5f5;
        }
        .timestamp {
            color: #666;
            font-size: 0.8em;
        }
        #messages {
            height: 300px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px 0;
        }
    </style>
</body>
</html>
```

#### Implementasi Server (Spring Boot)

```java
package com.example.stompchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@SpringBootApplication
public class StompChatApplication {
    public static void main(String[] args) {
        SpringApplication.run(StompChatApplication.class, args);
    }
}

@Controller
public class ChatController {

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/chat")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage,
                                   SimpMessageHeaderAccessor headerAccessor) {
        // Tambah timestamp jika belum ada
        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(new Date());
        }
        
        // Bisa tambah info session user di sini
        String sessionId = headerAccessor.getSessionId();
        System.out.println("Pesan dari session: " + sessionId);
        
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/chat")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        // Tambah user ke session WebSocket
        headerAccessor.getSessionAttributes().put("username", chatMessage.getUsername());
        
        chatMessage.setContent(chatMessage.getUsername() + " bergabung ke chat");
        chatMessage.setTimestamp(new Date());
        
        return chatMessage;
    }
}

public class ChatMessage {
    private String username;
    private String content;
    private Date timestamp;
    private MessageType type;

    public enum MessageType {
        CHAT, JOIN, LEAVE
    }

    // Getters and setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
    
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
}
```

### Konfigurasi STOMP (Spring Boot)

```java
package com.example.stompchat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix untuk pesan privat
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register endpoint "/ws" untuk koneksi WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Enable SockJS fallback
    }
}
```

### STOMP Lanjutan dengan Authentication

```java
package com.example.stompchat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketAuthConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = 
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract authentication token dari headers
                    String token = accessor.getFirstNativeHeader("Authorization");
                    
                    if (token != null && token.startsWith("Bearer ")) {
                        String jwtToken = token.substring(7);
                        
                        // Validate JWT token dan set authentication
                        try {
                            Authentication auth = validateJwtToken(jwtToken);
                            accessor.setUser(auth);
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Invalid token");
                        }
                    }
                }
                
                return message;
            }
        });
    }
    
    private Authentication validateJwtToken(String token) {
        // Implementasi validasi JWT
        // Return Authentication object dengan user details
        return null; // Placeholder
    }
}
```

### STOMP dengan RabbitMQ (Node.js)

```javascript
const stomp = require('stompit');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// STOMP client untuk RabbitMQ
const connectOptions = {
    host: 'localhost',
    port: 61613,
    connectHeaders: {
        host: '/',
        login: 'guest',
        passcode: 'guest'
    }
};

let stompClient;

function connectToRabbitMQ() {
    stomp.connect(connectOptions, (error, client) => {
        if (error) {
            console.error('Error koneksi STOMP:', error);
            setTimeout(connectToRabbitMQ, 5000);
            return;
        }

        stompClient = client;
        console.log('Terhubung ke RabbitMQ via STOMP');

        // Subscribe ke queue
        const subscribeHeaders = {
            destination: '/queue/chat.messages',
            ack: 'client-individual'
        };

        client.subscribe(subscribeHeaders, (error, message) => {
            if (error) {
                console.error('Subscribe error:', error);
                return;
            }

            message.readString('utf-8', (error, body) => {
                if (error) {
                    console.error('Read message error:', error);
                    return;
                }

                console.log('Pesan diterima:', body);
                
                // Broadcast ke semua klien WebSocket
                wss.clients.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(body);
                    }
                });

                // Acknowledge pesan
                client.ack(message);
            });
        });
    });
}

// WebSocket server untuk klien browser
wss.on('connection', (ws) => {
    console.log('Klien WebSocket terhubung');

    ws.on('message', (data) => {
        const message = data.toString();
        console.log('Diterima dari WebSocket:', message);

        // Kirim ke RabbitMQ via STOMP
        if (stompClient) {
            const frame = stompClient.send({
                destination: '/queue/chat.messages',
                body: message
            });
        }
    });

    ws.on('close', () => {
        console.log('Klien WebSocket terputus');
    });
});

// REST endpoint untuk mengirim pesan
app.post('/send', express.json(), (req, res) => {
    const { message } = req.body;
    
    if (stompClient) {
        stompClient.send({
            destination: '/queue/chat.messages',
            body: JSON.stringify(message)
        });
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'STOMP client tidak terhubung' });
    }
});

server.listen(8080, () => {
    console.log('Server berjalan di port 8080');
    connectToRabbitMQ();
});
```

### Manajemen Transaksi STOMP

```java
@Controller
public class TransactionController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/transaction.send")
    public void sendTransactionalMessage(@Payload TransactionMessage message) {
        // Mulai transaksi
        messagingTemplate.convertAndSend("/topic/transaction.start", 
            new TransactionStatus("STARTED", message.getTransactionId()));

        try {
            // Lakukan multiple operasi dalam transaksi
            performOperation1(message);
            performOperation2(message);
            performOperation3(message);

            // Commit transaksi
            messagingTemplate.convertAndSend("/topic/transaction.commit", 
                new TransactionStatus("COMMITTED", message.getTransactionId()));

        } catch (Exception e) {
            // Rollback transaksi
            messagingTemplate.convertAndSend("/topic/transaction.rollback", 
                new TransactionStatus("ROLLED_BACK", message.getTransactionId(), e.getMessage()));
            
            throw e;
        }
    }

    private void performOperation1(TransactionMessage message) {
        // Simulasi operasi
        messagingTemplate.convertAndSend("/topic/operation", 
            new OperationStatus("OPERATION_1", "COMPLETED", message.getTransactionId()));
    }

    private void performOperation2(TransactionMessage message) {
        // Simulasi operasi yang mungkin gagal
        if (Math.random() < 0.3) { // 30% chance gagal
            throw new RuntimeException("Operation 2 gagal");
        }
        
        messagingTemplate.convertAndSend("/topic/operation", 
            new OperationStatus("OPERATION_2", "COMPLETED", message.getTransactionId()));
    }

    private void performOperation3(TransactionMessage message) {
        // Simulasi operasi
        messagingTemplate.convertAndSend("/topic/operation", 
            new OperationStatus("OPERATION_3", "COMPLETED", message.getTransactionId()));
    }
}

public class TransactionMessage {
    private String transactionId;
    private String data;
    
    // Getters and setters
}

public class TransactionStatus {
    private String status;
    private String transactionId;
    private String errorMessage;
    
    // Constructors and getters/setters
}

public class OperationStatus {
    private String operation;
    private String status;
    private String transactionId;
    
    // Constructors and getters/setters
}
```

### Heartbeat STOMP dan Manajemen Koneksi

```javascript
class STOMPConnectionManager {
    constructor(url) {
        this.url = url;
        this.client = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.subscriptions = new Map();
        this.isConnected = false;
    }

    connect() {
        if (this.client && this.client.connected) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const socket = new WebSocket(this.url);
            
            this.client = new StompJs.Client({
                webSocketFactory: () => socket,
                debug: (str) => console.log('STOMP:', str),
                reconnectDelay: 0, // Kita handle reconnection manual
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000
            });

            this.client.onConnect = (frame) => {
                console.log('STOMP terhubung:', frame);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Re-subscribe ke semua destination
                this.resubscribeAll();
                
                resolve(frame);
            };

            this.client.onStompError = (frame) => {
                console.error('Error STOMP:', frame);
                this.isConnected = false;
                this.handleReconnection();
                reject(frame);
            };

            this.client.onWebSocketClose = () => {
                console.log('WebSocket ditutup');
                this.isConnected = false;
                this.handleReconnection();
            };

            this.client.onWebSocketError = (error) => {
                console.error('Error WebSocket:', error);
                this.isConnected = false;
                reject(error);
            };

            this.client.activate();
        });
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Mencoba reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection gagal:', error);
                });
            }, this.reconnectDelay);
        } else {
            console.error('Maksimal reconnection attempts tercapai');
        }
    }

    subscribe(destination, callback, headers = {}) {
        if (!this.client || !this.client.connected) {
            throw new Error('Klien STOMP tidak terhubung');
        }

        const subscription = this.client.subscribe(destination, callback, headers);
        
        // Simpan subscription untuk reconnection
        this.subscriptions.set(destination, {
            callback: callback,
            headers: headers,
            subscription: subscription
        });

        return subscription;
    }

    unsubscribe(destination) {
        const subInfo = this.subscriptions.get(destination);
        if (subInfo && subInfo.subscription) {
            subInfo.subscription.unsubscribe();
        }
        this.subscriptions.delete(destination);
    }

    resubscribeAll() {
        this.subscriptions.forEach((subInfo, destination) => {
            try {
                const subscription = this.client.subscribe(destination, subInfo.callback, subInfo.headers);
                subInfo.subscription = subscription;
                console.log(`Berlangganan ulang ke ${destination}`);
            } catch (error) {
                console.error(`Gagal berlangganan ulang ke ${destination}:`, error);
            }
        });
    }

    send(destination, body, headers = {}) {
        if (!this.client || !this.client.connected) {
            throw new Error('Klien STOMP tidak terhubung');
        }

        this.client.publish({
            destination: destination,
            body: body,
            headers: headers
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
        this.isConnected = false;
        this.subscriptions.clear();
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptionsCount: this.subscriptions.size,
            url: this.url
        };
    }
}

// Penggunaan
const stompManager = new STOMPConnectionManager('ws://localhost:8080/ws');

stompManager.connect().then(() => {
    // Subscribe ke topic
    stompManager.subscribe('/topic/chat', (message) => {
        console.log('Pesan chat diterima:', message.body);
    });

    stompManager.subscribe('/user/queue/notifications', (message) => {
        console.log('Notifikasi diterima:', message.body);
    });

    // Kirim pesan
    stompManager.send('/app/chat.sendMessage', JSON.stringify({
        content: 'Halo dari STOMP!',
        timestamp: new Date().toISOString()
    }));
}).catch(error => {
    console.error('Koneksi gagal:', error);
});
```

## Praktik Terbaik

- Implementasikan manajemen koneksi dan reconnection logic yang tepat
- Gunakan heartbeat untuk menjaga kesehatan koneksi
- Tangani autentikasi dan otorisasi dengan tepat
- Set batas ukuran pesan yang sesuai
- Implementasikan error handling dan logging yang tepat
- Gunakan transaksi untuk operasi atomik
- Monitor koneksi dan throughput pesan
- Implementasikan rate limiting untuk mencegah abuse
- Gunakan konvensi penamaan destination yang sesuai
- Tangani disconnect klien dengan baik

### Struktur Frame STOMP

```javascript
class STOMPFrameBuilder {
    static buildFrame(command, headers = {}, body = '') {
        let frame = command + '\n';
        
        // Tambah headers
        Object.entries(headers).forEach(([key, value]) => {
            frame += `${key}:${value}\n`;
        });
        
        frame += '\n';
        
        // Tambah body
        if (body) {
            frame += body;
        }
        
        frame += '\0'; // Null octet terminator
        
        return frame;
    }

    static parseFrame(frameString) {
        const lines = frameString.split('\n');
        const command = lines[0];
        
        const headers = {};
        let bodyStart = 1;
        
        // Parse headers
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line === '') {
                bodyStart = i + 1;
                break;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex);
                const value = line.substring(colonIndex + 1);
                headers[key] = value;
            }
        }
        
        // Parse body
        const body = lines.slice(bodyStart).join('\n').replace(/\0$/, '');
        
        return {
            command: command,
            headers: headers,
            body: body
        };
    }
}

// Contoh penggunaan
const connectFrame = STOMPFrameBuilder.buildFrame('CONNECT', {
    'accept-version': '1.2',
    'host': 'localhost',
    'login': 'guest',
    'passcode': 'guest'
});

const sendFrame = STOMPFrameBuilder.buildFrame('SEND', {
    'destination': '/queue/test',
    'content-type': 'text/plain'
}, 'Halo, STOMP!');

console.log('CONNECT frame:', connectFrame);
console.log('SEND frame:', sendFrame);
```

### Pola Routing Pesan STOMP

```java
@Controller
public class RoutingController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Direct messaging
    @MessageMapping("/direct.send")
    public void sendDirectMessage(@Payload DirectMessage message) {
        messagingTemplate.convertAndSendToUser(
            message.getRecipient(), 
            "/queue/messages", 
            message
        );
    }

    // Topic broadcasting
    @MessageMapping("/topic.broadcast")
    @SendTo("/topic/announcements")
    public Announcement broadcastToTopic(@Payload Announcement announcement) {
        announcement.setTimestamp(new Date());
        return announcement;
    }

    // Queue-based processing
    @MessageMapping("/queue.process")
    public void processQueueMessage(@Payload QueueMessage message) {
        // Process pesan secara asynchronous
        CompletableFuture.runAsync(() -> {
            try {
                // Simulasi processing time
                Thread.sleep(2000);
                
                // Kirim hasil kembali
                messagingTemplate.convertAndSendToUser(
                    message.getRequester(),
                    "/queue/results",
                    new ProcessingResult(message.getId(), "COMPLETED", "Processing selesai")
                );
            } catch (Exception e) {
                messagingTemplate.convertAndSendToUser(
                    message.getRequester(),
                    "/queue/results",
                    new ProcessingResult(message.getId(), "FAILED", e.getMessage())
                );
            }
        });
    }

    // Request-Reply pattern
    @MessageMapping("/request.reply")
    public void handleRequestReply(@Payload RequestMessage request,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        
        // Process request
        ResponseMessage response = processRequest(request);
        response.setCorrelationId(request.getId());
        
        // Kirim reply ke session spesifik
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/replies",
            response
        );
    }

    private ResponseMessage processRequest(RequestMessage request) {
        // Implementasi logic processing request
        return new ResponseMessage(request.getId(), "Diproses: " + request.getData());
    }
}

public class DirectMessage {
    private String recipient;
    private String content;
    private Date timestamp;
    // Getters and setters
}

public class Announcement {
    private String title;
    private String content;
    private String author;
    private Date timestamp;
    // Getters and setters
}

public class QueueMessage {
    private String id;
    private String requester;
    private String data;
    // Getters and setters
}

public class ProcessingResult {
    private String messageId;
    private String status;
    private String result;
    // Getters and setters
}

public class RequestMessage {
    private String id;
    private String data;
    // Getters and setters
}

public class ResponseMessage {
    private String correlationId;
    private String result;
    // Getters and setters
}
```

## Pertimbangan Keamanan

- Implementasikan autentikasi untuk koneksi STOMP
- Gunakan koneksi WebSocket aman (WSS)
- Validasi dan sanitasi konten pesan
- Implementasikan otorisasi untuk destination
- Gunakan interval heartbeat yang sesuai
- Monitor batas koneksi dan penggunaan resource
- Implementasikan rate limiting untuk pengiriman pesan
- Validasi ukuran frame dan konten
- Gunakan header aman untuk autentikasi
- Implementasikan manajemen session yang tepat

## STOMP vs Teknologi Lain

| Fitur | STOMP | WebSockets | MQTT | AMQP |
|-------|-------|------------|------|------|
| Transport | WS/TCP | WS/TCP | TCP | TCP |
| Model Pesan | Pub/Sub | Bidirectional | Pub/Sub | Pub/Sub |
| Kompleksitas | Sedang | Rendah | Sedang | Tinggi |
| Dukungan Browser | Baik | Excellent | Terbatas | Tidak ada |
| Persistence Pesan | Opsional | Tidak | Ya | Ya |
| Transaksi | Ya | Tidak | Tidak | Ya |
| QoS Levels | Basic | N/A | 3 level | Multiple |
| Use Case | Web messaging | Real-time apps | IoT | Enterprise |

## Use Case STOMP Umum

- **Aplikasi Chat Real-time**: Room chat multi-user dan private messaging
- **Sistem Notifikasi**: Push notifications dan alerts
- **Tools Kolaboratif**: Editing dokumen dan shared workspaces
- **Gaming**: Update game multiplayer real-time
- **Aplikasi Finansial**: Update harga saham dan platform trading
- **Dashboard Monitoring**: Metrics dan update status real-time
- **Platform IoT**: Messaging dan kontrol perangkat
- **Event Streaming**: Broadcasting event live dan updates
- **Job Processing**: Update status task background
- **Platform Sosial**: Live feeds dan activity streams