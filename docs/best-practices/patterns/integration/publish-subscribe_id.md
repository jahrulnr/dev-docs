# Publish / Subscribe
## Gambaran Umum

Publish/Subscribe memisahkan producer (publisher) dan consumer (subscriber) melalui perantara (broker) yang merutekan pesan berdasarkan topik. Pola ini memungkinkan decoupling yang kuat dan skalabilitas dalam sistem event-driven.

## Kapan digunakan
Cocok untuk arsitektur event-driven, skenario broadcast, atau ketika banyak konsumen perlu merespon event yang sama.

## Contoh
Event `OrderCreated` dipublikasikan; layanan inventory, billing, dan analytics berlangganan dan bereaksi secara independen.

## Kelebihan / Kekurangan
- Kelebihan: Loose coupling, mudah men-skalakan konsumen, komunikasi asinkron.
- Kekurangan: Kompleksitas operasional meningkat dan isu konsistensi eventual.

## Referensi
- Sumber daya tentang messaging dan arsitektur event-driven.