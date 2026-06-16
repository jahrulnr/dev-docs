# WebRTC (Web Real-Time Communication)

## Overview

WebRTC adalah standar terbuka untuk komunikasi peer-to-peer real-time di browser dan aplikasi native. Mendukung audio, video, dan data biner arbitrer melalui channel terenkripsi tanpa plugin browser. Use case umum: video call, screen sharing, sinkronisasi data ber-latensi rendah, dan alat kolaborasi.

Browser mengekspos API tingkat tinggi (`getUserMedia`, `RTCPeerConnection`, `RTCDataChannel`). Di balik layar, WebRTC menegosiasikan codec, menembus NAT via ICE, dan mengenkripsi media dengan DTLS-SRTP. **Signaling** — pertukaran session description dan ICE candidate — tidak didefinisikan spesifikasinya; Anda mengimplementasikannya dengan WebSocket, HTTP, atau channel lain.

WebRTC bukan pengganti streaming client–server: ruang multi-party biasanya membutuhkan SFU (Selective Forwarding Unit) atau mixing server. P2P cocok untuk one-to-one atau grup kecil ketika kedua peer dapat membentuk jalur langsung.

## Signaling, STUN, and TURN

### Signaling

Sebelum media mengalir, peer harus menukar:

- **SDP** (Session Description Protocol) — kemampuan codec dan media melalui **offer** dan **answer**
- **ICE candidates** — jalur jaringan yang dapat dipakai masing-masing peer untuk saling menjangkau

Signaling server meneruskan pesan ini; tidak membawa media. Gunakan HTTPS/WSS di production dan autentikasi akses ruang.

### ICE (Interactive Connectivity Establishment)

ICE mengumpulkan alamat lokal dan refleksif, menguji konektivitas, dan memilih pasangan candidate yang berfungsi. Event tiba di `RTCPeerConnection.onicecandidate`.

### STUN

Server STUN membantu peer menemukan IP dan port publik di balik NAT. STUN publik (mis. `stun:stun.l.google.com:19302`) cukup untuk banyak jaringan rumah. STUN saja tidak menembus symmetric NAT atau firewall ketat.

### TURN

TURN me-relay media ketika P2P langsung gagal. Menambah latensi dan biaya bandwidth tetapi meningkatkan keberhasilan koneksi di jaringan enterprise dan mobile. Aplikasi production hampir selalu menyediakan TURN bersama STUN.

| Komponen | Peran |
|----------|-------|
| Signaling | Tukar SDP offer/answer dan ICE candidates |
| STUN | Temukan alamat publik; bantu NAT traversal |
| TURN | Relay media jika jalur langsung tidak tersedia |
| ICE | Pilih jalur terbaik antar peer |

## Minimal peer connection sketch

Alur ilustratif — transport signaling didefinisikan aplikasi (`sendSignaling` / `onSignalingMessage`).

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

`RTCDataChannel` memakai `RTCPeerConnection` yang sama untuk data arbitrer (transfer file, state game) tanpa track media terpisah.

## Security notes

- Layani aplikasi dan signaling lewat **HTTPS**; banyak API WebRTC memerlukan secure context
- Media terenkripsi dengan **DTLS-SRTP** secara default; jangan nonaktifkan enkripsi
- Autentikasi signaling — ruang tanpa autentikasi memungkinkan session hijacking
- Validasi dan rate-limit signaling; ICE candidate berasal dari peer
- Hentikan track `MediaStream` dan tutup `RTCPeerConnection` saat hang-up untuk melepas kamera/mikrofon
- Kredensial TURN sebaiknya short-lived; hindari menyematkan secret jangka panjang di client bundle

## Related

- [WebSocket](websocket_id.md)
- [HTTP](http_id.md)
- [UDP](udp_id.md)

## References

- [WebRTC specification](https://www.w3.org/TR/webrtc/)
