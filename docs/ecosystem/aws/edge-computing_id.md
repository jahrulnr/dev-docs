# Edge Computing (AWS)

## Overview

**Edge computing** menempatkan compute dan data lebih dekat ke user atau device untuk mengurangi latency dan menjaga data lokal. Di AWS, edge mencakup **CDN/edge functions** (CloudFront), **5G/Wavelength**, **Outposts** (hybrid on-premises AWS rack), **Local Zones**, dan **IoT Greengrass** di device edge.

Pilih tier berdasarkan latency budget, data residency, dan seberapa banyak AWS API/control plane yang dibutuhkan di edge.

## How it works

| Offering | Apa itu | Penempatan / latency tipikal |
| --- | --- | --- |
| **CloudFront + Lambda@Edge / CloudFront Functions** | Code di CDN PoP | ms; HTTP request/response |
| **AWS Wavelength** | Compute di carrier 5G edge | ultra-low latency ke mobile UE |
| **AWS Outposts** | Hardware AWS di datacenter Anda | Lokal; hybrid API parity |
| **Local Zones** | Perpanjangan AWS di area metro | Low latency ke user kota |
| **IoT Greengrass** | Runtime di gateway/device | On-site processing, cloud sync |

## When to use

- Aplikasi interaktif atau real-time saat round-trip ke Region pusat terlalu lambat.
- Data residency atau hybrid cloud—workload harus on-premises tapi pakai tooling AWS (Outposts).
- Pipeline IoT yang filter/aggregate sebelum cloud ingest.

## When not to use

- Batch analytics tanpa SLA latency—Region pusat lebih sederhana dan murah.
- Tujuan tercapai dengan satu Region + CDN static caching saja.
- Edge split mempersulit debugging—hindari tanpa driver latency atau compliance yang jelas.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Latency lebih rendah, local processing | Operational complexity, deploy terfragmentasi |
| Opsi hybrid dan 5G untuk kasus khusus | Biaya vs centralized compute |
| CDN edge untuk HTTP global | Runtime terbatas di edge (size, duration cap) |

## Example

Live dashboard memakai CloudFront untuk static asset dan Lambda@Edge untuk geo routing; sensor pabrik menjalankan Greengrass untuk anomaly detection sebelum mengirim aggregate ke IoT Core in-region.

## Related

- [AWS Networking](./networking_id.md)
- [AWS Compute](./compute_id.md)
- [AWS IoT](./iot_id.md)

## References

- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [AWS Outposts](https://docs.aws.amazon.com/outposts/)
