# Unit of Work
## Gambaran Umum

Unit of Work menjaga daftar objek yang terpengaruh oleh sebuah transaksi bisnis dan mengoordinasikan penulisan perubahan serta penanganan konkurensi. Pola ini memastikan konsistensi data dengan mengelompokkan operasi terkait.

## Kapan digunakan
Gunakan saat perlu menggabungkan banyak perubahan menjadi satu transaksi dan mengurangi jumlah panggilan ke database.

## Contoh
`UnitOfWork` ORM yang melacak entitas yang dibuat/diperbarui/dihapus dan melakukan commit dalam satu transaksi.

## Kelebihan / Kekurangan
- Kelebihan: Manajemen transaksi terpusat, mengurangi panggilan database.
- Kekurangan: Pertumbuhan memori jika melacak banyak entitas, kompleksitas manajemen lifecycle.

## Referensi
- Martin Fowler, patterns of enterprise application architecture.