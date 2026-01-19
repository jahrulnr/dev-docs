# Prinsip Fail-Fast

## Gambaran Umum

Prinsip Fail-Fast adalah pendekatan desain yang menekankan deteksi dan pelaporan error secepat mungkin dalam alur eksekusi. Alih-alih melanjutkan dengan state atau data yang tidak valid, sistem segera gagal dan memberikan feedback yang jelas tentang apa yang salah. Ini mencegah kegagalan diam dan masalah cascading yang lebih sulit di-debug.

## Konsep Utama

### Deteksi Dini
- **Validasi Input**: Periksa input di batas sistem
- **Pemeriksaan Startup**: Validasi konfigurasi dan dependensi saat aplikasi start
- **Pemeriksaan Precondition**: Assert asumsi sebelum melanjutkan
- **Pemeriksaan Sanity**: Verifikasi state sistem sebelum operasi kritis

### Kegagalan Segera
- **Tidak Ada Degradasi Diam**: Jangan lanjutkan dengan fungsionalitas yang terdegradasi
- **Pesan Error Jelas**: Berikan informasi error yang actionable
- **Feedback Cepat**: Gagal cepat untuk memungkinkan iterasi cepat
- **Shutdown Terkontrol**: Kegagalan graceful dengan cleanup yang tepat

## Kapan Digunakan

- **API Endpoints**: Validasi parameter request dan autentikasi
- **Service Startup**: Periksa koneksi database, layanan eksternal, konfigurasi
- **Data Processing**: Validasi integritas data sebelum pemrosesan
- **Configuration Loading**: Pastikan semua setting yang diperlukan ada dan valid
- **Integration Points**: Verifikasi kontrak antara komponen sistem

## Contoh Implementasi

### Validasi Input

```javascript
class UserService {
  async createUser(userData) {
    // Fail fast pada input tidak valid
    this.validateUserData(userData);

    // Hanya lanjutkan jika validasi pass
    const user = await this.userRepository.create(userData);
    await this.notificationService.sendWelcomeEmail(user.email);
    return user;
  }

  validateUserData(userData) {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new ValidationError('Alamat email tidak valid');
    }

    if (!userData.password || userData.password.length < 8) {
      throw new ValidationError('Password minimal 8 karakter');
    }

    if (userData.age && (userData.age < 13 || userData.age > 120)) {
      throw new ValidationError('Umur harus antara 13 dan 120');
    }
  }
}
```

### Validasi Startup

```javascript
class Application {
  async start() {
    try {
      // Fail fast selama startup
      await this.validateConfiguration();
      await this.checkDatabaseConnection();
      await this.verifyExternalServices();

      // Hanya start jika semua pemeriksaan pass
      await this.initializeServices();
      console.log('Aplikasi berhasil start');
    } catch (error) {
      console.error('Aplikasi gagal start:', error.message);
      process.exit(1); // Fail fast - jangan start dengan state tidak valid
    }
  }

  async validateConfiguration() {
    const requiredConfig = ['DATABASE_URL', 'JWT_SECRET', 'API_KEY'];

    for (const key of requiredConfig) {
      if (!process.env[key]) {
        throw new Error(`Konfigurasi wajib hilang: ${key}`);
      }
    }
  }

  async checkDatabaseConnection() {
    try {
      await this.database.ping();
    } catch (error) {
      throw new Error('Koneksi database gagal');
    }
  }
}
```

### Circuit Breaker dengan Fail-Fast

```javascript
class ApiClient {
  constructor() {
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.isOpen = false;
  }

  async callApi(endpoint) {
    if (this.isOpen) {
      throw new Error('Circuit breaker terbuka - layanan tidak tersedia');
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Panggilan API gagal: ${response.status}`);
      }

      this.failureCount = 0; // Reset saat sukses
      return response.json();
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.isOpen = true;
        // Bisa set timeout untuk menutup circuit nanti
      }
      throw error;
    }
  }
}
```

## Praktik Terbaik

### Error Handling
- **Exception Spesifik**: Gunakan tipe exception custom untuk kategori error berbeda
- **Pesan Deskriptif**: Sertakan konteks dan saran perbaikan di pesan error
- **Logging**: Log kegagalan dengan detail cukup untuk debugging
- **Monitoring**: Track rate kegagalan dan pola

### Resilience Patterns
- **Circuit Breakers**: Cegah cascading failures di sistem terdistribusi
- **Retries**: Implementasikan exponential backoff untuk transient failures
- **Fallbacks**: Berikan fungsionalitas terdegradasi jika memungkinkan
- **Timeouts**: Set timeout reasonable untuk menghindari operasi hanging

### Testing
- **Negative Testing**: Test skenario kegagalan secara eksplisit
- **Boundary Testing**: Verifikasi behavior di batas input
- **Integration Testing**: Test propagasi kegagalan antar komponen

## Anti-Pattern Umum

- **Silent Failures**: Melanjutkan dengan data atau state tidak valid
- **Generic Errors**: Menggunakan pesan error samar seperti "Ada yang salah"
- **Swallowing Exceptions**: Catch dan ignore exceptions
- **Delayed Failures**: Izinkan state tidak valid propagate sebelum gagal

## Manfaat

- **Debugging Lebih Mudah**: Masalah ditangkap dekat dengan sumbernya
- **Reliability Lebih Baik**: State tidak valid tidak propagate melalui sistem
- **Development Lebih Cepat**: Feedback cepat selama development dan testing
- **User Experience Lebih Baik**: Pesan error jelas membantu user memperbaiki masalah

## Tantangan

- **Trade-off Availability**: Fail-fast agresif mungkin mengurangi availability sistem
- **User Experience**: Kegagalan tiba-tiba bisa mengejutkan untuk user
- **Distributed Systems**: Fail-fast di satu layanan bisa cascade ke yang lain
- **Configuration**: Menentukan apa yang merupakan "fail fast" vs. graceful degradation

## Implementasi di Konteks Berbeda

### Web Applications
- Validasi client-side sebelum API calls
- Validasi server-side dengan response error segera
- Validasi konfigurasi selama deployment

### Microservices
- Health checks selama startup
- Validasi kontrak antar layanan
- Circuit breakers untuk komunikasi inter-service

### Data Processing
- Validasi schema untuk data masuk
- Pemeriksaan preprocessing sebelum komputasi berat
- Terminasi dini untuk dataset tidak valid

## Alat dan Framework

- **Validation Libraries**: Joi, Yup untuk validasi input
- **Assertion Libraries**: Assert, Chai untuk pemeriksaan runtime
- **Circuit Breaker Libraries**: Opossum, Resilience4j
- **Health Check Tools**: Spring Boot Actuator, custom health endpoints

## Referensi

- [Fail-Fast Principle - Wikipedia](https://en.wikipedia.org/wiki/Fail-fast)
- [Defensive Programming](https://en.wikipedia.org/wiki/Defensive_programming)
- [Circuit Breaker Pattern](https://microservices.io/patterns/reliability/circuit-breaker.html)
- [Release It! oleh Michael Nygard](https://www.amazon.com/Release-Design-Deploy-Production-Ready-Software/dp/1680502395)