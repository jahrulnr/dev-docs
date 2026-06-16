# CI/CD (Continuous Integration / Continuous Delivery)

## Overview

**CI/CD** bundles practices and automation that integrate code changes frequently, verify quality automatically, and deliver or deploy releasable artifacts with minimal manual steps. **Continuous Integration (CI)** merges work into a shared line often—each merge triggers build, test, and analysis. **Continuous Delivery (CD)** keeps the main branch always deployable; **Continuous Deployment** goes further by automatically promoting passing builds to production.

Modern pipelines are code: YAML in GitHub Actions, GitLab CI, Jenkins, or Tekton. They encode the path from commit to running software—compile, unit tests, SAST, container image build, integration tests, staging deploy, smoke tests, production rollout with approvals or progressive strategies.

CI/CD reduces integration risk, shortens feedback loops, and makes releases repeatable. It does not replace good tests, observability, or rollback design; a fast pipeline that ships broken code is harmful.

## Core concepts

- **Pipeline as code** — versioned, reviewable, reproducible.
- **Artifact immutability** — build once, promote the same image/binary through environments.
- **Fast feedback** — fail early on unit tests; parallelize slow suites.
- **Environment parity** — staging mirrors production topology enough to catch real issues.
- **Secrets management** — credentials in vaults/CI secret stores, never in repo.

## When to use

- Any team shipping software to shared environments (always, for professional delivery).
- Microservices, libraries, and infrastructure repos benefiting from automated verification.
- Regulated environments needing audit trails of who deployed what and when.

## When not to use

- Truly throwaway experiments with no repeat deploy—still consider minimal CI for tests.
- Do not automate deploy to production without tests and rollback paths "because CI/CD says so."

## Trade-offs

| Automated pipelines | Pitfalls |
| --- | --- |
| Faster, safer releases | Initial setup and maintenance cost |
| Consistent quality gates | Flaky tests erode trust—fix or quarantine |
| Auditability | Over-long pipelines delay feedback |

## Example

Typical stages:

```text
commit -> lint/unit test -> build image -> integration test
       -> push to registry -> deploy staging -> smoke test
       -> manual approval (delivery) or auto deploy (deployment) -> prod
```

Use **feature flags** to decouple deploy from release. Pair production deploys with [blue-green](../deployment/blue-green-deployment_en.md) or [canary](../deployment/canary-deployment_en.md) strategies.

## Related

- [Blue-Green Deployment](../deployment/blue-green-deployment_en.md) — zero-downtime cutover
- [Canary Deployment](../deployment/canary-deployment_en.md) — gradual traffic shift
- [Fail Fast](../../principles/fail-fast_en.md) — fail pipelines early on bad input

## References

- Martin Fowler — Continuous Integration and Continuous Delivery articles
- DORA metrics — deployment frequency, lead time, change failure rate
