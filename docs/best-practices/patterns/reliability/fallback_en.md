# Fallback
## Overview

Fallback provides an alternative result or behavior when a primary service fails, allowing graceful degradation. This pattern ensures system resilience by providing backup options.

## When to use
Use to maintain service availability with degraded functionality during partial failures.

## Example
If payment gateway fails, return a 'try later' response or queue the payment for manual or delayed processing.

## Pros / Cons
- Pros: Improves user experience during failures, prevents cascading errors.
- Cons: Requires careful design so fallback behavior is safe and acceptable.

## References
- Resilience patterns and circuit breaker strategies.