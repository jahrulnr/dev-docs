# CI/CD (Continuous Integration / Continuous Delivery)
## Overview

CI/CD is a set of practices that automate build, test, and deployment pipelines to deliver software changes rapidly, reliably, and consistently. This enables faster and higher-quality delivery.

## Core Concepts
- **Continuous Integration (CI)**: Developers frequently integrate code into a shared repository; automated builds and tests run on each integration.
- **Continuous Delivery / Deployment (CD)**: Changes that pass the pipeline are automatically packaged and either made ready for release (delivery) or deployed to production (deployment).

## Typical Pipeline Steps
- Source checkout -> Build -> Unit tests -> Static analysis -> Integration tests -> Artifact publish -> Deploy to staging -> Smoke tests -> Deploy to production

## Benefits
- Faster feedback loop, fewer integration issues
- Higher deployment confidence and reproducibility
- Shorter time-to-market and safer releases

## Best Practices
- Keep pipelines fast and reliable (parallelize tests)
- Use feature flags for incremental release
- Automate rollbacks and health checks
- Secure pipeline credentials and artifact stores

## References
- https://martinfowler.com/articles/continuousIntegration.html
- https://12factor.net/
