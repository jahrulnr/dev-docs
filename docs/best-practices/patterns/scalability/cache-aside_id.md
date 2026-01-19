# Pola Cache-Aside

## Gambaran Umum

Pola Cache-Aside adalah strategi caching di mana kode aplikasi secara eksplisit mengelola populasi dan invalidasi cache. Data dimuat ke cache sesuai permintaan - ketika data yang diminta tidak ada di cache, data diambil dari sumber data dan disimpan di cache untuk permintaan masa depan.

## Cara Kerja

1. **Operasi Baca**:
   - Aplikasi memeriksa cache untuk data yang diminta
   - Jika data ada (cache hit), kembalikan segera
   - Jika data tidak ada (cache miss), ambil dari database
   - Simpan data yang diambil di cache dan kembalikan

2. **Operasi Tulis**:
   - Update database terlebih dahulu
   - Invalidate atau update entry cache yang sesuai
   - Opsional, update cache segera atau biarkan lazy-loaded

## Kapan Digunakan

- **Beban baca tinggi**: Aplikasi dengan rasio baca-tulis tinggi
- **Pola akses dapat diprediksi**: Data diakses secara sering oleh banyak pengguna
- **Cache miss dapat diterima**: Di mana hit database sesekali dapat ditoleransi
- **Invalidasi sederhana**: Ketika logika invalidasi cache mudah

## Contoh Implementasi

### Implementasi Dasar

```javascript
class CacheAsideService {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }

  async getUser(userId) {
    // Cek cache terlebih dahulu
    const cachedUser = await this.cache.get(`user:${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Cache miss - ambil dari database
    const user = await this.database.getUser(userId);
    if (user) {
      // Isi cache untuk permintaan masa depan
      await this.cache.set(`user:${userId}`, JSON.stringify(user), 3600); // TTL 1 jam
    }

    return user;
  }

  async updateUser(userId, userData) {
    // Update database terlebih dahulu
    await this.database.updateUser(userId, userData);

    // Invalidate cache - baca berikutnya akan mengambil data segar
    await this.cache.delete(`user:${userId}`);

    // Alternatif: Update cache segera
    // await this.cache.set(`user:${userId}`, JSON.stringify(userData), 3600);
  }
}
```

### Implementasi Lanjutan dengan Error Handling

```javascript
class ResilientCacheAsideService {
  constructor(cache, database, metrics) {
    this.cache = cache;
    this.database = database;
    this.metrics = metrics;
  }

  async getUser(userId) {
    try {
      // Cek cache
      const cachedUser = await this.cache.get(`user:${userId}`);
      if (cachedUser) {
        this.metrics.increment('cache_hit');
        return JSON.parse(cachedUser);
      }

      this.metrics.increment('cache_miss');

      // Ambil dari database
      const user = await this.database.getUser(userId);
      if (user) {
        // Cache dengan error handling
        try {
          await this.cache.set(`user:${userId}`, JSON.stringify(user), 3600);
        } catch (cacheError) {
          // Log error cache tapi jangan gagal request
          console.error('Cache write failed:', cacheError);
        }
      }

      return user;
    } catch (error) {
      this.metrics.increment('cache_error');
      throw error;
    }
  }
}
```

## Strategi Invalidasi Cache

### Ekspirasi Berbasis Waktu (TTL)
- Set waktu ekspirasi untuk entry cache
- Sederhana tapi mungkin serve data stale
- Baik untuk data yang relatif statis

### Write-Through
- Update cache segera ketika data berubah
- Memastikan konsistensi cache tapi meningkatkan latensi tulis
- Baik untuk data yang sering diupdate

### Write-Behind
- Update cache secara asinkron setelah tulis database
- Meningkatkan performa tulis tapi risiko inkonsistensi data
- Baik untuk skenario high-write

## Praktik Terbaik

### Desain Cache Key
- Gunakan konvensi penamaan konsisten: `entity:id` atau `entity:id:field`
- Sertakan nomor versi untuk evolusi cache key
- Hindari karakter spesial di key

### Error Handling
- Kegagalan cache tidak boleh merusak fungsionalitas aplikasi
- Implementasikan circuit breaker untuk ketidaktersediaan layanan cache
- Log error cache untuk monitoring

### Monitoring dan Metrics
- Track rasio cache hit/miss
- Monitor penggunaan memori cache
- Alert pada error rate tinggi

### Pertimbangan Performa
- Gunakan nilai TTL yang sesuai berdasarkan volatilitas data
- Pertimbangkan cache warming untuk data kritis
- Implementasikan kompresi cache untuk objek besar

## Pitfall Umum

- **Cache Stampede**: Beberapa request untuk data yang sama yang hilang
- **Stale Data**: Serve informasi yang kedaluwarsa
- **Memory Leaks**: Tidak properly expire entry lama
- **Thundering Herd**: Mass cache miss menyebabkan overload database

## Alat dan Framework

- **Redis**: High-performance in-memory data structure store
- **Memcached**: Distributed memory object caching system
- **Caffeine**: Java in-process caching library
- **Ehcache**: Enterprise-grade caching solution

## Perbandingan dengan Pola Lain

| Pola | Kapan Digunakan | Kelebihan | Kekurangan |
|------|-----------------|-----------|------------|
| Cache-Aside | Baca tinggi, invalidasi sederhana | Sederhana, kontrol eksplisit | Cache miss tambah latensi |
| Read-Through | Cache sebagai sumber data primer | Caching transparan | Kontrol populasi kurang |
| Write-Through | Konsistensi kuat dibutuhkan | Selalu konsisten | Latensi tulis lebih tinggi |
| Write-Behind | Throughput tulis tinggi | Performa lebih baik | Potensi inkonsistensi |

## Referensi

- [Cache-Aside Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Caching Patterns](https://microservices.io/patterns/data/caching.html)
- [Redis Caching Strategies](https://redis.io/topics/caching)
- [Designing Data-Intensive Applications oleh Martin Kleppmann](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)