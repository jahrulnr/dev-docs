# Server-Sent Events (SSE)

## Overview

Server-Sent Events (SSE) is a standard that allows servers to push real-time updates to web clients over HTTP. Unlike WebSockets, SSE is unidirectional (server-to-client only) and uses a simple text-based protocol. SSE is particularly well-suited for scenarios where the server needs to send updates to the client without the client needing to send data back.

SSE connections are persistent HTTP connections that remain open, allowing the server to send multiple messages to the client. The protocol is built on top of HTTP and inherits many of its benefits, including automatic reconnection, message formatting, and browser support.

## Key Concepts

- **EventSource**: JavaScript API for receiving SSE messages
- **Event Stream**: Text-based format for server messages
- **Event Types**: Named events for different message categories
- **Reconnection**: Automatic reconnection on connection loss
- **Last-Event-ID**: Tracking message IDs for resuming streams
- **CORS Support**: Cross-origin resource sharing compatibility
- **Text-based Protocol**: Human-readable message format

## When to Use

- Real-time notifications and alerts
- Live data feeds (stock prices, sports scores)
- Social media updates and timelines
- Chat applications with server push
- Progress indicators for long-running tasks
- Live blog updates and news feeds
- Monitoring dashboards and status updates
- Collaborative document editing notifications
- IoT device status updates
- Server health monitoring displays

## Examples

### Basic SSE Implementation

#### Server (Node.js with Express)

```javascript
const express = require('express');
const app = express();

app.get('/events', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write('data: Connected to SSE server\n\n');

    // Send periodic updates
    const interval = setInterval(() => {
        const data = {
            timestamp: new Date().toISOString(),
            message: `Update at ${new Date().toLocaleTimeString()}`,
            id: Date.now()
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 2000);

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected from SSE');
        clearInterval(interval);
        res.end();
    });
});

app.listen(3000, () => {
    console.log('SSE server running on port 3000');
});
```

#### Client (HTML/JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE Demo</title>
</head>
<body>
    <h1>Server-Sent Events Demo</h1>
    <div id="messages"></div>
    <button id="stopButton">Stop Updates</button>

    <script>
        const messagesDiv = document.getElementById('messages');
        const stopButton = document.getElementById('stopButton');

        // Create EventSource connection
        const eventSource = new EventSource('/events');

        // Handle connection open
        eventSource.onopen = function(event) {
            console.log('SSE connection opened');
            addMessage('Connected to server', 'system');
        };

        // Handle incoming messages
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                addMessage(`${data.message} (ID: ${data.id})`, 'update');
            } catch (error) {
                addMessage(event.data, 'raw');
            }
        };

        // Handle errors
        eventSource.onerror = function(event) {
            console.error('SSE error:', event);
            addMessage('Connection error - attempting to reconnect...', 'error');
        };

        // Stop connection
        stopButton.onclick = function() {
            eventSource.close();
            addMessage('Connection closed', 'system');
        };

        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = `${new Date().toLocaleTimeString()}: ${text}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>

    <style>
        .message {
            padding: 5px;
            margin: 2px 0;
            border-radius: 3px;
        }
        .system { background-color: #e8f4fd; }
        .update { background-color: #f0f8e8; }
        .error { background-color: #fde8e8; color: #d32f2f; }
        .raw { background-color: #fff3e0; }
    </style>
</body>
</html>
```

### Advanced SSE with Named Events

#### Server with Multiple Event Types

```javascript
const express = require('express');
const app = express();

class SSEManager {
    constructor() {
        this.clients = new Map();
        this.eventCounters = {
            notification: 0,
            update: 0,
            alert: 0
        };
    }

    addClient(res, clientId) {
        this.clients.set(clientId, res);
        console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
    }

    sendToClient(clientId, eventType, data, id = null) {
        const client = this.clients.get(clientId);
        if (client) {
            const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n`;
            if (id) {
                eventData += `id: ${id}\n`;
            }
            eventData += '\n';
            client.write(eventData);
        }
    }

    broadcast(eventType, data, id = null) {
        this.eventCounters[eventType] = (this.eventCounters[eventType] || 0) + 1;

        const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n`;
        if (id) {
            eventData += `id: ${id}\n`;
        }
        eventData += '\n';

        this.clients.forEach((client, clientId) => {
            try {
                client.write(eventData);
            } catch (error) {
                console.error(`Error sending to client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });

        console.log(`Broadcasted ${eventType} to ${this.clients.size} clients`);
    }

    getStats() {
        return {
            totalClients: this.clients.size,
            eventCounts: { ...this.eventCounters }
        };
    }
}

const sseManager = new SSEManager();

// SSE endpoint
app.get('/events', (req, res) => {
    const clientId = Date.now() + Math.random();

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    sseManager.addClient(res, clientId);

    // Send welcome message
    sseManager.sendToClient(clientId, 'connected', {
        message: 'Successfully connected to SSE server',
        clientId: clientId
    });

    // Handle client disconnect
    req.on('close', () => {
        sseManager.removeClient(clientId);
    });
});

// API endpoints to trigger events
app.post('/notify', express.json(), (req, res) => {
    const { message, userId } = req.body;

    sseManager.broadcast('notification', {
        message: message,
        timestamp: new Date().toISOString(),
        userId: userId
    });

    res.json({ success: true });
});

app.post('/update', express.json(), (req, res) => {
    const { type, data } = req.body;

    sseManager.broadcast('update', {
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    });

    res.json({ success: true });
});

app.post('/alert', express.json(), (req, res) => {
    const { level, message } = req.body;

    sseManager.broadcast('alert', {
        level: level,
        message: message,
        timestamp: new Date().toISOString()
    });

    res.json({ success: true });
});

// Stats endpoint
app.get('/stats', (req, res) => {
    res.json(sseManager.getStats());
});

// Simulate periodic events
setInterval(() => {
    sseManager.broadcast('heartbeat', {
        timestamp: new Date().toISOString(),
        serverLoad: Math.random() * 100
    });
}, 30000);

app.listen(3000, () => {
    console.log('Advanced SSE server running on port 3000');
});
```

#### Client with Event Type Handling

```html
<!DOCTYPE html>
<html>
<head>
    <title>Advanced SSE Demo</title>
</head>
<body>
    <h1>Advanced Server-Sent Events</h1>
    <div id="stats"></div>
    <div id="messages"></div>

    <div id="controls">
        <button id="connectBtn">Connect</button>
        <button id="disconnectBtn">Disconnect</button>
        <button id="clearBtn">Clear Messages</button>
    </div>

    <script>
        let eventSource = null;
        const messagesDiv = document.getElementById('messages');
        const statsDiv = document.getElementById('stats');

        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const clearBtn = document.getElementById('clearBtn');

        connectBtn.onclick = connect;
        disconnectBtn.onclick = disconnect;
        clearBtn.onclick = () => messagesDiv.innerHTML = '';

        function connect() {
            if (eventSource) {
                eventSource.close();
            }

            eventSource = new EventSource('/events');

            // Handle different event types
            eventSource.addEventListener('connected', handleConnected);
            eventSource.addEventListener('notification', handleNotification);
            eventSource.addEventListener('update', handleUpdate);
            eventSource.addEventListener('alert', handleAlert);
            eventSource.addEventListener('heartbeat', handleHeartbeat);

            // Handle generic messages
            eventSource.onmessage = function(event) {
                addMessage('Generic message: ' + event.data, 'generic');
            };

            eventSource.onopen = function() {
                addMessage('Connection opened', 'system');
                updateConnectionStatus(true);
            };

            eventSource.onerror = function(event) {
                addMessage('Connection error', 'error');
                updateConnectionStatus(false);
            };
        }

        function disconnect() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                addMessage('Connection closed', 'system');
                updateConnectionStatus(false);
            }
        }

        function handleConnected(event) {
            const data = JSON.parse(event.data);
            addMessage(`Connected with ID: ${data.clientId}`, 'connected');
        }

        function handleNotification(event) {
            const data = JSON.parse(event.data);
            addMessage(`🔔 ${data.message}`, 'notification');
        }

        function handleUpdate(event) {
            const data = JSON.parse(event.data);
            addMessage(`🔄 ${data.type}: ${JSON.stringify(data.data)}`, 'update');
        }

        function handleAlert(event) {
            const data = JSON.parse(event.data);
            addMessage(`🚨 ${data.level}: ${data.message}`, 'alert');
        }

        function handleHeartbeat(event) {
            const data = JSON.parse(event.data);
            addMessage(`💓 Heartbeat - Load: ${data.serverLoad.toFixed(1)}%`, 'heartbeat');
            updateStats();
        }

        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString()}</span> ${text}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        async function updateStats() {
            try {
                const response = await fetch('/stats');
                const stats = await response.json();
                statsDiv.innerHTML = `
                    <strong>Stats:</strong> ${stats.totalClients} clients,
                    Notifications: ${stats.eventCounts.notification},
                    Updates: ${stats.eventCounts.update},
                    Alerts: ${stats.eventCounts.alert}
                `;
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }

        function updateConnectionStatus(connected) {
            connectBtn.disabled = connected;
            disconnectBtn.disabled = !connected;
        }

        // Auto-connect on page load
        connect();
        updateStats();
    </script>

    <style>
        .message {
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
            border-left: 4px solid #ccc;
        }
        .system { background-color: #f5f5f5; border-left-color: #666; }
        .connected { background-color: #e8f5e8; border-left-color: #4caf50; }
        .notification { background-color: #fff3e0; border-left-color: #ff9800; }
        .update { background-color: #e3f2fd; border-left-color: #2196f3; }
        .alert { background-color: #ffebee; border-left-color: #f44336; }
        .heartbeat { background-color: #f3e5f5; border-left-color: #9c27b0; }
        .error { background-color: #ffebee; border-left-color: #d32f2f; }
        .generic { background-color: #fafafa; border-left-color: #9e9e9e; }

        .timestamp {
            color: #666;
            font-size: 0.8em;
        }

        #controls {
            margin: 10px 0;
        }

        button {
            margin-right: 10px;
            padding: 8px 16px;
        }
    </style>
</body>
</html>
```

### SSE with Authentication and Filtering

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// Middleware for authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

class FilteredSSEManager {
    constructor() {
        this.clients = new Map(); // clientId -> { res, user, filters }
    }

    addClient(res, user, filters = {}) {
        const clientId = Date.now() + Math.random();
        this.clients.set(clientId, { res, user, filters });

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        console.log(`Client ${clientId} (${user.username}) connected with filters:`, filters);
        return clientId;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
    }

    matchesFilters(clientFilters, eventData) {
        for (const [key, value] of Object.entries(clientFilters)) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }

    sendToMatchingClients(eventType, eventData, senderUser = null) {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`;

        this.clients.forEach((client, clientId) => {
            // Don't send to sender if specified
            if (senderUser && client.user.id === senderUser.id) {
                return;
            }

            // Check filters
            if (this.matchesFilters(client.filters, eventData)) {
                try {
                    client.res.write(eventString);
                } catch (error) {
                    console.error(`Error sending to client ${clientId}:`, error);
                    this.removeClient(clientId);
                }
            }
        });
    }
}

const sseManager = new FilteredSSEManager();

// Authenticated SSE endpoint
app.get('/events', authenticateToken, (req, res) => {
    const filters = {
        category: req.query.category,
        priority: req.query.priority
    };

    const clientId = sseManager.addClient(res, req.user, filters);

    // Send welcome message
    const welcomeData = {
        message: `Welcome ${req.user.username}!`,
        clientId: clientId,
        filters: filters
    };

    res.write(`event: connected\ndata: ${JSON.stringify(welcomeData)}\n\n`);

    // Handle disconnect
    req.on('close', () => {
        sseManager.removeClient(clientId);
    });
});

// Send notification to specific users
app.post('/notify-user', authenticateToken, (req, res) => {
    const { targetUserId, message, category = 'general', priority = 'normal' } = req.body;

    const eventData = {
        from: req.user.username,
        to: targetUserId,
        message: message,
        category: category,
        priority: priority,
        timestamp: new Date().toISOString()
    };

    sseManager.sendToMatchingClients('notification', eventData, req.user);
    res.json({ success: true });
});

// Broadcast to category
app.post('/broadcast', authenticateToken, (req, res) => {
    const { message, category, priority = 'normal' } = req.body;

    const eventData = {
        from: req.user.username,
        message: message,
        category: category,
        priority: priority,
        timestamp: new Date().toISOString()
    };

    sseManager.sendToMatchingClients('broadcast', eventData, req.user);
    res.json({ success: true });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Simple authentication (in real app, check against database)
    if (username && password) {
        const token = jwt.sign(
            { id: Date.now(), username: username },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ token: token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.listen(3000, () => {
    console.log('Authenticated SSE server running on port 3000');
});
```

### SSE with Message Persistence and Recovery

```javascript
const express = require('express');
const app = express();

class PersistentSSEManager {
    constructor() {
        this.clients = new Map();
        this.messageHistory = [];
        this.maxHistorySize = 100;
    }

    addMessageToHistory(eventType, data, id) {
        this.messageHistory.push({
            id: id,
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString()
        });

        // Keep only recent messages
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory.shift();
        }
    }

    getMessagesSince(lastEventId) {
        if (!lastEventId) return this.messageHistory;

        const lastId = parseInt(lastEventId);
        return this.messageHistory.filter(msg => msg.id > lastId);
    }

    addClient(res, lastEventId = null) {
        const clientId = Date.now() + Math.random();
        this.clients.set(clientId, res);

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send recent messages for catch-up
        const recentMessages = this.getMessagesSince(lastEventId);
        recentMessages.forEach(msg => {
            const eventString = `event: ${msg.eventType}\ndata: ${JSON.stringify(msg.data)}\nid: ${msg.id}\n\n`;
            res.write(eventString);
        });

        console.log(`Client ${clientId} connected. Sent ${recentMessages.length} historical messages.`);
        return clientId;
    }

    broadcast(eventType, data) {
        const eventId = Date.now();
        this.addMessageToHistory(eventType, data, eventId);

        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\nid: ${eventId}\n\n`;

        this.clients.forEach((client, clientId) => {
            try {
                client.write(eventString);
            } catch (error) {
                console.error(`Error sending to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        });

        console.log(`Broadcasted ${eventType} to ${this.clients.size} clients`);
    }
}

const sseManager = new PersistentSSEManager();

app.get('/events', (req, res) => {
    const lastEventId = req.headers['last-event-id'];
    const clientId = sseManager.addClient(res, lastEventId);

    req.on('close', () => {
        sseManager.clients.delete(clientId);
    });
});

// Simulate data updates
let messageCounter = 0;
setInterval(() => {
    messageCounter++;
    sseManager.broadcast('update', {
        message: `Update #${messageCounter}`,
        value: Math.random() * 100,
        timestamp: new Date().toISOString()
    });
}, 5000);

// API to get message history
app.get('/history', (req, res) => {
    const since = req.query.since;
    const messages = sseManager.getMessagesSince(since);
    res.json(messages);
});

app.listen(3000, () => {
    console.log('Persistent SSE server running on port 3000');
});
```

## Best Practices

- Implement proper error handling and reconnection logic
- Use appropriate message IDs for recovery and ordering
- Set reasonable reconnection timeouts
- Handle client disconnections gracefully
- Implement authentication for sensitive data
- Use event types to categorize different message types
- Monitor server resources and client connections
- Implement rate limiting to prevent abuse
- Use compression for large messages
- Provide fallback mechanisms for unsupported browsers

### Connection Management

```javascript
class SSEConnectionManager {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 3000,
            maxReconnectAttempts: 10,
            ...options
        };

        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.eventHandlers = {};
        this.isConnected = false;
    }

    connect() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        try {
            this.eventSource = new EventSource(this.url);

            this.eventSource.onopen = (event) => {
                console.log('SSE connection opened');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected', event);
            };

            this.eventSource.onmessage = (event) => {
                this.emit('message', event);
            };

            this.eventSource.onerror = (event) => {
                console.error('SSE connection error:', event);
                this.isConnected = false;
                this.emit('error', event);
                this.handleReconnection();
            };

            // Add custom event listeners
            Object.keys(this.eventHandlers).forEach(eventType => {
                if (eventType !== 'connected' && eventType !== 'message' && eventType !== 'error') {
                    this.eventSource.addEventListener(eventType, (event) => {
                        this.emit(eventType, event);
                    });
                }
            });

        } catch (error) {
            console.error('Failed to create EventSource:', error);
            this.handleReconnection();
        }
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect();
            }, this.options.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    on(eventType, handler) {
        this.eventHandlers[eventType] = handler;
    }

    emit(eventType, data) {
        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType](data);
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            url: this.url
        };
    }
}

// Usage
const sseManager = new SSEConnectionManager('/events', {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
});

sseManager.on('connected', () => {
    console.log('Successfully connected to SSE');
});

sseManager.on('message', (event) => {
    console.log('Received message:', event.data);
});

sseManager.on('error', (event) => {
    console.error('SSE error occurred');
});

sseManager.on('maxReconnectAttemptsReached', () => {
    console.error('Failed to reconnect after maximum attempts');
});

// Connect
sseManager.connect();
```

### Server-Side Connection Pooling

```javascript
class SSEConnectionPool {
    constructor() {
        this.connections = new Map();
        this.maxConnections = 1000;
        this.cleanupInterval = 300000; // 5 minutes

        // Periodic cleanup of stale connections
        setInterval(() => {
            this.cleanupStaleConnections();
        }, this.cleanupInterval);
    }

    addConnection(clientId, res, user = null) {
        if (this.connections.size >= this.maxConnections) {
            throw new Error('Maximum connections exceeded');
        }

        this.connections.set(clientId, {
            res: res,
            user: user,
            connectedAt: new Date(),
            lastActivity: new Date()
        });

        console.log(`Connection added: ${clientId}. Total: ${this.connections.size}`);
    }

    removeConnection(clientId) {
        const connection = this.connections.get(clientId);
        if (connection) {
            try {
                connection.res.end();
            } catch (error) {
                console.error(`Error closing connection ${clientId}:`, error);
            }
            this.connections.delete(clientId);
            console.log(`Connection removed: ${clientId}. Total: ${this.connections.size}`);
        }
    }

    updateActivity(clientId) {
        const connection = this.connections.get(clientId);
        if (connection) {
            connection.lastActivity = new Date();
        }
    }

    broadcast(eventType, data, filterFn = null) {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        let sentCount = 0;

        this.connections.forEach((connection, clientId) => {
            // Apply filter if provided
            if (filterFn && !filterFn(connection)) {
                return;
            }

            try {
                connection.res.write(eventString);
                this.updateActivity(clientId);
                sentCount++;
            } catch (error) {
                console.error(`Error broadcasting to ${clientId}:`, error);
                this.removeConnection(clientId);
            }
        });

        console.log(`Broadcasted ${eventType} to ${sentCount} connections`);
    }

    sendToUser(userId, eventType, data) {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        let sentCount = 0;

        this.connections.forEach((connection, clientId) => {
            if (connection.user && connection.user.id === userId) {
                try {
                    connection.res.write(eventString);
                    this.updateActivity(clientId);
                    sentCount++;
                } catch (error) {
                    console.error(`Error sending to user ${userId}:`, error);
                    this.removeConnection(clientId);
                }
            }
        });

        return sentCount;
    }

    cleanupStaleConnections(maxAge = 3600000) { // 1 hour default
        const now = new Date();
        let cleanedCount = 0;

        this.connections.forEach((connection, clientId) => {
            const age = now - connection.lastActivity;
            if (age > maxAge) {
                this.removeConnection(clientId);
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} stale connections`);
        }
    }

    getStats() {
        const userConnections = Array.from(this.connections.values())
            .filter(conn => conn.user).length;

        return {
            totalConnections: this.connections.size,
            userConnections: userConnections,
            anonymousConnections: this.connections.size - userConnections,
            maxConnections: this.maxConnections
        };
    }
}
```

## Security Considerations

- Implement authentication for sensitive SSE streams
- Use HTTPS for encrypted connections
- Validate and sanitize event data
- Implement rate limiting to prevent abuse
- Monitor connection counts and resource usage
- Use CORS properly for cross-origin requests
- Implement proper cleanup of disconnected clients
- Validate Last-Event-ID headers
- Use secure tokens for authentication
- Implement authorization checks for filtered streams

## SSE vs Other Technologies

| Feature | SSE | WebSockets | HTTP Polling | HTTP Long Polling |
|---------|-----|------------|--------------|-------------------|
| Direction | Server → Client | Bidirectional | Client → Server | Bidirectional |
| Protocol | HTTP | WS/WSS | HTTP | HTTP |
| Browser Support | Excellent | Good | Excellent | Good |
| Complexity | Low | Medium | Low | Medium |
| Overhead | Low | Low | High | Medium |
| Reconnection | Automatic | Manual | N/A | Manual |
| Message Format | Text | Binary/Text | Any | Any |
| Use Case | Server push | Real-time chat | Form submission | Real-time updates |

## Common SSE Use Cases

- **Real-time Notifications**: Email alerts, system notifications
- **Live Feeds**: Social media timelines, news updates
- **Progress Tracking**: File upload progress, task completion
- **Live Scores**: Sports scores, election results
- **Stock Tickers**: Financial data updates
- **Chat Applications**: Message delivery confirmations
- **Monitoring Dashboards**: Server status, metrics updates
- **Collaborative Editing**: Document change notifications
- **IoT Updates**: Sensor data, device status changes
- **Live Blogging**: Real-time article updates