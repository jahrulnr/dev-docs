# Layanan Penyimpanan AWS

## Amazon S3 (Simple Storage Service)

Amazon S3 adalah layanan penyimpanan objek yang menawarkan skalabilitas, ketersediaan data, keamanan, dan performa terdepan di industri.

### Kasus Penggunaan Umum
- Hosting situs web statis
- Backup dan arsip data
- Analitik big data
- Distribusi dan pengiriman konten

### Praktik Terbaik
- Gunakan kelas penyimpanan yang sesuai (Standard, IA, Glacier)
- Implementasikan versioning untuk perlindungan data
- Konfigurasikan kebijakan lifecycle untuk optimasi biaya
- Gunakan enkripsi untuk data sensitif

## AWS Storage Gateway

AWS Storage Gateway adalah layanan penyimpanan cloud hybrid yang memberikan akses on-premises ke penyimpanan cloud yang secara virtual tidak terbatas.

### Kasus Penggunaan Umum
- Solusi penyimpanan cloud hybrid
- Migrasi data ke cloud
- Backup dan disaster recovery
- Optimasi penyimpanan tiered

### Praktik Terbaik
- Pilih tipe gateway yang sesuai
- Konfigurasikan throttling bandwidth yang tepat
- Implementasikan kompresi data
- Monitor performa gateway

## Amazon EFS (Elastic File System)

Amazon EFS menyediakan sistem file yang sederhana, skalabel, dan elastis untuk workload berbasis Linux untuk digunakan dengan layanan AWS Cloud dan sumber daya on-premises.

### Kasus Penggunaan Umum
- Penyimpanan file bersama di berbagai instance
- Sistem manajemen konten
- Environment development dan staging
- Persistent storage untuk container

### Praktik Terbaik
- Gunakan mode performa yang sesuai
- Implementasikan strategi backup
- Konfigurasikan security groups yang tepat
- Monitor metrik performa

## Amazon EBS (Elastic Block Store)

Amazon EBS menyediakan volume penyimpanan level blok untuk digunakan dengan instance EC2, menawarkan penyimpanan persisten yang dapat dilampirkan ke instance yang berjalan.

### Kasus Penggunaan Umum
- Penyimpanan database untuk instance EC2
- Persistensi data aplikasi
- Kebutuhan penyimpanan high-performance

### Praktik Terbaik
- Pilih tipe volume yang sesuai (gp3, io1, dll.)
- Implementasikan strategi snapshot
- Gunakan enkripsi at rest
- Monitor IOPS dan throughput

## AWS Snow Family

AWS Snow Family adalah kumpulan perangkat fisik yang membantu migrasi jumlah data besar ke dan dari AWS, atau memproses data di edge.

### Kasus Penggunaan Umum
- Migrasi data skala besar
- Deployment edge computing
- Distribusi konten
- Aplikasi militer dan pemerintah

### Praktik Terbaik
- Rencanakan logistik transfer data
- Gunakan tipe perangkat yang sesuai
- Implementasikan langkah keamanan yang tepat
- Monitor progress dan status transfer