# WebRTC (Web Real-Time Communication)

## Gambaran Umum

WebRTC adalah proyek open-source yang memungkinkan kemampuan komunikasi real-time (RTC) secara langsung di web browser dan aplikasi mobile. Teknologi ini memungkinkan berbagi audio, video, dan data peer-to-peer antara browser tanpa memerlukan plugin atau software pihak ketiga. WebRTC menggunakan kombinasi JavaScript APIs dan protokol underlying untuk membuat koneksi langsung antara peer.

WebRTC dibangun di atas standar web yang ada dan menyediakan fondasi untuk aplikasi seperti video calling, file sharing, screen sharing, dan gaming real-time. Teknologi ini secara otomatis menangani NAT traversal, enkripsi, dan encoding/decoding media.

## Konsep Utama

- **Peer-to-Peer (P2P)**: Komunikasi langsung antara browser tanpa relay server
- **Signaling**: Proses negosiasi awal untuk bertukar informasi koneksi
- **ICE (Interactive Connectivity Establishment)**: Framework untuk NAT traversal
- **STUN/TURN Servers**: Membantu membuat koneksi melalui firewall dan NAT
- **SDP (Session Description Protocol)**: Menjelaskan parameter sesi multimedia
- **MediaStream**: Mewakili stream audio/video dari kamera dan mikrofon
- **RTCPeerConnection**: Mengelola koneksi peer-to-peer
- **RTCDataChannel**: Memungkinkan pertukaran data arbitrer antara peer
- **Codecs**: Algoritma kompresi audio/video (VP8, VP9, H.264, Opus)

## Kapan Menggunakan

- Aplikasi video calling dan konferensi
- Komunikasi audio real-time (VoIP)
- Screen sharing dan remote desktop
- File sharing antara peer
- Gaming dan kolaborasi real-time
- Live streaming dengan latensi rendah
- Komunikasi perangkat IoT melalui browser
- Sistem komunikasi multi-party
- Video surveillance dan monitoring
- Platform edukasi interaktif

## Contoh

### Video Call WebRTC Dasar (HTML/JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebRTC Video Call</title>
</head>
<body>
    <video id="localVideo" autoplay muted></video>
    <video id="remoteVideo" autoplay></video>
    <button id="startButton">Mulai Panggilan</button>
    <button id="hangupButton">Tutup Panggilan</button>

    <script>
        let localStream;
        let peerConnection;
        let remoteStream;

        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const startButton = document.getElementById('startButton');
        const hangupButton = document.getElementById('hangupButton');

        // Konfigurasi STUN server
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        startButton.onclick = startCall;
        hangupButton.onclick = hangupCall;

        async function startCall() {
            try {
                // Dapatkan user media
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                localVideo.srcObject = localStream;
                
                // Buat peer connection
                peerConnection = new RTCPeerConnection(configuration);
                
                // Tambahkan local stream ke peer connection
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
                
                // Tangani remote stream
                peerConnection.ontrack = event => {
                    remoteVideo.srcObject = event.streams[0];
                };
                
                // Tangani ICE candidates
                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        // Kirim candidate ke remote peer via signaling
                        sendSignalingMessage({
                            type: 'candidate',
                            candidate: event.candidate
                        });
                    }
                };
                
                // Buat offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                // Kirim offer ke remote peer via signaling
                sendSignalingMessage({
                    type: 'offer',
                    offer: offer
                });
                
            } catch (error) {
                console.error('Error memulai panggilan:', error);
            }
        }

        function hangupCall() {
            if (peerConnection) {
                peerConnection.close();
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
        }

        // Fungsi signaling (implementasikan berdasarkan signaling server Anda)
        function sendSignalingMessage(message) {
            // Kirim pesan ke signaling server
            console.log('Mengirim pesan signaling:', message);
        }

        function receiveSignalingMessage(message) {
            switch (message.type) {
                case 'offer':
                    handleOffer(message.offer);
                    break;
                case 'answer':
                    handleAnswer(message.answer);
                    break;
                case 'candidate':
                    handleCandidate(message.candidate);
                    break;
            }
        }

        async function handleOffer(offer) {
            peerConnection = new RTCPeerConnection(configuration);
            
            // Tambahkan local stream
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
            
            // Tangani remote stream
            peerConnection.ontrack = event => {
                remoteVideo.srcObject = event.streams[0];
            };
            
            // Tangani ICE candidates
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    sendSignalingMessage({
                        type: 'candidate',
                        candidate: event.candidate
                    });
                }
            };
            
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            sendSignalingMessage({
                type: 'answer',
                answer: answer
            });
        }

        async function handleAnswer(answer) {
            await peerConnection.setRemoteDescription(answer);
        }

        async function handleCandidate(candidate) {
            await peerConnection.addIceCandidate(candidate);
        }
    </script>
</body>
</html>
```

### WebRTC Data Channel untuk File Sharing

```javascript
class WebRTCFileTransfer {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.fileChunks = [];
        this.receivedSize = 0;
        this.fileSize = 0;
    }
    
    async initialize() {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        
        this.peerConnection = new RTCPeerConnection(configuration);
        
        // Buat data channel
        this.dataChannel = this.peerConnection.createDataChannel('fileTransfer');
        this.setupDataChannel();
        
        // Tangani ICE candidates
        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                // Kirim ke remote peer
                this.sendSignalingMessage({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        };
    }
    
    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel dibuka');
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleReceivedData(event.data);
        };
        
        this.dataChannel.onclose = () => {
            console.log('Data channel ditutup');
        };
    }
    
    async sendFile(file) {
        const chunkSize = 16384; // 16KB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        // Kirim metadata file terlebih dahulu
        const metadata = {
            type: 'file-metadata',
            name: file.name,
            size: file.size,
            type: file.type,
            totalChunks: totalChunks
        };
        
        this.dataChannel.send(JSON.stringify(metadata));
        
        // Kirim chunk file
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            const arrayBuffer = await chunk.arrayBuffer();
            this.dataChannel.send(arrayBuffer);
            
            // Update progress
            const progress = ((i + 1) / totalChunks) * 100;
            console.log(`Progress pengiriman: ${progress.toFixed(1)}%`);
        }
    }
    
    handleReceivedData(data) {
        if (typeof data === 'string') {
            // Metadata
            const metadata = JSON.parse(data);
            this.fileSize = metadata.size;
            this.fileName = metadata.name;
            this.fileChunks = [];
            this.receivedSize = 0;
            console.log(`Menerima file: ${metadata.name} (${metadata.size} bytes)`);
        } else {
            // File chunk
            this.fileChunks.push(data);
            this.receivedSize += data.byteLength;
            
            const progress = (this.receivedSize / this.fileSize) * 100;
            console.log(`Progress penerimaan: ${progress.toFixed(1)}%`);
            
            if (this.receivedSize >= this.fileSize) {
                this.assembleFile();
            }
        }
    }
    
    assembleFile() {
        const blob = new Blob(this.fileChunks);
        const url = URL.createObjectURL(blob);
        
        // Buat link download
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('Download file dimulai');
    }
}

// Penggunaan
const fileTransfer = new WebRTCFileTransfer();
await fileTransfer.initialize();

// Untuk mengirim file
const fileInput = document.getElementById('fileInput');
fileInput.onchange = (event) => {
    const file = event.target.files[0];
    fileTransfer.sendFile(file);
};
```

### Node.js WebRTC Signaling Server

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`Client terhubung: ${socket.id}`);
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);
        
        // Beritahu yang lain di room
        socket.to(roomId).emit('user-joined', socket.id);
        
        console.log(`User ${socket.id} bergabung dengan room ${roomId}`);
    });
    
    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', {
            offer: data.offer,
            from: socket.id
        });
    });
    
    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', {
            answer: data.answer,
            from: socket.id
        });
    });
    
    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', {
            candidate: data.candidate,
            from: socket.id
        });
    });
    
    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        
        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }
        
        socket.to(roomId).emit('user-left', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client terputus: ${socket.id}`);
        
        // Bersihkan rooms
        rooms.forEach((clients, roomId) => {
            if (clients.has(socket.id)) {
                clients.delete(socket.id);
                socket.to(roomId).emit('user-left', socket.id);
                
                if (clients.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Signaling server berjalan di port 3000');
});
```

### WebRTC Lanjutan dengan Media Constraints

```javascript
async function getOptimizedMediaStream() {
    const constraints = {
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user' // atau 'environment' untuk kamera belakang
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 2
        }
    };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Dapatkan track settings
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        console.log('Video track settings:', videoTrack.getSettings());
        console.log('Audio track settings:', audioTrack.getSettings());
        
        return stream;
    } catch (error) {
        console.error('Error mendapatkan media stream:', error);
        
        // Fallback ke basic constraints
        return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
    }
}

// Screen sharing
async function startScreenShare() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'monitor'
            },
            audio: true
        });
        
        // Tambahkan screen share ke peer connection
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });
        
        return stream;
    } catch (error) {
        console.error('Error memulai screen share:', error);
    }
}

// Manajemen bandwidth
function setBandwidthLimit(peerConnection, bandwidth) {
    const sender = peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
    );
    
    if (sender) {
        const parameters = sender.getParameters();
        
        if (!parameters.encodings) {
            parameters.encodings = [{}];
        }
        
        parameters.encodings[0].maxBitrate = bandwidth * 1000; // Konversi ke bps
        
        sender.setParameters(parameters);
    }
}
```

## Praktik Terbaik

- Implementasikan signaling yang tepat untuk pembentukan koneksi
- Gunakan STUN/TURN servers untuk NAT traversal
- Tangani kegagalan koneksi dengan baik
- Optimalkan media constraints untuk berbagai perangkat
- Implementasikan manajemen bandwidth
- Gunakan koneksi aman (DTLS-SRTP)
- Tangani pemutusan peer dengan tepat
- Implementasikan echo cancellation dan noise reduction
- Monitor kualitas koneksi dan adaptasi sesuai
- Gunakan codec yang sesuai untuk berbagai use case

### Implementasi Signaling

```javascript
class SignalingChannel {
    constructor(serverUrl) {
        this.socket = io(serverUrl);
        this.eventHandlers = {};
    }
    
    connect(roomId) {
        this.socket.emit('join-room', roomId);
        
        this.socket.on('offer', (data) => {
            this.emit('offer', data);
        });
        
        this.socket.on('answer', (data) => {
            this.emit('answer', data);
        });
        
        this.socket.on('ice-candidate', (data) => {
            this.emit('ice-candidate', data);
        });
        
        this.socket.on('user-joined', (userId) => {
            this.emit('user-joined', userId);
        });
        
        this.socket.on('user-left', (userId) => {
            this.emit('user-left', userId);
        });
    }
    
    sendOffer(roomId, offer) {
        this.socket.emit('offer', { roomId, offer });
    }
    
    sendAnswer(roomId, answer) {
        this.socket.emit('answer', { roomId, answer });
    }
    
    sendIceCandidate(roomId, candidate) {
        this.socket.emit('ice-candidate', { roomId, candidate });
    }
    
    on(event, handler) {
        this.eventHandlers[event] = handler;
    }
    
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event](data);
        }
    }
    
    disconnect() {
        this.socket.disconnect();
    }
}
```

### Monitoring Kualitas Koneksi

```javascript
class WebRTCConnectionMonitor {
    constructor(peerConnection) {
        this.peerConnection = peerConnection;
        this.statsInterval = null;
    }
    
    startMonitoring(callback) {
        this.statsInterval = setInterval(async () => {
            try {
                const stats = await this.peerConnection.getStats();
                const connectionStats = this.processStats(stats);
                callback(connectionStats);
            } catch (error) {
                console.error('Error mendapatkan stats:', error);
            }
        }, 1000);
    }
    
    processStats(stats) {
        let connectionStats = {
            timestamp: Date.now(),
            bytesSent: 0,
            bytesReceived: 0,
            packetsSent: 0,
            packetsReceived: 0,
            packetsLost: 0,
            roundTripTime: 0,
            jitter: 0
        };
        
        stats.forEach(report => {
            if (report.type === 'transport') {
                connectionStats.bytesSent = report.bytesSent || 0;
                connectionStats.bytesReceived = report.bytesReceived || 0;
                connectionStats.packetsSent = report.packetsSent || 0;
                connectionStats.packetsReceived = report.packetsReceived || 0;
            }
            
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                connectionStats.roundTripTime = report.currentRoundTripTime * 1000 || 0;
            }
            
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                connectionStats.packetsLost = report.packetsLost || 0;
                connectionStats.jitter = report.jitter * 1000 || 0;
            }
        });
        
        return connectionStats;
    }
    
    stopMonitoring() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }
}

// Penggunaan
const monitor = new WebRTCConnectionMonitor(peerConnection);
monitor.startMonitoring((stats) => {
    console.log('Connection stats:', stats);
    
    // Adaptasi berdasarkan kualitas
    if (stats.packetsLost > 10) {
        console.warn('Packet loss tinggi terdeteksi');
        // Kurangi kualitas video atau bitrate
    }
});
```

### Konferensi Multi-party

```javascript
class WebRTCConference {
    constructor(signalingChannel) {
        this.signalingChannel = signalingChannel;
        this.peerConnections = new Map();
        this.localStream = null;
    }
    
    async joinConference(roomId) {
        this.signalingChannel.connect(roomId);
        
        // Dapatkan media lokal
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Tangani event signaling
        this.signalingChannel.on('user-joined', (userId) => {
            this.createPeerConnection(userId);
        });
        
        this.signalingChannel.on('user-left', (userId) => {
            this.removePeerConnection(userId);
        });
        
        this.signalingChannel.on('offer', (data) => {
            this.handleOffer(data.from, data.offer);
        });
        
        this.signalingChannel.on('answer', (data) => {
            this.handleAnswer(data.from, data.answer);
        });
        
        this.signalingChannel.on('ice-candidate', (data) => {
            this.handleIceCandidate(data.from, data.candidate);
        });
    }
    
    createPeerConnection(userId) {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        
        const peerConnection = new RTCPeerConnection(configuration);
        this.peerConnections.set(userId, peerConnection);
        
        // Tambahkan local stream
        this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
        });
        
        // Tangani remote stream
        peerConnection.ontrack = (event) => {
            this.addRemoteVideo(userId, event.streams[0]);
        };
        
        // Tangani ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingChannel.sendIceCandidate(userId, event.candidate);
            }
        };
        
        return peerConnection;
    }
    
    async handleOffer(userId, offer) {
        const peerConnection = this.createPeerConnection(userId);
        await peerConnection.setRemoteDescription(offer);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        this.signalingChannel.sendAnswer(userId, answer);
    }
    
    async handleAnswer(userId, answer) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(answer);
        }
    }
    
    async handleIceCandidate(userId, candidate) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            await peerConnection.addIceCandidate(candidate);
        }
    }
    
    removePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
            this.removeRemoteVideo(userId);
        }
    }
    
    addRemoteVideo(userId, stream) {
        // Buat elemen video untuk remote user
        const video = document.createElement('video');
        video.id = `remote-video-${userId}`;
        video.srcObject = stream;
        video.autoplay = true;
        document.getElementById('remote-videos').appendChild(video);
    }
    
    removeRemoteVideo(userId) {
        const video = document.getElementById(`remote-video-${userId}`);
        if (video) {
            video.remove();
        }
    }
    
    leaveConference() {
        // Tutup semua peer connections
        this.peerConnections.forEach((pc, userId) => {
            pc.close();
        });
        this.peerConnections.clear();
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        this.signalingChannel.disconnect();
    }
}
```

## Pertimbangan Keamanan

- Selalu gunakan HTTPS untuk signaling
- Implementasikan autentikasi untuk akses room
- Gunakan DTLS-SRTP untuk enkripsi media
- Validasi ICE candidates
- Implementasikan rate limiting pada signaling server
- Monitor upaya akses tidak sah
- Gunakan WebSocket aman untuk signaling
- Implementasikan cleanup yang tepat untuk media streams

## WebRTC vs Teknologi Lain

| Fitur | WebRTC | WebSockets | HTTP Polling |
|-------|--------|------------|--------------|
| Real-time | Ya | Ya | Tidak |
| P2P | Ya | Tidak | Tidak |
| Audio/Video | Native | Manual | Manual |
| Data Channel | Ya | Ya | Tidak |
| Browser Support | Browser modern | Semua browser | Semua browser |
| Server Required | Signaling saja | Selalu | Selalu |
| Latensi | Sangat rendah | Rendah | Tinggi |
| Kompleksitas | Tinggi | Sedang | Rendah |

## Use Case WebRTC Umum

- **Video Konferensi**: Zoom, Google Meet, Microsoft Teams
- **Video Sosial**: Omegle, Chatroulette
- **Dukungan Remote**: Screen sharing untuk dukungan teknis
- **Edukasi Online**: Ruang kelas interaktif
- **Telemedicine**: Konsultasi medis jarak jauh
- **Live Streaming**: Broadcasting latensi rendah
- **Gaming**: Game multiplayer real-time
- **Monitoring IoT**: Surveillance perangkat jarak jauh
- **File Sharing**: Transfer file P2P
- **Tools Kolaboratif**: Editing dokumen real-time