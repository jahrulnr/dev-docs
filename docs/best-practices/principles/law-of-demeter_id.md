# Law of Demeter

## Overview

**Law of Demeter** (LoD), atau "prinsip pengetahuan minimum," menyatakan modul hanya boleh berbicara dengan teman langsungnya—bukan orang asing. Dalam praktik: hindari rantai panjang *getter* yang menembus graf objek (`order.getCustomer().getAddress().getZip()`), yang mengikat pemanggil ke struktur internal yang jauh.

LoD mendorong **interface sempit** dan **tell, don't ask**: minta objek melakukan pekerjaan dengan datanya sendiri alih-alalu menarik internal untuk dimanipulasi di tempat lain. Pelanggaran ("train wreck") membuat refactor menyakitkan—mengubah `Address` merusak kode yang seharusnya tidak bergantung padanya.

LoD adalah panduan, bukan dogma. DTO, *mapper*, dan lapisan query kadang butuh banyak field; kandung pengetahuan itu di satu tempat alih-alalu menyebarkan panggilan *reach-through*.

## Key ideas

- Metode pada *class* hanya boleh memakai: dirinya sendiri, parameter, objek yang dibuatnya, komponen langsungnya.
- Utamakan metode domain (`order.shipToZip()`) daripada mengekspos graf objek dalam.
- Facade dan *application service* mengoordinasikan tanpa membocorkan setiap *getter entity*.
- Di Go, *interface* kecil di titik panggilan mengurangi godaan menembus *struct*.

## When to use

- Model domain di mana enkapsulasi melindungi invariant.
- API yang menstabilkan batas modul antar tim.
- Refactor kode *legacy* dengan rantai dependensi rapuh.

## When not to use

- Pelaporan atau analitik yang sah mengagregasi banyak field—gunakan *read model* atau proyeksi khusus.
- Lapisan serialisasi yang harus memetakan pohon objek penuh—lokalisasikan pemetaan.
- Jalur kritis performa dengan profil yang menunjukkan overhead delegasi (jarang).

## Trade-offs

| Mengikuti LoD | Biaya |
| --- | --- |
| Coupling lebih longgar, refactor lebih aman | Lebih banyak metode *wrapper* atau *service* |
| Kepemilikan perilaku lebih jelas | Bisa terasa verbose untuk pembawa data sederhana |
| Menyembunyikan perubahan graf internal | Indireksi bagi pembaca yang kurang kenal domain |

## Example

Hindari:

```go
zip := order.Customer.Address.Zip // train wreck
```

Lebih baik:

```go
zip, err := order.ShippingZip()
```

`Order` mendelegasikan ke `Customer`/`Address` yang dimilikinya secara internal; pemanggil tetap stabil jika penyimpanan alamat berubah.

## Related

- [Separation of Concerns](separation-of-concerns_id.md) — batasi apa yang diketahui setiap modul
- [Facade](../patterns/design/facade_id.md) — titik masuk stabil atas *subsystem*
- [SOLID](solid_id.md) — terutama enkapsulasi dan *interface segregation*

## References

- Lieberherr et al. — Law of Demeter asli (Northeastern University, 1987)
- Hunt & Thomas — *The Pragmatic Programmer*, "Tell, Don't Ask"
