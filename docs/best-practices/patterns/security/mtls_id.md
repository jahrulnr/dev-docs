# Mutual TLS (mTLS)

## Gambaran Umum

mTLS mengautentikasi klien dan server menggunakan sertifikat TLS, memberi autentikasi mutual yang kuat dan saluran terenkripsi. Ini memberikan keamanan yang tinggi untuk komunikasi service-to-service.

## Kapan digunakan
Gunakan untuk autentikasi service-to-service di jaringan internal, terutama pada lingkungan berkeamanan tinggi.

## Contoh
Layanan saling menunjukkan sertifikat klien saat TLS handshake dan memverifikasi rantai kepercayaan.

## Kelebihan / Kekurangan
- Kelebihan: Jaminan identitas kuat, transport terenkripsi.
- Kekurangan: Kompleksitas manajemen sertifikat dan overhead operasional.

## Referensi
- Panduan deployment TLS dan mTLS.