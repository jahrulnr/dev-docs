# Helm

## Gambaran Umum

Helm adalah package manager untuk Kubernetes, memungkinkan Anda mendefinisikan, menginstall, dan upgrade aplikasi Kubernetes kompleks. Anggap saja sebagai apt/yum untuk Kubernetes - menyederhanakan deployment dan manajemen aplikasi melalui charts.

Helm menggunakan format packaging bernama charts, yang merupakan kumpulan file yang mendeskripsikan set resource Kubernetes terkait. Charts dapat di-version, dishare, dan reuse di environment berbeda.

## Konsep Utama

- **Charts**: Package berisi manifest Kubernetes dan metadata
- **Releases**: Instance charts yang dideploy ke cluster
- **Repositories**: Kumpulan charts yang dapat dishare dan diakses
- **Templates**: Generasi dinamis manifest Kubernetes menggunakan Go templating
- **Values**: File konfigurasi yang customize deployment chart

## Arsitektur

- **Helm Client**: Tool command-line untuk manajemen chart
- **Tiller (deprecated)**: Komponen server-side (dihapus di Helm 3)
- **Chart Museum**: Server repository untuk hosting charts
- **Release Storage**: Pelacakan releases yang dideploy di cluster

## Kapan Digunakan

- Deploy aplikasi kompleks dengan multiple dependencies
- Mengelola konfigurasi aplikasi di berbagai environment
- Sharing dan reusing aplikasi Kubernetes
- Mengimplementasikan workflow GitOps
- Standardisasi deployment aplikasi

## Perintah Dasar

```bash
# Tambah repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Cari charts
helm search repo nginx

# Install chart
helm install my-release bitnami/nginx

# List releases
helm list

# Upgrade release
helm upgrade my-release bitnami/nginx --version 13.0.0

# Uninstall release
helm uninstall my-release

# Buat chart baru
helm create mychart
```

## Struktur Chart Contoh

```
mychart/
├── Chart.yaml          # Metadata chart
├── values.yaml         # Values default
├── templates/          # Manifest Kubernetes
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl
└── charts/             # Dependencies
```

## Contoh values.yaml

```yaml
replicaCount: 3

image:
  repository: nginx
  tag: "1.20"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  annotations: {}
  hosts:
    - host: myapp.example.com
      paths: []
  tls: []
```

## Praktik Terbaik

- Gunakan semantic versioning untuk charts
- Implementasikan manajemen dependency proper
- Gunakan subcharts untuk aplikasi kompleks
- Implementasikan validasi dengan JSON schemas
- Gunakan helm lint untuk validasi chart
- Simpan charts di version control

## Perbandingan dengan Kustomize

- **Approach**: Helm gunakan templating; Kustomize gunakan overlays
- **Kompleksitas**: Helm dukung logic lebih kompleks; Kustomize lebih sederhana
- **Ekosistem**: Helm punya ekosistem chart lebih besar
- **Learning**: Kustomize punya learning curve lebih gentle untuk use case basic

## Terkait

- [Kubernetes](kubernetes_id.md)
- [Docker](docker_id.md)

## Referensi

- [Helm Documentation](https://helm.sh/docs/)
