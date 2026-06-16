---
name: doc-research-validate
description: >-
  Validate research artifacts before writing dev-docs: phase gates, claims ledger,
  source quality, staleness check, and gap analysis. Blocks doc-write until research
  is grounded — do not trust model memory or unverified landscape notes.
upstream:
  project: agent-research-skills
  author: lingzhi227
  repo: https://github.com/lingzhi227/agent-research-skills
  skill: deep-research
  commit: 9e6c085d65e313e475e921fdfe795ac11eb7589e
  note: Phase-gate pattern adapted; no academic paper requirements.
disable-model-invocation: true
---

# Doc research validate (dev-docs)

**Gate between research and writing.** Training knowledge does not pass this gate.

## When to use

- After `github-landscape-research` (or equivalent manual research)
- Before `doc-write`

## Required inputs

| File | Purpose |
| --- | --- |
| `research/{slug}/brief.md` | Planned questions & criteria |
| `research/{slug}/repo_db.jsonl` or discovery logs | Evidence of scan |
| `research/{slug}/phase6_blueprint/final_report.md` or `blueprint_summary.md` | Synthesis (if present) |

If artifacts are missing, verdict = **fail** — complete research first.

## Phase gates

| Gate | Requirement |
| --- | --- |
| G1 Brief | `brief.md` exists; questions still relevant |
| G2 Coverage | ≥3 distinct sources (repos, official docs, or specs) |
| G3 Deep read | ≥2 sources had **code or docs read**, not README-only |
| G4 Claims ledger | Every must-have claim maps to a source (table below) |
| G5 Trade-offs | ≥2 approaches compared with honest cons |
| G6 Staleness | Version/date noted for volatile facts; no unchecked "latest" |
| G7 Gaps | Unknowns listed explicitly — not hidden |

## Claims ledger (mandatory)

| Claim | Source (URL/path) | Checked date | Confidence |
| --- | --- | --- | --- |
| e.g. KrakenD uses Go plugins | repo path / doc | session date | high/med/low |

Reject **high** confidence without a source row.

## Harsh critic (prompt)

```
You are validating research for production documentation, not a paper.
Reject: README-only summaries, single-source narratives, training-memory
fill-ins, "best practice" without trade-offs, missing deprecation/version context.
Accept: multi-source, code-backed, explicit gaps and risks.
```

## Output: `research/{slug}/validation.md`

```markdown
# Validation: {slug}

## Verdict
pass | pass-with-gaps | fail

## Gate checklist
- G1 … G7: pass/fail + note

## Claims ledger
(table)

## Gaps (OK to document as unknown)
- ...

## Blockers (must fix before write)
- ...

## Approved outline for doc-write
1. Section …
2. ...
```

## Verdict rules

| Verdict | Meaning |
| --- | --- |
| **pass** | All gates pass; proceed to `doc-write` |
| **pass-with-gaps** | G7 gaps documented; human ack if gaps affect safety/architecture |
| **fail** | Return to `github-landscape-research` or fetch live sources |

## Related

- `doc-research-plan` — upstream brief
- `github-landscape-research` — re-run on fail
- `doc-write` — only after pass*
