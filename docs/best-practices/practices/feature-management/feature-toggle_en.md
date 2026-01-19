# Feature Toggle Pattern

## Overview

Feature Toggles (also known as Feature Flags or Feature Switches) are a powerful technique for controlling feature availability at runtime without deploying new code. This enables safer deployments, gradual rollouts, A/B testing, and quick rollbacks.

## When to Use

- **Progressive Delivery**: Roll out features to subsets of users gradually
- **A/B Testing**: Test different feature implementations with real users
- **Dark Launches**: Deploy features that aren't yet visible to users
- **Emergency Rollbacks**: Quickly disable problematic features without redeployment
- **Trunk-Based Development**: Enable features for QA while keeping them hidden from production

## Types of Feature Toggles

1. **Release Toggles**: Control rollout of incomplete features
2. **Experiment Toggles**: Enable A/B testing and experimentation
3. **Ops Toggles**: Allow operational control (maintenance mode, etc.)
4. **Permission Toggles**: Control feature access based on user permissions

## Implementation Example

### Basic Implementation

```javascript
class FeatureToggleService {
  constructor(configService) {
    this.configService = configService;
  }

  isEnabled(featureName, userId = null) {
    const toggle = this.configService.getToggle(featureName);

    if (!toggle.enabled) return false;

    // Check user-based rollout
    if (toggle.rolloutPercentage && userId) {
      const userHash = this.hashUserId(userId);
      return userHash % 100 < toggle.rolloutPercentage;
    }

    return toggle.enabled;
  }

  hashUserId(userId) {
    // Simple hash function for user distribution
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 100;
  }
}

// Usage in application
class CheckoutService {
  constructor(featureToggleService) {
    this.featureToggleService = featureToggleService;
  }

  async processPayment(orderData, userId) {
    if (this.featureToggleService.isEnabled('newCheckoutFlow', userId)) {
      return this.processWithNewFlow(orderData);
    } else {
      return this.processWithLegacyFlow(orderData);
    }
  }
}
```

### Configuration Example

```json
{
  "featureToggles": {
    "newCheckoutFlow": {
      "enabled": true,
      "rolloutPercentage": 25,
      "description": "New streamlined checkout process"
    },
    "advancedAnalytics": {
      "enabled": false,
      "rolloutPercentage": 0,
      "description": "Advanced user analytics dashboard"
    },
    "maintenanceMode": {
      "enabled": false,
      "description": "Put application in maintenance mode"
    }
  }
}
```

## Best Practices

### Toggle Management
- **Naming Convention**: Use descriptive names like `enableNewCheckoutFlow`
- **Documentation**: Document what each toggle controls and when to remove it
- **Ownership**: Assign responsibility for each toggle to specific teams

### Implementation Guidelines
- **Default Values**: Always provide safe defaults when toggles fail
- **Performance**: Cache toggle values to avoid repeated lookups
- **Testing**: Test both enabled and disabled states of each toggle
- **Monitoring**: Track toggle usage and impact on application metrics

### Lifecycle Management
- **Short-lived Toggles**: Remove toggles within 1-2 weeks after full rollout
- **Audit Trail**: Log when toggles are enabled/disabled and by whom
- **Gradual Cleanup**: Phase out old code paths after toggle removal

## Tools and Frameworks

- **LaunchDarkly**: Enterprise feature flag management platform
- **Split.io**: Feature flag and experimentation platform
- **ConfigCat**: Developer-friendly feature flag service
- **Unleash**: Open-source feature flag platform
- **FF4J**: Java-based feature flag framework

## Common Pitfalls

- **Toggle Debt**: Accumulating too many toggles that are never removed
- **Complex Logic**: Overusing toggles for complex business logic
- **Performance Issues**: Not caching toggle values in high-traffic applications
- **Testing Gaps**: Not testing all toggle combinations thoroughly

## Integration with CI/CD

```yaml
# Example GitHub Actions workflow
name: Feature Toggle Deployment
on: push

jobs:
  deploy:
    steps:
      - name: Deploy to staging
        run: deploy --environment staging --feature-flags newCheckoutFlow:25

      - name: Run tests with toggles
        run: |
          test --feature-toggle newCheckoutFlow:enabled
          test --feature-toggle newCheckoutFlow:disabled

      - name: Gradual rollout
        run: |
          deploy --environment prod --feature-flags newCheckoutFlow:10
          sleep 3600
          deploy --environment prod --feature-flags newCheckoutFlow:25
```

## References

- [Feature Toggles (aka Feature Flags)](https://martinfowler.com/articles/feature-toggles.html)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/feature-flags/)
- [Continuous Delivery: Reliable Software Releases](https://www.amazon.com/Continuous-Delivery-Deployment-Automation-Addison-Wesley/dp/0321601912)