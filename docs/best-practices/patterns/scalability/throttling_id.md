# Throttling
## Gambaran Umum

Throttling membatasi laju permintaan untuk melindungi layanan dari overload dan memastikan penggunaan sumber daya yang adil. Pola ini membantu menjaga ketersediaan layanan dan mencegah kegagalan cascading di bawah beban tinggi.

## Kapan digunakan
Gunakan untuk mencegah penyalahgunaan, menghindari overload saat lonjakan trafik, dan menjaga stabilitas sistem.

## Contoh
Rate limiting per API key: 100 request per menit, respon 429 jika berlebih.

## Kelebihan / Kekurangan
- Kelebihan: Melindungi sistem, mencegah kegagalan berantai.
- Kekurangan: Bisa menolak permintaan sah saat beban; perlu desain kebijakan yang baik.

## Referensi
- Praktik terbaik rate limiting API.