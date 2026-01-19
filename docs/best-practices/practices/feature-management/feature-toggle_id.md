# Pola Feature Toggle

## Gambaran Umum

Feature Toggle (juga dikenal sebagai Feature Flag atau Feature Switch) adalah teknik yang powerful untuk mengontrol ketersediaan fitur saat runtime tanpa deploy kode baru. Ini memungkinkan deployment yang lebih aman, rollout bertahap, A/B testing, dan rollback cepat.

## Kapan Digunakan

- **Progressive Delivery**: Roll out fitur ke subset pengguna secara bertahap
- **A/B Testing**: Test implementasi fitur berbeda dengan pengguna nyata
- **Dark Launch**: Deploy fitur yang belum terlihat oleh pengguna
- **Emergency Rollback**: Cepat menonaktifkan fitur bermasalah tanpa redeployment
- **Trunk-Based Development**: Aktifkan fitur untuk QA sambil menyembunyikannya dari production

## Tipe Feature Toggle

1. **Release Toggle**: Kontrol rollout fitur yang belum selesai
2. **Experiment Toggle**: Aktifkan A/B testing dan eksperimen
3. **Ops Toggle**: Izinkan kontrol operasional (maintenance mode, dll.)
4. **Permission Toggle**: Kontrol akses fitur berdasarkan permission pengguna

## Contoh Implementasi

### Implementasi Dasar

```javascript
class FeatureToggleService {
  constructor(configService) {
    this.configService = configService;
  }

  isEnabled(featureName, userId = null) {
    const toggle = this.configService.getToggle(featureName);

    if (!toggle.enabled) return false;

    // Periksa rollout berbasis pengguna
    if (toggle.rolloutPercentage && userId) {
      const userHash = this.hashUserId(userId);
      return userHash % 100 < toggle.rolloutPercentage;
    }

    return toggle.enabled;
  }

  hashUserId(userId) {
    // Fungsi hash sederhana untuk distribusi pengguna
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 100;
  }
}

// Penggunaan di aplikasi
class CheckoutService {
  constructor(featureToggleService) {
    this.featureToggleService = featureToggleService;
  }

  async processPayment(orderData, userId) {
    if (this.featureToggleService.isEnabled('newCheckoutFlow', userId)) {
      return this.processWithNewFlow(orderData);
    } else {
      return this.processWithLegacyFlow(orderData);
    }
  }
}
```

### Contoh Konfigurasi

```json
{
  "featureToggles": {
    "newCheckoutFlow": {
      "enabled": true,
      "rolloutPercentage": 25,
      "description": "Proses checkout yang disederhanakan"
    },
    "advancedAnalytics": {
      "enabled": false,
      "rolloutPercentage": 0,
      "description": "Dashboard analitik pengguna lanjutan"
    },
    "maintenanceMode": {
      "enabled": false,
      "description": "Masukkan aplikasi ke mode maintenance"
    }
  }
}
```

## Praktik Terbaik

### Manajemen Toggle
- **Konvensi Penamaan**: Gunakan nama deskriptif seperti `enableNewCheckoutFlow`
- **Dokumentasi**: Dokumentasikan apa yang dikontrol setiap toggle dan kapan menghapusnya
- **Kepemilikan**: Tetapkan tanggung jawab untuk setiap toggle ke tim spesifik

### Panduan Implementasi
- **Nilai Default**: Selalu berikan default aman ketika toggle gagal
- **Performa**: Cache nilai toggle untuk menghindari lookup berulang
- **Testing**: Test kedua state enabled dan disabled dari setiap toggle
- **Monitoring**: Track penggunaan toggle dan dampaknya pada metrik aplikasi

### Manajemen Lifecycle
- **Toggle Jangka Pendek**: Hapus toggle dalam 1-2 minggu setelah rollout penuh
- **Audit Trail**: Log kapan toggle diaktifkan/dinonaktifkan dan oleh siapa
- **Cleanup Bertahap**: Fase out code path lama setelah penghapusan toggle

## Alat dan Framework

- **LaunchDarkly**: Platform manajemen feature flag enterprise
- **Split.io**: Platform feature flag dan eksperimen
- **ConfigCat**: Layanan feature flag yang developer-friendly
- **Unleash**: Platform feature flag open-source
- **FF4J**: Framework feature flag berbasis Java

## Pitfall Umum

- **Hutang Toggle**: Mengakumulasi terlalu banyak toggle yang tidak pernah dihapus
- **Logika Kompleks**: Overusing toggle untuk logika bisnis yang kompleks
- **Masalah Performa**: Tidak cache nilai toggle di aplikasi high-traffic
- **Gap Testing**: Tidak test semua kombinasi toggle secara menyeluruh

## Integrasi dengan CI/CD

```yaml
# Contoh workflow GitHub Actions
name: Feature Toggle Deployment
on: push

jobs:
  deploy:
    steps:
      - name: Deploy ke staging
        run: deploy --environment staging --feature-flags newCheckoutFlow:25

      - name: Jalankan test dengan toggle
        run: |
          test --feature-toggle newCheckoutFlow:enabled
          test --feature-toggle newCheckoutFlow:disabled

      - name: Rollout bertahap
        run: |
          deploy --environment prod --feature-flags newCheckoutFlow:10
          sleep 3600
          deploy --environment prod --feature-flags newCheckoutFlow:25
```

## Referensi

- [Feature Toggles (aka Feature Flags)](https://martinfowler.com/articles/feature-toggles.html)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/feature-flags/)
- [Continuous Delivery: Reliable Software Releases](https://www.amazon.com/Continuous-Delivery-Deployment-Automation-Addison-Wesley/dp/0321601912)