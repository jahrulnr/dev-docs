# Trunk-Based Development

## Gambaran Umum

Trunk-Based Development (TBD) adalah metodologi branching di mana semua pengembang bekerja secara langsung atau dengan branch jangka pendek yang sering di-merge ke branch utama (trunk atau main). Pendekatan ini mendorong integrasi kode yang kecil, sering, dan otomatis, didukung oleh feature flags untuk mengontrol fitur yang belum siap dirilis. TBD mengurangi kompleksitas merge konflik, mempercepat feedback loop, dan memungkinkan continuous integration/continuous delivery (CI/CD) yang efektif.

Berbeda dengan model branching tradisional seperti Git Flow yang menggunakan branch panjang untuk fitur, TBD menjaga trunk selalu dalam kondisi releasable, sehingga tim dapat deploy kapan saja.

## Prinsip Utama

- **Branch Jangka Pendek**: Branch fitur dibuat hanya untuk beberapa jam atau hari, lalu segera di-merge.
- **Integrasi Harian**: Kode di-merge minimal sekali sehari untuk menghindari divergensi besar.
- **Feature Flags**: Gunakan toggles untuk menyembunyikan fitur yang belum selesai dari production.
- **Automated Testing**: CI/CD pipeline yang kuat untuk memvalidasi setiap merge.
- **Kultur Kolaborasi**: Komunikasi intensif antar tim untuk menghindari konflik.

## Workflow Dasar

1. **Pull dari Trunk**: Selalu mulai dari trunk terbaru.
2. **Buat Branch Fitur**: Jika diperlukan, buat branch lokal (e.g., `feature/user-auth`).
3. **Develop dan Test**: Tulis kode, commit sering, dan jalankan test lokal.
4. **Merge ke Trunk**: Push dan buat pull request; merge setelah review dan CI pass.
5. **Deploy**: Trunk selalu siap deploy via CI/CD.

Contoh workflow sederhana dengan Git:

```bash
# Pull latest trunk
git checkout main
git pull origin main

# Create feature branch (optional for small changes)
git checkout -b feature/add-login

# Develop and commit
git add .
git commit -m "Add login functionality"

# Push and create PR
git push origin feature/add-login

# After review, merge to main
git checkout main
git merge feature/add-login
```

## Kesesuaian dengan Metodologi Development

TBD sangat cocok untuk metodologi yang menekankan kecepatan dan iterasi cepat:

- **Agile/Scrum**: Mendukung sprint pendek dengan delivery incremental. Tim dapat release fitur kecil setiap sprint tanpa menunggu branch besar selesai.
- **Continuous Delivery**: Ideal untuk CD karena trunk selalu releasable. Kombinasi TBD + CD memungkinkan deploy harian atau bahkan multiple times per hari.
- **DevOps Culture**: Mendorong kolaborasi antara dev, ops, dan QA. CI/CD menjadi backbone untuk automasi.
- **Microservices/Cloud-Native**: Cocok untuk tim yang deploy sering; feature flags membantu A/B testing dan canary releases.

Kurang cocok untuk:
- Tim besar dengan koordinasi rendah (risiko konflik tinggi).
- Proyek dengan release jarang atau waterfall model.
- Sistem legacy tanpa CI/CD matang.

## Contoh Implementasi

### Contoh di Tim Agile
Tim menggunakan Scrum dengan sprint 2 minggu. Setiap hari, developer merge kode ke trunk. Feature flags digunakan untuk fitur eksperimental. Pada akhir sprint, trunk di-deploy ke staging, lalu production jika stabil.

### Contoh dengan Feature Flags
```javascript
// Contoh sederhana feature flag di kode
const isNewFeatureEnabled = process.env.FEATURE_NEW_UI === 'true';

if (isNewFeatureEnabled) {
  // Kode fitur baru
  renderNewUI();
} else {
  // Kode lama
  renderOldUI();
}
```

Flag ini dikontrol via environment variables atau service seperti LaunchDarkly.

## Kelebihan dan Kekurangan

### Kelebihan
- **Kecepatan Delivery**: Merge sering mengurangi risiko dan mempercepat feedback.
- **Kurangi Konflik Merge**: Branch pendek menghindari divergensi besar.
- **Continuous Integration**: Memaksa praktik CI yang baik.
- **Fleksibilitas Release**: Feature flags memungkinkan deploy tanpa expose fitur.
- **Kolaborasi Lebih Baik**: Tim lebih terintegrasi, kurangi silo.

### Kekurangan
- **Disiplin Tinggi**: Membutuhkan komitmen untuk merge sering dan test menyeluruh.
- **CI/CD Wajib**: Tanpa pipeline kuat, trunk bisa unstable.
- **Kompleksitas Feature Flags**: Overhead management flags jika terlalu banyak.
- **Tidak Cocok Semua Tim**: Sulit untuk tim yang belum matang dalam agile atau CI/CD.
- **Risiko Rollback**: Jika ada bug besar, rollback bisa lebih kompleks.

## Best Practices

- **Pair Programming/Review**: Selalu review kode sebelum merge.
- **Automated Tests**: Minimum 80% coverage, termasuk integration tests.
- **Monitoring**: Gunakan tools seperti Sentry atau New Relic untuk detect issues post-deploy.
- **Branch Naming**: Gunakan konvensi seperti `feature/`, `bugfix/`, `hotfix/`.
- **Limit Branch Lifetime**: Maksimal 1-2 hari untuk branch fitur.
- **Education**: Latih tim tentang TBD dan feature flags.

## Common Pitfalls

- **Trunk Unstable**: Jika CI lemah, merge buruk bisa break trunk.
- **Feature Flag Debt**: Lupa remove flags lama, bikin kode kompleks.
- **Resistance to Change**: Tim terbiasa Git Flow mungkin resisten.
- **Over-reliance on Flags**: Jangan gunakan flags untuk hide bad code.

## Referensi
- Buku "Accelerate" oleh Nicole Forsgren et al. (tentang DevOps metrics).
- Artikel Paul Hammant tentang Trunk-Based Development.
- Dokumentasi GitHub Flow dan praktik CI/CD modern.
- Tools: Git, GitHub/GitLab, Jenkins/CircleCI, LaunchDarkly untuk feature flags.