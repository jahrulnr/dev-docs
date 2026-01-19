# Teorema CAP

## Gambaran Umum

Teorema CAP, yang dirumuskan oleh Eric Brewer pada tahun 2000, menyatakan bahwa dalam sistem terdistribusi, tidak mungkin secara simultan menjamin ketiga properti berikut:

- **Konsistensi**: Semua node melihat data yang sama pada waktu yang bersamaan
- **Ketersediaan**: Setiap permintaan menerima respons (tidak harus data terbaru)
- **Toleransi Partisi**: Sistem terus beroperasi meskipun ada partisi jaringan

Ketika partisi jaringan terjadi, sistem terdistribusi harus memilih antara konsistensi dan ketersediaan. Teorema ini memberikan kerangka kerja fundamental untuk memahami trade-off dalam desain sistem terdistribusi dan membantu arsitek membuat keputusan yang tepat tentang arsitektur sistem berdasarkan kebutuhan bisnis.

## Konsep Inti

### Tiga Properti CAP

#### Konsistensi (C)
- **Definisi**: Semua node dalam sistem melihat data yang sama secara simultan
- **Konsistensi Kuat**: Linearizability - operasi tampak terjadi dalam urutan global tunggal
- **Konsistensi Lemah**: Konsistensi eventual atau kausal
- **Trade-off**: Mungkin memerlukan pengorbanan ketersediaan selama partisi

#### Ketersediaan (A)
- **Definisi**: Setiap permintaan ke node yang tidak gagal menerima respons
- **Ketersediaan Tinggi**: Sistem tetap responsif bahkan selama kegagalan
- **Pola Ketersediaan**: Load balancing, redundansi, failover
- **Trade-off**: Mungkin mengizinkan data yang stale atau tidak konsisten selama partisi

#### Toleransi Partisi (P)
- **Definisi**: Sistem terus berfungsi meskipun ada partisi jaringan
- **Partisi Jaringan**: Kehilangan komunikasi sementara antara node
- **Skenario Partisi**: Kegagalan jaringan, crash node, kehilangan pesan
- **Realitas**: Partisi jaringan tidak dapat dihindari dalam sistem terdistribusi

### Trade-off CAP

#### Sistem CP (Konsistensi + Toleransi Partisi)
- **Karakteristik**: Mengorbankan ketersediaan untuk konsistensi
- **Contoh**: RDBMS tradisional, HBase, MongoDB (dapat dikonfigurasi)
- **Kasus Penggunaan**: Sistem keuangan, manajemen inventori
- **Perilaku**: Selama partisi, sistem menjadi tidak tersedia untuk menjaga konsistensi

#### Sistem AP (Ketersediaan + Toleransi Partisi)
- **Karakteristik**: Mengorbankan konsistensi untuk ketersediaan
- **Contoh**: Cassandra, DynamoDB, CouchDB
- **Kasus Penggunaan**: Jaringan sosial, pengiriman konten, IoT
- **Perilaku**: Sistem tetap tersedia tetapi mungkin mengembalikan data yang stale

#### Sistem CA (Konsistensi + Ketersediaan)
- **Karakteristik**: Mengorbankan toleransi partisi
- **Contoh**: Database single-node, sistem tightly-coupled
- **Realitas**: Tidak mungkin dalam sistem terdistribusi dengan partisi jaringan
- **Keterbatasan**: Rentan terhadap kegagalan jaringan

## Strategi Implementasi

### Memilih Properti CAP

```javascript
// Kerangka keputusan CAP
class ArsitekSistem {

  static pilihStrategiCAP(kebutuhan) {
    const { prioritasKonsistensi, prioritasKetersediaan, toleransiPartisi } = kebutuhan;

    // Sistem keuangan sering memprioritaskan konsistensi
    if (prioritasKonsistensi > 0.8) {
      return {
        strategi: 'CP',
        contoh: ['PostgreSQL', 'MySQL Cluster'],
        tradeoffs: 'Mungkin menjadi tidak tersedia selama partisi'
      };
    }

    // Media sosial memprioritaskan ketersediaan
    if (prioritasKetersediaan > 0.8) {
      return {
        strategi: 'AP',
        contoh: ['Cassandra', 'DynamoDB'],
        tradeoffs: 'Mungkin mengembalikan data yang stale selama partisi'
      };
    }

    // Kebanyakan sistem terdistribusi membutuhkan toleransi partisi
    return {
      strategi: 'AP_ATAU_CP',
      contoh: ['Kubernetes', 'Microservices'],
      tradeoffs: 'Pilih berdasarkan kasus penggunaan spesifik'
    };
  }
}

// Penggunaan
const sistemPerbankan = ArsitekSistem.pilihStrategiCAP({
  prioritasKonsistensi: 0.9,
  prioritasKetersediaan: 0.7,
  toleransiPartisi: 0.8
});
// Mengembalikan: { strategi: 'CP', contoh: [...], tradeoffs: '...' }
```

### Implementasi Sistem CP

```java
// Contoh sistem CP - Transfer bank dengan konsistensi kuat
public class LayananTransferBank {

    private final DistributedLockManager lockManager;
    private final AccountRepository accountRepo;

    public HasilTransfer transferUang(TransferRequest request) {
        // Dapatkan distributed lock untuk kedua akun
        String lockKey = getTransferLockKey(request.getFromAccount(), request.getToAccount());

        try {
            if (!lockManager.acquireLock(lockKey, Duration.ofSeconds(30))) {
                throw new TransferException("Tidak dapat mendapatkan lock transfer");
            }

            // Periksa saldo dengan konsistensi kuat
            Account fromAccount = accountRepo.findById(request.getFromAccount());
            if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
                throw new InsufficientFundsException();
            }

            // Lakukan transfer secara atomik
            accountRepo.updateBalance(request.getFromAccount(),
                fromAccount.getBalance().subtract(request.getAmount()));
            accountRepo.updateBalance(request.getToAccount(),
                accountRepo.findById(request.getToAccount()).getBalance().add(request.getAmount()));

            return HasilTransfer.berhasil();

        } catch (Exception e) {
            // Rollback jika gagal
            return HasilTransfer.gagal(e.getMessage());
        } finally {
            lockManager.releaseLock(lockKey);
        }
    }
}
```

### Implementasi Sistem AP

```javascript
// Contoh sistem AP - Post media sosial dengan konsistensi eventual
public class LayananMediaSosial {

    private final EventStore eventStore;
    private final ReadModelUpdater readModelUpdater;

    public HasilPost buatPost(CreatePostRequest request) {
        try {
            // Generate event
            PostCreatedEvent event = new PostCreatedEvent(
                UUID.randomUUID().toString(),
                request.getUserId(),
                request.getContent(),
                Instant.now()
            );

            // Simpan event (selalu berhasil jika partisi mengizinkan)
            eventStore.append(event);

            // Update read models secara asynchronous
            CompletableFuture.runAsync(() ->
                readModelUpdater.updatePostReadModel(event)
            );

            // Kembalikan sukses segera
            return HasilPost.berhasil(event.getPostId());

        } catch (Exception e) {
            // Tangani kegagalan sementara
            if (isTemporaryFailure(e)) {
                return HasilPost.retry();
            }
            return HasilPost.gagal(e.getMessage());
        }
    }

    public Post getPost(String postId) {
        // Mungkin mengembalikan data yang stale, tetapi sistem tetap tersedia
        return postReadModel.findById(postId);
    }
}
```

### Pendekatan Hibrid

```javascript
// Pendekatan CAP hibrid - Konsistensi yang dapat disesuaikan
public class LayananKonsistensiTunable {

    private final DatabaseClient strongConsistencyClient;
    private final DatabaseClient eventualConsistencyClient;

    public HasilData getData(String key, ConsistencyLevel level) {
        switch (level) {
            case STRONG:
                // Gunakan penyimpanan CP untuk data kritis
                return strongConsistencyClient.get(key);

            case EVENTUAL:
                // Gunakan penyimpanan AP untuk data non-kritis
                return eventualConsistencyClient.get(key);

            case HYBRID:
                // Coba konsistensi kuat, fallback ke eventual
                try {
                    return strongConsistencyClient.get(key);
                } catch (UnavailableException e) {
                    return eventualConsistencyClient.get(key);
                }

            default:
                return eventualConsistencyClient.get(key);
        }
    }
}
```

## CAP dalam Praktik

### Contoh Dunia Nyata

#### Sistem Perbankan (CP)
```sql
-- Sistem perbankan dengan kebutuhan konsistensi kuat
BEGIN TRANSACTION;

-- Periksa saldo dengan isolasi serializable
SELECT balance FROM accounts WHERE id = ? FOR UPDATE;

-- Pastikan dana cukup
IF balance >= ? THEN
    -- Kurangi dari sumber
    UPDATE accounts SET balance = balance - ? WHERE id = ?;

    -- Tambahkan ke tujuan
    UPDATE accounts SET balance = balance + ? WHERE id = ?;

    COMMIT;
ELSE
    ROLLBACK;
END IF;
```

#### Media Sosial (AP)
```javascript
// Timeline media sosial dengan konsistensi eventual
class LayananTimeline {

  async postKeTimeline(userId, postId) {
    // Tulis ke multiple region secara asynchronous
    const regions = ['us-east', 'eu-west', 'ap-south'];

    const writePromises = regions.map(region =>
      writeToRegion(region, userId, postId)
        .catch(error => {
          // Log tetapi jangan gagal - konsistensi eventual
          console.warn(`Gagal menulis ke ${region}:`, error);
          return null;
        })
    );

    // Tunggu mayoritas tetapi jangan semua
    await Promise.allSettled(writePromises);

    return { success: true, eventualConsistency: true };
  }

  async getTimeline(userId) {
    // Baca dari region terdekat - mungkin stale
    const localRegion = getLocalRegion();
    return await readFromRegion(localRegion, userId);
  }
}
```

#### E-commerce (Hibrid)
```java
// E-commerce dengan strategi CAP hibrid
public class LayananEcommerce {

    // Katalog produk - AP (ketersediaan diprioritaskan)
    public Product getProduct(String productId) {
        return productCache.get(productId); // Mungkin stale, tetapi cepat
    }

    // Inventori - CP (konsistensi kritis)
    public boolean checkInventory(String productId, int quantity) {
        return inventoryService.checkWithStrongConsistency(productId, quantity);
    }

    // Shopping cart - AP dengan resolusi konflik
    public void addToCart(String userId, String productId, int quantity) {
        cartService.addItemEventuallyConsistent(userId, productId, quantity);
    }

    // Pemesanan - CP (transaksi kritis)
    public HasilOrder placeOrder(OrderRequest request) {
        return orderService.placeWithStrongConsistency(request);
    }
}
```

## Ekstensi CAP dan Teorema Terkait

### Teorema PACELC
```
Jika ada partisi (P), bagaimana sistem melakukan trade-off antara ketersediaan dan konsistensi (A dan C);
jika tidak (E), ketika sistem berjalan normal tanpa partisi,
bagaimana sistem melakukan trade-off antara latency (L) dan konsistensi (C)?
```

```javascript
// Pohon keputusan PACELC
class KeputusanPacelc {

  static pilihStrategi(kebutuhan) {
    const { skenarioPartisi, operasiNormal, prioritasLatency, prioritasKonsistensi } = kebutuhan;

    if (skenarioPartisi) {
      // Selama partisi
      if (prioritasLatency > prioritasKonsistensi) {
        return 'PA/EL'; // Tersedia dengan latency tinggi
      } else {
        return 'PC/EC'; // Konsisten dengan latency tinggi
      }
    } else {
      // Operasi normal
      if (prioritasLatency > prioritasKonsistensi) {
        return 'EL'; // Prioritaskan latency daripada konsistensi
      } else {
        return 'EC'; // Prioritaskan konsistensi daripada latency
      }
    }
  }
}
```

### Kemustahilan FLP
- **Teorema**: Dalam jaringan asynchronous, konsensus tidak mungkin jika bahkan satu proses dapat gagal
- **Implikasi**: Toleransi fault sempurna dan konsistensi secara teoritis tidak mungkin
- **Solusi Praktis**: Gunakan timeout dan terima inkonsistensi sesekali

### Teorema CALM
- **Teorema**: Konsistensi Sebagai Monotonicity Logis
- **Implikasi**: Program monotonic konsisten eventual tanpa koordinasi
- **Aplikasi**: CRDT dan tipe data terduplikasi bebas konflik

## Monitoring Properti CAP

### Metrik CAP
```javascript
// Monitoring trade-off CAP
const metrikCap = {
  counters: {
    totalRequests: 0,
    consistentResponses: 0,
    availableResponses: 0,
    partitionEvents: 0,
    consistencyViolations: 0
  },

  histograms: {
    responseTime: [],
    consistencyLag: [],    // Waktu antara update dan konsistensi
    partitionDuration: []  // Berapa lama partisi berlangsung
  },

  gauges: {
    currentConsistencyLevel: 0,  // Skala 0-1
    systemAvailability: 0,       // Persentase
    activePartitions: 0
  }
};

// Metrik Prometheus
const metrikPrometheus = `
# HELP cap_consistency_violations_total Total pelanggaran konsistensi CAP
# TYPE cap_consistency_violations_total counter
cap_consistency_violations_total{type="stale_read"} 42

# HELP cap_system_availability Persentase ketersediaan sistem saat ini
# TYPE cap_system_availability gauge
cap_system_availability 99.9

# HELP cap_partition_duration_seconds Durasi partisi jaringan
# TYPE cap_partition_duration_seconds histogram
cap_partition_duration_seconds_bucket{le="1.0"} 1205
`;
```

### Aturan Alerting
```yaml
# Alerting untuk isu terkait CAP
groups:
  - name: cap_theorem_alerts
    rules:
      - alert: LowConsistencyLevel
        expr: cap_consistency_level < 0.95
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tingkat konsistensi di bawah threshold"
          description: "Konsistensi sistem adalah {{ $value }}%, di bawah 95%"

      - alert: LowAvailability
        expr: cap_system_availability < 0.99
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Ketersediaan sistem rendah"
          description: "Ketersediaan sistem adalah {{ $value }}%, di bawah 99%"

      - alert: ProlongedPartition
        expr: cap_active_partitions > 0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Partisi jaringan terdeteksi"
          description: "{{ $value }} partisi aktif terdeteksi"
```

## Testing Skenario CAP

### Testing Partisi
```bash
#!/bin/bash
# Testing teorema CAP dengan partisi jaringan

# Fungsi untuk mensimulasikan partisi jaringan
simulate_partition() {
    local service1=$1
    local service2=$2
    local duration=$3

    echo "Membuat partisi antara $service1 dan $service2 selama ${duration}s"

    # Blok komunikasi antara service
    iptables -A INPUT -s $service1 -d $service2 -j DROP
    iptables -A INPUT -s $service2 -d $service1 -j DROP

    # Generate request selama partisi
    generate_load_during_partition $duration

    # Restore komunikasi
    iptables -D INPUT -s $service1 -d $service2 -j DROP
    iptables -D INPUT -s $service2 -d $service1 -j DROP

    echo "Partisi berakhir, memeriksa konsistensi..."
}

# Test perilaku sistem CP
test_cp_system() {
    echo "Testing sistem CP selama partisi"

    # Mulai partisi
    simulate_partition "node1" "node2" 30

    # Periksa apakah sistem menjadi tidak tersedia
    if check_system_unavailable; then
        echo "✓ Sistem CP benar mengorbankan ketersediaan"
    else
        echo "✗ Sistem CP tetap tersedia (tidak diharapkan)"
    fi
}

# Test perilaku sistem AP
test_ap_system() {
    echo "Testing sistem AP selama partisi"

    # Mulai partisi
    simulate_partition "node1" "node2" 30

    # Periksa apakah sistem tetap tersedia
    if check_system_available; then
        echo "✓ Sistem AP benar menjaga ketersediaan"

        # Periksa pelanggaran konsistensi
        violations=$(count_consistency_violations)
        if [ $violations -gt 0 ]; then
            echo "✓ Pelanggaran konsistensi yang diharapkan: $violations"
        fi
    else
        echo "✗ Sistem AP menjadi tidak tersedia (tidak diharapkan)"
    fi
}
```

### Testing Konsistensi
```java
// Testing properti konsistensi
@Test
public void testConsistencyUnderPartition() {
    DistributedSystem system = createPartitionedSystem();

    // Lakukan write sebelum partisi
    system.write("key1", "value1");

    // Buat partisi
    system.createPartition();

    // Tulis ke kedua sisi
    system.writeToPartition1("key1", "value1_p1");
    system.writeToPartition2("key1", "value1_p2");

    // Sembuhkan partisi
    system.healPartition();

    // Periksa perilaku konsistensi
    if (system.isCP()) {
        // Seharusnya menolak salah satu write
        assertTrue(system.getConflicts("key1").size() <= 1);
    } else if (system.isAP()) {
        // Seharusnya menerima keduanya, sekarang perlu resolusi
        assertTrue(system.getConflicts("key1").size() >= 1);
    }
}

@Test
public void testAvailabilityUnderPartition() {
    DistributedSystem system = createPartitionedSystem();

    // Buat partisi
    system.createPartition();

    // Generate request ke kedua partisi
    int requestsSent = 1000;
    int responsesReceived = system.sendRequests(requestsSent);

    double availability = (double) responsesReceived / requestsSent;

    if (system.isCP()) {
        // Mungkin memiliki ketersediaan lebih rendah
        assertTrue(availability >= 0.5); // Setidaknya 50% tersedia
    } else if (system.isAP()) {
        // Seharusnya menjaga ketersediaan tinggi
        assertTrue(availability >= 0.95); // Setidaknya 95% tersedia
    }
}
```

## Tools dan Framework

### Database yang Aware CAP
- **Sistem CP**: PostgreSQL, MySQL Cluster, ZooKeeper
- **Sistem AP**: Cassandra, Riak, DynamoDB
- **Sistem Hibrid**: CockroachDB, YugabyteDB

### Tools Testing
- **Testing Partisi**: Chaos Monkey, Toxiproxy, Jepsen
- **Testing Konsistensi**: Elle (Jepsen), Antithesis
- **Load Testing**: Apache Bench, JMeter dengan simulasi jaringan

### Tools Monitoring
- **Distributed Tracing**: Jaeger, Zipkin untuk flow request
- **Metrik**: Prometheus, Grafana untuk metrik CAP
- **Log Analysis**: ELK Stack untuk analisis partisi

## Pola Umum dan Anti-Pola

### Pola yang Direkomendasikan
- **Pilihan CAP Eksplisit**: Dokumentasikan keputusan CAP untuk setiap komponen
- **Arsitektur Hibrid**: Gunakan properti CAP berbeda untuk tipe data berbeda
- **Degradasi Graceful**: Definisikan perilaku ketika properti CAP tidak dapat dipertahankan
- **Monitoring Properti CAP**: Lacak metrik konsistensi, ketersediaan, dan partisi
- **Testing Under Failure**: Secara teratur test perilaku sistem selama partisi

### Anti-Pola yang Harus Dihindari
- **Mengabaikan CAP**: Membangun sistem terdistribusi tanpa kesadaran CAP
- **Ketergantungan Berlebihan pada CA**: Mengasumsikan jaringan sempurna dan tanpa partisi
- **Pilihan CAP Inkonsisten**: Mencampur CP dan AP tanpa batasan yang jelas
- **Tidak Ada Testing Failure**: Tidak test skenario partisi
- **Trade-off Tersembunyi**: Tidak mengkomunikasikan implikasi CAP ke stakeholder

## Referensi

- [Teorema CAP Brewer](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf)
- [CAP Dua Belas Tahun Kemudian: Bagaimana Aturannya Telah Berubah](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)
- [Teorema PACELC](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)
- [Kemustahilan FLP](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf)
- [Teorema CALM](https://arxiv.org/abs/1901.01930)
- [Merancang Aplikasi Data-Intensive - Martin Kleppmann](https://dataintensive.net/)