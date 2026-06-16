# Fail Fast Principle

## Overview

**Fail fast** means detecting errors and invalid states as early as possible—at compile time, startup, input validation, or the first API boundary—and stopping immediately with a clear signal rather than continuing with corrupt assumptions. The goal is to surface defects where they are cheapest to fix and easiest to diagnose.

Fail fast complements **defensive programming** but differs in emphasis: instead of silently recovering or returning ambiguous defaults, fail fast rejects bad input, missing configuration, or violated invariants promptly. In distributed systems, combine local fail fast with timeouts and circuit breakers so failures do not cascade unnoticed.

"Fail closed" in security (deny when uncertain) is a fail-fast cousin: prefer blocking over risky continuation.

## Key ideas

- Validate preconditions at boundaries (HTTP handlers, CLI entry, message consumers).
- Crash or error at startup if required config/secrets are missing—do not limp into production.
- Use types and constructors that cannot represent invalid states when practical.
- Propagate errors with context; avoid swallowing exceptions.

## When to use

- Configuration-driven services where misconfiguration causes data loss or security holes.
- Libraries and public APIs where invalid arguments indicate programmer error.
- Pipelines where partial success masks downstream corruption.

## When not to use

- User-facing flows where graceful degradation improves UX (show validation message, not process crash).
- Batch jobs processing millions of rows—per-row fail fast may need aggregation and skip policies.
- Resilience patterns that intentionally retry transient faults (network blips).

## Trade-offs

| Fail fast | Softer handling |
| --- | --- |
| Faster root-cause identification | More user-friendly in some UX paths |
| Prevents corrupt state propagation | Can increase noise if thresholds are wrong |
| Clear operational alerts | Requires thoughtful error messages |

## Example

Reject negative transfer amounts at the service entry; do not let them reach the ledger.

```go
func Transfer(from, to AccountID, amount decimal.Decimal) error {
    if amount.Sign() <= 0 {
        return fmt.Errorf("transfer: amount must be positive: %s", amount)
    }
    // proceed
}
```

Application startup: if `DATABASE_URL` is empty, `log.Fatal` or return error from `main`—never default to in-memory DB in production builds.

## Related

- [DRY](dry_en.md) — centralize validation rules once
- [Separation of Concerns](separation-of-concerns_en.md) — validate at the right boundary
- [Defense in Depth](security/defense-in-depth_en.md) — layered checks without hiding failures

## References

- Jim Shore — "Fail Fast" (IEEE / agile practice articles)
- Go community: explicit error returns vs panic for programmer errors
