# Use Case Interactor
## Gambaran Umum

Use Case Interactor (atau Application Service) mengoordinasikan workflow tingkat aplikasi dengan mengatur objek domain dan repository untuk memenuhi use case. Mereka bertindak sebagai titik masuk untuk logika aplikasi, memastikan pemisahan yang bersih antara lapisan presentasi, domain, dan infrastruktur.

## Kapan digunakan
Gunakan untuk mengenkapsulasi logika alur aplikasi yang terpisah dari domain model dan concern infrastruktur.

## Contoh
`CreateOrderInteractor` memvalidasi input, menggunakan domain service/aggregate, dan menyimpan perubahan melalui repository.

## Kelebihan / Kekurangan
- Kelebihan: Pemisahan jelas antara orkestrasi use case dan aturan domain.
- Kekurangan: Bisa menjadi anemic jika terlalu banyak logika domain ditempatkan di sini.

## Referensi
- Clean Architecture dan sumber Hexagonal Architecture.