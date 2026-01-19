# Networking & Content Delivery

## Amazon CloudFront

Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally.

## Common Use Cases
- Static and dynamic web content delivery
- Video streaming and on-demand content
- API acceleration
- Global application performance improvement

## Best Practices
- Use custom domain names with SSL
- Configure cache behaviors appropriately
- Implement origin access identity for S3
- Use CloudFront functions for edge computing

## Amazon VPC (Virtual Private Cloud)

Amazon VPC lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network.

## Common Use Cases
- Secure network isolation
- Multi-tier application architectures
- Hybrid cloud deployments
- Regulatory compliance requirements

## Best Practices
- Use multiple availability zones
- Implement proper subnet design (public/private)
- Configure security groups and NACLs
- Use VPC endpoints for AWS services

## Amazon Route 53

Amazon Route 53 is a highly available and scalable Domain Name System (DNS) web service designed to route end users to applications.

## Common Use Cases
- Domain registration and DNS management
- Traffic routing and load balancing
- Health checking and failover
- Global application availability

## Best Practices
- Use alias records for AWS services
- Configure health checks for high availability
- Implement geo-based routing when needed
- Use private hosted zones for internal DNS