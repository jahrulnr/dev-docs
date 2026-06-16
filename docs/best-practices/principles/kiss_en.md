# KISS Principle

## Overview

**KISS** (Keep It Simple, Stupid) is a design principle that favors the simplest solution that correctly solves the problem. Coined in aerospace engineering (Kelly Johnson, Lockheed Skunk Works), it warns against unnecessary complexity in systems, APIs, and code paths.

Simplicity is not laziness or cutting corners. It means resisting speculative abstractions, avoiding clever tricks that obscure intent, and choosing readable structures over fashionable patterns when they do not earn their cost. Simple systems are easier to review, operate, debug, and onboard—especially under incident pressure.

KISS pairs naturally with **YAGNI** (do not build for hypothetical futures) and **DRY** (but do not merge unrelated logic just to deduplicate). The goal is clarity and maintainability, not minimal line count.

## Key ideas

- Prefer obvious data structures and control flow over generic frameworks.
- Defer abstraction until a second real use case appears.
- Optimize for the reader of the code six months from now.
- Complexity budget: spend it only where requirements demand (performance, compliance, scale).

## When to use

- Always as a default bias when designing modules, APIs, and infrastructure.
- When reviewing PRs that introduce layers without a concrete present need.
- When incident postmortems cite confusion or opaque indirection as contributors.

## When not to use

- Do not confuse KISS with ignoring real constraints (security, SLAs, regulatory audit trails).
- Do not simplify by omitting error handling, observability, or tests where stakes are high.
- Legitimate complexity (distributed consensus, encryption) still needs rigorous design—KISS applies to *unnecessary* complexity.

## Trade-offs

| Simpler approach | Risk if over-applied |
| --- | --- |
| Faster to ship and reason about | May underfit future known requirements |
| Fewer moving parts in production | Refactor cost if requirements shift sharply |
| Clearer onboarding | Can look "naive" to pattern-heavy cultures |

## Example

Summing a slice of integers: a `for` loop is KISS. A generic reducer pipeline with plugins is not—unless multiple summation strategies are already required.

```go
func Sum(nums []int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}
```

Before adding a factory, event bus, or plugin hook, ask: "What concrete problem does this solve today?"

## Related

- [YAGNI](yagni_en.md) — avoid speculative features
- [DRY](dry_en.md) — share knowledge without forced coupling
- [Separation of Concerns](separation-of-concerns_en.md) — simple modules with clear boundaries

## References

- U.S. Navy / Skunk Works origin of KISS (engineering folklore, widely cited)
- Martin Fowler — YAGNI and incremental design essays
