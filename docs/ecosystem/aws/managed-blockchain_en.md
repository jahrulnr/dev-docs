# Amazon Managed Blockchain

## Overview

**Amazon Managed Blockchain** is a managed service for creating and operating blockchain networks using frameworks such as **Hyperledger Fabric** and (historically) Ethereum-related setups. AWS handles node provisioning, certificates, and scaling so teams can focus on chaincode/smart contracts and consortium governance.

Blockchain fits **multi-party workflows** where participants need a shared, append-only ledger—not general-purpose databases. Verify current framework support and regional availability in AWS docs before new designs; the product surface has evolved and many teams now use purpose-built ledgers or L2 solutions instead.

## How it works

- Create a **network** and invite members (accounts) with defined roles.
- Deploy **peer nodes**; managed service handles TLS, ordering service (Fabric), and upgrades within supported bounds.
- Applications invoke **chaincode** (Fabric) via SDK; state is replicated across members.

Costs include instance hours, storage, and data transfer between members.

## When to use

- Consortium scenarios: supply chain, trade finance, auditable multi-org workflows.
- You need managed nodes and CA integration without operating your own blockchain ops team.
- Regulatory requirements favor permissioned networks over public chains.

## When not to use

- Simple shared database suffices (use RDS/DynamoDB with audit log).
- Public cryptocurrency or DeFi on mainnet—different stack and compliance model.
- High-throughput OLTP—blockchain throughput and consensus latency are poor fits.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Reduced ops for permissioned networks | Niche; higher complexity than SQL |
| AWS integration (IAM, CloudWatch) | Cost and skill set (chaincode, governance) |
| Multi-member trust model | Slower than centralized DB |

## Example

Retail and logistics partners run a Fabric network; each party peers order and shipment events; chaincode enforces access rules per organization MSP.

## Related

- [AWS Security](./security_en.md)
- [Event-driven architecture](../../best-practices/architecture/styles/event-driven-architecture_en.md)

## References

- [Amazon Managed Blockchain](https://docs.aws.amazon.com/managed-blockchain/)
- Hyperledger Fabric documentation (open source framework)
