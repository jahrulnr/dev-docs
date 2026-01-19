# Infrastructure as Code (IaC)

## Overview

Infrastructure as Code (IaC) is the practice of managing and provisioning infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. This approach treats infrastructure the same way developers treat code.

## When to Use

- **Environment Consistency**: Ensure all environments (dev, staging, prod) are identical
- **Scalable Deployments**: Easily replicate infrastructure across regions or accounts
- **Version Control**: Track infrastructure changes alongside application code
- **Automated Provisioning**: Integrate infrastructure deployment into CI/CD pipelines
- **Disaster Recovery**: Quickly recreate infrastructure from code definitions

## Key Principles

1. **Declarative**: Define desired state, not procedural steps
2. **Versioned**: Store infrastructure code in version control systems
3. **Testable**: Validate infrastructure changes before applying
4. **Idempotent**: Running the same code multiple times produces the same result
5. **Modular**: Break down infrastructure into reusable components

## Popular Tools

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
Description: 'VPC with public subnets'

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

## State Management

### Terraform State
```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan -var-file="dev.tfvars"

# Apply changes
terraform apply -var-file="dev.tfvars"

# Store state remotely (recommended)
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Best Practices

### Organization
- **Modular Structure**: Break infrastructure into logical modules
- **Environment Separation**: Use workspaces or separate state files per environment
- **Naming Conventions**: Consistent resource naming across environments

### Security
- **Secrets Management**: Never store secrets in IaC code
- **Least Privilege**: Grant minimal required permissions to deployment roles
- **State Encryption**: Encrypt sensitive data in state files

### Development Workflow
- **Code Reviews**: Review infrastructure changes like application code
- **Testing**: Use tools like Terratest or Kitchen-Terraform for validation
- **CI/CD Integration**: Automate infrastructure deployment in pipelines

## CI/CD Integration

```yaml
# GitHub Actions example
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

## Common Challenges

- **State Lock Issues**: Multiple users trying to modify infrastructure simultaneously
- **Drift Detection**: Infrastructure changes made outside of IaC tools
- **Dependency Management**: Complex resource dependencies and ordering
- **Cost Management**: Tracking and controlling cloud resource costs

## Tools Ecosystem

- **Terraform**: Multi-cloud infrastructure provisioning
- **AWS CloudFormation**: AWS-specific infrastructure management
- **Azure Resource Manager**: Azure infrastructure templates
- **Google Cloud Deployment Manager**: GCP infrastructure management
- **Pulumi**: Infrastructure as code with programming languages
- **Ansible**: Configuration management and application deployment

## Migration Strategies

1. **Brownfield Migration**: Import existing resources into IaC
2. **Gradual Adoption**: Start with new resources, migrate legacy systems over time
3. **Hybrid Approach**: Use IaC for new deployments, manual for legacy

## References

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [Infrastructure as Code by Kief Morris](https://www.manning.com/books/infrastructure-as-code)
- [Terraform: Up and Running](https://www.amazon.com/Terraform-Running-Writing-Infrastructure-Code/dp/1492046906)