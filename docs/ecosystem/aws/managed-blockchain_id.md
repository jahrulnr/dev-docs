# Amazon Managed Blockchain

## Overview

**Amazon Managed Blockchain** adalah managed service untuk membuat dan mengoperasikan blockchain network memakai framework seperti **Hyperledger Fabric**. AWS menangani provisioning node, certificate, dan scaling sehingga tim fokus pada chaincode/smart contract dan governance konsorsium.

Blockchain cocok untuk **workflow multi-pihak** yang butuh ledger append-only bersama—bukan pengganti database umum. Verifikasi dukungan framework dan regional availability di dokumentasi AWS sebelum desain baru; banyak tim kini memakai ledger khusus atau solusi L2.

## How it works

- Buat **network** dan undang member (account) dengan role yang didefinisikan.
- Deploy **peer node**; managed service menangani TLS, ordering service (Fabric), dan upgrade dalam batas yang didukung.
- Aplikasi memanggil **chaincode** (Fabric) via SDK; state direplikasi antar member.

Biaya mencakup instance hours, storage, dan data transfer antar member.

## When to use

- Skenario konsorsium: supply chain, trade finance, workflow multi-org yang auditable.
- Butuh managed node dan integrasi CA tanpa tim ops blockchain sendiri.
- Regulasi mengarah ke permissioned network daripada public chain.

## When not to use

- Shared database sederhana cukup (pakai RDS/DynamoDB dengan audit log).
- Public cryptocurrency atau DeFi mainnet—stack dan compliance berbeda.
- High-throughput OLTP—throughput blockchain dan latency consensus kurang cocok.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Ops berkurang untuk permissioned network | Niche; complexity lebih tinggi dari SQL |
| Integrasi AWS (IAM, CloudWatch) | Biaya dan skill set (chaincode, governance) |
| Model trust multi-member | Lebih lambat dari DB terpusat |

## Example

Mitra retail dan logistik menjalankan Fabric network; tiap pihak peer event order dan shipment; chaincode menegakkan access rule per organization MSP.

## Related

- [AWS Security](./security_id.md)
- [Event-driven architecture](../../best-practices/architecture/styles/event-driven-architecture_id.md)

## References

- [Amazon Managed Blockchain](https://docs.aws.amazon.com/managed-blockchain/)
