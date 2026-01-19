# Prinsip Secure by Default

## Gambaran Umum

Secure by Default adalah prinsip keamanan yang menyatakan bahwa sistem, aplikasi, dan infrastruktur harus dikonfigurasi dengan pengaturan paling aman secara default. Daripada memulai dengan konfigurasi permisif dan memerlukan pengguna untuk mengeraskannya, sistem aman dimulai dengan default yang restriktif yang memerlukan aksi eksplisit untuk melonggarkan batasan keamanan. Pendekatan ini meminimalkan attack surface dan mengurangi risiko misconfiguration.

## Konsep Inti

### Defense in Depth dengan Defaults
- **Multiple Security Layers**: Setiap lapisan dimulai dengan aman
- **Fail-Safe Defaults**: Sistem gagal dengan aman saat terjadi error
- **Explicit Opt-in**: Fitur keamanan diaktifkan secara default

### Filosofi Konfigurasi
- **Secure Baseline**: Mulai dengan keamanan maksimal
- **Explicit Permissions**: Wajibkan justifikasi untuk keamanan yang dilonggarkan
- **Audit Trail**: Lacak semua perubahan konfigurasi keamanan

## Strategi Implementasi

### Default Keamanan Aplikasi

#### Authentication & Authorization
```javascript
// Default autentikasi yang aman
const authConfig = {
  // Keamanan sesi
  session: {
    secure: true,              // HTTPS only
    httpOnly: true,           // Prevent XSS
    sameSite: 'strict',       // CSRF protection
    maxAge: 3600000          // 1 hour expiration
  },

  // Kebijakan password
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

#### Keamanan API
```javascript
// Default API yang aman
const apiConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                  // 100 requests per window
    message: 'Too many requests'
  },

  // Validasi input
  validation: {
    sanitize: true,            // Sanitize all inputs
    strict: true,             // Strict validation rules
    escape: true              // Escape outputs
  },

  // Kebijakan CORS
  cors: {
    origin: false,            // Deny by default
    credentials: false,
    methods: ['GET'],         // Minimal allowed methods
    allowedHeaders: []        // No custom headers by default
  }
};
```

### Default Keamanan Infrastruktur

#### Keamanan Jaringan
```terraform
# Default jaringan yang aman
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

#### Konfigurasi Server
```bash
#!/bin/bash
# Script hardening server yang aman

# Nonaktifkan root login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Gunakan cipher kuat
echo "Ciphers aes256-gcm@openssh.com,aes128-gcm@openssh.com" >> /etc/ssh/sshd_config

# Nonaktifkan autentikasi password (gunakan key saja)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Konfigurasi firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Nonaktifkan layanan yang tidak perlu
systemctl disable avahi-daemon
systemctl disable cups

# Set permission yang aman
chmod 600 /etc/shadow
chmod 644 /etc/passwd

# Aktifkan update otomatis
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

### Default Keamanan Database
```sql
-- Default database yang aman
-- Konfigurasi PostgreSQL yang aman

-- Nonaktifkan koneksi remote secara default
ALTER SYSTEM SET listen_addresses = 'localhost';

-- Wajibkan koneksi SSL
ALTER SYSTEM SET ssl = on;

-- Enkripsi password kuat
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Permission restriktif
REVOKE ALL ON DATABASE postgres FROM public;
REVOKE ALL ON SCHEMA public FROM public;

-- Buat role aman dengan permission minimal
CREATE ROLE app_user LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON users
    FOR ALL USING (user_id = current_user_id());
```

## Secure Development Lifecycle

### Fase Desain
```yaml
# Checklist kebutuhan keamanan
security_requirements:
  authentication:
    - Multi-factor authentication wajib
    - Kebijakan password aman diterapkan
    - Manajemen sesi aman secara default

  authorization:
    - Role-based access control
    - Principle of least privilege
    - Explicit permission grants

  data_protection:
    - Data dienkripsi saat istirahat
    - Data dienkripsi saat transit
    - Manajemen key yang aman

  audit:
    - Semua event keamanan dicatat
    - Log tamper-proof
    - Review log berkala
```

### Fase Development
```javascript
// Default coding yang aman
const securityDefaults = {
  // Penanganan input
  input: {
    validate: true,
    sanitize: true,
    escape: true
  },

  // Penanganan error
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

### Fase Deployment
```dockerfile
# Default container yang aman
FROM secure-base-image:latest

# Jalankan sebagai non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Minimal attack surface
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tidak ada data sensitif di image
COPY --chown=app:app . /app

# Default runtime yang aman
ENV NODE_ENV=production
ENV DEBUG=false

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
```

## Common Secure Defaults

### Aplikasi Web
- **HTTPS Only**: Semua trafik dienkripsi
- **Secure Cookies**: Flag HttpOnly, Secure, SameSite
- **CSP Headers**: Content Security Policy diaktifkan
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Prevent clickjacking

### APIs
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Validasi schema yang ketat
- **Authentication**: Wajib untuk semua endpoint
- **CORS**: Kebijakan cross-origin yang restriktif
- **API Versioning**: Kebutuhan versi eksplisit

### Infrastruktur Cloud
- **IMDSv2**: Akses metadata instance yang aman
- **VPC**: Networking privat secara default
- **Security Groups**: Default deny inbound
- **IAM Roles**: Permission least privilege
- **Encryption**: Data dienkripsi secara default

## Tantangan dan Solusi

### Trade-off Usability vs Security
**Tantangan**: Secure defaults bisa merepotkan untuk pengguna
**Solusi**: Sediakan mekanisme opt-in yang jelas dan dokumentasi

### Integrasi Sistem Legacy
**Tantangan**: Sistem existing mungkin tidak mendukung secure defaults
**Solusi**: Gunakan adapter dan strategi migrasi

### Dampak Performa
**Tantangan**: Ukuran keamanan dapat memengaruhi performa
**Solusi**: Optimalkan kontrol keamanan dan gunakan algoritma efisien

## Monitoring dan Compliance

### Monitoring Keamanan
```javascript
// Default monitoring keamanan
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

### Penilaian Keamanan Otomatis
- **Vulnerability Scanning**: Scan otomatis berkala
- **Configuration Auditing**: Pemeriksaan compliance berkelanjutan
- **Penetration Testing**: Penilaian keamanan terjadwal

## Tools dan Teknologi

### Tools Konfigurasi Keamanan
- **OpenSCAP**: Scanning konfigurasi keamanan
- **CIS-CAT**: Penilaian benchmark CIS
- **Chef InSpec**: Testing infrastruktur
- **Terraform Sentinel**: Policy as code

### Tools Development Aman
- **OWASP ZAP**: Web application security scanner
- **SonarQube**: Kualitas dan keamanan kode
- **Snyk**: Scanning vulnerability dependency
- **GitGuardian**: Deteksi secrets

## Referensi

- [NIST Secure Configuration Guidelines](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [OWASP Secure Coding Practices](https://owasp.org/www-pdf-archive/OWASP_SCP_Quick_Reference_Guide_v2.pdf)
- [Microsoft Secure by Default](https://docs.microsoft.com/en-us/security/develop/secure-by-default)