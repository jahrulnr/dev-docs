# Layanan Komputasi AWS

## Amazon EC2 (Elastic Compute Cloud)

Amazon EC2 menyediakan server virtual yang dapat diubah ukurannya di cloud, menawarkan kontrol penuh atas sumber daya komputasi dan menjalankan aplikasi di infrastruktur AWS.

### Kasus Penggunaan Umum
- Server web dan hosting aplikasi
- Pemrosesan batch dan analisis data
- Lingkungan development dan staging
- Beban kerja komputasi performa tinggi

### Praktik Terbaik
- Gunakan Auto Scaling Groups untuk scaling dinamis
- Implementasikan security groups dan NACL yang tepat
- Gunakan Amazon Machine Images (AMIs) untuk deployment yang konsisten
- Aktifkan monitoring detail dan alarm CloudWatch

## AWS Lambda

AWS Lambda adalah layanan komputasi serverless yang menjalankan kode sebagai respons terhadap event dan secara otomatis mengelola sumber daya komputasi yang mendasarinya.

### Kasus Penggunaan Umum
- Pemrosesan file real-time
- Transformasi data dan operasi ETL
- Backend API dan microservices
- Aplikasi berbasis event

### Praktik Terbaik
- Jaga paket fungsi tetap kecil (< 50MB terkompresi)
- Gunakan variabel environment untuk konfigurasi
- Implementasikan penanganan error dan retry yang tepat
- Monitor dengan CloudWatch Logs dan X-Ray

## Amazon ECS (Elastic Container Service)

Amazon ECS adalah layanan orkestrasi kontainer yang dikelola sepenuhnya yang memudahkan menjalankan, menghentikan, dan mengelola kontainer Docker di cluster.

### Kasus Penggunaan Umum
- Deployment arsitektur microservices
- Beban kerja pemrosesan batch
- Aplikasi web dengan auto-scaling
- Integrasi pipeline CI/CD

### Praktik Terbaik
- Gunakan Fargate untuk eksekusi kontainer serverless
- Implementasikan service discovery dengan Cloud Map
- Konfigurasikan task definition yang tepat
- Gunakan Application Load Balancers untuk eksposur layanan

## AWS Fargate

AWS Fargate adalah mesin komputasi serverless untuk kontainer yang bekerja dengan Amazon ECS dan Amazon EKS, menghilangkan kebutuhan untuk mengelola server atau cluster.

### Kasus Penggunaan Umum
- Deployment kontainer serverless
- Microservices tanpa manajemen infrastruktur
- Aplikasi yang memerlukan ketersediaan tinggi
- Eksekusi kontainer yang hemat biaya

### Praktik Terbaik
- Gunakan alokasi CPU dan memori yang sesuai
- Implementasikan logging dengan CloudWatch
- Konfigurasikan security groups dengan benar
- Gunakan task roles untuk izin yang lebih detail

## AWS Batch

AWS Batch memungkinkan developer, ilmuwan, dan engineer dengan mudah dan efisien menjalankan ratusan ribu job komputasi batch di AWS.

### Kasus Penggunaan Umum
- Workload komputasi performa tinggi
- Pemrosesan batch dataset besar
- Job batch terkontainerisasi
- Komputasi ilmiah dan simulasi

### Praktik Terbaik
- Gunakan compute environment yang sesuai
- Konfigurasikan job queue untuk prioritisasi
- Implementasikan alokasi sumber daya yang tepat
- Monitor eksekusi job dan biaya

## Amazon EMR (Elastic MapReduce)

Amazon EMR adalah platform big data cloud untuk memproses jumlah data yang sangat besar menggunakan tools open source seperti Apache Spark, Apache Hive, dan Presto.

### Kasus Penggunaan Umum
- Pemrosesan dan analitik big data
- Analisis dan pemrosesan log
- Machine learning pada dataset besar
- Operasi ETL dalam skala besar

### Praktik Terbaik
- Pilih tipe instance yang sesuai
- Gunakan EMR managed scaling
- Konfigurasikan security groups yang tepat
- Implementasikan strategi optimasi biaya