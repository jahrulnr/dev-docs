# Backward Compatibility
## Gambaran Umum

Backward Compatibility memastikan versi baru layanan atau API tetap bekerja dengan klien lama, memungkinkan evolusi yang aman. Prinsip ini sangat penting dalam sistem terdistribusi untuk menjaga interoperabilitas dan menghindari perubahan yang dapat mengganggu layanan dependen.

## Kapan digunakan
Gunakan saat mengubah sistem terdistribusi dimana tidak semua klien dapat diupgrade bersamaan.

## Contoh
Tambahkan field opsional ke response API daripada menghapus atau merename field.

## Kelebihan / Kekurangan
- Kelebihan: Mengurangi koordinasi deployment, mempermudah upgrade.
- Kekurangan: Dapat menambah kompleksitas dan legacy behavior yang panjang.

## Referensi
- Pedoman versioning dan kompatibilitas API.