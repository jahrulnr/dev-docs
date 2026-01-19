# Secure by Default Principle

## Overview

Secure by Default is a security principle that states systems, applications, and infrastructure should be configured with the most secure settings by default. Instead of starting with permissive configurations and requiring users to harden them, secure systems begin with restrictive defaults that require explicit action to relax security constraints. This approach minimizes the attack surface and reduces the risk of misconfiguration.

## Core Concepts

### Defense in Depth with Defaults
- **Multiple Security Layers**: Each layer starts secure
- **Fail-Safe Defaults**: System fails securely when errors occur
- **Explicit Opt-in**: Security features enabled by default

### Configuration Philosophy
- **Secure Baseline**: Start with maximum security
- **Explicit Permissions**: Require justification for relaxed security
- **Audit Trail**: Track all security configuration changes

## Implementation Strategies

### Application Security Defaults

#### Authentication & Authorization
```javascript
// Secure authentication defaults
const authConfig = {
  // Session security
  session: {
    secure: true,              // HTTPS only
    httpOnly: true,           // Prevent XSS
    sameSite: 'strict',       // CSRF protection
    maxAge: 3600000          // 1 hour expiration
  },

  // Password policies
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: true,
    maxAge: 90              // Force change every 90 days
  },

  // Multi-factor authentication
  mfa: {
    required: true,
    methods: ['totp', 'sms', 'hardware'],
    gracePeriod: 7          // Days to set up MFA
  }
};
```

#### API Security
```javascript
// Secure API defaults
const apiConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                  // 100 requests per window
    message: 'Too many requests'
  },

  // Input validation
  validation: {
    sanitize: true,            // Sanitize all inputs
    strict: true,             // Strict validation rules
    escape: true              // Escape outputs
  },

  // CORS policy
  cors: {
    origin: false,            // Deny by default
    credentials: false,
    methods: ['GET'],         // Minimal allowed methods
    allowedHeaders: []        // No custom headers by default
  }
};
```

### Infrastructure Security Defaults

#### Network Security
```terraform
# Secure network defaults
resource "aws_security_group" "secure_defaults" {
  name_prefix = "secure-sg-"

  # Default deny all inbound
  ingress = []

  # Minimal outbound (DNS, HTTP, HTTPS)
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS"
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  tags = {
    Security = "secure-by-default"
  }
}
```

#### Server Configuration
```bash
#!/bin/bash
# Secure server hardening script

# Disable root login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Use strong ciphers
echo "Ciphers aes256-gcm@openssh.com,aes128-gcm@openssh.com" >> /etc/ssh/sshd_config

# Disable password authentication (use keys only)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Configure firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Disable unnecessary services
systemctl disable avahi-daemon
systemctl disable cups

# Set secure permissions
chmod 600 /etc/shadow
chmod 644 /etc/passwd

# Enable automatic updates
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

### Database Security Defaults
```sql
-- Secure database defaults
-- PostgreSQL secure configuration

-- Disable remote connections by default
ALTER SYSTEM SET listen_addresses = 'localhost';

-- Require SSL connections
ALTER SYSTEM SET ssl = on;

-- Strong password encryption
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Restrictive permissions
REVOKE ALL ON DATABASE postgres FROM public;
REVOKE ALL ON SCHEMA public FROM public;

-- Create secure role with minimal permissions
CREATE ROLE app_user LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON users
    FOR ALL USING (user_id = current_user_id());
```

## Secure Development Lifecycle

### Design Phase
```yaml
# Security requirements checklist
security_requirements:
  authentication:
    - Multi-factor authentication required
    - Secure password policies enforced
    - Session management secure by default

  authorization:
    - Role-based access control
    - Principle of least privilege
    - Explicit permission grants

  data_protection:
    - Data encrypted at rest
    - Data encrypted in transit
    - Secure key management

  audit:
    - All security events logged
    - Logs tamper-proof
    - Regular log review
```

### Development Phase
```javascript
// Secure coding defaults
const securityDefaults = {
  // Input handling
  input: {
    validate: true,
    sanitize: true,
    escape: true
  },

  // Error handling
  errors: {
    exposeDetails: false,    // Don't leak sensitive info
    logSecurity: true,      // Log security events
    failSecure: true        // Fail securely
  },

  // Dependencies
  dependencies: {
    scan: true,             // Scan for vulnerabilities
    update: true,           // Keep updated
    minimal: true           // Use minimal required
  }
};
```

### Deployment Phase
```dockerfile
# Secure container defaults
FROM secure-base-image:latest

# Run as non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Minimal attack surface
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# No sensitive data in image
COPY --chown=app:app . /app

# Secure runtime defaults
ENV NODE_ENV=production
ENV DEBUG=false

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
```

## Common Secure Defaults

### Web Applications
- **HTTPS Only**: All traffic encrypted
- **Secure Cookies**: HttpOnly, Secure, SameSite flags
- **CSP Headers**: Content Security Policy enabled
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Prevent clickjacking

### APIs
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Strict schema validation
- **Authentication**: Required for all endpoints
- **CORS**: Restrictive cross-origin policies
- **API Versioning**: Explicit version requirements

### Cloud Infrastructure
- **IMDSv2**: Secure instance metadata access
- **VPC**: Private networking by default
- **Security Groups**: Default deny inbound
- **IAM Roles**: Least privilege permissions
- **Encryption**: Data encrypted by default

## Challenges and Solutions

### Usability vs Security Trade-off
**Challenge**: Secure defaults can be cumbersome for users
**Solution**: Provide clear opt-in mechanisms and documentation

### Legacy System Integration
**Challenge**: Existing systems may not support secure defaults
**Solution**: Use adapters and migration strategies

### Performance Impact
**Challenge**: Security measures can affect performance
**Solution**: Optimize security controls and use efficient algorithms

## Monitoring and Compliance

### Security Monitoring
```javascript
// Security monitoring defaults
const monitoringConfig = {
  alerts: {
    failedLogin: true,
    suspiciousActivity: true,
    configurationChange: true,
    privilegeEscalation: true
  },

  logging: {
    securityEvents: true,
    auditTrail: true,
    retention: 365,        // Days
    tamperProof: true
  },

  compliance: {
    pci: true,
    gdpr: true,
    sox: true,
    cis: true
  }
};
```

### Automated Security Assessment
- **Vulnerability Scanning**: Regular automated scans
- **Configuration Auditing**: Continuous compliance checks
- **Penetration Testing**: Scheduled security assessments

## Tools and Technologies

### Security Configuration Tools
- **OpenSCAP**: Security configuration scanning
- **CIS-CAT**: CIS benchmark assessment
- **Chef InSpec**: Infrastructure testing
- **Terraform Sentinel**: Policy as code

### Secure Development Tools
- **OWASP ZAP**: Web application security scanner
- **SonarQube**: Code quality and security
- **Snyk**: Dependency vulnerability scanning
- **GitGuardian**: Secrets detection

## References

- [NIST Secure Configuration Guidelines](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [OWASP Secure Coding Practices](https://owasp.org/www-pdf-archive/OWASP_SCP_Quick_Reference_Guide_v2.pdf)
- [Microsoft Secure by Default](https://docs.microsoft.com/en-us/security/develop/secure-by-default)