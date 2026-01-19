# Prinsip Assume Breach

## Gambaran Umum

Prinsip Assume Breach adalah pola pikir keamanan yang beroperasi dengan asumsi bahwa pelanggaran keamanan telah terjadi atau akan terjadi. Daripada fokus hanya pada pencegahan, pendekatan ini menekankan deteksi, pembatasan, respons cepat, dan ketahanan. Prinsip ini mengakui bahwa keamanan sempurna tidak dapat dicapai dan menggeser fokus pada meminimalkan kerusakan dan waktu pemulihan ketika pelanggaran memang terjadi.

## Konsep Inti

### Pola Pikir Asumsi Pelanggaran
- **Ketidakpastian**: Pelanggaran tidak terhindarkan dengan waktu dan sumber daya yang cukup
- **Pertahanan Proaktif**: Rancang sistem dengan ekspektasi kompromi
- **Pembatasan Kerusakan**: Fokus pada pembatasan dan pemulihan dari pelanggaran

### Lapisan Strategi Pertahanan
- **Deteksi**: Monitoring komprehensif dan deteksi anomali
- **Pembatasan**: Membatasi penyebaran dan dampak pelanggaran
- **Pemulihan**: Restorasi cepat dan pembelajaran dari insiden

## Strategi Implementasi

### Segmentasi Jaringan
```yaml
# Arsitektur jaringan Zero Trust
segmentasi_jaringan:
  zona_publik:
    akses: "internet"
    tingkat_kepercayaan: "tidak_ada"
    monitoring: "inspeksi_paket_lengkap"

  zona_dmz:
    akses: "eksternal_terbatas"
    tingkat_kepercayaan: "minimal"
    monitoring: "ditingkatkan"

  zona_aplikasi:
    akses: "internal_saja"
    tingkat_kepercayaan: "terotentikasi"
    monitoring: "analisis_perilaku"

  zona_data:
    akses: "terbatas"
    tingkat_kepercayaan: "terotorisasi"
    monitoring: "komprehensif"
```

### Implementasi Micro-Segmentation
```terraform
# AWS VPC dengan micro-segmentation
resource "aws_security_group" "assume_breach_sg" {
  name_prefix = "assume-breach-"

  # Default deny all
  ingress = []

  # Explicit allow dengan monitoring
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Internal only
    description = "HTTPS dari internal"

    # Aktifkan flow logs untuk monitoring
  }

  # Egress monitoring
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# VPC Flow Logs untuk deteksi pelanggaran
resource "aws_flow_log" "breach_monitoring" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

### Kontrol Lapisan Aplikasi
```javascript
// Kontrol pertahanan mendalam aplikasi
const perlindunganBreach = {
  // Validasi input dengan monitoring
  validasiInput: {
    sanitize: true,
    validate: true,
    monitor: true,           // Log input mencurigakan
    block: true             // Blok pola berbahaya
  },

  // Manajemen sesi
  session: {
    monitorActivity: true,   // Track semua aktivitas sesi
    anomalyDetection: true, // Deteksi perilaku tidak normal
    autoInvalidate: true,   // Invalidate sesi mencurigakan
    geoFencing: true       // Batasi berdasarkan geografi
  },

  // Perlindungan API
  api: {
    rateLimiting: true,
    requestThrottling: true,
    abuseDetection: true,
    circuitBreaker: true    // Fail fast saat kompromi
  }
};
```

## Deteksi dan Monitoring

### Logging Komprehensif
```javascript
// Logging terpusat untuk deteksi pelanggaran
const konfigurasiLogging = {
  // Log aplikasi
  aplikasi: {
    level: "debug",
    format: "json",
    destination: "terpusat",
    retention: 365
  },

  // Event keamanan
  keamanan: {
    events: [
      "autentikasi",
      "otorisasi",
      "akses_data",
      "perubahan_konfigurasi",
      "eskalasi_privilege"
    ],
    alerting: true,
    correlation: true
  },

  // Log infrastruktur
  infrastruktur: {
    network: true,
    system: true,
    container: true,
    orchestration: true
  }
};
```

### Deteksi Anomali
```python
# Deteksi anomali machine learning
from sklearn.ensemble import IsolationForest
import pandas as pd

class BreachDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1)
        self.baseline_data = []

    def train_baseline(self, historical_data):
        """Train pada pola perilaku normal"""
        self.baseline_data = historical_data
        features = self.extract_features(historical_data)
        self.model.fit(features)

    def detect_anomalies(self, current_data):
        """Deteksi potensi pelanggaran"""
        features = self.extract_features(current_data)
        predictions = self.model.predict(features)

        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:  # Anomali terdeteksi
                anomalies.append({
                    'timestamp': current_data[i]['timestamp'],
                    'type': 'potensi_breach',
                    'confidence': self.model.decision_function([features[i]])[0],
                    'details': current_data[i]
                })

        return anomalies

    def extract_features(self, data):
        """Ekstrak fitur perilaku"""
        features = []
        for record in data:
            feature_vector = [
                record.get('request_count', 0),
                record.get('error_rate', 0),
                record.get('response_time', 0),
                record.get('unique_ips', 0),
                record.get('data_volume', 0)
            ]
            features.append(feature_vector)
        return features
```

## Otomasi Respons Insiden

### Pembatasan Otomatis
```bash
#!/bin/bash
# Script pembatasan pelanggaran otomatis

# Function untuk isolasi host terkompromi
isolate_host() {
    local host_ip=$1

    # Blok semua trafik ke/dari host
    iptables -A INPUT -s $host_ip -j DROP
    iptables -A OUTPUT -d $host_ip -j DROP

    # Notifikasi tim keamanan
    curl -X POST $WEBHOOK_URL \
         -H "Content-Type: application/json" \
         -d "{\"alert\": \"Host $host_ip diisolasi karena dugaan pelanggaran\"}"

    # Ambil snapshot untuk forensik
    aws ec2 create-snapshot --instance-id $INSTANCE_ID --description "Forensik pelanggaran"
}

# Function untuk karantina data
quarantine_data() {
    local bucket=$1
    local object_key=$2

    # Pindah ke bucket karantina
    aws s3 cp s3://$bucket/$object_key s3://quarantine-bucket/

    # Hapus dari lokasi asli
    aws s3 rm s3://$bucket/$object_key

    # Log aksi karantina
    logger "Data dikarantina: $bucket/$object_key"
}

# Monitor indikator pelanggaran
monitor_breach_indicators() {
    while true; do
        # Periksa pola login tidak normal
        suspicious_logins=$(grep "Failed password" /var/log/auth.log | wc -l)

        if [ $suspicious_logins -gt 10 ]; then
            isolate_host $(hostname -I | awk '{print $1}')
            break
        fi

        sleep 60
    done
}
```

### Otomasi Pemulihan
```yaml
# Playbook pemulihan otomatis
otomasi_pemulihan:
  stages:
    - name: "Assessment"
      actions:
        - isolate_sistem_terkompromi
        - kumpulkan_data_forensik
        - nilai_cakupan_kerusakan

    - name: "Containment"
      actions:
        - blok_ip_berbahaya
        - cabut_kredensial_terkompromi
        - implementasi_monitoring_tambahan

    - name: "Recovery"
      actions:
        - restore_dari_backup_bersih
        - patch_kerentanan
        - validasi_integritas_sistem

    - name: "Lessons Learned"
      actions:
        - dokumentasi_insiden
        - update_kontrol_keamanan
        - lakukan_post_mortem

  triggers:
    - breach_terdeteksi
    - threshold_anomali_terlampaui
    - aktivasi_manual
```

## Strategi Perlindungan Data

### Enkripsi saat Istirahat dan Transit
```javascript
// Enkripsi data komprehensif
const perlindunganData = {
  // Enkripsi database
  database: {
    encryption: "AES-256-GCM",
    keyRotation: "30_days",
    backupEncryption: true
  },

  // Enkripsi filesystem
  filesystem: {
    algorithm: "AES-256-XTS",
    keyManagement: "KMS",
    accessLogging: true
  },

  // Enkripsi jaringan
  network: {
    protocol: "TLS_1.3",
    cipherSuites: ["TLS_AES_256_GCM_SHA384"],
    certificateValidation: "strict"
  }
};
```

### Pencegahan Kebocoran Data
```java
// Implementasi Data Loss Prevention (DLP)
public class PencegahanKebocoranData {

    private final Pattern polaDataSensitif;
    private final LayananAlert layananAlert;

    public PencegahanKebocoranData() {
        // Pola untuk data sensitif
        this.polaDataSensitif = Pattern.compile(
            "(?i)(credit.card|ssn|social.security|password|api.key)"
        );
        this.layananAlert = new LayananAlert();
    }

    public void inspeksiData(String data, String konteks) {
        Matcher matcher = polaDataSensitif.matcher(data);

        if (matcher.find()) {
            // Blok transmisi
            throw new SecurityException("Data sensitif terdeteksi dalam transmisi");

            // Alert tim keamanan
            layananAlert.kirimAlert(new Alert(
                AlertType.DATA_EXFILTRATION_ATTEMPT,
                "Data sensitif terdeteksi: " + matcher.group(),
                konteks
            ));

            // Log insiden
            SecurityLogger.logIncident(
                IncidentType.DATA_LOSS_PREVENTION,
                "Pola data sensitif cocok dalam: " + konteks
            );
        }
    }

    public void scanTrafikKeluar(byte[] data) {
        String content = new String(data, StandardCharsets.UTF_8);
        inspeksiData(content, "trafik_keluar");
    }
}
```

## Testing dan Validasi

### Simulasi Pelanggaran
```bash
#!/bin/bash
# Script simulasi red team

# Function untuk simulasi serangan umum
simulate_attacks() {
    echo "Memulai simulasi pelanggaran..."

    # Percobaan SQL injection
    curl -X POST $TARGET_URL \
         -d "username=admin' OR '1'='1&password="

    # Percobaan XSS
    curl $TARGET_URL/search?q="<script>alert('xss')</script>"

    # Directory traversal
    curl $TARGET_URL/../../../etc/passwd

    # Brute force login
    for i in {1..100}; do
        curl -X POST $TARGET_URL/login \
             -d "username=admin&password=password$i"
    done

    echo "Simulasi pelanggaran selesai"
}

# Function untuk test kapabilitas deteksi
test_detection() {
    echo "Testing sistem deteksi..."

    # Generate trafik mencurigakan
    for i in {1..1000}; do
        curl $TARGET_URL/api/data &
    done

    # Periksa apakah alert terpicu
    alert_count=$(curl $MONITORING_URL/alerts | jq '.alerts | length')

    if [ $alert_count -gt 0 ]; then
        echo "Sistem deteksi berfungsi - $alert_count alert terpicu"
    else
        echo "Peringatan: Tidak ada alert terpicu selama simulasi"
    fi
}
```

### Testing Pemulihan
```yaml
# Testing disaster recovery
testing_pemulihan:
  scenarios:
    - name: "Data Breach"
      trigger: "data_exfiltration_terdeteksi"
      response_time: "5_menit"
      recovery_time: "1_jam"

    - name: "Service Compromise"
      trigger: "unauthorized_access_terdeteksi"
      response_time: "2_menit"
      recovery_time: "30_menit"

    - name: "Infrastructure Breach"
      trigger: "host_compromise_terdeteksi"
      response_time: "1_menit"
      recovery_time: "15_menit"

  validasi_checks:
    - data_integrity_diverifikasi
    - kontrol_keamanan_direstorasi
    - sistem_monitoring_operasional
    - tim_incident_response_dinotify
```

## Tools dan Teknologi

### Tools Deteksi Pelanggaran
- **Sistem SIEM**: Splunk, ELK Stack, Sumo Logic
- **Solusi EDR**: CrowdStrike, Carbon Black, SentinelOne
- **Monitoring Jaringan**: Zeek, Suricata, Wireshark
- **Analisis Perilaku**: Darktrace, Vectra AI

### Platform Respons Insiden
- **Tools SOAR**: IBM Resilient, Palo Alto Cortex XSOAR
- **Sistem Ticketing**: Jira Service Desk, ServiceNow
- **Komunikasi**: Integrasi Slack, Microsoft Teams
- **Dokumentasi**: Confluence, SharePoint

### Testing dan Simulasi
- **Tools Red Team**: Metasploit, Cobalt Strike
- **Vulnerability Scanner**: Nessus, OpenVAS, Qualys
- **Penetration Testing**: Burp Suite, OWASP ZAP

## Tantangan dan Solusi

### Intensif Sumber Daya
**Tantangan**: Monitoring komprehensif membutuhkan sumber daya signifikan
**Solusi**: Prioritaskan aset kritis dan gunakan teknik sampling

### Alert Fatigue
**Tantangan**: Terlalu banyak alert mengurangi efektivitas respons
**Solusi**: Implementasikan korelasi alert dan tuning

### Integrasi Sistem Legacy
**Tantangan**: Sistem lama kekurangan fitur keamanan modern
**Solusi**: Gunakan compensating controls dan strategi migrasi

## Compliance dan Pelaporan

### Kebutuhan Regulasi
- **GDPR**: Notifikasi pelanggaran data dalam 72 jam
- **PCI DSS**: Deteksi dan respons pelanggaran komprehensif
- **HIPAA**: Pelaporan pelanggaran informasi kesehatan terproteksi
- **SOX**: Kontrol data keuangan pelanggaran

### Metrik dan KPI
```javascript
// Metrik kesiapan breach
const metrikBreach = {
  deteksi: {
    meanTimeToDetect: "< 24 jam",
    detectionAccuracy: "> 95%",
    falsePositiveRate: "< 5%"
  },

  respons: {
    meanTimeToRespond: "< 4 jam",
    containmentTime: "< 1 jam",
    recoveryTime: "< 24 jam"
  },

  resilience: {
    systemAvailability: "> 99.9%",
    dataIntegrity: "100%",
    backupRecovery: "< 4 jam"
  }
};
```

## Referensi

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [Microsoft Zero Trust Model](https://www.microsoft.com/en-us/security/blog/2020/04/30/zero-trust-deployment-guide/)
- [AWS Assume Breach Best Practices](https://aws.amazon.com/security/zero-trust/)
- [Google BeyondCorp Security Model](https://cloud.google.com/beyondcorp)