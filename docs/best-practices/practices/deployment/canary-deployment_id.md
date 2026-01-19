# Canary Deployment

## Gambaran Umum

Canary Deployment adalah strategi deployment yang menggulirkan perubahan secara bertahap ke subset kecil pengguna atau instance untuk mendeteksi masalah sebelum rilis penuh. Pendekatan ini meminimalkan risiko dengan menguji fitur baru di lingkungan produksi secara terkontrol, memungkinkan rollback cepat jika ada regresi. Berbeda dengan blue-green yang switch semua traffic sekaligus, canary menggunakan persentase traffic untuk testing incremental.

Ini bagian dari progressive delivery, yang menggabungkan canary dengan feature flags dan monitoring untuk deployment yang lebih aman.

## Prinsip Utama

- **Incremental Rollout**: Mulai dari persentase kecil (e.g., 5%), tingkatkan bertahap berdasarkan metrics.
- **Monitoring Intensif**: Pantau error rates, response times, dan user feedback secara real-time.
- **Automated Rollback**: Jika thresholds terlampaui, otomatis rollback ke versi lama.
- **Traffic Routing**: Gunakan load balancer atau service mesh untuk kontrol traffic.
- **Gradual Exposure**: Tingkatkan exposure berdasarkan confidence dari testing.

## Workflow Dasar

1. **Persiapan**: Siapkan versi baru di environment staging atau paralel.
2. **Deploy Awal**: Gulirkan ke subset kecil (canary group), e.g., 5% traffic.
3. **Monitoring**: Pantau KPIs selama periode observasi (e.g., 10-30 menit).
4. **Evaluasi**: Jika metrics baik, tingkatkan persentase (10%, 25%, 50%, 100%).
5. **Full Rollout atau Rollback**: Jika stabil, lanjut ke 100%; jika ada issue, rollback.
6. **Cleanup**: Setelah sukses, decommission canary instances.

Contoh workflow sederhana dengan Kubernetes dan Istio:

```yaml
# Contoh VirtualService untuk canary routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-vs
spec:
  http:
  - route:
    - destination:
        host: myapp
        subset: v1  # Versi lama
      weight: 95
    - destination:
        host: myapp
        subset: v2  # Canary versi baru
      weight: 5
```

## Kesesuaian dengan Strategi Deployment

Canary sangat cocok untuk:

- **Aplikasi High-Traffic**: Dimana testing penuh sulit direplikasi.
- **Continuous Deployment**: Mendukung deploy sering dengan risiko rendah.
- **User-Facing Features**: Untuk validasi UX dan performance di real users.
- **Microservices**: Mudah diimplementasi per service.

Kurang cocok untuk:
- Sistem monolitik besar tanpa traffic control.
- Environment tanpa monitoring matang.
- Perubahan infrastruktur (bukan aplikasi), karena sulit rollback.

## Contoh Implementasi

### Contoh dengan AWS
- Gunakan AWS Lambda dengan weighted routing atau ALB untuk canary.
- Blue: Versi lama, Green: Versi baru sebagai canary.

Script sederhana:

```bash
# Update Lambda alias weights
aws lambda update-alias --function-name myfunction --name prod --routing-config AdditionalVersionWeights={2=0.05}  # 5% ke v2
```

Pantau dengan CloudWatch.

### Contoh dengan Docker dan Nginx
```nginx
# Upstream untuk load balancing
upstream backend {
    server old-app:80 weight=95;
    server new-app:80 weight=5;  # Canary
}
```

Update weights secara bertahap.

## Kelebihan dan Kekurangan

### Kelebihan
- **Risiko Rendah**: Masalah terdeteksi dini dengan exposure kecil.
- **Real User Testing**: Validasi di production environment.
- **Gradual Rollout**: Mungkin rollback parsial jika diperlukan.
- **Improved Confidence**: Metrics-driven decisions.
- **Faster Feedback**: Deteksi regresi sebelum full impact.

### Kekurangan
- **Kompleksitas Monitoring**: Membutuhkan alerting dan observability yang kuat.
- **Traffic Control Overhead**: Sulit diimplementasi tanpa tools seperti Istio atau ALB.
- **Delayed Full Rollout**: Proses bertahap memakan waktu.
- **Data Consistency Issues**: Jika stateful, bisa bikin masalah antara versi.
- **Cost for Monitoring**: Overhead tools dan resources.

## Best Practices

- **Define Metrics**: Tetapkan thresholds untuk error rate, latency, dll.
- **Automated Rollback**: Implementasi circuit breakers atau automated scripts.
- **A/B Testing Integration**: Gabungkan dengan feature flags untuk user segmentation.
- **Gradual Increases**: Jangan loncat drastis; gunakan increments kecil.
- **Team Alerts**: Notifikasi real-time ke dev/ops saat thresholds breach.

## Common Pitfalls

- **Insufficient Monitoring**: Tanpa metrics baik, masalah terlewat.
- **Too Small Canary**: Jika 1%, masalah besar mungkin tidak terdeteksi.
- **Ignoring User Feedback**: Fokus metrics teknis, lupakan UX issues.
- **Manual Overrides**: Jangan force rollout tanpa data.
- **State Mismatch**: Versi lama dan baru berinteraksi dengan data berbeda.

## Referensi
- Dokumentasi Istio tentang Traffic Management.
- Artikel Google tentang Progressive Delivery.
- Buku "Site Reliability Engineering" oleh Google.
- Tools: Kubernetes/Istio, AWS ALB, LaunchDarkly untuk feature flags.