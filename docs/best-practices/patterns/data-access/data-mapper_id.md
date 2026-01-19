# Data Mapper
## Gambaran Umum

Data Mapper memisahkan objek domain di memori dari skema database dengan memetakan di antara keduanya. Pola ini memungkinkan pemisahan tanggung jawab yang bersih antara logika bisnis dan persistensi data.

## Kapan digunakan
Digunakan saat menginginkan lapisan persistensi yang terpisah dari objek domain dan membutuhkan logika pemetaan kompleks.

## Contoh
Mapper yang menerjemahkan objek `Order` ke baris/kolom database.

## Kelebihan / Kekurangan
- Kelebihan: Pemisahan bersih, domain model tidak bergantung pada persistensi.
- Kekurangan: Kode pemetaan tambahan dan potensi overhead performa.

## Referensi
- Patterns of enterprise application architecture.