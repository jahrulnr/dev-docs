---
name: doc-write
description: >-
  Write or update bilingual dev-docs from validated research: structure, pillar
  placement, _en/_id pairs, examples, and cross-links. Use only after
  doc-research-validate passes. Do not invent facts from training memory.
disable-model-invocation: true
---

# Doc write (dev-docs)

Turn **validated** research into published corpus docs. Facts come from `research/{slug}/validation.md` claims ledger and cited sources — not from model recall.

## Prerequisites

- `doc-research-validate` verdict: `pass` or acknowledged `pass-with-gaps`
- `research/{slug}/brief.md` target paths confirmed

## Document template (both languages)

Use the same heading structure in `_en.md` and `_id.md`:

```markdown
# {Title}

## Overview
What it is and why it matters (2–4 short paragraphs).

## Key components
Bullets or diagram — core concepts.

## When to use
Concrete triggers.

## When not to use
Anti-patterns, wrong contexts.

## Implementation guide
Numbered steps or patterns. Small code snippets only.

## Trade-offs
| Approach | Pros | Cons |

## Examples
Minimal, realistic snippets.

## Links
- Relative links to related `docs/...`
- External only if in claims ledger
```

## Pillar placement

| Content | Folder |
| --- | --- |
| Architecture style/pattern | `docs/best-practices/architecture/{styles,patterns}/` |
| Design/integration pattern | `docs/best-practices/patterns/{sub}/` |
| Principle, anti-pattern | `docs/best-practices/principles/` or `anti-patterns/` |
| Infra tool | `docs/technologies/infrastructure/` |
| Protocol | `docs/technologies/protocols/` |
| Cloud service category | `docs/ecosystem/{aws,azure,google-cloud}/` |

Confirm against `AGENTS.md` if unsure.

## Bilingual workflow

1. Draft **`_en.md`** first from validation outline
2. Draft **`_id.md`** — translate narrative, do not add/remove sections
3. Keep code blocks identical
4. Tone: professional, accessible (per `AGENTS.md`)
5. **`_id` technical vocabulary**: keep system/infra terms in English (*hot path*, *runtime*, *hook*, *checksum*, *rollback*, *marketplace*, etc.). Avoid awkward literal translations (e.g. “jalur panas ultra-rendah” → “ultra-low-latency hot path”). Table headers may stay English when they are field labels.

## Writing rules

- Cite OSS implementations in **Links** or inline when comparing (from research)
- Mark uncertain areas: "As of {date}, …" or "Verify upstream for …"
- No full application code — partial examples only
- Cross-link 2–3 related internal docs max
- Do **not** duplicate an existing doc — extend or link instead

## After writing

1. Run `doc-self-review` on both files
2. Fix critical/should-fix items
3. `node scripts/build-index.mjs`
4. `node scripts/lookup.mjs "<topic>"` — verify discovery

## Related

- `doc-research-validate` — upstream gate
- `doc-self-review` — next step
- `dev-docs` — check related entries while writing
