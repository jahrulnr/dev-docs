# Fail Fast
## Gambaran Umum

Fail Fast means detecting errors early and stopping execution to avoid cascading failures; it favors early validation and clear failure signals. Pendekatan ini mencegah kegagalan diam dan membuat debugging lebih mudah dengan menangkap masalah segera setelah terjadi.

## Kapan digunakan
Use during input validation, startup checks, and early in processing pipelines to surface issues quickly.

## Contoh
Validate configuration on startup and refuse to run if required settings are missing.

## Kelebihan / Kekurangan
- Kelebihan: Faster detection of issues, easier debugging.
- Kekurangan: May terminate processes that could recover if not handled carefully.

## Referensi
- Reliability and defensive programming guides.