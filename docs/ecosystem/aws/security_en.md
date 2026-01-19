# Security & Identity

## AWS IAM (Identity and Access Management)

AWS IAM enables you to manage access to AWS services and resources securely, controlling who can access what and under what conditions.

## Common Use Cases
- User and group management
- Role-based access control
- Temporary credential management
- Multi-factor authentication enforcement

## Best Practices
- Follow the principle of least privilege
- Use IAM roles instead of access keys
- Enable MFA for privileged users
- Regularly rotate access keys and review permissions

## AWS WAF (Web Application Firewall)

AWS WAF is a web application firewall that helps protect web applications from common web exploits that could affect availability or security.

## Common Use Cases
- SQL injection protection
- Cross-site scripting (XSS) prevention
- DDoS attack mitigation
- Bot management and rate limiting

## Best Practices
- Use managed rule groups for common threats
- Configure custom rules for application-specific protection
- Enable logging for threat analysis
- Test rules in count mode before blocking

## AWS Shield

AWS Shield is a managed Distributed Denial of Service (DDoS) protection service that safeguards applications running on AWS.

## Common Use Cases
- Protection against volumetric attacks
- Mitigation of application layer attacks
- Real-time attack visibility
- Automatic attack mitigation

## Best Practices
- Use Shield Advanced for enhanced protection
- Configure health checks for better detection
- Enable automatic application layer DDoS mitigation
- Integrate with CloudWatch for monitoring

## AWS Certificate Manager

AWS Certificate Manager is a service that lets you easily provision, manage, and deploy public and private SSL/TLS certificates.

## Common Use Cases
- HTTPS website security
- API endpoint encryption
- Internal service communication
- IoT device authentication

## Best Practices
- Use ACM for AWS services integration
- Enable automatic certificate renewal
- Configure DNS validation for faster issuance
- Use private CA for internal certificates

## AWS Key Management Service (KMS)

AWS KMS is a managed service that makes it easy for you to create and control the encryption keys used to encrypt your data.

## Common Use Cases
- Data encryption at rest
- Secure key management
- Compliance with encryption standards
- Integration with AWS services

## Best Practices
- Use customer managed keys for full control
- Implement key rotation policies
- Configure key policies for access control
- Use CloudTrail for audit logging

## AWS Secrets Manager

AWS Secrets Manager helps you protect secrets needed to access your applications, services, and IT resources by enabling you to rotate, manage, and retrieve secrets.

## Common Use Cases
- Database credentials management
- API keys and tokens storage
- Secure configuration management
- Automated secret rotation

## Best Practices
- Use automatic rotation for database secrets
- Configure appropriate permissions with IAM
- Enable CloudTrail logging for audit
- Use resource-based policies for cross-account access

## AWS CloudHSM

AWS CloudHSM provides hardware security modules in the AWS Cloud, allowing you to generate and use your own encryption keys on dedicated hardware.

## Common Use Cases
- Secure key generation and storage
- Compliance with regulatory requirements
- Integration with applications requiring HSM
- Offloading cryptographic operations

## Best Practices
- Use HSMs in different availability zones
- Configure auto-scaling for high availability
- Implement proper backup and restore procedures
- Monitor HSM performance and capacity