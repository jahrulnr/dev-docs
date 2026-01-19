# WebRTC (Web Real-Time Communication)

## Overview

WebRTC is an open-source project that enables real-time communication (RTC) capabilities directly in web browsers and mobile applications. It allows peer-to-peer audio, video, and data sharing between browsers without requiring plugins or third-party software. WebRTC uses a combination of JavaScript APIs and underlying protocols to establish direct connections between peers.

WebRTC is built on top of existing web standards and provides the foundation for applications like video calling, file sharing, screen sharing, and real-time gaming. It handles NAT traversal, encryption, and media encoding/decoding automatically.

## Key Concepts

- **Peer-to-Peer (P2P)**: Direct communication between browsers without server relay
- **Signaling**: Initial negotiation process to exchange connection information
- **ICE (Interactive Connectivity Establishment)**: Framework for NAT traversal
- **STUN/TURN Servers**: Help establish connections through firewalls and NATs
- **SDP (Session Description Protocol)**: Describes multimedia session parameters
- **MediaStream**: Represents audio/video streams from cameras and microphones
- **RTCPeerConnection**: Manages peer-to-peer connections
- **RTCDataChannel**: Enables arbitrary data exchange between peers
- **Codecs**: Audio/video compression algorithms (VP8, VP9, H.264, Opus)

## When to Use

- Video calling and conferencing applications
- Real-time audio communication (VoIP)
- Screen sharing and remote desktop
- File sharing between peers
- Real-time gaming and collaboration
- Live streaming with low latency
- IoT device communication through browsers
- Multi-party communication systems
- Video surveillance and monitoring
- Interactive educational platforms

## Examples

### Basic WebRTC Video Call (HTML/JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebRTC Video Call</title>
</head>
<body>
    <video id="localVideo" autoplay muted></video>
    <video id="remoteVideo" autoplay></video>
    <button id="startButton">Start Call</button>
    <button id="hangupButton">Hang Up</button>

    <script>
        let localStream;
        let peerConnection;
        let remoteStream;

        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const startButton = document.getElementById('startButton');
        const hangupButton = document.getElementById('hangupButton');

        // STUN server configuration
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
                // Get user media
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                localVideo.srcObject = localStream;
                
                // Create peer connection
                peerConnection = new RTCPeerConnection(configuration);
                
                // Add local stream to peer connection
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
                
                // Handle remote stream
                peerConnection.ontrack = event => {
                    remoteVideo.srcObject = event.streams[0];
                };
                
                // Handle ICE candidates
                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        // Send candidate to remote peer via signaling
                        sendSignalingMessage({
                            type: 'candidate',
                            candidate: event.candidate
                        });
                    }
                };
                
                // Create offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                // Send offer to remote peer via signaling
                sendSignalingMessage({
                    type: 'offer',
                    offer: offer
                });
                
            } catch (error) {
                console.error('Error starting call:', error);
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

        // Signaling functions (implement based on your signaling server)
        function sendSignalingMessage(message) {
            // Send message to signaling server
            console.log('Sending signaling message:', message);
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
            
            // Add local stream
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
            
            // Handle remote stream
            peerConnection.ontrack = event => {
                remoteVideo.srcObject = event.streams[0];
            };
            
            // Handle ICE candidates
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

### WebRTC Data Channel for File Sharing

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
        
        // Create data channel
        this.dataChannel = this.peerConnection.createDataChannel('fileTransfer');
        this.setupDataChannel();
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                // Send to remote peer
                this.sendSignalingMessage({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        };
    }
    
    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleReceivedData(event.data);
        };
        
        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
        };
    }
    
    async sendFile(file) {
        const chunkSize = 16384; // 16KB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        // Send file metadata first
        const metadata = {
            type: 'file-metadata',
            name: file.name,
            size: file.size,
            type: file.type,
            totalChunks: totalChunks
        };
        
        this.dataChannel.send(JSON.stringify(metadata));
        
        // Send file chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            const arrayBuffer = await chunk.arrayBuffer();
            this.dataChannel.send(arrayBuffer);
            
            // Update progress
            const progress = ((i + 1) / totalChunks) * 100;
            console.log(`Sending progress: ${progress.toFixed(1)}%`);
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
            console.log(`Receiving file: ${metadata.name} (${metadata.size} bytes)`);
        } else {
            // File chunk
            this.fileChunks.push(data);
            this.receivedSize += data.byteLength;
            
            const progress = (this.receivedSize / this.fileSize) * 100;
            console.log(`Receiving progress: ${progress.toFixed(1)}%`);
            
            if (this.receivedSize >= this.fileSize) {
                this.assembleFile();
            }
        }
    }
    
    assembleFile() {
        const blob = new Blob(this.fileChunks);
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('File download initiated');
    }
}

// Usage
const fileTransfer = new WebRTCFileTransfer();
await fileTransfer.initialize();

// To send a file
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
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);
        
        // Notify others in room
        socket.to(roomId).emit('user-joined', socket.id);
        
        console.log(`User ${socket.id} joined room ${roomId}`);
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
        console.log(`Client disconnected: ${socket.id}`);
        
        // Clean up rooms
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
    console.log('Signaling server running on port 3000');
});
```

### Advanced WebRTC with Media Constraints

```javascript
async function getOptimizedMediaStream() {
    const constraints = {
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user' // or 'environment' for back camera
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
        
        // Get track settings
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        console.log('Video track settings:', videoTrack.getSettings());
        console.log('Audio track settings:', audioTrack.getSettings());
        
        return stream;
    } catch (error) {
        console.error('Error getting media stream:', error);
        
        // Fallback to basic constraints
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
        
        // Add screen share to peer connection
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });
        
        return stream;
    } catch (error) {
        console.error('Error starting screen share:', error);
    }
}

// Bandwidth management
function setBandwidthLimit(peerConnection, bandwidth) {
    const sender = peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
    );
    
    if (sender) {
        const parameters = sender.getParameters();
        
        if (!parameters.encodings) {
            parameters.encodings = [{}];
        }
        
        parameters.encodings[0].maxBitrate = bandwidth * 1000; // Convert to bps
        
        sender.setParameters(parameters);
    }
}
```

## Best Practices

- Implement proper signaling for connection establishment
- Use STUN/TURN servers for NAT traversal
- Handle connection failures gracefully
- Optimize media constraints for different devices
- Implement bandwidth management
- Use secure connections (DTLS-SRTP)
- Handle peer disconnections properly
- Implement echo cancellation and noise reduction
- Monitor connection quality and adapt accordingly
- Use appropriate codecs for different use cases

### Signaling Implementation

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

### Connection Quality Monitoring

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
                console.error('Error getting stats:', error);
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

// Usage
const monitor = new WebRTCConnectionMonitor(peerConnection);
monitor.startMonitoring((stats) => {
    console.log('Connection stats:', stats);
    
    // Adapt based on quality
    if (stats.packetsLost > 10) {
        console.warn('High packet loss detected');
        // Reduce video quality or bitrate
    }
});
```

### Multi-party Conferencing

```javascript
class WebRTCConference {
    constructor(signalingChannel) {
        this.signalingChannel = signalingChannel;
        this.peerConnections = new Map();
        this.localStream = null;
    }
    
    async joinConference(roomId) {
        this.signalingChannel.connect(roomId);
        
        // Get local media
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Handle signaling events
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
        
        // Add local stream
        this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
        });
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            this.addRemoteVideo(userId, event.streams[0]);
        };
        
        // Handle ICE candidates
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
        // Create video element for remote user
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
        // Close all peer connections
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

## Security Considerations

- Always use HTTPS for signaling
- Implement authentication for room access
- Use DTLS-SRTP for media encryption
- Validate ICE candidates
- Implement rate limiting on signaling server
- Monitor for unauthorized access attempts
- Use secure WebSocket for signaling
- Implement proper cleanup of media streams

## WebRTC vs Other Technologies

| Feature | WebRTC | WebSockets | HTTP Polling |
|---------|--------|------------|--------------|
| Real-time | Yes | Yes | No |
| P2P | Yes | No | No |
| Audio/Video | Native | Manual | Manual |
| Data Channel | Yes | Yes | No |
| Browser Support | Modern browsers | All browsers | All browsers |
| Server Required | Signaling only | Always | Always |
| Latency | Very low | Low | High |
| Complexity | High | Medium | Low |

## Common WebRTC Use Cases

- **Video Conferencing**: Zoom, Google Meet, Microsoft Teams
- **Social Video**: Omegle, Chatroulette
- **Remote Support**: Screen sharing for technical support
- **Online Education**: Interactive classrooms
- **Telemedicine**: Remote medical consultations
- **Live Streaming**: Low-latency broadcasting
- **Gaming**: Real-time multiplayer games
- **IoT Monitoring**: Remote device surveillance
- **File Sharing**: P2P file transfer
- **Collaborative Tools**: Real-time document editing