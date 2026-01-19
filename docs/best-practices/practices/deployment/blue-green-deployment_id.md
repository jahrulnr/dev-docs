# Blue-Green Deployment

## Gambaran Umum

Blue-Green Deployment adalah strategi deployment di mana dua lingkungan produksi identik (blue dan green) dijalankan secara paralel. Salah satu lingkungan (misalnya blue) menangani traffic produksi saat ini, sementara yang lain (green) digunakan untuk deploy versi aplikasi baru. Setelah verifikasi, traffic dialihkan ke lingkungan baru, memungkinkan rollback instan jika ada masalah. Pendekatan ini meminimalkan downtime, mengurangi risiko deployment, dan memungkinkan testing di environment yang mirip production.

Berbeda dengan deployment tradisional yang langsung overwrite environment aktif, blue-green menggunakan switching traffic untuk transisi mulus.

## Prinsip Utama

- **Lingkungan Duplikat**: Blue dan green harus identik dalam konfigurasi, data, dan infrastruktur.
- **Traffic Switching**: Gunakan load balancer atau DNS untuk alihkan traffic tanpa downtime.
- **Testing Pre-Switch**: Jalankan automated tests, smoke tests, dan monitoring sebelum switch.
- **Rollback Cepat**: Jika ada issue, switch kembali ke lingkungan lama.
- **Data Consistency**: Pastikan database dan state shared antara blue dan green.

## Workflow Dasar

1. **Persiapan**: Pastikan blue aktif menangani traffic, green idle atau staging.
2. **Deploy ke Green**: Deploy aplikasi baru ke green environment.
3. **Testing**: Jalankan automated tests, integration tests, dan smoke tests di green.
4. **Switch Traffic**: Alihkan load balancer/DNS ke green.
5. **Monitoring**: Pantau metrics (response time, error rate) selama periode grace.
6. **Cleanup**: Jika stabil, decommission blue; jika ada masalah, rollback ke blue.

Contoh workflow sederhana dengan Kubernetes dan Ingress:

```yaml
# Contoh Ingress untuk switch traffic
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: green-service  # Switch ke blue-service jika rollback
            port:
              number: 80
```

## Kesesuaian dengan Strategi Deployment

Blue-Green sangat cocok untuk:

- **Aplikasi Kritis**: Dimana downtime tidak diperbolehkan (e.g., e-commerce, banking).
- **Microservices/Cloud-Native**: Mudah diimplementasi dengan container orchestration seperti Kubernetes.
- **Continuous Delivery**: Mendukung deploy sering dengan risiko rendah.
- **Tim dengan Monitoring Matang**: Membutuhkan observability untuk detect issues post-switch.

Kurang cocok untuk:
- Infrastruktur terbatas (biaya duplikat tinggi).
- Aplikasi monolitik besar dengan state kompleks.
- Environment on-premise tanpa automation tools.

## Contoh Implementasi

### Contoh dengan AWS
- Blue: Auto Scaling Group (ASG) dengan versi lama.
- Green: ASG baru dengan versi baru.
- Gunakan Application Load Balancer (ALB) untuk switch traffic via target groups.

Script sederhana untuk switch:

```bash
# Deploy ke green ASG
aws autoscaling update-auto-scaling-group --auto-scaling-group-name green-asg --launch-template LaunchTemplateId=lt-new-version

# Switch ALB
aws elbv2 modify-listener --listener-arn arn:aws:elasticloadbalancing:... --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...green-tg
```

### Contoh dengan Docker Compose
```yaml
version: '3.8'
services:
  blue:
    image: myapp:v1
    ports:
      - "8080:80"
  green:
    image: myapp:v2
    ports:
      - "8081:80"  # Port berbeda untuk testing
```

Jalankan green, test, lalu update reverse proxy (e.g., Nginx) untuk switch.

## Kelebihan dan Kekurangan

### Kelebihan
- **Zero Downtime**: Switching traffic tanpa interupsi pengguna.
- **Rollback Instan**: Jika ada bug, switch kembali dalam detik.
- **Testing Aman**: Validasi di environment identik production.
- **Risiko Rendah**: Deploy tidak affect traffic aktif sampai switch.
- **Improved Reliability**: Mendorong praktik testing dan monitoring yang baik.

### Kekurangan
- **Biaya Infrastruktur**: Membutuhkan 2x resources (compute, storage, dll.).
- **Kompleksitas Setup**: Membutuhkan automation untuk provisioning dan switch.
- **Data Synchronization**: Tantangan untuk stateful apps dengan database shared.
- **Overhead Maintenance**: Dua environment perlu di-maintain dan update.
- **Tidak untuk Semua Scale**: Mahal untuk apps kecil atau budget terbatas.

## Best Practices

- **Automation**: Gunakan tools seperti Terraform, Ansible, atau CI/CD pipelines untuk provisioning.
- **Monitoring**: Implementasi health checks, metrics, dan alerting pre/post-switch.
- **Gradual Rollout**: Gabungkan dengan canary untuk traffic kecil dulu.
- **Data Backup**: Selalu backup sebelum switch.
- **Team Coordination**: Komunikasi antara dev, ops, dan QA untuk switch.

## Common Pitfalls

- **Configuration Drift**: Blue dan green berbeda konfigurasi, bikin testing tidak akurat.
- **Database Issues**: Jika tidak shared, data divergen bisa bikin masalah.
- **Traffic Leak**: Pastikan semua traffic switch, tidak ada yang stuck di blue.
- **Resource Waste**: Lupa decommission environment lama, biaya membengkak.
- **Testing Inadequate**: Skip smoke tests, bikin issue terdeteksi terlambat.

## Referensi
- Dokumentasi AWS Blue-Green Deployment.
- Artikel Martin Fowler tentang Blue-Green Deployment.
- Buku "Continuous Delivery" oleh Jez Humble dan David Farley.
- Tools: Kubernetes, Docker, AWS ALB, Terraform untuk IaC.