# Server-Sent Events (SSE)

## Gambaran Umum

Server-Sent Events (SSE) adalah standar yang memungkinkan server untuk mendorong update real-time ke klien web melalui HTTP. Berbeda dengan WebSockets, SSE bersifat unidirectional (server-to-client saja) dan menggunakan protokol berbasis teks sederhana. SSE sangat cocok untuk skenario di mana server perlu mengirim update ke klien tanpa klien perlu mengirim data kembali.

Koneksi SSE adalah koneksi HTTP persisten yang tetap terbuka, memungkinkan server mengirim multiple pesan ke klien. Protokol ini dibangun di atas HTTP dan mewarisi banyak keuntungannya, termasuk reconnection otomatis, formatting pesan, dan dukungan browser.

## Konsep Utama

- **EventSource**: JavaScript API untuk menerima pesan SSE
- **Event Stream**: Format berbasis teks untuk pesan server
- **Event Types**: Event bernama untuk kategori pesan berbeda
- **Reconnection**: Reconnection otomatis saat koneksi hilang
- **Last-Event-ID**: Tracking ID pesan untuk melanjutkan stream
- **CORS Support**: Kompatibilitas cross-origin resource sharing
- **Text-based Protocol**: Format pesan yang mudah dibaca manusia

## Kapan Menggunakan

- Notifikasi real-time dan alert
- Live data feeds (harga saham, skor olahraga)
- Update media sosial dan timeline
- Aplikasi chat dengan server push
- Indikator progress untuk task berjalan lama
- Update live blog dan news feeds
- Dashboard monitoring dan status update
- Notifikasi editing dokumen kolaboratif
- Update status perangkat IoT
- Display monitoring kesehatan server

## Contoh

### Implementasi SSE Dasar

#### Server (Node.js dengan Express)

```javascript
const express = require('express');
const app = express();

app.get('/events', (req, res) => {
    // Set header SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Kirim pesan koneksi awal
    res.write('data: Terhubung ke server SSE\n\n');

    // Kirim update berkala
    const interval = setInterval(() => {
        const data = {
            timestamp: new Date().toISOString(),
            message: `Update pada ${new Date().toLocaleTimeString()}`,
            id: Date.now()
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 2000);

    // Tangani disconnect klien
    req.on('close', () => {
        console.log('Klien terputus dari SSE');
        clearInterval(interval);
        res.end();
    });
});

app.listen(3000, () => {
    console.log('Server SSE berjalan di port 3000');
});
```

#### Klien (HTML/JavaScript)

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

        // Buat koneksi EventSource
        const eventSource = new EventSource('/events');

        // Tangani koneksi terbuka
        eventSource.onopen = function(event) {
            console.log('Koneksi SSE terbuka');
            addMessage('Terhubung ke server', 'system');
        };

        // Tangani pesan masuk
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                addMessage(`${data.message} (ID: ${data.id})`, 'update');
            } catch (error) {
                addMessage(event.data, 'raw');
            }
        };

        // Tangani error
        eventSource.onerror = function(event) {
            console.error('SSE error:', event);
            addMessage('Error koneksi - mencoba reconnect...', 'error');
        };

        // Stop koneksi
        stopButton.onclick = function() {
            eventSource.close();
            addMessage('Koneksi ditutup', 'system');
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

### SSE Lanjutan dengan Named Events

#### Server dengan Multiple Event Types

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
        console.log(`Klien ${clientId} terhubung. Total klien: ${this.clients.size}`);
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(`Klien ${clientId} terputus. Total klien: ${this.clients.size}`);
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
                console.error(`Error mengirim ke klien ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });

        console.log(`Broadcast ${eventType} ke ${this.clients.size} klien`);
    }

    getStats() {
        return {
            totalClients: this.clients.size,
            eventCounts: { ...this.eventCounters }
        };
    }
}

const sseManager = new SSEManager();

// Endpoint SSE
app.get('/events', (req, res) => {
    const clientId = Date.now() + Math.random();

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    sseManager.addClient(res, clientId);

    // Kirim pesan welcome
    sseManager.sendToClient(clientId, 'connected', {
        message: 'Berhasil terhubung ke server SSE',
        clientId: clientId
    });

    // Tangani disconnect klien
    req.on('close', () => {
        sseManager.removeClient(clientId);
    });
});

// API endpoints untuk trigger events
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

// Endpoint stats
app.get('/stats', (req, res) => {
    res.json(sseManager.getStats());
});

// Simulasi event berkala
setInterval(() => {
    sseManager.broadcast('heartbeat', {
        timestamp: new Date().toISOString(),
        serverLoad: Math.random() * 100
    });
}, 30000);

app.listen(3000, () => {
    console.log('Server SSE lanjutan berjalan di port 3000');
});
```

#### Klien dengan Event Type Handling

```html
<!DOCTYPE html>
<html>
<head>
    <title>Advanced SSE Demo</title>
</head>
<body>
    <h1>Server-Sent Events Lanjutan</h1>
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

            // Tangani berbagai event types
            eventSource.addEventListener('connected', handleConnected);
            eventSource.addEventListener('notification', handleNotification);
            eventSource.addEventListener('update', handleUpdate);
            eventSource.addEventListener('alert', handleAlert);
            eventSource.addEventListener('heartbeat', handleHeartbeat);

            // Tangani pesan generic
            eventSource.onmessage = function(event) {
                addMessage('Pesan generic: ' + event.data, 'generic');
            };

            eventSource.onopen = function() {
                addMessage('Koneksi terbuka', 'system');
                updateConnectionStatus(true);
            };

            eventSource.onerror = function(event) {
                addMessage('Error koneksi', 'error');
                updateConnectionStatus(false);
            };
        }

        function disconnect() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                addMessage('Koneksi ditutup', 'system');
                updateConnectionStatus(false);
            }
        }

        function handleConnected(event) {
            const data = JSON.parse(event.data);
            addMessage(`Terhubung dengan ID: ${data.clientId}`, 'connected');
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
                    <strong>Stats:</strong> ${stats.totalClients} klien,
                    Notifications: ${stats.eventCounts.notification},
                    Updates: ${stats.eventCounts.update},
                    Alerts: ${stats.eventCounts.alert}
                `;
            } catch (error) {
                console.error('Error mengambil stats:', error);
            }
        }

        function updateConnectionStatus(connected) {
            connectBtn.disabled = connected;
            disconnectBtn.disabled = !connected;
        }

        // Auto-connect saat page load
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

### SSE dengan Authentication dan Filtering

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// Middleware untuk authentication
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

        // Set header SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        console.log(`Klien ${clientId} (${user.username}) terhubung dengan filter:`, filters);
        return clientId;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(`Klien ${clientId} terputus`);
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
            // Jangan kirim ke sender jika ditentukan
            if (senderUser && client.user.id === senderUser.id) {
                return;
            }

            // Cek filter
            if (this.matchesFilters(client.filters, eventData)) {
                try {
                    client.res.write(eventString);
                } catch (error) {
                    console.error(`Error mengirim ke klien ${clientId}:`, error);
                    this.removeClient(clientId);
                }
            }
        });
    }
}

const sseManager = new FilteredSSEManager();

// Endpoint SSE terautentikasi
app.get('/events', authenticateToken, (req, res) => {
    const filters = {
        category: req.query.category,
        priority: req.query.priority
    };

    const clientId = sseManager.addClient(res, req.user, filters);

    // Kirim pesan welcome
    const welcomeData = {
        message: `Selamat datang ${req.user.username}!`,
        clientId: clientId,
        filters: filters
    };

    res.write(`event: connected\ndata: ${JSON.stringify(welcomeData)}\n\n`);

    // Tangani disconnect
    req.on('close', () => {
        sseManager.removeClient(clientId);
    });
});

// Kirim notifikasi ke user tertentu
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

// Broadcast ke kategori
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

// Endpoint login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Autentikasi sederhana (di aplikasi nyata, cek terhadap database)
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
    console.log('Server SSE terautentikasi berjalan di port 3000');
});
```

### SSE dengan Message Persistence dan Recovery

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

        // Simpan hanya pesan terbaru
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

        // Kirim pesan terbaru untuk catch-up
        const recentMessages = this.getMessagesSince(lastEventId);
        recentMessages.forEach(msg => {
            const eventString = `event: ${msg.eventType}\ndata: ${JSON.stringify(msg.data)}\nid: ${msg.id}\n\n`;
            res.write(eventString);
        });

        console.log(`Klien ${clientId} terhubung. Mengirim ${recentMessages.length} pesan historis.`);
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
                console.error(`Error mengirim ke klien ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        });

        console.log(`Broadcast ${eventType} ke ${this.clients.size} klien`);
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

// Simulasi update data
let messageCounter = 0;
setInterval(() => {
    messageCounter++;
    sseManager.broadcast('update', {
        message: `Update #${messageCounter}`,
        value: Math.random() * 100,
        timestamp: new Date().toISOString()
    });
}, 5000);

// API untuk mendapatkan history pesan
app.get('/history', (req, res) => {
    const since = req.query.since;
    const messages = sseManager.getMessagesSince(since);
    res.json(messages);
});

app.listen(3000, () => {
    console.log('Server SSE persistent berjalan di port 3000');
});
```

## Praktik Terbaik

- Implementasikan error handling dan reconnection logic yang tepat
- Gunakan ID pesan yang sesuai untuk recovery dan ordering
- Set timeout reconnection yang reasonable
- Tangani disconnect klien dengan baik
- Implementasikan autentikasi untuk data sensitif
- Gunakan event types untuk mengkategorikan berbagai jenis pesan
- Monitor resource server dan koneksi klien
- Implementasikan rate limiting untuk mencegah abuse
- Gunakan kompresi untuk pesan besar
- Sediakan mekanisme fallback untuk browser yang tidak didukung

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
                console.log('Koneksi SSE terbuka');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected', event);
            };

            this.eventSource.onmessage = (event) => {
                this.emit('message', event);
            };

            this.eventSource.onerror = (event) => {
                console.error('Error koneksi SSE:', event);
                this.isConnected = false;
                this.emit('error', event);
                this.handleReconnection();
            };

            // Tambahkan event listener custom
            Object.keys(this.eventHandlers).forEach(eventType => {
                if (eventType !== 'connected' && eventType !== 'message' && eventType !== 'error') {
                    this.eventSource.addEventListener(eventType, (event) => {
                        this.emit(eventType, event);
                    });
                }
            });

        } catch (error) {
            console.error('Gagal membuat EventSource:', error);
            this.handleReconnection();
        }
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Mencoba reconnection ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect();
            }, this.options.reconnectInterval);
        } else {
            console.error('Maksimal reconnection attempts tercapai');
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

// Penggunaan
const sseManager = new SSEConnectionManager('/events', {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
});

sseManager.on('connected', () => {
    console.log('Berhasil terhubung ke SSE');
});

sseManager.on('message', (event) => {
    console.log('Pesan diterima:', event.data);
});

sseManager.on('error', (event) => {
    console.error('Error SSE terjadi');
});

sseManager.on('maxReconnectAttemptsReached', () => {
    console.error('Gagal reconnect setelah maksimal attempts');
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
        this.cleanupInterval = 300000; // 5 menit

        // Cleanup berkala koneksi stale
        setInterval(() => {
            this.cleanupStaleConnections();
        }, this.cleanupInterval);
    }

    addConnection(clientId, res, user = null) {
        if (this.connections.size >= this.maxConnections) {
            throw new Error('Koneksi maksimal terlampaui');
        }

        this.connections.set(clientId, {
            res: res,
            user: user,
            connectedAt: new Date(),
            lastActivity: new Date()
        });

        console.log(`Koneksi ditambahkan: ${clientId}. Total: ${this.connections.size}`);
    }

    removeConnection(clientId) {
        const connection = this.connections.get(clientId);
        if (connection) {
            try {
                connection.res.end();
            } catch (error) {
                console.error(`Error menutup koneksi ${clientId}:`, error);
            }
            this.connections.delete(clientId);
            console.log(`Koneksi dihapus: ${clientId}. Total: ${this.connections.size}`);
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
            // Terapkan filter jika disediakan
            if (filterFn && !filterFn(connection)) {
                return;
            }

            try {
                connection.res.write(eventString);
                this.updateActivity(clientId);
                sentCount++;
            } catch (error) {
                console.error(`Error broadcast ke ${clientId}:`, error);
                this.removeConnection(clientId);
            }
        });

        console.log(`Broadcast ${eventType} ke ${sentCount} koneksi`);
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
                    console.error(`Error mengirim ke user ${userId}:`, error);
                    this.removeConnection(clientId);
                }
            }
        });

        return sentCount;
    }

    cleanupStaleConnections(maxAge = 3600000) { // 1 jam default
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
            console.log(`Membersihkan ${cleanedCount} koneksi stale`);
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

## Pertimbangan Keamanan

- Implementasikan autentikasi untuk stream SSE sensitif
- Gunakan HTTPS untuk koneksi terenkripsi
- Validasi dan sanitasi data event
- Implementasikan rate limiting untuk mencegah abuse
- Monitor jumlah koneksi dan penggunaan resource
- Gunakan CORS dengan tepat untuk cross-origin requests
- Implementasikan cleanup yang tepat untuk klien terputus
- Validasi header Last-Event-ID
- Gunakan token aman untuk autentikasi
- Implementasikan cek otorisasi untuk filtered streams

## SSE vs Teknologi Lain

| Fitur | SSE | WebSockets | HTTP Polling | HTTP Long Polling |
|-------|-----|------------|--------------|-------------------|
| Arah | Server → Klien | Bidirectional | Klien → Server | Bidirectional |
| Protokol | HTTP | WS/WSS | HTTP | HTTP |
| Dukungan Browser | Excellent | Good | Excellent | Good |
| Kompleksitas | Rendah | Sedang | Rendah | Sedang |
| Overhead | Rendah | Rendah | Tinggi | Sedang |
| Reconnection | Otomatis | Manual | N/A | Manual |
| Format Pesan | Teks | Binary/Teks | Any | Any |
| Use Case | Server push | Chat real-time | Form submission | Update real-time |

## Use Case SSE Umum

- **Notifikasi Real-time**: Alert email, notifikasi sistem
- **Live Feeds**: Timeline media sosial, update berita
- **Progress Tracking**: Progress upload file, penyelesaian task
- **Live Scores**: Skor olahraga, hasil pemilihan
- **Stock Tickers**: Update data finansial
- **Aplikasi Chat**: Konfirmasi pengiriman pesan
- **Dashboard Monitoring**: Status server, update metrics
- **Editing Kolaboratif**: Notifikasi perubahan dokumen
- **Update IoT**: Data sensor, perubahan status perangkat
- **Live Blogging**: Update artikel real-time