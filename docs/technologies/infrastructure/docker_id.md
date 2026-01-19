# Docker

## Gambaran Umum

Docker adalah platform untuk mengembangkan, mengirimkan, dan menjalankan aplikasi dalam container. Container memungkinkan Anda untuk mengemas aplikasi dengan semua dependensinya ke dalam unit standar yang dapat berjalan konsisten di berbagai environment. Ini menyelesaikan masalah "works on my machine" dan memungkinkan arsitektur microservices.

Docker menggunakan teknologi containerization untuk mengisolasi aplikasi dan dependensinya. Setiap container berjalan sebagai proses ringan, mandiri di OS host, berbagi kernel tetapi dengan filesystem, networking, dan ruang proses sendiri.

## Konsep Utama

- **Images**: Template read-only yang digunakan untuk membuat container. Images dibangun dari Dockerfile.
- **Containers**: Instance yang dapat dijalankan dari images. Container bersifat ephemeral dan dapat dimulai, dihentikan, dan dihapus.
- **Dockerfile**: File teks dengan instruksi untuk membangun image Docker.
- **Docker Compose**: Tool untuk mendefinisikan dan menjalankan aplikasi Docker multi-container.
- **Docker Registry**: Repository untuk menyimpan dan mendistribusikan image Docker (misalnya, Docker Hub).

## Kapan Digunakan

- Mengembangkan microservices yang perlu berjalan konsisten di berbagai environment
- Membuat environment development dan testing yang reproducible
- Menyederhanakan pipeline deployment
- Mengisolasi aplikasi dan dependensinya

## Perintah Dasar

```bash
# Membangun image
docker build -t myapp .

# Menjalankan container
docker run -d -p 8080:8080 myapp

# Melihat container yang berjalan
docker ps

# Menghentikan container
docker stop <container_id>

# Menghapus container
docker rm <container_id>

# Melihat images
docker images

# Menghapus image
docker rmi <image_id>
```

## Contoh Dockerfile

```dockerfile
# Gunakan runtime Node.js resmi sebagai base image
FROM node:14

# Set working directory
WORKDIR /app

# Copy file package
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy kode aplikasi
COPY . .

# Expose port
EXPOSE 8080

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
```

## Praktik Terbaik

- Gunakan multi-stage builds untuk mengurangi ukuran image
- Hindari menjalankan container sebagai root
- Gunakan .dockerignore untuk mengecualikan file yang tidak perlu
- Tag images dengan nomor versi
- Update base images secara teratur untuk keamanan

## Integrasi dengan Ecommerce

Dalam aplikasi ecommerce, Docker umumnya digunakan untuk:
- Mengcontainerize microservices (layanan order, pembayaran)
- Menjalankan database dalam container untuk development
- Membuat pipeline CI/CD yang konsisten
- Deploy aplikasi ke cluster Kubernetes