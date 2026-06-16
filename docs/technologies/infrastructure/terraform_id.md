# Terraform

## Gambaran Umum

Terraform adalah tool infrastructure as code (IaC) open-source yang memungkinkan Anda mendefinisikan dan menyediakan infrastruktur menggunakan file konfigurasi deklaratif. Dikembangkan oleh HashiCorp, Terraform mendukung multiple cloud provider dan service, memungkinkan deployment infrastruktur yang konsisten dan repeatable.

Terraform menggunakan HashiCorp Configuration Language (HCL) untuk mendeskripsikan komponen infrastruktur dan hubungannya. Ia mempertahankan state untuk melacak resource dan dapat plan, apply, dan destroy perubahan infrastruktur secara aman.

## Konsep Utama

- **Providers**: Plugin yang berinteraksi dengan platform cloud (AWS, Azure, GCP)
- **Resources**: Komponen infrastruktur (VM, network, database)
- **Modules**: Konfigurasi reusable untuk pola infrastruktur umum
- **State**: Pelacakan resource terkelola dan konfigurasinya
- **Workspaces**: Environment terisolasi untuk deployment berbeda

## Kapan Digunakan

- Mengelola infrastruktur multi-cloud atau hybrid
- Mengimplementasikan praktik infrastructure as code
- Memastikan environment konsisten di dev/staging/production
- Mengotomasi setup infrastruktur kompleks
- Version control perubahan infrastruktur

## Perintah Dasar

```bash
# Inisialisasi working directory
terraform init

# Plan perubahan infrastruktur
terraform plan

# Apply perubahan
terraform apply

# Destroy infrastruktur
terraform destroy

# Format file konfigurasi
terraform fmt

# Validasi konfigurasi
terraform validate
```

## Contoh Konfigurasi

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
  }
}

resource "aws_db_instance" "default" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "mysql"
  engine_version       = "5.7"
  instance_class       = "db.t2.micro"
  name                 = "mydb"
  username             = "admin"
  password             = "password"
  parameter_group_name = "default.mysql5.7"
}
```

## Praktik Terbaik

- Gunakan modules untuk komponen infrastruktur reusable
- Implementasikan remote state untuk kolaborasi tim
- Gunakan workspaces untuk separasi environment
- Implementasikan mekanisme locking proper
- Update providers dan versi Terraform secara teratur
- Gunakan variables dan locals untuk fleksibilitas konfigurasi

## Perbandingan dengan CloudFormation

- **Multi-cloud**: Terraform dukung multiple provider; CloudFormation AWS-only
- **Bahasa**: HCL vs JSON/YAML
- **Manajemen State**: Terraform punya built-in state; CloudFormation gunakan stacks
- **Komunitas**: Terraform punya ekosistem dan dukungan komunitas lebih luas

## Terkait

- [Kubernetes](kubernetes_id.md)
- [Helm](helm_id.md)
- [Docker](docker_id.md)

## Referensi

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
