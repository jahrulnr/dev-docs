# Infrastructure as Code (IaC)

## Gambaran Umum

Infrastructure as Code (IaC) adalah praktik mengelola dan menyediakan infrastruktur melalui file definisi yang dapat dibaca mesin, daripada konfigurasi hardware fisik atau alat konfigurasi interaktif. Pendekatan ini memperlakukan infrastruktur sama seperti developer memperlakukan kode.

## Kapan Digunakan

- **Konsistensi Lingkungan**: Pastikan semua lingkungan (dev, staging, prod) identik
- **Deployment Skalabel**: Mudah mereplikasi infrastruktur di berbagai region atau akun
- **Version Control**: Track perubahan infrastruktur bersama kode aplikasi
- **Provisioning Otomatis**: Integrasikan deployment infrastruktur ke pipeline CI/CD
- **Disaster Recovery**: Cepat recreate infrastruktur dari definisi kode

## Prinsip Utama

1. **Deklaratif**: Definisikan state yang diinginkan, bukan langkah prosedural
2. **Versioned**: Simpan kode infrastruktur di sistem version control
3. **Testable**: Validasi perubahan infrastruktur sebelum apply
4. **Idempotent**: Menjalankan kode yang sama berkali-kali menghasilkan hasil yang sama
5. **Modular**: Pecah infrastruktur menjadi komponen yang dapat digunakan ulang

## Alat Populer

### Terraform
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
  }
}

resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-web-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### AWS CloudFormation
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC dengan subnet publik'

Parameters:
  EnvironmentName:
    Type: String
    Default: dev

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-igw

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet
```

## Manajemen State

### Terraform State
```bash
# Inisialisasi Terraform
terraform init

# Plan perubahan
terraform plan -var-file="dev.tfvars"

# Apply perubahan
terraform apply -var-file="dev.tfvars"

# Simpan state remotely (direkomendasikan)
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Praktik Terbaik

### Organisasi
- **Struktur Modular**: Pecah infrastruktur menjadi modul logis
- **Pemisahan Lingkungan**: Gunakan workspace atau file state terpisah per lingkungan
- **Konvensi Penamaan**: Penamaan resource yang konsisten di seluruh lingkungan

### Keamanan
- **Manajemen Secrets**: Jangan pernah simpan secrets di kode IaC
- **Least Privilege**: Berikan permission minimal yang diperlukan ke role deployment
- **Enkripsi State**: Enkripsi data sensitif di file state

### Workflow Development
- **Code Reviews**: Review perubahan infrastruktur seperti kode aplikasi
- **Testing**: Gunakan alat seperti Terratest atau Kitchen-Terraform untuk validasi
- **Integrasi CI/CD**: Otomasi deployment infrastruktur di pipeline

## Integrasi CI/CD

```yaml
# Contoh GitHub Actions
name: Infrastructure Deployment

on:
  push:
    branches: [main]
    paths: ['infrastructure/**']

jobs:
  terraform:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure

      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: infrastructure

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
        working-directory: infrastructure
```

## Tantangan Umum

- **Masalah State Lock**: Beberapa pengguna mencoba memodifikasi infrastruktur secara simultan
- **Deteksi Drift**: Perubahan infrastruktur dibuat di luar alat IaC
- **Manajemen Dependency**: Dependency resource yang kompleks dan ordering
- **Manajemen Biaya**: Tracking dan kontrol biaya resource cloud

## Ekosistem Alat

- **Terraform**: Provisioning infrastruktur multi-cloud
- **AWS CloudFormation**: Manajemen infrastruktur spesifik AWS
- **Azure Resource Manager**: Template infrastruktur Azure
- **Google Cloud Deployment Manager**: Manajemen infrastruktur GCP
- **Pulumi**: Infrastructure as code dengan bahasa pemrograman
- **Ansible**: Configuration management dan deployment aplikasi

## Strategi Migrasi

1. **Migrasi Brownfield**: Import resource yang ada ke IaC
2. **Adopsi Bertahap**: Mulai dengan resource baru, migrasi sistem legacy seiring waktu
3. **Pendekatan Hybrid**: Gunakan IaC untuk deployment baru, manual untuk legacy

## Referensi

- [Dokumentasi Terraform](https://www.terraform.io/docs)
- [Panduan AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [Infrastructure as Code oleh Kief Morris](https://www.manning.com/books/infrastructure-as-code)
- [Terraform: Up and Running](https://www.amazon.com/Terraform-Running-Writing-Infrastructure-Code/dp/1492046906)