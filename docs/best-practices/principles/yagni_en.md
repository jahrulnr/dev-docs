# YAGNI Principle

## Overview

**YAGNI** (You Aren't Gonna Need It) is an Extreme Programming principle: implement only what current requirements demand, not what you imagine you might need later. Speculative features add code to maintain, tests to run, and cognitive load—often without ever delivering value.

YAGNI does not forbid planning or clean extension points. It forbids **building unused capability now** because "we might need multi-tenant sharding someday." When the requirement arrives, you implement with today's context—often simpler than the speculative design would have been.

Balance YAGNI with **refactoring** when a second similar case appears (Rule of Three). The antidote to duplication is not premature abstraction; it is evidence-driven generalization.

## Key ideas

- Ship the smallest change that satisfies the story or ticket.
- Delete dead code and feature flags for abandoned paths.
- Prefer configuration over unused plugin frameworks.
- Document known future risks in tickets or ADRs, not in production code paths.

## When to use

- Backlog items describe one concrete behavior—implement only that.
- Reviews add abstraction "for flexibility" without a second consumer.
- Startup or cost-sensitive teams where maintenance burden matters.

## When not to use

- Regulatory or safety requirements mandate capabilities before go-live (audit logging, encryption at rest).
- Contractual SLAs require hooks that will activate on a fixed date—coordinate with delivery, not silent stubs.
- Performance or capacity work where measurement proves imminent need (not guesswork).

## Trade-offs

| Following YAGNI | Cost |
| --- | --- |
| Less waste, faster delivery | Possible refactor when requirements land |
| Smaller attack and failure surface | Can feel short-sighted to planners |
| Clearer codebase | Requires discipline in reviews |

## Example

A ticket asks for CSV export only. Do not build a generic `Exporter` plugin system with XML and Parquet drivers. Implement `ExportCSV()`; extract an interface when PDF export is actually requested.

```go
func ExportCSV(rows []Row, w io.Writer) error {
    cw := csv.NewWriter(w)
    // write header and rows
    cw.Flush()
    return cw.Error()
}
```

## Related

- [KISS](kiss_en.md) — simplicity as default
- [DRY](dry_en.md) — deduplicate after repetition is real
- [Fail Fast](fail-fast_en.md) — reject invalid assumptions early instead of speculative branches

## References

- Beck & Andres — *Extreme Programming Explained*, YAGNI
- Martin Fowler — bliki on YAGNI and incremental design
