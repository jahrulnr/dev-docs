---
name: dev-docs
description: >-
  Lookup bilingual dev documentation for architecture, design patterns, SOLID/DDD,
  anti-patterns, AWS/Azure/GCP services, Kubernetes, Docker, protocols (HTTP, gRPC,
  SSE, WebSocket), and infrastructure tools. Use when designing systems, choosing
  cloud or infra tech, reviewing architecture, or needing best-practice reference.
  Resolve paths via index.json routing — do not glob or semantic-search docs/ blindly.
---

# dev-docs

Personal knowledge base at `/home/jahrulnr/.agents/skills/dev-docs/`. ~165 English topics (+ Indonesian mirrors). Load after `agent-workflows` and `automation-learning`.

## Fast lookup (mandatory)

**Never** glob `docs/`, semantic-search the whole tree, or read root `README.md` for routing.

1. **Inline table below** — hit common topics in one step.
2. **`grep` `index.json`** — `grep -i "circuit breaker" /home/jahrulnr/.agents/skills/dev-docs/index.json`
3. **CLI** — `node /home/jahrulnr/.agents/skills/dev-docs/scripts/lookup.mjs "aws rds"`
4. **Slug formula** — `docs/{slug}_{lang}.md` when slug is known (see pillars).

Read **1–3 docs max** per query. Prefer English unless user writes Indonesian → use `_id.md`.

## Language rule

| User language | Suffix |
| --- | --- |
| Indonesian (ID) | `_id.md` |
| English / mixed / default | `_en.md` |

## Pillar decision tree

| Intent | Start here |
| --- | --- |
| Arch style (mono, micro, serverless, EDA) | `docs/best-practices/architecture/styles/` |
| Arch pattern (clean, hexagonal, DDD, BFF) | `docs/best-practices/architecture/patterns/` |
| GoF / design pattern | `docs/best-practices/patterns/design/` |
| Resilience (circuit breaker, retry, saga) | `docs/best-practices/patterns/reliability/` or `integration/` |
| Data access (repository, CQRS, UoW) | `docs/best-practices/patterns/data-access/` or `integration/` |
| Principle (SOLID, DRY, zero trust) | `docs/best-practices/principles/` |
| Anti-pattern | `docs/best-practices/anti-patterns/` |
| CI/CD, deployment, feature flags | `docs/best-practices/practices/` |
| AWS / Azure / GCP service | `docs/ecosystem/{aws,azure,google-cloud}/` |
| Infra tool (k8s, terraform, kafka) | `docs/technologies/infrastructure/` |
| Protocol (http, grpc, sse, mqtt) | `docs/technologies/protocols/` |

Ecosystem READMEs (`docs/ecosystem/aws/README.md`) are valid **second** hop when a service category is unclear.

## Top routing (O(1))

Path base: `/home/jahrulnr/.agents/skills/dev-docs/`. Replace `{lang}` with `en` or `id`.

| Trigger | Doc |
| --- | --- |
| clean architecture | `docs/best-practices/architecture/patterns/clean-architecture_{lang}.md` |
| hexagonal, ports adapters | `docs/best-practices/architecture/patterns/hexagonal-architecture_{lang}.md` |
| ddd, domain driven | `docs/best-practices/architecture/patterns/ddd_{lang}.md` |
| microservices | `docs/best-practices/architecture/styles/microservices-architecture_{lang}.md` |
| event driven architecture | `docs/best-practices/architecture/styles/event-driven-architecture_{lang}.md` |
| serverless | `docs/best-practices/architecture/styles/serverless-architecture_{lang}.md` |
| solid | `docs/best-practices/principles/solid_{lang}.md` |
| dry, kiss, yagni | `docs/best-practices/principles/code-quality/` |
| zero trust | `docs/best-practices/principles/security/zero-trust_{lang}.md` |
| circuit breaker | `docs/best-practices/patterns/reliability/circuit-breaker_{lang}.md` |
| retry, backoff | `docs/best-practices/patterns/reliability/retry_{lang}.md` |
| saga | `docs/best-practices/patterns/integration/saga_{lang}.md` |
| cqrs | `docs/best-practices/patterns/integration/cqrs_{lang}.md` |
| event sourcing | `docs/best-practices/patterns/integration/event-sourcing_{lang}.md` |
| repository pattern | `docs/best-practices/patterns/design/repository_{lang}.md` |
| api gateway | `docs/best-practices/patterns/integration/api-gateway_{lang}.md` |
| distributed monolith | `docs/best-practices/anti-patterns/distributed-monolith_{lang}.md` |
| kubernetes, k8s | `docs/technologies/infrastructure/kubernetes_{lang}.md` |
| docker | `docs/technologies/infrastructure/docker_{lang}.md` |
| terraform, iac | `docs/technologies/infrastructure/terraform_{lang}.md` |
| kafka | `docs/technologies/infrastructure/kafka_{lang}.md` |
| rabbitmq | `docs/technologies/infrastructure/rabbitmq_{lang}.md` |
| nginx | `docs/technologies/infrastructure/nginx_{lang}.md` |
| prometheus, grafana | `docs/technologies/infrastructure/prometheus_{lang}.md` / `grafana_{lang}.md` |
| elk, elasticsearch | `docs/technologies/infrastructure/elk-stack_{lang}.md` |
| istio, service mesh | `docs/technologies/infrastructure/istio_{lang}.md` |
| http, rest | `docs/technologies/protocols/http_{lang}.md` |
| grpc | `docs/technologies/protocols/grpc_{lang}.md` |
| graphql | `docs/technologies/protocols/graphql_{lang}.md` |
| websocket | `docs/technologies/protocols/websocket_{lang}.md` |
| sse, server sent events | `docs/technologies/protocols/sse_{lang}.md` |
| mqtt | `docs/technologies/protocols/mqtt_{lang}.md` |
| aws compute, ec2, lambda | `docs/ecosystem/aws/compute_{lang}.md` |
| aws s3, storage | `docs/ecosystem/aws/storage_{lang}.md` |
| aws rds, dynamodb | `docs/ecosystem/aws/database_{lang}.md` |
| aws vpc, cloudfront | `docs/ecosystem/aws/networking_{lang}.md` |
| aws iam, security | `docs/ecosystem/aws/security_{lang}.md` |
| aws sqs, sns, eventbridge | `docs/ecosystem/aws/event-driven_{lang}.md` |
| aws cicd, codepipeline | `docs/ecosystem/aws/deployment_{lang}.md` |
| azure compute | `docs/ecosystem/azure/compute_{lang}.md` |
| gcp gke, cloud run | `docs/ecosystem/google-cloud/compute_{lang}.md` |

Full keyword map: [routing-table.md](routing-table.md) or [index.json](index.json).

## Code-generation tasks

When generating or reviewing code, read applicable **principles** first (`docs/best-practices/principles/`), then **patterns**, then technology-specific docs. Docs enforce DDD, clean architecture, TDD, zero-trust input validation.

## New or updated documentation (lifecycle)

Do not assert "current" facts from training memory. Use **`doc-authoring`** for the full chain:

| Step | Skill |
| --- | --- |
| Plan | `doc-research-plan` |
| Research | `github-landscape-research` |
| Validate | `doc-research-validate` |
| Write | `doc-write` |
| Review | `doc-self-review` |
| Index | `node scripts/build-index.mjs` |

Quick lookup of existing topics stays in **this** skill only.

## Index maintenance

After adding or renaming docs under `docs/`:

```bash
node /home/jahrulnr/.agents/skills/dev-docs/scripts/build-index.mjs
```

## Response style

- Cite the doc path used.
- Summarize actionable guidance; do not dump entire markdown files.
- Cross-link related docs only when the task needs them (max 2 extra reads).
