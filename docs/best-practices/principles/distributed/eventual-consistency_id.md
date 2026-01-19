# Prinsip Eventual Consistency

## Gambaran Umum

Prinsip Eventual Consistency menyatakan bahwa dalam sistem terdistribusi, pembaruan akan menyebar dan semua replika akan konvergen ke state yang sama seiring waktu, asalkan tidak ada pembaruan baru yang dilakukan pada data yang terpengaruh. Model ini memberikan skalabilitas dan ketersediaan yang lebih baik dibandingkan model konsistensi kuat dengan mengizinkan inkonsistensi temporer selama propagasi pembaruan. Eventual consistency adalah konsep kunci dalam desain sistem terdistribusi, terutama saat mengimplementasikan trade-off CAP theorem.

## Konsep Inti

### Model Konsistensi
- **Strong Consistency**: Semua read mengembalikan write terbaru
- **Eventual Consistency**: Semua replika konvergen seiring waktu
- **Causal Consistency**: Operasi yang berhubungan kausal terlihat dalam urutan
- **Read-Your-Writes**: User melihat update mereka sendiri secara langsung

### Properti Konvergensi
- **Monotonic Reads**: Setelah nilai dibaca, read selanjutnya mengembalikan nilai sama atau lebih baru
- **Monotonic Writes**: Write diterapkan dalam urutan di seluruh replika
- **Read-Your-Writes**: Write user langsung visible untuk diri mereka sendiri
- **Writes Follow Reads**: Write visible setelah read yang mendahuluinya

## Strategi Implementasi

### Conflict-Free Replicated Data Types (CRDTs)
```javascript
// Implementasi Counter CRDT
class GCounter {
  constructor(id, state = {}) {
    this.id = id;
    this.state = { ...state };
  }

  increment(amount = 1) {
    this.state[this.id] = (this.state[this.id] || 0) + amount;
    return this;
  }

  value() {
    return Object.values(this.state).reduce((sum, val) => sum + val, 0);
  }

  merge(other) {
    const merged = { ...this.state };
    for (const [key, value] of Object.entries(other.state)) {
      merged[key] = Math.max(merged[key] || 0, value);
    }
    return new GCounter(this.id, merged);
  }
}

// Penggunaan
const counter1 = new GCounter('node1');
const counter2 = new GCounter('node2');

counter1.increment(5);
counter2.increment(3);

// Merge state
const merged = counter1.merge(counter2);
console.log(merged.value()); // 8
```

### Version Vectors untuk Conflict Resolution
```java
// Version vector untuk tracking kausalitas
public class VersionVector {
    private Map<String, Long> versions;

    public VersionVector() {
        this.versions = new HashMap<>();
    }

    public void increment(String nodeId) {
        versions.put(nodeId, versions.getOrDefault(nodeId, 0L) + 1);
    }

    public boolean dominates(VersionVector other) {
        for (String node : versions.keySet()) {
            if (other.versions.getOrDefault(node, 0L) > versions.get(node)) {
                return false;
            }
        }
        for (String node : other.versions.keySet()) {
            if (versions.getOrDefault(node, 0L) < other.versions.get(node)) {
                return false;
            }
        }
        return true;
    }

    public VersionVector merge(VersionVector other) {
        VersionVector result = new VersionVector();
        Set<String> allNodes = new HashSet<>();
        allNodes.addAll(versions.keySet());
        allNodes.addAll(other.versions.keySet());

        for (String node : allNodes) {
            long v1 = versions.getOrDefault(node, 0L);
            long v2 = other.versions.getOrDefault(node, 0L);
            result.versions.put(node, Math.max(v1, v2));
        }

        return result;
    }
}
```

### Event Sourcing dengan Eventual Consistency
```javascript
// Event sourcing untuk eventual consistency
class EventStore {
  constructor() {
    this.events = [];
    this.subscribers = [];
  }

  async append(event) {
    this.events.push(event);
    await this.notifySubscribers(event);
  }

  subscribe(handler) {
    this.subscribers.push(handler);
  }

  async notifySubscribers(event) {
    // Notifikasi asinkron untuk eventual consistency
    setImmediate(() => {
      this.subscribers.forEach(subscriber => {
        try {
          subscriber(event);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      });
    });
  }

  getEvents(aggregateId) {
    return this.events.filter(event => event.aggregateId === aggregateId);
  }
}

// Penggunaan dengan read model projection
class UserReadModel {
  constructor(eventStore) {
    this.users = new Map();
    eventStore.subscribe(event => this.project(event));
  }

  project(event) {
    switch (event.type) {
      case 'UserCreated':
        this.users.set(event.aggregateId, {
          id: event.aggregateId,
          name: event.name,
          email: event.email,
          version: event.version
        });
        break;

      case 'UserUpdated':
        const user = this.users.get(event.aggregateId);
        if (user && event.version > user.version) {
          Object.assign(user, event.updates);
          user.version = event.version;
        }
        break;
    }
  }

  getUser(id) {
    return this.users.get(id);
  }
}
```

### CQRS dengan Eventual Consistency
```java
// Implementasi CQRS dengan eventual consistency
public class CqrsSystem {

    private final CommandBus commandBus;
    private final QueryBus queryBus;
    private final EventStore eventStore;

    public CqrsSystem(CommandBus commandBus, QueryBus queryBus, EventStore eventStore) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.eventStore = eventStore;

        // Subscribe read models ke events
        eventStore.subscribe(this::updateReadModels);
    }

    public CompletableFuture<Void> executeCommand(Command command) {
        return commandBus.send(command);
    }

    public <T> CompletableFuture<T> executeQuery(Query query) {
        return queryBus.send(query);
    }

    private void updateReadModels(DomainEvent event) {
        // Update read models secara asinkron
        CompletableFuture.runAsync(() -> {
            try {
                readModelProjectors.forEach(projector ->
                    projector.project(event));
            } catch (Exception e) {
                // Log dan potentially retry
                log.error("Read model update failed", e);
            }
        });
    }
}
```

## Menangani Inkonsistensi

### Strategi Rekonsiliasi
```javascript
// Rekonsiliasi data untuk eventual consistency
class DataReconciler {

  constructor(primaryStore, replicaStores) {
    this.primaryStore = primaryStore;
    this.replicaStores = replicaStores;
  }

  async reconcile() {
    const primaryData = await this.primaryStore.getAll();
    const reconciliationResults = [];

    for (const replica of this.replicaStores) {
      try {
        const replicaData = await replica.getAll();
        const differences = this.findDifferences(primaryData, replicaData);

        if (differences.length > 0) {
          await this.resolveDifferences(replica, differences);
          reconciliationResults.push({
            replica: replica.id,
            differences: differences.length,
            status: 'reconciled'
          });
        } else {
          reconciliationResults.push({
            replica: replica.id,
            differences: 0,
            status: 'consistent'
          });
        }
      } catch (error) {
        reconciliationResults.push({
          replica: replica.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return reconciliationResults;
  }

  findDifferences(primary, replica) {
    const differences = [];

    // Cari item yang missing di replica
    for (const [key, primaryValue] of Object.entries(primary)) {
      const replicaValue = replica[key];
      if (!replicaValue || replicaValue.version < primaryValue.version) {
        differences.push({
          key,
          type: 'missing_or_stale',
          primary: primaryValue,
          replica: replicaValue
        });
      }
    }

    return differences;
  }

  async resolveDifferences(replica, differences) {
    for (const diff of differences) {
      await replica.update(diff.key, diff.primary);
    }
  }
}
```

### Conflict Resolution Sisi Klien
```javascript
// Conflict resolution sisi klien
class ConflictResolver {

  resolveConflicts(localData, serverData, lastSyncTimestamp) {
    const conflicts = this.identifyConflicts(localData, serverData);

    return conflicts.map(conflict => {
      switch (conflict.type) {
        case 'last_write_wins':
          return conflict.serverData.timestamp > conflict.localData.timestamp
            ? conflict.serverData
            : conflict.localData;

        case 'merge':
          return this.mergeObjects(conflict.localData, conflict.serverData);

        case 'manual_resolution':
          return this.promptUserResolution(conflict);

        default:
          return conflict.serverData; // Default ke server
      }
    });
  }

  identifyConflicts(local, server) {
    const conflicts = [];

    for (const key of Object.keys(local)) {
      if (server[key] && local[key].timestamp !== server[key].timestamp) {
        conflicts.push({
          key,
          localData: local[key],
          serverData: server[key],
          type: this.determineConflictType(local[key], server[key])
        });
      }
    }

    return conflicts;
  }

  determineConflictType(local, server) {
    // Strategi conflict resolution sederhana
    if (local.type === server.type) {
      return 'merge';
    } else {
      return 'last_write_wins';
    }
  }

  mergeObjects(local, server) {
    // Strategi deep merge
    return { ...server, ...local };
  }
}
```

## Monitoring dan Observability

### Metrik Konsistensi
```javascript
// Monitoring eventual consistency
const consistencyMetrics = {
  counters: {
    totalUpdates: 0,
    consistencyViolations: 0,
    reconciliationEvents: 0,
    conflictResolutions: 0
  },

  histograms: {
    convergenceTime: [],     // Waktu untuk mencapai konsistensi
    stalenessDuration: [],   // Berapa lama data tetap usang
    reconciliationLatency: [] // Waktu untuk reconcile differences
  },

  gauges: {
    currentInconsistencies: 0,
    replicasOutOfSync: 0,
    pendingReconciliations: 0
  }
};

// Metrik Prometheus
const prometheusMetrics = `
# HELP consistency_violations_total Total pelanggaran konsistensi terdeteksi
# TYPE consistency_violations_total counter
consistency_violations_total{type="stale_read"} 42

# HELP convergence_time_seconds Waktu untuk replika konvergen
# TYPE convergence_time_seconds histogram
convergence_time_seconds_bucket{le="1.0"} 1205

# HELP replicas_out_of_sync Jumlah replika yang sedang out-of-sync
# TYPE replicas_out_of_sync gauge
replicas_out_of_sync 3
`;
```

### Aturan Alerting
```yaml
# Alerting untuk masalah eventual consistency
groups:
  - name: eventual_consistency_alerts
    rules:
      - alert: HighConsistencyViolations
        expr: rate(consistency_violations_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tingkat pelanggaran konsistensi tinggi"
          description: "Pelanggaran konsistensi pada {{ $value }} per menit"

      - alert: SlowConvergence
        expr: histogram_quantile(0.95, rate(convergence_time_seconds_bucket[5m])) > 30
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Konvergensi replika lambat"
          description: "95th percentile waktu konvergensi adalah {{ $value }}s"

      - alert: ManyOutOfSyncReplicas
        expr: replicas_out_of_sync > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Banyak replika out of sync"
          description: "{{ $value }} replika sedang out of sync"
```

## Testing Eventual Consistency

### Testing Konvergensi
```java
// Testing konvergensi eventual consistency
@Test
public void testEventualConvergence() throws InterruptedException {
    DistributedStore store = new DistributedStore(3); // 3 replika

    // Lakukan update
    store.update("key1", "value1", "node1");
    store.update("key2", "value2", "node2");

    // Tunggu konvergensi
    Thread.sleep(5000); // Izinkan waktu untuk propagasi

    // Verifikasi semua replika telah konvergen
    for (int i = 0; i < 3; i++) {
        assertEquals("value1", store.getFromReplica("key1", i));
        assertEquals("value2", store.getFromReplica("key2", i));
    }
}

@Test
public void testConflictResolution() {
    ConflictResolver resolver = new ConflictResolver();

    // Buat update yang konflik
    DataItem local = new DataItem("content1", 1000L);
    DataItem server = new DataItem("content2", 2000L);

    // Resolve konflik
    DataItem resolved = resolver.resolveConflict(local, server, "last_write_wins");

    assertEquals("content2", resolved.content); // Server menang
    assertEquals(2000L, resolved.timestamp);
}
```

### Chaos Testing
```bash
#!/bin/bash
# Chaos testing untuk eventual consistency

# Function untuk simulasi network partition
simulate_partition() {
    local duration=$1

    echo "Membuat network partition selama ${duration}s"

    # Isolate replika
    iptables -A INPUT -s $REPLICA_IP -j DROP
    iptables -A OUTPUT -d $REPLICA_IP -j DROP

    sleep $duration

    # Restore konektivitas
    iptables -D INPUT -s $REPLICA_IP -j DROP
    iptables -D OUTPUT -d $REPLICA_IP -j DROP

    echo "Network partition berakhir"
}

# Function untuk verifikasi konvergensi setelah chaos
verify_convergence() {
    echo "Memverifikasi konvergensi..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if check_consistency; then
            echo "Konvergensi tercapai setelah ${attempt} attempts"
            return 0
        fi

        sleep 10
        ((attempt++))
    done

    echo "Konvergensi tidak tercapai dalam timeout"
    return 1
}

# Jalankan chaos test
run_chaos_test() {
    echo "Memulai chaos test untuk eventual consistency"

    # Generate load
    start_load_generator &

    # Simulasi partition
    simulate_partition 60

    # Verifikasi konvergensi
    if verify_convergence; then
        echo "✓ Chaos test passed"
    else
        echo "✗ Chaos test failed"
        exit 1
    fi
}
```

## Pola Umum dan Anti-Patterns

### Pola yang Direkomendasikan
- **Optimistic Concurrency Control**: Izinkan update concurrent dengan conflict resolution
- **Eventual Consistency Bounds**: Definisi window inkonsistensi yang acceptable
- **Read Repair**: Perbaiki inkonsistensi selama operasi read
- **Anti-Entropy**: Proses background untuk deteksi dan repair inkonsistensi
- **Version Vectors**: Track kausalitas untuk resolve konflik dengan proper

### Anti-Patterns yang Harus Dihindari
- **Mengasumsikan Immediate Consistency**: Jangan expect propagasi instant
- **Mengabaikan Conflicts**: Selalu handle conflict resolution
- **Read Models Inconsistent**: Jaga read models eventually consistent
- **Blocking on Consistency**: Jangan tunggu konsistensi global
- **Complex Conflict Resolution**: Jaga logika resolution simple dan predictable

## Tools dan Frameworks

### Database Terdistribusi
- **Cassandra**: Masterless, eventual consistency secara default
- **CouchDB**: Multi-master replication dengan conflict resolution
- **DynamoDB**: Consistency levels yang dapat dikonfigurasi
- **Riak**: Eventual consistency dengan CRDTs

### Library Konsistensi
- **Akka**: Actor-based eventual consistency
- **CRDT Libraries**: Antidote, Riak DT, SwiftCloud
- **EventStore**: Event sourcing untuk eventual consistency
- **Kafka Streams**: Stream processing dengan eventual consistency

### Tools Monitoring
- **Prometheus**: Koleksi metrik untuk monitoring konsistensi
- **Grafana**: Dashboard untuk tracking konvergensi
- **Jaeger**: Distributed tracing untuk propagasi update
- **Chaos Monkey**: Tool Netflix untuk testing resilience

## Referensi

- [CAP Theorem - Brewer](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf)
- [Eventual Consistency - Vogels](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html)
- [Conflict-Free Replicated Data Types](https://hal.inria.fr/inria-00609399/document)
- [Designing Data-Intensive Applications - Martin Kleppmann](https://dataintensive.net/)
- [Time, Clocks, and the Ordering of Events - Lamport](https://lamport.azurewebsites.net/pubs/time-clocks.pdf)