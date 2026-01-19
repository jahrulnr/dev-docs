# Containerd

## Gambaran Umum

Containerd adalah container runtime standar industri yang mengelola siklus hidup container secara lengkap. Awalnya dikembangkan oleh Docker dan sekarang merupakan proyek CNCF yang lulus. Containerd menyediakan fungsionalitas inti untuk menjalankan container, termasuk manajemen image, eksekusi container, dan storage.

Tidak seperti Docker yang merupakan platform lengkap, containerd fokus hanya pada operasi runtime container. Dirancang untuk diembed ke dalam sistem yang lebih besar dan menyediakan API bersih untuk manajemen container.

## Fitur Utama

- **Manajemen Image**: Pull, push, dan kelola image container
- **Siklus Hidup Container**: Buat, mulai, hentikan, dan hapus container
- **Storage**: Kelola storage container dan snapshot
- **Networking**: Tangani networking container
- **Distribusi**: Dukungan untuk berbagai registry image

## Arsitektur

Containerd terdiri dari beberapa komponen:
- **Containerd**: Daemon utama
- **Containerd-shim**: Kelola proses container
- **Runc**: Runtime container low-level
- **CNI**: Interface networking container

## Kapan Digunakan

- Membangun platform container kustom
- Mengintegrasikan container ke sistem orkestrasi
- Ketika membutuhkan runtime container ringan
- Untuk operasi container high-performance

## Penggunaan Dasar

Containerd biasanya dikelola melalui tool tingkat tinggi seperti Docker atau Kubernetes, tetapi dapat digunakan langsung:

```bash
# Import image
ctr images import image.tar

# List images
ctr images list

# Jalankan container
ctr run --rm docker.io/library/alpine:latest test /bin/sh

# List containers
ctr containers list
```

## Integrasi dengan Kubernetes

Containerd adalah runtime container default untuk Kubernetes (sejak v1.24). Menyediakan performa dan utilisasi resource yang lebih baik dibanding runtime Docker.

## Perbandingan dengan Docker

- **Scope**: Containerd hanya runtime; Docker termasuk tool build
- **Performa**: Containerd memiliki overhead lebih rendah
- **Integrasi**: Containerd terintegrasi lebih baik dengan sistem orkestrasi
- **API**: Containerd menyediakan API gRPC untuk manajemen

## Praktik Terbaik

- Gunakan containerd dengan Kubernetes untuk workload produksi
- Monitor metrik containerd untuk tuning performa
- Jaga containerd tetap update untuk patch keamanan
- Gunakan plugin CNI yang sesuai untuk kebutuhan networking