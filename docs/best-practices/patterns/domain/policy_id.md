# Pola Policy
## Gambaran Umum

Policy mengenkapsulasi logika keputusan bisnis (aturan atau kebijakan) yang sering dapat dikonfigurasi dan diuji terpisah dari entitas domain. Pendekatan ini mempromosikan pemisahan tanggung jawab dan membuat aturan bisnis lebih mudah dipelihara dan disesuaikan dengan persyaratan yang berubah.

## Kapan digunakan
Gunakan untuk memusatkan keputusan bisnis yang mungkin sering berubah atau dapat dikonfigurasi oleh pemangku kepentingan.

## Contoh
`PricingPolicy` menentukan diskon berdasarkan tier pelanggan dan promosi.

## Kelebihan / Kekurangan
- Kelebihan: Memusatkan aturan bisnis, lebih mudah diuji dan dimodifikasi.
- Kekurangan: Mungkin perlu orkestrasi untuk menerapkan kebijakan secara konsisten.

## Referensi
- Sumber DDD dan arsitektur.