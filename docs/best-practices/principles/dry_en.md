# DRY Principle

## Overview

**DRY** (Don't Repeat Yourself) states that every piece of knowledge should have a single, authoritative representation in a system. Duplicated business rules, validation logic, or configuration constants drift apart over time—one copy gets fixed, another does not, and bugs become intermittent.

DRY targets **knowledge duplication**, not mechanical similarity. Two functions with similar syntax but different reasons to change should stay separate (see **coincidental duplication**). Forcing unrelated code into one abstraction creates coupling worse than repetition.

Balance DRY with **YAGNI** and **KISS**: extract shared logic after the second or third justified repetition, not at the first glance of similarity.

## Key ideas

- One source of truth for rules, schemas, and magic numbers (constants package, OpenAPI spec, DB migration).
- Generated code from schemas (protobuf, OpenAPI clients) beats hand-copied structs.
- Tests can repeat arrange steps if shared fixtures obscure intent—DRY is not a mantra for spec readability.
- Cross-service duplication may need contract tests rather than shared libraries.

## When to use

- The same business rule appears in API validation, worker, and UI backend.
- Bug fixes repeatedly require editing multiple files the same way.
- Configuration or feature flags must stay synchronized across modules.

## When not to use

- Similar-looking code with different change drivers (admin vs public API).
- Premature shared utilities used once—wait for evidence.
- Micro-optimizing line count at the expense of module independence.

## Trade-offs

| Centralized knowledge | Risk |
| --- | --- |
| Consistent behavior and fixes | Shared module becomes a bottleneck |
| Less copy-paste maintenance | Over-abstraction couples unrelated features |
| Easier audits of rules | Wrong extraction harder to untangle |

## Example

Tax rate defined once:

```go
const VATRate = 0.11

func ApplyVAT(net decimal.Decimal) decimal.Decimal {
    return net.Mul(decimal.NewFromFloat(VATRate))
}
```

Both HTTP handlers and invoice PDF generator import the same function—never duplicate `0.11` literals.

## Related

- [KISS](kiss_en.md) — avoid complex deduplication frameworks
- [YAGNI](yagni_en.md) — do not abstract before repetition is real
- [Separation of Concerns](separation-of-concerns_en.md) — share knowledge without merging responsibilities

## References

- Hunt & Thomas — *The Pragmatic Programmer*, DRY chapter
- Fowler — duplication vs coupling trade-offs in refactoring literature
