# Terraform

## Overview

Terraform is an open-source infrastructure as code (IaC) tool that allows you to define and provision infrastructure using declarative configuration files. Developed by HashiCorp, Terraform supports multiple cloud providers and services, enabling consistent and repeatable infrastructure deployments.

Terraform uses HashiCorp Configuration Language (HCL) to describe infrastructure components and their relationships. It maintains state to track resources and can plan, apply, and destroy infrastructure changes safely.

## Key Concepts

- **Providers**: Plugins that interact with cloud platforms (AWS, Azure, GCP)
- **Resources**: Infrastructure components (VMs, networks, databases)
- **Modules**: Reusable configurations for common infrastructure patterns
- **State**: Tracking of managed resources and their configurations
- **Workspaces**: Isolated environments for different deployments

## When to Use

- Managing multi-cloud or hybrid infrastructure
- Implementing infrastructure as code practices
- Ensuring consistent environments across dev/staging/production
- Automating complex infrastructure setups
- Version controlling infrastructure changes

## Basic Commands

```bash
# Initialize working directory
terraform init

# Plan infrastructure changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy

# Format configuration files
terraform fmt

# Validate configuration
terraform validate
```

## Example Configuration

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

## Best Practices

- Use modules for reusable infrastructure components
- Implement remote state for team collaboration
- Use workspaces for environment separation
- Implement proper locking mechanisms
- Regularly update providers and Terraform version
- Use variables and locals for configuration flexibility

## Comparison with CloudFormation

- **Multi-cloud**: Terraform supports multiple providers; CloudFormation is AWS-only
- **Language**: HCL vs JSON/YAML
- **State Management**: Terraform has built-in state; CloudFormation uses stacks
- **Community**: Terraform has broader ecosystem and community support

## Related

- [Kubernetes](kubernetes_en.md)
- [Helm](helm_en.md)
- [Docker](docker_en.md)

## References

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
