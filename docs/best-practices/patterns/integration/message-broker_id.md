# Message Broker
## Gambaran Umum

Message Broker merutekan, men-buffer, dan mengirim pesan antara producer dan consumer, sering menyediakan persistensi, routing, dan jaminan pengiriman. Ini memungkinkan komunikasi asinkron yang andal di sistem terdistribusi.

## Kapan digunakan
Gunakan untuk membangun sistem asinkron yang terlepas atau mengintegrasikan sistem heterogen.

## Contoh
RabbitMQ atau Kafka sebagai broker yang menangani stream event dan merutekan pesan ke konsumen.

## Kelebihan / Kekurangan
- Kelebihan: Keandalan, buffering, routing fleksibel, opsi persistensi.
- Kekurangan: Overhead operasional, tantangan evolusi skema dan koordinasi konsumen.

## Referensi
- Dokumentasi RabbitMQ/Kafka.