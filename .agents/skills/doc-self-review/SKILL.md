---
name: doc-self-review
description: >-
  Review draft or published dev-docs for accuracy, staleness, structure, bilingual
  parity, and index routing. Uses multi-persona critique and optional landscape
  verification — do not rely on model training knowledge alone for fast-moving tech.
  Use after writing or updating docs/**/*_{en,id}.md, or before merging architecture
  or technology topics.
upstream:
  project: agent-research-skills
  author: lingzhi227
  repo: https://github.com/lingzhi227/agent-research-skills
  skill: self-review
  commit: 9e6c085d65e313e475e921fdfe795ac11eb7589e
  note: Prompt-only adaptation; review rubric is dev-docs-specific, not NeurIPS.
disable-model-invocation: true
---

# Doc self-review (dev-docs)

Model training knowledge goes stale. Treat it as **hypothesis**, not fact — especially for tools, cloud APIs, and agent/IDE workflows that change yearly.

This skill reviews **written docs** in `docs/`. It does not replace `github-landscape-research` (use that **before** writing when the topic is fast-moving).

## When to use

- **After** `doc-write` (or any edit to `docs/**/*_en.md` + `*_id.md`)
- **Before** `node scripts/build-index.mjs` on new topics
- When a doc cites versions, products, or "current best practice"

**On fail:** return to `doc-research-validate` or `github-landscape-research` — do not patch from training memory alone.

## Trust model

| Source | Trust |
| --- | --- |
| This repo's `docs/` + `index.json` | High (if recently reviewed) |
| `research/{slug}/` artifacts | High for facts cited there |
| Live upstream docs / repo README | High when fetched in session |
| Model training memory | **Low** — verify or mark uncertain |

Flag sentences that sound plausible but lack a cited source or live check.

## Review pipeline

### 1. Staleness scan

For each factual claim (product name, API, default behavior, version, deprecation):

- Would this have changed after the model's knowledge cutoff?
- Is there a `research/` note or link backing it?
- If unsure → run targeted `github-landscape-research` or fetch official docs; do not guess.

Record in `research/reviews/{slug}-staleness.md` (optional, gitignored parent `research/`).

### 2. Three-persona review

Review **both** `_en.md` and `_id.md` (or the pair named in the task).

| Persona | Lens |
| --- | --- |
| **Architect** | Correctness, trade-offs, when-to-use / when-not, missing alternatives |
| **Operator** | Production fit, security, ops burden, failure modes |
| **Maintainer** | Structure, cross-links, bilingual parity, index keywords, no drift from `AGENTS.md` |

Each persona outputs:

- Strengths (bullets)
- Issues (severity: critical / should-fix / nit)
- Questions needing human or live verification

### 3. Bilingual parity

- Same headings and section order in `_en` and `_id`
- No extra claims in one language only
- Code blocks identical unless comment locale differs (prefer identical)

### 4. Corpus fit

- Correct pillar folder (see `AGENTS.md`)
- Relative links valid
- Keywords suitable for `index.json` (grep existing entries to avoid duplicates)
- Related docs linked (max 2–3 cross-links)

### 5. Action report

Write a short review artifact (in chat or `research/reviews/{slug}-review.md`):

```markdown
## Verdict
ready | needs-revision | blocked-on-research

## Staleness flags
- [claim] → verify via [source]

## Consensus fixes (apply before merge)
1. ...

## Persona notes (non-blocking)
- Architect: ...
- Operator: ...
- Maintainer: ...
```

Re-run review after edits if any **critical** item was found.

## Doc quality checklist

- [ ] Overview explains what and why (not only how)
- [ ] Key components / concepts defined
- [ ] When to use + when **not** to use
- [ ] Trade-offs honest (not one-sided marketing)
- [ ] Examples small and runnable or clearly partial
- [ ] Links section points to repo paths or verified externals
- [ ] No undocumented breaking assumptions
- [ ] `_en` / `_id` pairs synchronized

## After review passes

1. Apply fixes to `docs/`
2. `node scripts/build-index.mjs`
3. `node scripts/lookup.mjs "<topic>"` — confirm routing works

## Related

- `doc-authoring` — full pipeline
- `doc-write` — upstream draft
- `doc-research-validate` — re-run if claims lack sources
- `github-landscape-research` — refresh OSS evidence
- `dev-docs` — corpus lookup during review
