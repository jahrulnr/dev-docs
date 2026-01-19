# STOMP (Streaming Text Oriented Messaging Protocol)

## Overview

STOMP (Streaming Text Oriented Messaging Protocol) is a simple, text-based protocol for messaging between clients and message brokers. It provides an interoperable wire format that allows STOMP clients to communicate with any STOMP message broker, making it a popular choice for building messaging applications. STOMP is often used over WebSockets to provide a higher-level messaging protocol.

STOMP defines a set of commands and frames for interacting with message brokers, including sending and receiving messages, subscribing to destinations, and managing transactions. It's designed to be simple to implement while providing the essential features needed for messaging applications.

## Key Concepts

- **Frames**: Basic unit of communication in STOMP
- **Commands**: Operations like CONNECT, SEND, SUBSCRIBE, etc.
- **Headers**: Metadata for frames (destination, content-type, etc.)
- **Body**: Message payload
- **Destinations**: Addresses for sending/receiving messages
- **Subscriptions**: Client registrations for receiving messages
- **Transactions**: Grouping multiple operations atomically
- **Heartbeats**: Keep-alive mechanism for connections

## When to Use

- Building chat applications and real-time messaging
- Implementing publish/subscribe messaging patterns
- Creating notification systems
- Developing collaborative applications
- Building event-driven architectures
- Integrating with message brokers (RabbitMQ, ActiveMQ)
- Creating real-time dashboards and monitoring systems
- Implementing job queues and background processing
- Developing multiplayer games with real-time updates
- Building IoT messaging systems

## Examples

### Basic STOMP over WebSocket (JavaScript)

#### Client Implementation

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
    
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button id="sendButton">Send</button>
    
    <div id="status">Disconnected</div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const statusDiv = document.getElementById('status');

        let stompClient = null;

        function connect() {
            // Create WebSocket connection
            const socket = new WebSocket('ws://localhost:8080/ws');
            
            // Create STOMP client over WebSocket
            stompClient = new StompJs.Client({
                webSocketFactory: () => socket,
                debug: (str) => console.log(str),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000
            });

            stompClient.onConnect = (frame) => {
                console.log('Connected:', frame);
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';

                // Subscribe to public chat
                stompClient.subscribe('/topic/chat', (message) => {
                    const body = JSON.parse(message.body);
                    displayMessage(body.username, body.content, body.timestamp);
                });

                // Subscribe to private messages
                stompClient.subscribe('/user/queue/messages', (message) => {
                    const body = JSON.parse(message.body);
                    displayMessage('Private: ' + body.from, body.content, body.timestamp);
                });
            };

            stompClient.onStompError = (frame) => {
                console.error('STOMP error:', frame);
                statusDiv.textContent = 'Error: ' + frame.headers['message'];
                statusDiv.style.color = 'red';
            };

            stompClient.onWebSocketClose = () => {
                console.log('WebSocket closed');
                statusDiv.textContent = 'Disconnected';
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

        // Connect on page load
        connect();

        // Cleanup on page unload
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

#### Server Implementation (Spring Boot)

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
        // Add timestamp if not present
        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(new Date());
        }
        
        // You can add user session info here
        String sessionId = headerAccessor.getSessionId();
        System.out.println("Message from session: " + sessionId);
        
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/chat")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        // Add user to WebSocket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getUsername());
        
        chatMessage.setContent(chatMessage.getUsername() + " joined the chat");
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

### STOMP Configuration (Spring Boot)

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
        // Enable a simple in-memory message broker
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix for private messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint for WebSocket connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Enable SockJS fallback
    }
}
```

### Advanced STOMP with Authentication

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
                    // Extract authentication token from headers
                    String token = accessor.getFirstNativeHeader("Authorization");
                    
                    if (token != null && token.startsWith("Bearer ")) {
                        String jwtToken = token.substring(7);
                        
                        // Validate JWT token and set authentication
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
        // Implement JWT validation logic
        // Return Authentication object with user details
        return null; // Placeholder
    }
}
```

### STOMP with RabbitMQ (Node.js)

```javascript
const stomp = require('stompit');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// STOMP client for RabbitMQ
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
            console.error('STOMP connection error:', error);
            setTimeout(connectToRabbitMQ, 5000);
            return;
        }

        stompClient = client;
        console.log('Connected to RabbitMQ via STOMP');

        // Subscribe to a queue
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

                console.log('Received message:', body);
                
                // Broadcast to all WebSocket clients
                wss.clients.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(body);
                    }
                });

                // Acknowledge the message
                client.ack(message);
            });
        });
    });
}

// WebSocket server for browser clients
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
        const message = data.toString();
        console.log('Received from WebSocket:', message);

        // Send to RabbitMQ via STOMP
        if (stompClient) {
            const frame = stompClient.send({
                destination: '/queue/chat.messages',
                body: message
            });
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// REST endpoint to send messages
app.post('/send', express.json(), (req, res) => {
    const { message } = req.body;
    
    if (stompClient) {
        stompClient.send({
            destination: '/queue/chat.messages',
            body: JSON.stringify(message)
        });
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'STOMP client not connected' });
    }
});

server.listen(8080, () => {
    console.log('Server running on port 8080');
    connectToRabbitMQ();
});
```

### STOMP Transaction Management

```java
@Controller
public class TransactionController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/transaction.send")
    public void sendTransactionalMessage(@Payload TransactionMessage message) {
        // Start a transaction
        messagingTemplate.convertAndSend("/topic/transaction.start", 
            new TransactionStatus("STARTED", message.getTransactionId()));

        try {
            // Perform multiple operations within transaction
            performOperation1(message);
            performOperation2(message);
            performOperation3(message);

            // Commit transaction
            messagingTemplate.convertAndSend("/topic/transaction.commit", 
                new TransactionStatus("COMMITTED", message.getTransactionId()));

        } catch (Exception e) {
            // Rollback transaction
            messagingTemplate.convertAndSend("/topic/transaction.rollback", 
                new TransactionStatus("ROLLED_BACK", message.getTransactionId(), e.getMessage()));
            
            throw e;
        }
    }

    private void performOperation1(TransactionMessage message) {
        // Simulate operation
        messagingTemplate.convertAndSend("/topic/operation", 
            new OperationStatus("OPERATION_1", "COMPLETED", message.getTransactionId()));
    }

    private void performOperation2(TransactionMessage message) {
        // Simulate operation that might fail
        if (Math.random() < 0.3) { // 30% chance of failure
            throw new RuntimeException("Operation 2 failed");
        }
        
        messagingTemplate.convertAndSend("/topic/operation", 
            new OperationStatus("OPERATION_2", "COMPLETED", message.getTransactionId()));
    }

    private void performOperation3(TransactionMessage message) {
        // Simulate operation
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

### STOMP Heartbeat and Connection Management

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
                reconnectDelay: 0, // We'll handle reconnection manually
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000
            });

            this.client.onConnect = (frame) => {
                console.log('STOMP connected:', frame);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Re-subscribe to all destinations
                this.resubscribeAll();
                
                resolve(frame);
            };

            this.client.onStompError = (frame) => {
                console.error('STOMP error:', frame);
                this.isConnected = false;
                this.handleReconnection();
                reject(frame);
            };

            this.client.onWebSocketClose = () => {
                console.log('WebSocket closed');
                this.isConnected = false;
                this.handleReconnection();
            };

            this.client.onWebSocketError = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                reject(error);
            };

            this.client.activate();
        });
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    subscribe(destination, callback, headers = {}) {
        if (!this.client || !this.client.connected) {
            throw new Error('STOMP client not connected');
        }

        const subscription = this.client.subscribe(destination, callback, headers);
        
        // Store subscription for reconnection
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
                console.log(`Resubscribed to ${destination}`);
            } catch (error) {
                console.error(`Failed to resubscribe to ${destination}:`, error);
            }
        });
    }

    send(destination, body, headers = {}) {
        if (!this.client || !this.client.connected) {
            throw new Error('STOMP client not connected');
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

// Usage
const stompManager = new STOMPConnectionManager('ws://localhost:8080/ws');

stompManager.connect().then(() => {
    // Subscribe to topics
    stompManager.subscribe('/topic/chat', (message) => {
        console.log('Received chat message:', message.body);
    });

    stompManager.subscribe('/user/queue/notifications', (message) => {
        console.log('Received notification:', message.body);
    });

    // Send messages
    stompManager.send('/app/chat.sendMessage', JSON.stringify({
        content: 'Hello from STOMP!',
        timestamp: new Date().toISOString()
    }));
}).catch(error => {
    console.error('Connection failed:', error);
});
```

## Best Practices

- Implement proper connection management and reconnection logic
- Use heartbeats to maintain connection health
- Handle authentication and authorization appropriately
- Set appropriate message size limits
- Implement proper error handling and logging
- Use transactions for atomic operations
- Monitor connection and message throughput
- Implement rate limiting to prevent abuse
- Use appropriate destination naming conventions
- Handle client disconnections gracefully

### STOMP Frame Structure

```javascript
class STOMPFrameBuilder {
    static buildFrame(command, headers = {}, body = '') {
        let frame = command + '\n';
        
        // Add headers
        Object.entries(headers).forEach(([key, value]) => {
            frame += `${key}:${value}\n`;
        });
        
        frame += '\n';
        
        // Add body
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

// Example usage
const connectFrame = STOMPFrameBuilder.buildFrame('CONNECT', {
    'accept-version': '1.2',
    'host': 'localhost',
    'login': 'guest',
    'passcode': 'guest'
});

const sendFrame = STOMPFrameBuilder.buildFrame('SEND', {
    'destination': '/queue/test',
    'content-type': 'text/plain'
}, 'Hello, STOMP!');

console.log('CONNECT frame:', connectFrame);
console.log('SEND frame:', sendFrame);
```

### STOMP Message Routing Patterns

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
        // Process message asynchronously
        CompletableFuture.runAsync(() -> {
            try {
                // Simulate processing time
                Thread.sleep(2000);
                
                // Send result back
                messagingTemplate.convertAndSendToUser(
                    message.getRequester(),
                    "/queue/results",
                    new ProcessingResult(message.getId(), "COMPLETED", "Processing finished")
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
        
        // Send reply to specific session
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/replies",
            response
        );
    }

    private ResponseMessage processRequest(RequestMessage request) {
        // Implement request processing logic
        return new ResponseMessage(request.getId(), "Processed: " + request.getData());
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

## Security Considerations

- Implement authentication for STOMP connections
- Use secure WebSocket connections (WSS)
- Validate and sanitize message content
- Implement authorization for destinations
- Use appropriate heartbeat intervals
- Monitor connection limits and resource usage
- Implement rate limiting for message sending
- Validate frame sizes and content
- Use secure headers for authentication
- Implement proper session management

## STOMP vs Other Technologies

| Feature | STOMP | WebSockets | MQTT | AMQP |
|---------|-------|------------|------|------|
| Transport | WS/TCP | WS/TCP | TCP | TCP |
| Message Model | Pub/Sub | Bidirectional | Pub/Sub | Pub/Sub |
| Complexity | Medium | Low | Medium | High |
| Browser Support | Good | Excellent | Limited | None |
| Message Persistence | Optional | No | Yes | Yes |
| Transactions | Yes | No | No | Yes |
| QoS Levels | Basic | N/A | 3 levels | Multiple |
| Use Case | Web messaging | Real-time apps | IoT | Enterprise |

## Common STOMP Use Cases

- **Real-time Chat Applications**: Multi-user chat rooms and private messaging
- **Notification Systems**: Push notifications and alerts
- **Collaborative Tools**: Document editing and shared workspaces
- **Gaming**: Real-time multiplayer game updates
- **Financial Applications**: Stock price updates and trading platforms
- **Monitoring Dashboards**: Real-time metrics and status updates
- **IoT Platforms**: Device messaging and control
- **Event Streaming**: Live event broadcasting and updates
- **Job Processing**: Background task status updates
- **Social Platforms**: Live feeds and activity streams