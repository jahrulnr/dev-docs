# Rolling Deployment

## Gambaran Umum

Rolling Deployment adalah strategi deployment di mana instances aplikasi diupdate secara bertahap, satu per satu atau dalam batch kecil, tanpa menghentikan seluruh sistem. Versi baru digulirkan ke subset instances sambil versi lama tetap berjalan, meminimalkan downtime dan risiko. Pendekatan ini cocok untuk aplikasi yang toleran terhadap mixed versions selama transisi.

Berbeda dengan blue-green yang switch semua traffic sekaligus, rolling update instances incrementally untuk availability tinggi.

## Prinsip Utama

- **Incremental Updates**: Update instances dalam batch kecil (e.g., 10-25% sekaligus).
- **Zero Downtime**: Traffic tetap dilayani selama update.
- **Health Checks**: Pastikan instance baru healthy sebelum lanjut.
- **Rollback Cepat**: Jika ada issue, stop rollout dan revert.
- **Load Balancing**: Distribusi traffic otomatis selama update.

## Workflow Dasar

1. **Persiapan**: Siapkan versi baru di registry/container.
2. **Batch Update**: Update batch pertama (e.g., 20% instances), tunggu healthy.
3. **Traffic Shift**: Load balancer arahkan traffic ke instances baru.
4. **Iterasi**: Ulangi untuk batch berikutnya sampai 100%.
5. **Monitoring**: Pantau metrics selama dan setelah rollout.
6. **Cleanup**: Remove instances lama jika sukses.

Contoh workflow sederhana dengan Kubernetes Deployment:

```yaml
# Contoh Rolling Update di Kubernetes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # Maksimal 1 instance down
      maxSurge: 1        # Maksimal 1 instance extra
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2  # Update image
```

## Kesesuaian dengan Strategi Deployment

Rolling sangat cocok untuk:

- **Aplikasi Stateless**: Dimana instances independen.
- **Microservices/Containers**: Mudah di-orchestrate dengan Kubernetes/Docker Swarm.
- **Continuous Deployment**: Mendukung deploy sering tanpa downtime.
- **Resource-Constrained Environments**: Tidak butuh duplikasi infrastruktur.

Kurang cocok untuk:
- Aplikasi stateful dengan data kompleks.
- Sistem monolitik yang sulit di-scale.
- Requirements zero-downtime absolut (gunakan blue-green).

## Contoh Implementasi

### Contoh dengan AWS ECS
Gunakan Rolling Update di ECS Service.

```bash
# Update service dengan rolling strategy
aws ecs update-service --cluster my-cluster --service my-service --task-definition new-task-def --deployment-configuration maximumPercent=200,minimumHealthyPercent=50
```

50% minimum healthy, 200% max untuk rolling.

### Contoh dengan Docker Compose
```yaml
version: '3.8'
services:
  app:
    image: myapp:v2
    deploy:
      update_config:
        parallelism: 1  # Update 1 container at a time
        delay: 10s      # Delay between updates
```

## Kelebihan dan Kekurangan

### Kelebihan
- **No Downtime**: Availability selama update.
- **Resource Efficient**: Tidak perlu duplikasi environment.
- **Simple Setup**: Mudah implementasi di orchestration tools.
- **Gradual Rollout**: Deteksi issue dini per batch.
- **Cost Effective**: Minimal infrastruktur tambahan.

### Kekurangan
- **Mixed Versions**: Risiko incompatibility antara versi lama/baru.
- **Slower Rollout**: Lebih lama dari blue-green untuk full update.
- **Monitoring Intensive**: Perlu watch setiap batch.
- **Not for Critical Updates**: Jika ada bug besar, rollback sulit.
- **Dependency on Health Checks**: Jika checks lemah, issue terlewat.

## Best Practices

- **Small Batches**: Mulai dengan 10-20% untuk minimize risk.
- **Health Checks**: Implementasi readiness/liveness probes.
- **Monitoring**: Gunakan tools seperti Prometheus untuk metrics.
- **Canary First**: Gabungkan dengan canary untuk testing awal.
- **Automation**: Script atau CI/CD untuk automate rollout.

## Common Pitfalls

- **Ignoring Health Checks**: Update lanjut tanpa verifikasi.
- **Large Batches**: Risiko downtime jika batch terlalu besar.
- **State Issues**: Data inconsistency selama mixed versions.
- **No Rollback Plan**: Sulit revert jika ada masalah besar.
- **Over-Reliance**: Tidak cocok untuk semua scenarios.

## Referensi
- Dokumentasi Kubernetes Rolling Updates.
- AWS ECS Deployment Strategies.
- Buku "Site Reliability Engineering" oleh Google.
- Tools: Kubernetes, Docker Swarm, AWS ECS.