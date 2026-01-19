# Infrastructure as Code (IaC)
## Gambaran Umum

IaC mengelola infrastruktur menggunakan konfigurasi deklaratif (Terraform, CloudFormation) sehingga perubahan infrastruktur dapat direproduksi dan versioned. Pendekatan ini memungkinkan manajemen infrastruktur yang lebih efisien, konsisten, dan dapat diotomatisasi.

## Kapan digunakan
Gunakan untuk provisioning lingkungan yang konsisten, deployment yang dapat diulang, dan audit perubahan infrastruktur.

## Contoh
Definisikan infrastruktur dalam file Terraform, jalankan apply via pipeline CI, dan simpan state secara aman.

## Kelebihan / Kekurangan
- Kelebihan: Reproducibility, versioning, otomasi.
- Kekurangan: Kompleksitas manajemen state, kurva belajar, keamanan terhadap secrets/state.

## Referensi
- Dokumentasi Terraform, panduan CloudFormation.