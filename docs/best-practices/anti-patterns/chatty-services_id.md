# Chatty Services
## Gambaran Umum

Chatty Services adalah layanan yang memerlukan banyak panggilan bolak-balik untuk menyelesaikan tugas sederhana, sehingga meningkatkan latensi dan coupling. Anti-pola ini dapat mengurangi performa dan skalabilitas sistem.

## Mengapa bermasalah
Mengakibatkan latensi tinggi, overhead jaringan, dan interaksi antar layanan yang rapuh.

## Mitigasi
Konsolidasikan panggilan, gunakan API bulk, atau rancang ulang boundary untuk mengurangi chattiness.

## Referensi
- Praktik terbaik komunikasi microservices.