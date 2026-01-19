# Recreate Deployment

## Gambaran Umum

Recreate Deployment adalah strategi deployment paling sederhana di mana semua instances aplikasi lama dihentikan terlebih dahulu, lalu instances baru dijalankan. Pendekatan ini memastikan tidak ada mixed versions, tapi menyebabkan downtime selama transisi. Cocok untuk environment development atau aplikasi yang toleran downtime singkat.

Berbeda dengan rolling atau blue-green, recreate tidak mempertahankan availability selama update.

## Prinsip Utama

- **Shutdown First**: Stop semua instances lama sebelum start yang baru.
- **Clean Slate**: Tidak ada overlap antara versi lama dan baru.
- **Simple Execution**: Mudah diimplementasi tanpa tools kompleks.
- **Full Replacement**: Semua instances update sekaligus.
- **Downtime Expected**: Plan untuk maintenance window.

## Workflow Dasar

1. **Persiapan**: Backup data jika diperlukan.
2. **Shutdown**: Stop semua instances lama.
3. **Deploy Baru**: Jalankan instances dengan versi baru.
4. **Verification**: Test aplikasi baru.
5. **Traffic Restore**: Arahkan traffic kembali jika diperlukan.

Contoh workflow sederhana dengan Docker:

```bash
# Shutdown lama
docker stop $(docker ps -q --filter ancestor=myapp:v1)

# Run baru
docker run -d -p 80:80 myapp:v2
```

## Kesesuaian dengan Strategi Deployment

Recreate cocok untuk:

- **Development/Staging**: Dimana downtime tidak kritikal.
- **Simple Apps**: Aplikasi monolitik tanpa high availability needs.
- **Maintenance Windows**: Saat scheduled downtime diperbolehkan.
- **Low-Traffic Systems**: Impact downtime minimal.

Kurang cocok untuk:
- Production dengan SLA tinggi.
- Apps yang require 24/7 availability.
- Microservices dengan dependencies kompleks.

## Contoh Implementasi

### Contoh dengan Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    type: Recreate  # No rolling, full recreate
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2
```

### Contoh dengan AWS EC2
Gunakan script untuk terminate dan launch baru.

```bash
# Terminate instances lama
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0

# Launch baru
aws ec2 run-instances --image-id ami-12345678 --count 1 --instance-type t2.micro
```

## Kelebihan dan Kekurangan

### Kelebihan
- **Simple**: Tidak perlu orchestration kompleks.
- **Clean Deployment**: Tidak ada mixed versions.
- **Resource Efficient**: Tidak butuh extra instances.
- **Fast for Small Apps**: Cepat untuk deployments kecil.
- **No Compatibility Issues**: Versi lama fully replaced.

### Kekurangan
- **Downtime**: Sistem offline selama update.
- **Risky**: Jika deploy gagal, full outage.
- **Not Scalable**: Sulit untuk large systems.
- **User Impact**: Pengguna terpengaruh selama downtime.
- **No Gradual Rollout**: All-or-nothing approach.

## Best Practices

- **Schedule Maintenance**: Lakukan di low-traffic hours.
- **Backup First**: Selalu backup sebelum shutdown.
- **Quick Verification**: Test cepat post-deploy.
- **Fallback Plan**: Siapkan rollback jika gagal.
- **Monitor Closely**: Watch logs selama startup.

## Common Pitfalls

- **Unexpected Downtime**: Durasi lebih lama dari expected.
- **Data Loss**: Lupa backup stateful data.
- **Startup Failures**: Instances baru gagal start.
- **No Monitoring**: Tidak detect issues selama downtime.
- **Overuse**: Digunakan di production tanpa plan.

## Referensi
- Kubernetes Deployment Strategies.
- AWS EC2 Instance Management.
- Buku "Continuous Delivery" oleh Jez Humble.
- Tools: Docker, Kubernetes, AWS CLI.