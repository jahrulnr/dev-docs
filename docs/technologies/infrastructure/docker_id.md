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

## Kasus penggunaan khas

- Packaging aplikasi dengan runtime environment yang reproducible
- Paritas development lokal dengan production deployment
- Pipeline CI/CD untuk build, test, dan artifact
- Membangun image yang dikonsumsi Kubernetes atau Docker Swarm
- Mengisolasi dependensi service dalam stack microservice

## Terkait

- [Kubernetes](kubernetes_id.md)
- [Docker Swarm](docker-swarm_id.md)
- [containerd](containerd_id.md)

## Referensi

- [Docker Documentation](https://docs.docker.com/)
