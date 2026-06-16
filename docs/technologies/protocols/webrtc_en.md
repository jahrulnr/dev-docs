# WebRTC (Web Real-Time Communication)

## Overview

WebRTC is an open standard for real-time peer-to-peer communication in browsers and native apps. It supports audio, video, and arbitrary binary data over encrypted channels without browser plugins. Typical uses include video calls, screen sharing, low-latency data sync, and collaborative tools.

The browser exposes high-level APIs (`getUserMedia`, `RTCPeerConnection`, `RTCDataChannel`). Under the hood, WebRTC negotiates codecs, traverses NATs via ICE, and encrypts media with DTLS-SRTP. **Signaling** — exchanging session descriptions and ICE candidates — is not defined by the spec; you implement it with WebSocket, HTTP, or another channel.

WebRTC is not a drop-in replacement for client–server streaming: multi-party rooms usually need a selective forwarding unit (SFU) or mixing server. P2P works well for one-to-one or small groups when both peers can establish a direct path.

## Signaling, STUN, and TURN

### Signaling

Before media flows, peers must exchange:

- **SDP** (Session Description Protocol) — codec and media capabilities via **offer** and **answer**
- **ICE candidates** — network paths each peer can use to reach the other

Signaling servers relay these messages; they do not carry media. Use HTTPS/WSS in production and authenticate room access.

### ICE (Interactive Connectivity Establishment)

ICE gathers local and reflexive addresses, tests connectivity, and picks a working candidate pair. Events arrive on `RTCPeerConnection.onicecandidate`.

### STUN

STUN servers help a peer discover its public IP and port behind NAT. Public STUN (e.g. `stun:stun.l.google.com:19302`) suffices for many home networks. STUN alone cannot punch through symmetric NAT or strict firewalls.

### TURN

TURN relays media when direct P2P fails. It adds latency and bandwidth cost but improves connection success in enterprise and mobile networks. Production apps almost always provision TURN alongside STUN.

| Component | Role |
|-----------|------|
| Signaling | Exchange SDP offers/answers and ICE candidates |
| STUN | Discover public address; assist NAT traversal |
| TURN | Relay media when direct path unavailable |
| ICE | Select best working path between peers |

## Minimal peer connection sketch

Illustrative flow — signaling transport is application-defined (`sendSignaling` / `onSignalingMessage`).

```javascript
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // { urls: 'turn:turn.example.com', username: 'user', credential: 'pass' }
  ],
};

const pc = new RTCPeerConnection(config);

// Local media (caller)
const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

pc.onicecandidate = (event) => {
  if (event.candidate) sendSignaling({ type: 'candidate', candidate: event.candidate });
};

// Caller: create offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
sendSignaling({ type: 'offer', sdp: offer });

// Callee: handle offer, create answer
async function onOffer(offer) {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendSignaling({ type: 'answer', sdp: answer });
}

async function onAnswer(answer) {
  await pc.setRemoteDescription(answer);
}

async function onCandidate(candidate) {
  await pc.addIceCandidate(candidate);
}
```

`RTCDataChannel` uses the same `RTCPeerConnection` for arbitrary data (file transfer, game state) without a separate media track.

## Security notes

- Serve the app and signaling over **HTTPS**; many WebRTC APIs require a secure context
- Media is encrypted with **DTLS-SRTP** by default; do not disable encryption
- Authenticate signaling — unauthenticated rooms allow session hijacking
- Validate and rate-limit signaling; ICE candidates come from peers
- Stop `MediaStream` tracks and close `RTCPeerConnection` on hang-up to release camera/mic
- TURN credentials should be short-lived; avoid embedding long-lived secrets in client bundles

## Related

- [WebSocket](websocket_en.md)
- [HTTP](http_en.md)
- [UDP](udp_en.md)

## References

- [WebRTC specification](https://www.w3.org/TR/webrtc/)
