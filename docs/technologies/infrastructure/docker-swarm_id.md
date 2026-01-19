# Docker Swarm

## Gambaran Umum

Docker Swarm adalah solusi clustering dan orkestrasi native Docker untuk aplikasi containerized. Memungkinkan Anda membuat dan mengelola cluster node Docker sebagai sistem virtual tunggal. Swarm menyediakan kemampuan clustering native tanpa memerlukan tool orkestrasi eksternal.

Mode swarm diperkenalkan di Docker 1.12 dan menyediakan definisi service deklaratif, load balancing, scaling, dan rolling updates out of the box.

## Konsep Utama

- **Nodes**: Host Docker individual yang berpartisipasi dalam swarm
- **Manager Nodes**: Tangani manajemen cluster dan keputusan orkestrasi
- **Worker Nodes**: Jalankan container sesuai arahan manager
- **Services**: Definisi deklaratif dari state container yang diinginkan
- **Stacks**: Grup service terkait yang didefinisikan dalam file Compose

## Arsitektur

- **Raft Consensus**: Manager gunakan algoritma Raft untuk state konsisten
- **Service Discovery**: Service discovery berbasis DNS built-in
- **Load Balancing**: Load balancer internal untuk akses service
- **Rolling Updates**: Update tanpa downtime untuk service

## Kapan Digunakan

- Orkestrasi container skala kecil hingga menengah
- Ketika ingin tetap dalam ekosistem Docker
- Skenario deployment sederhana
- Belajar konsep orkestrasi container

## Perintah Dasar

```bash
# Inisialisasi swarm
docker swarm init

# Join worker node
docker swarm join --token <token> <manager_ip>:2377

# Buat service
docker service create --name web --publish 8080:80 nginx

# Scale service
docker service scale web=3

# Update service
docker service update --image nginx:1.20 web

# List services
docker service ls

# Inspect service
docker service inspect web
```

## Contoh File Stack

```yaml
version: '3.8'
services:
  web:
    image: nginx
    ports:
      - "80:80"
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  app:
    image: myapp
    depends_on:
      - db
    deploy:
      replicas: 2

  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints: [node.role == manager]

volumes:
  db-data:
```

## Perbandingan dengan Kubernetes

- **Kompleksitas**: Swarm lebih sederhana untuk setup dan manage
- **Fitur**: Kubernetes memiliki fitur lebih advanced dan ekosistem
- **Skalabilitas**: Kubernetes scale lebih baik untuk deployment besar
- **Learning Curve**: Swarm memiliki learning curve lebih gentle

## Praktik Terbaik

- Gunakan manager nodes untuk management dan workload di cluster kecil
- Implementasikan networking proper dengan overlay networks
- Gunakan manajemen secrets untuk data sensitif
- Monitor kesehatan swarm dan performa
- Rencanakan high availability dengan multiple managers

## Integrasi dengan Ecommerce

Docker Swarm dapat digunakan untuk:
- Orkestrasi microservices di platform ecommerce
- Mengelola database dan cache containerized
- Mengimplementasikan blue-green deployments
- Scaling services berdasarkan pola trafik