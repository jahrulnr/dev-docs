# Pola Authorization
## Gambaran Umum

Authorization memutuskan apa yang boleh dilakukan oleh entitas yang terautentikasi (kontrol akses). Terapkan sebagai RBAC, ABAC, atau capability-based. Ini memastikan bahwa hanya pengguna yang berwenang yang dapat mengakses sumber daya.

## Kapan digunakan
Gunakan untuk menegakkan kontrol akses yang terperinci pada API dan sumber daya.

## Contoh
Role-based access: `admin` dapat membuat user; `user` hanya dapat mengedit profil sendiri.

## Kelebihan / Kekurangan
- Kelebihan: Menegakkan prinsip least privilege bila dirancang dengan benar.
- Kekurangan: Kompleksitas meningkat dengan banyak role/policy; salah konfigurasi menyebabkan over-privilege.

## Referensi
- Panduan OWASP tentang access control.