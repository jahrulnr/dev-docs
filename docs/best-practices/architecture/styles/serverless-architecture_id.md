# Arsitektur Serverless

## Gambaran Umum

Arsitektur Serverless mendelegasikan manajemen server ke penyedia cloud, menjalankan kode sebagai respons terhadap event tanpa penyediaan server. Fungsi dieksekusi sesuai permintaan, diskalakan secara otomatis. Gaya ini fokus pada logika kode, mengurangi overhead operasional, tetapi dapat menyebabkan vendor lock-in dan masalah cold start.

## Karakteristik Utama

- **Function as a Service (FaaS)**: Kode berjalan dalam fungsi stateless (misalnya, AWS Lambda).
- **Dipicu Event**: Dipanggil oleh permintaan HTTP, perubahan basis data, dll.
- **Auto-Scaling**: Diskalakan berdasarkan permintaan.
- **Tidak Ada Manajemen Server**: Penyedia menangani infrastruktur.

## Kapan Digunakan

- Aplikasi dengan traffic variabel atau tidak dapat diprediksi.
- Prototyping atau beban kerja event-driven.
- Hindari untuk proses berjalan lama atau kebutuhan latensi rendah.

## Keuntungan

- Efisiensi biaya: Bayar hanya untuk waktu eksekusi.
- Skalabilitas dan ops yang dikurangi.
- Pengembangan lebih cepat.

## Kekurangan

- Vendor lock-in.
- Cold start dan timeout.
- Tantangan debugging.

## Contoh

Layanan pemrosesan file yang dipicu oleh upload.

## Pola Terkait

- Event-Driven, Microservices.
- Lihat dokumen AWS Serverless.

## Referensi

- Arsitektur Serverless AWS.