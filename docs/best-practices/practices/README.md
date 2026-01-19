# Practices
## Overview

Cara kerja dan operasional yang direkomendasikan untuk development dan deployment yang efisien. Section ini mencakup praktik-praktik operasional yang terbukti untuk meningkatkan productivity, reliability, dan scalability dalam software development lifecycle.

## Subcategories

### Deployment
Strategi deployment untuk minimize downtime dan risiko:
- **[Blue-Green Deployment](deployment/blue-green-deployment_en.md)**: Switch traffic antara dua environment identik.
- **[Canary Deployment](deployment/canary-deployment_en.md)**: Rollout gradual ke subset users.
- **[Rolling Deployment](deployment/rolling-deployment_en.md)**: Update instances incrementally.
- **[Recreate Deployment](deployment/recreate-deployment_en.md)**: Shutdown lama sebelum deploy baru.
- **[A/B Testing Deployment](deployment/ab-testing-deployment_en.md)**: Test multiple versions dengan data-driven decisions.
- **[Shadow Deployment](deployment/shadow-deployment_en.md)**: Testing paralel tanpa affect production.

### Integration
Praktik integrasi kode dan testing:
- **[CI/CD](integration/ci-cd_en.md)**: Continuous Integration dan Continuous Delivery pipelines.
- **[Trunk-Based Development](integration/trunk-based-development_en.md)**: Development dengan short-lived branches.
- **[Test-Driven Development](integration/test-driven-development_en.md)**: Write tests before code (Red-Green-Refactor).

### Feature Management
Teknik manajemen fitur untuk controlled rollouts:
- **[Feature Toggle](feature-management/feature-toggle_en.md)**: Enable/disable features tanpa redeploy.

### Infrastructure
Praktik infrastruktur dan automation:
- **[Infrastructure as Code](infrastructure/infrastructure-as-code_en.md)**: Manage infrastructure dengan code (Terraform, CloudFormation).

## Dokumentasi Bilingual

Semua praktik tersedia dalam bahasa Inggris dan Indonesia dengan akhiran `_en.md` dan `_id.md`.

## Panduan Implementasi

- Mulai dengan CI/CD untuk automated testing dan deployment
- Gunakan feature toggles untuk gradual feature rollouts
- Pilih strategi deployment berdasarkan risk tolerance dan downtime requirements
- Combine practices untuk comprehensive DevOps workflow

## Referensi

- [Principles](../principles/) untuk fundamental guidelines
- [Patterns](../patterns/) untuk technical implementations
- [Anti-patterns](../anti-patterns/) untuk pitfalls to avoid