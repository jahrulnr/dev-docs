# Networking & Content Delivery

## Amazon CloudFront

Amazon CloudFront adalah layanan content delivery network (CDN) cepat yang mengirimkan data, video, aplikasi, dan API kepada pelanggan secara global dengan aman.

## Kasus Penggunaan Umum
- Pengiriman konten web statis dan dinamis
- Streaming video dan konten on-demand
- Akselerasi API
- Peningkatan performa aplikasi global

## Praktik Terbaik
- Gunakan nama domain kustom dengan SSL
- Konfigurasikan cache behaviors dengan tepat
- Implementasikan origin access identity untuk S3
- Gunakan CloudFront functions untuk edge computing

## Amazon VPC (Virtual Private Cloud)

Amazon VPC memungkinkan Anda menyediakan bagian cloud AWS yang terisolasi secara logis tempat Anda dapat meluncurkan sumber daya AWS di jaringan virtual.

## Kasus Penggunaan Umum
- Isolasi jaringan yang aman
- Arsitektur aplikasi multi-tier
- Deployment hybrid cloud
- Persyaratan kepatuhan regulasi

## Praktik Terbaik
- Gunakan multiple availability zones
- Implementasikan desain subnet yang tepat (public/private)
- Konfigurasikan security groups dan NACLs
- Gunakan VPC endpoints untuk layanan AWS

## Amazon Route 53

Amazon Route 53 adalah layanan web Domain Name System (DNS) yang sangat tersedia dan skalabel yang dirancang untuk mengarahkan pengguna akhir ke aplikasi.

## Kasus Penggunaan Umum
- Registrasi domain dan manajemen DNS
- Routing traffic dan load balancing
- Health checking dan failover
- Ketersediaan aplikasi global

## Praktik Terbaik
- Gunakan alias records untuk layanan AWS
- Konfigurasikan health checks untuk ketersediaan tinggi
- Implementasikan routing berbasis geo jika diperlukan
- Gunakan private hosted zones untuk DNS internal