# Infrastructure as Code (IaC)
## Overview

IaC manages infrastructure using declarative configuration (Terraform, CloudFormation) enabling reproducible and versioned infrastructure changes. Pendekatan ini memungkinkan manajemen infrastruktur yang lebih efisien, konsisten, dan dapat diotomatisasi.

## When to use
Use for consistent environment provisioning, repeatable deployments, and auditability of infrastructure changes.

## Example
Define infrastructure in Terraform files, apply via CI pipeline, and store state securely.

## Pros / Cons
- Pros: Reproducibility, versioning, automation.
- Cons: State management complexity, learning curve, careful security around secrets/state.

## References
- Terraform docs, CloudFormation guides.