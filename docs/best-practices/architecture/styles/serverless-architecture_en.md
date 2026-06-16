# Serverless Architecture

## Overview

**Serverless Architecture** is a cloud execution model where the provider runs your code in response to events and manages servers, scaling, and much of the runtime lifecycle. You deploy **functions** (FaaS) or managed services (API Gateway, queues, databases) and pay primarily for consumption rather than reserved capacity.

The name is misleading: servers still exist—they are abstracted. The developer focuses on handlers (`onUpload`, `onHTTPRequest`, `onSchedule`) and infrastructure as configuration (IAM, triggers, environment variables). Common platforms include AWS Lambda, Google Cloud Functions, Azure Functions, and Knative on Kubernetes.

Serverless fits spiky, event-shaped work. It struggles with long CPU-bound jobs, large in-memory state, strict low-latency without cold starts, and portable multi-cloud designs without discipline.

## Key characteristics

- **Event triggers** — HTTP, object storage, message queues, cron, database change streams.
- **Automatic scaling** — concurrency scales with load within account limits.
- **Stateless functions** — durable state in external stores (DynamoDB, S3, Redis).
- **Operational model** — patching and capacity planning shift to the provider; observability and limits remain your responsibility.

## When to use

- Variable or unpredictable traffic (webhooks, image thumbnailing, ETL bursts).
- Glue logic between managed cloud services.
- Rapid prototypes and internal tools with minimal ops headcount.

## When not to use

- Sustained high throughput cheaper on reserved VMs or containers—model costs.
- Long-running workers exceeding function timeout limits.
- Latency-sensitive hot paths where cold start variance is unacceptable without provisioned concurrency.

## Trade-offs

| Benefits | Challenges |
| --- | --- |
| Reduced server operations | Vendor lock-in and regional limits |
| Fine-grained pay-per-use | Cold starts, timeouts, memory ceilings |
| Fast horizontal scale | Distributed debugging and local dev parity |

## Example

An image upload to object storage triggers `ResizeThumbnail` Lambda, which writes derivatives back to storage and emits `ThumbnailReady` to a queue for search indexing.

```text
Client upload -> S3 -> Lambda (resize) -> S3 + SQS -> Indexer
```

Pair with **CI/CD** pipelines that package functions and update infrastructure definitions (SAM, Terraform, Serverless Framework).

## Related

- [Event-Driven Architecture](event-driven-architecture_en.md) — natural pairing with triggers
- [Microservices Architecture](microservices-architecture_en.md) — functions as fine-grained services
- [CI/CD](../../practices/integration/ci-cd_en.md) — automate function deploys

## References

- AWS Well-Architected Serverless Lens
- Martin Fowler — serverless definition and trade-off essays
