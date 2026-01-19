# Shared Database in Microservices
## Gambaran Umum

Shared Database in Microservices adalah anti-pattern yang mengikat layanan ke satu model data, menyebabkan coupling dan masalah koordinasi. Pendekatan ini mencegah evolusi dan deployment independen, meningkatkan risiko konflik dan keterkaitan skema. Sebagai alternatif, gunakan data store per-layanan atau bounded contexts; gunakan event atau API untuk berbagi data antar layanan.

## Mengapa bermasalah
Mencegah evolusi dan deployment independen, meningkatkan risiko konflik dan keterkaitan skema.

## Mitigasi
Gunakan data store per-layanan atau bounded contexts; gunakan event atau API untuk berbagi data antar layanan.

## Referensi
- Sumber kepemilikan data microservices.