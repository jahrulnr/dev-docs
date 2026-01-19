# Trunk-Based Development

## Overview

Trunk-Based Development (TBD) is a branching methodology where all developers work directly on or with short-lived branches that are frequently merged into the main branch (trunk). This approach promotes small, frequent, and automated code integrations, supported by feature flags to control incomplete features. TBD reduces merge conflict complexity, accelerates feedback loops, and enables effective continuous integration/continuous delivery (CI/CD).

Unlike traditional branching models like Git Flow with long-lived feature branches, TBD keeps the trunk always in a releasable state, allowing teams to deploy at any time.

## Core Principles

- **Short-Lived Branches**: Feature branches are created for a few hours or days, then quickly merged.
- **Daily Integration**: Code is merged at least once daily to avoid large divergences.
- **Feature Flags**: Use toggles to hide incomplete features from production.
- **Automated Testing**: A strong CI/CD pipeline to validate every merge.
- **Collaborative Culture**: Intensive communication among teams to avoid conflicts.

## Basic Workflow

1. **Pull from Trunk**: Always start from the latest trunk.
2. **Create Feature Branch**: If needed, create a local branch (e.g., `feature/user-auth`).
3. **Develop and Test**: Write code, commit frequently, run local tests.
4. **Merge to Trunk**: Push and create a pull request; merge after review and CI pass.
5. **Deploy**: Trunk is always ready for deployment via CI/CD.

Simple workflow example with Git:

```bash
# Pull latest trunk
git checkout main
git pull origin main

# Create feature branch (optional for small changes)
git checkout -b feature/add-login

# Develop and commit
git add .
git commit -m "Add login functionality"

# Push and create PR
git push origin feature/add-login

# After review, merge to main
git checkout main
git merge feature/add-login
```

## Suitability for Development Methodologies

TBD is highly suitable for methodologies that emphasize speed and rapid iteration:

- **Agile/Scrum**: Supports short sprints with incremental delivery. Teams can release small features every sprint without waiting for large branches to complete.
- **Continuous Delivery**: Ideal for CD because the trunk is always releasable. Combining TBD + CD enables daily or multiple deployments per day.
- **DevOps Culture**: Encourages collaboration between dev, ops, and QA. CI/CD becomes the backbone for automation.
- **Microservices/Cloud-Native**: Fits teams deploying frequently; feature flags help with A/B testing and canary releases.

Less suitable for:
- Large teams with poor coordination (high conflict risk).
- Projects with rare releases or waterfall models.
- Legacy systems without mature CI/CD.

## Implementation Examples

### Example in an Agile Team
The team uses Scrum with 2-week sprints. Every day, developers merge code to trunk. Feature flags are used for experimental features. At sprint end, trunk is deployed to staging, then production if stable.

### Example with Feature Flags
```javascript
// Simple feature flag example in code
const isNewFeatureEnabled = process.env.FEATURE_NEW_UI === 'true';

if (isNewFeatureEnabled) {
  // New feature code
  renderNewUI();
} else {
  // Old code
  renderOldUI();
}
```

Flags are controlled via environment variables or services like LaunchDarkly.

## Pros and Cons

### Pros
- **Faster Delivery**: Frequent merges reduce risks and accelerate feedback.
- **Reduced Conflicts**: Short branches avoid large divergences.
- **Continuous Integration**: Forces good CI practices.
- **Flexible Releases**: Feature flags allow deployment without exposing features.
- **Better Collaboration**: Teams are more integrated, reducing silos.

### Cons
- **High Discipline**: Requires commitment to frequent merges and thorough testing.
- **CI/CD Mandatory**: Without a strong pipeline, trunk can become unstable.
- **Feature Flag Complexity**: Overhead in managing many flags if overused.
- **Resistance to Change**: Teams accustomed to Git Flow may resist.
- **Rollback Challenges**: If a major bug occurs, rollback can be more complex.

## Best Practices

- **Pair Programming/Review**: Always review code before merging.
- **Automated Tests**: Minimum 80% coverage, including integration tests.
- **Monitoring**: Use tools like Sentry or New Relic to detect issues post-deployment.
- **Branch Naming**: Use conventions like `feature/`, `bugfix/`, `hotfix/`.
- **Limit Branch Lifetime**: Maximum 1-2 days for feature branches.
- **Education**: Train the team on TBD and feature flags.

## Common Pitfalls

- **Unstable Trunk**: Weak CI leads to bad merges breaking trunk.
- **Feature Flag Debt**: Forgetting to remove old flags complicates code.
- **Resistance**: Teams may resist due to habit.
- **Over-reliance on Flags**: Don't use flags to hide bad code.
- **Poor Testing**: Skipping tests leads to undetected issues.

## References
- Book "Accelerate" by Nicole Forsgren et al. (DevOps metrics).
- Paul Hammant's articles on Trunk-Based Development.
- "Continuous Delivery" book by Jez Humble and David Farley.
- Tools: Git, GitHub/GitLab, Jenkins/CircleCI, LaunchDarkly for feature flags.