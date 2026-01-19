# CI/CD (Continuous Integration / Continuous Delivery)
## Gambaran Umum

CI/CD adalah praktik yang mengotomasi pipeline build, pengujian, dan deployment untuk mengirim perubahan perangkat lunak dengan cepat, andal, dan konsisten. Ini memungkinkan delivery yang lebih cepat dan berkualitas tinggi.

## Konsep Inti
- **Continuous Integration (CI)**: Integrasi kode yang sering ke repository bersama; build dan pengujian otomatis dijalankan pada setiap integrasi.
- **Continuous Delivery / Deployment (CD)**: Perubahan yang lulus pipeline dikemas dan siap dirilis (delivery) atau otomatis dideploy ke produksi (deployment).

## Langkah Umum Pipeline
- Checkout kode -> Build -> Unit test -> Static analysis -> Integration test -> Publish artifact -> Deploy ke staging -> Smoke test -> Deploy ke produksi

## Manfaat
- Umpan balik lebih cepat, masalah integrasi lebih sedikit
- Keyakinan dan reproduksibilitas deployment lebih tinggi
- Waktu ke pasar lebih singkat dan rilis lebih aman

## Praktik Terbaik
- Buat pipeline cepat dan andal (paralelisasi test)
- Gunakan feature flag untuk rilis bertahap
- Otomatiskan rollback dan health check
- Amankan kredensial pipeline dan storage artifact

## Referensi
- https://martinfowler.com/articles/continuousIntegration.html
- https://12factor.net/
