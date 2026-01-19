# Kubernetes

## Gambaran Umum

Kubernetes (K8s) adalah platform open-source untuk mengotomasi deployment, scaling, dan manajemen aplikasi containerized. Awalnya dikembangkan oleh Google dan sekarang dikelola oleh Cloud Native Computing Foundation (CNCF), Kubernetes menyediakan framework untuk menjalankan sistem terdistribusi secara resilient.

Kubernetes mengorkestrasi container di seluruh cluster mesin, menyediakan fitur seperti service discovery, load balancing, storage orchestration, dan automated rollouts/rollbacks.

## Konsep Utama

- **Pods**: Unit terkecil yang dapat dideploy, berisi satu atau lebih container
- **Services**: Abstraksi untuk mengakses pods, menyediakan load balancing
- **Deployments**: Cara deklaratif untuk mengelola replica pod dan update
- **Namespaces**: Cluster virtual untuk isolasi resource
- **ConfigMaps/Secrets**: Cara untuk menginjeksi konfigurasi dan data sensitif
- **Persistent Volumes**: Abstraksi storage untuk aplikasi stateful

## Komponen Arsitektur

- **Control Plane**: API server, scheduler, controller manager, etcd
- **Worker Nodes**: Kubelet, kube-proxy, container runtime
- **Add-ons**: Networking, DNS, monitoring, logging

## Kapan Digunakan

- Orkestrasi container skala besar
- Arsitektur microservices kompleks
- Deployment multi-cloud atau hybrid
- Aplikasi yang memerlukan high availability dan scalability
- Tim dengan praktik DevOps

## Perintah Dasar

```bash
# Buat deployment
kubectl create deployment nginx --image=nginx

# Expose deployment sebagai service
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Scale deployment
kubectl scale deployment nginx --replicas=3

# Update image
kubectl set image deployment/nginx nginx=nginx:1.20

# Cek status pod
kubectl get pods

# Lihat logs
kubectl logs <pod-name>

# Eksekusi command di pod
kubectl exec -it <pod-name> -- /bin/bash
```

## Contoh YAML Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce
  template:
    metadata:
      labels:
        app: ecommerce
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-service
spec:
  selector:
    app: ecommerce
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Praktik Terbaik

- Gunakan namespaces untuk isolasi environment
- Implementasikan limits dan requests resource
- Gunakan liveness dan readiness probes
- Implementasikan logging dan monitoring proper
- Gunakan Helm untuk packaging aplikasi kompleks
- Implementasikan security contexts dan network policies

## Integrasi dengan Ecommerce

Kubernetes ideal untuk platform ecommerce karena:
- Tangani lonjakan trafik dengan horizontal pod autoscaling
- Sediakan rolling updates untuk deployment tanpa downtime
- Kelola dependensi microservices kompleks
- Dukung deployment multi-region untuk skala global
- Terintegrasi dengan service mesh untuk manajemen trafik advanced

## Perbandingan dengan Docker Swarm

- **Ekosistem**: Kubernetes memiliki komunitas dan ekosistem tool lebih besar
- **Fitur**: Opsi scheduling, networking, dan storage lebih advanced
- **Kompleksitas**: Learning curve lebih curam tetapi lebih powerful
- **Adopsi**: Standar industri untuk orkestrasi container enterprise