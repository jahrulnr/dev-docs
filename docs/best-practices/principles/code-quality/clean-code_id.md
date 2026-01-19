# Prinsip Clean Code

## Gambaran Umum

Clean Code adalah filosofi pengembangan software yang menekankan penulisan kode yang mudah dibaca, dipahami, dan dipelihara. Fokusnya adalah pada kejelasan, kesederhanaan, dan ekspresivitas daripada kecerdasan atau kompleksitas. Kode bersih mengurangi technical debt dan membuat software lebih berkelanjutan seiring waktu.

## Prinsip Utama

### 1. Nama Bermakna
- **Gunakan nama yang mengungkapkan maksud**: Nama variabel dan fungsi harus jelas menyatakan tujuannya.
- **Hindari disinformasi**: Jangan gunakan nama yang menyesatkan tentang tujuan atau isi.
- **Buat nama dapat diucapkan**: Nama harus mudah dibaca dan didiskusikan.
- **Gunakan nama yang dapat dicari**: Nama harus cukup panjang untuk ditemukan via pencarian.

### 2. Fungsi
- **Fungsi kecil**: Fungsi harus kecil, melakukan satu hal dengan baik.
- **Tanggung jawab tunggal**: Setiap fungsi harus memiliki satu alasan untuk berubah.
- **Nama deskriptif**: Nama fungsi harus jelas menggambarkan apa yang dilakukannya.
- **Sedikit parameter**: Batasi parameter fungsi (idealnya 0-2, maksimal 3).

### 3. Komentar
- **Jelaskan maksud, bukan kode**: Komentar harus menjelaskan mengapa, bukan apa yang dilakukan kode.
- **Jaga komentar tetap terkini**: Update komentar ketika kode berubah.
- **Gunakan komentar secukupnya**: Kode bersih harus self-documenting.
- **Hindari komentar noise**: Hapus komentar yang redundan atau jelas.

### 4. Formatting
- **Indentasi konsisten**: Gunakan spasi dan alignment yang konsisten.
- **Kepadatan vertikal**: Kelompokkan konsep terkait bersama.
- **Alignment horizontal**: Jaga baris tetap readable (biasanya <120 karakter).
- **Standar tim**: Ikuti konvensi formatting yang telah ditetapkan.

## Contoh

### Contoh Buruk (Kode Tidak Bersih)

```javascript
// Buruk: Nama tidak jelas dan fungsi besar
function calc(x, y, z) {
  let res = 0;
  if (x > 0) {
    res = y * z;
  } else {
    res = y + z;
  }
  // Logika lebih kompleks...
  for (let i = 0; i < 10; i++) {
    res += i;
  }
  return res;
}
```

### Contoh Baik (Kode Bersih)

```javascript
// Baik: Nama jelas, fungsi kecil, self-documenting
function calculateOrderTotal(subtotal, taxRate, discountAmount) {
  const taxAmount = calculateTax(subtotal, taxRate);
  const discount = calculateDiscount(subtotal, discountAmount);
  return subtotal + taxAmount - discount;
}

function calculateTax(amount, rate) {
  return amount * rate;
}

function calculateDiscount(amount, discountAmount) {
  return Math.min(discountAmount, amount * 0.1); // Maksimal diskon 10%
}
```

## Code Smells yang Harus Dihindari

- **Kode duplikat**: Ekstrak fungsionalitas umum ke fungsi yang dapat digunakan ulang.
- **Metode panjang**: Pecah metode besar menjadi yang lebih kecil dan fokus.
- **Kelas besar**: Pisah kelas yang memiliki terlalu banyak tanggung jawab.
- **Penamaan tidak konsisten**: Gunakan konvensi penamaan yang konsisten di seluruh.
- **Kode mati**: Hapus variabel, metode, dan import yang tidak digunakan.
- **Angka magic**: Ganti dengan konstanta bernama.

## Praktik Terbaik

### Proses Pengembangan
- **Pair programming**: Review kode secara real-time untuk feedback langsung.
- **Code reviews**: Review rekan reguler untuk menjaga standar kualitas.
- **Refactoring**: Terus tingkatkan kode tanpa mengubah fungsionalitas.
- **Testing otomatis**: Tulis test untuk memastikan refactoring tidak merusak fungsionalitas.

### Alat dan Teknik
- **Linters**: Gunakan ESLint, Prettier untuk formatting konsisten.
- **Analisis kode**: Alat seperti SonarQube untuk mendeteksi code smells.
- **Dokumentasi**: Jaga README dan inline docs tetap terkini.
- **Version control**: Gunakan pesan commit bermakna dan penamaan branch.

## Manfaat

- **Maintainability**: Lebih mudah memodifikasi dan memperluas kode.
- **Debugging**: Lebih cepat mengidentifikasi dan memperbaiki masalah.
- **Onboarding**: Developer baru dapat memahami kode dengan cepat.
- **Kolaborasi**: Tim kerja yang lebih baik dengan kode yang jelas dan readable.
- **Technical Debt**: Mengurangi akumulasi kode bermasalah.

## Tantangan Umum

- **Tekanan waktu**: Pengembangan terburu-buru menyebabkan shortcut.
- **Legacy code**: Kode tidak bersih yang ada sulit diubah.
- **Konsistensi tim**: Gaya coding berbeda di antara anggota tim.
- **Kurva belajar**: Memerlukan disiplin dan latihan.

## Strategi Implementasi

1. **Mulai kecil**: Mulai dengan konvensi penamaan dan refactoring kecil.
2. **Kesepakatan tim**: Tetapkan standar coding dan proses review.
3. **Perbaikan bertahap**: Refactor kode yang ada secara bertahap.
4. **Edukasi**: Latih anggota tim tentang prinsip clean code.
5. **Pengukuran**: Track metrik kualitas kode seiring waktu.

## Referensi

- [Clean Code oleh Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [The Clean Coder oleh Robert C. Martin](https://www.amazon.com/Clean-Coder-Conduct-Professional-Programmers/dp/0137081073)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
- [Code Complete oleh Steve McConnell](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)