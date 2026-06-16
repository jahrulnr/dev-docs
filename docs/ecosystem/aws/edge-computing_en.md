# Edge Computing (AWS)

## Overview

**Edge computing** places compute and data closer to users or devices to cut latency and keep data local. On AWS, edge spans **CDN/edge functions** (CloudFront), **5G/Wavelength** zones, **Outposts** (hybrid on-premises AWS racks), **Local Zones**, and **IoT Greengrass** at the device edge.

Choose the tier by latency budget, data residency, and how much AWS API/control plane you need at the edge.

## How it works

| Offering | What it is | Typical latency / placement |
| --- | --- | --- |
| **CloudFront + Lambda@Edge / CloudFront Functions** | Run code at CDN PoPs | ms; HTTP request/response |
| **AWS Wavelength** | Compute in carrier 5G edge | ultra-low latency to mobile UEs |
| **AWS Outposts** | AWS hardware in your datacenter | Local; hybrid API parity |
| **Local Zones** | AWS extension in metro areas | Low latency to city users |
| **IoT Greengrass** | Runtime on gateways/devices | On-site processing, cloud sync |

## When to use

- Interactive or real-time apps where round-trip to a central Region is too slow.
- Data residency or hybrid cloud—workloads must stay on-premises but use AWS tooling (Outposts).
- IoT pipelines that filter/aggregate before cloud ingest.

## When not to use

- Batch analytics with no latency SLA—central Region is simpler and cheaper.
- You can achieve goals with a single Region + CDN static caching only.
- Edge splits complicate debugging—avoid without clear latency or compliance driver.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Lower latency, local processing | Operational complexity, fragmented deploy |
| Hybrid and 5G options for specialized cases | Cost vs centralized compute |
| CDN edge for global HTTP | Limited runtime at edge (size, duration caps) |

## Example

A live dashboard uses CloudFront for static assets and Lambda@Edge for geo routing; factory sensors run Greengrass for anomaly detection before sending aggregates to IoT Core in-region.

## Related

- [AWS Networking](./networking_en.md)
- [AWS Compute](./compute_en.md)
- [AWS IoT](./iot_en.md)

## References

- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [AWS Outposts](https://docs.aws.amazon.com/outposts/)
- [AWS Wavelength](https://docs.aws.amazon.com/wavelength/)
