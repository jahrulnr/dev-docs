# Event Carried State Transfer
## Gambaran Umum

Event Carried State Transfer mengirimkan state yang diperlukan dalam event sehingga konsumen dapat memperbarui view lokal tanpa lookup tambahan. Pola ini mengoptimalkan sistem event-driven dengan mengurangi kebutuhan untuk query tambahan, meningkatkan performa dan decoupling antara producer dan consumer.

## Kapan digunakan
Gunakan ketika konsumen membutuhkan data cukup untuk memperbarui read model atau view yang terdenormalisasi dan ingin meminimalkan panggilan sinkron.

## Contoh
Event `OrderCreated` berisi detail order sehingga service proyeksi dapat segera memperbarui store baca.

## Kelebihan / Kekurangan
- Kelebihan: Mengurangi lookup sinkron, mempercepat pembaruan read model.
- Kekurangan: Payload event lebih besar dan duplikasi data di berbagai sistem.

## Referensi
- Praktik terbaik sistem event-driven.