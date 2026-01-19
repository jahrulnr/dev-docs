# Composition over Inheritance
## Gambaran Umum

Composition favors combining smaller components to build behavior rather than deep inheritance hierarchies. Pendekatan ini menghasilkan kode yang lebih mudah dipelihara dan fleksibel dengan mempromosikan loose coupling dan pengujian yang lebih mudah.

## Kapan digunakan
Use to increase flexibility and avoid fragile base class problems common with deep inheritance.

## Contoh
Compose a `ReportingService` with `Storage` and `Formatter` components instead of inheriting from a base class.

## Kelebihan / Kekurangan
- Kelebihan: Greater flexibility, easier testing and substitution.
- Kekurangan: Can require more boilerplate glue code.

## Referensi
- Object-oriented design best practices.