# Security & Identity

## AWS IAM (Identity and Access Management)

AWS IAM memungkinkan Anda mengelola akses ke layanan dan sumber daya AWS secara aman, mengontrol siapa yang dapat mengakses apa dan di bawah kondisi apa.

## Kasus Penggunaan Umum
- Manajemen pengguna dan grup
- Kontrol akses berbasis peran
- Manajemen kredensial sementara
- Penegakan autentikasi multi-faktor

## Praktik Terbaik
- Ikuti prinsip hak istimewa paling sedikit
- Gunakan IAM roles alih-alih access keys
- Aktifkan MFA untuk pengguna istimewa
- Putar access keys secara teratur dan tinjau izin

## AWS WAF (Web Application Firewall)

AWS WAF adalah firewall aplikasi web yang membantu melindungi aplikasi web dari eksploitasi web umum yang dapat memengaruhi ketersediaan atau keamanan.

## Kasus Penggunaan Umum
- Perlindungan SQL injection
- Pencegahan cross-site scripting (XSS)
- Mitigasi serangan DDoS
- Manajemen bot dan rate limiting

## Praktik Terbaik
- Gunakan managed rule groups untuk ancaman umum
- Konfigurasikan aturan kustom untuk perlindungan spesifik aplikasi
- Aktifkan logging untuk analisis ancaman
- Test aturan dalam mode count sebelum blocking

## AWS Shield

AWS Shield adalah layanan perlindungan Distributed Denial of Service (DDoS) terkelola yang menjaga aplikasi yang berjalan di AWS.

## Kasus Penggunaan Umum
- Perlindungan terhadap serangan volumetrik
- Mitigasi serangan lapisan aplikasi
- Visibilitas serangan real-time
- Mitigasi serangan otomatis

## Praktik Terbaik
- Gunakan Shield Advanced untuk perlindungan yang lebih baik
- Konfigurasikan health checks untuk deteksi yang lebih baik
- Aktifkan mitigasi DDoS lapisan aplikasi otomatis
- Integrasikan dengan CloudWatch untuk monitoring

## AWS Certificate Manager

AWS Certificate Manager adalah layanan yang memungkinkan Anda dengan mudah menyediakan, mengelola, dan men-deploy sertifikat SSL/TLS publik dan privat.

## Kasus Penggunaan Umum
- Keamanan situs web HTTPS
- Enkripsi endpoint API
- Komunikasi layanan internal
- Autentikasi perangkat IoT

## Praktik Terbaik
- Gunakan ACM untuk integrasi layanan AWS
- Aktifkan perpanjangan sertifikat otomatis
- Konfigurasikan validasi DNS untuk penerbitan lebih cepat
- Gunakan private CA untuk sertifikat internal

## AWS Key Management Service (KMS)

AWS KMS adalah layanan terkelola yang memudahkan Anda membuat dan mengontrol kunci enkripsi yang digunakan untuk mengenkripsi data Anda.

## Kasus Penggunaan Umum
- Enkripsi data at rest
- Manajemen kunci yang aman
- Kepatuhan dengan standar enkripsi
- Integrasi dengan layanan AWS

## Praktik Terbaik
- Gunakan customer managed keys untuk kontrol penuh
- Implementasikan kebijakan rotasi kunci
- Konfigurasikan key policies untuk kontrol akses
- Gunakan CloudTrail untuk audit logging

## AWS Secrets Manager

AWS Secrets Manager membantu Anda melindungi secrets yang diperlukan untuk mengakses aplikasi, layanan, dan sumber daya IT dengan memungkinkan Anda merotasi, mengelola, dan mengambil secrets.

## Kasus Penggunaan Umum
- Manajemen kredensial database
- Penyimpanan API keys dan tokens
- Manajemen konfigurasi aman
- Rotasi secret otomatis

## Praktik Terbaik
- Gunakan rotasi otomatis untuk secrets database
- Konfigurasikan izin yang sesuai dengan IAM
- Aktifkan logging CloudTrail untuk audit
- Gunakan resource-based policies untuk akses cross-account

## AWS CloudHSM

AWS CloudHSM menyediakan hardware security modules di AWS Cloud, memungkinkan Anda menghasilkan dan menggunakan kunci enkripsi Anda sendiri di hardware khusus.

## Kasus Penggunaan Umum
- Generasi dan penyimpanan kunci yang aman
- Kepatuhan dengan persyaratan regulasi
- Integrasi dengan aplikasi yang memerlukan HSM
- Offloading operasi kriptografi

## Praktik Terbaik
- Gunakan HSM di availability zones yang berbeda
- Konfigurasikan auto-scaling untuk ketersediaan tinggi
- Implementasikan prosedur backup dan restore yang tepat
- Monitor performa dan kapasitas HSM