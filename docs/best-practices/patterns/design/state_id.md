# Pola State
## Gambaran Umum

State memungkinkan objek mengubah perilakunya ketika status internalnya berubah dengan mendelegasikan perilaku ke objek state. Ini menyederhanakan logika bercabang dan mengelompokkan perilaku per-state. Pola ini meningkatkan maintainability dengan memisahkan state-specific behavior.

## Kapan digunakan
- Ketika perilaku bergantung pada state dan transisi state terdefinisi dengan baik.
- Ketika menghindari switch/case atau if/else besar membuat kode lebih jelas.

## Panduan Implementasi
- Definisikan antarmuka State dengan metode untuk perilaku khusus state dan logika transisi.
- Implementasikan tipe ConcreteState dan delegasikan dari Context ke State saat ini.
- Enkapsulasi logika transisi di state atau dalam state machine terpusat agar alur lebih eksplisit.

## Contoh (Pseudo)
`Connection` mendelegasikan `Send()` ke state saat ini: `Connected`, `Reconnecting`, `Disconnected`.

## Kelebihan / Kekurangan
- Kelebihan: Pemisahan perilaku per-state, mempermudah pengujian state individual.
- Kekurangan: Menambah kelas dan kompleksitas manajemen transisi.

## Perhatian
- Jaga agar logika transisi jelas; gunakan diagram atau tabel untuk workflow yang kompleks.

## Referensi
- Gamma dkk., "Design Patterns".