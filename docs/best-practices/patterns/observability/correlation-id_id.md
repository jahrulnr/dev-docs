# Correlation ID
## Gambaran Umum

Correlation ID adalah identifier unik yang dilampirkan ke permintaan yang memungkinkan penelusuran jalur permintaan melalui layanan dan log. Ini memungkinkan debugging yang efektif di sistem terdistribusi dengan menghubungkan log dan trace dari alur permintaan yang sama.

## Kapan digunakan
Gunakan untuk distributed tracing dan debugging untuk mengkorelasikan log dan trace dari alur permintaan yang sama.

## Contoh
Lampirkan `X-Request-ID` pada permintaan HTTP masuk dan propagasi ke seluruh layanan dan log.

## Kelebihan / Kekurangan
- Kelebihan: Mempermudah debugging antar layanan.
- Kekurangan: Membutuhkan propagasi dan instrumentasi konsisten.

## Referensi
- Panduan tracing dan logging terdistribusi.