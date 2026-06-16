---
name: doc-authoring
description: >-
  End-to-end workflow for creating or updating dev-docs: plan research, run
  landscape scan, validate findings, write bilingual docs, self-review, index.
  Use when adding new topics to the corpus — not for quick lookup (use dev-docs).
disable-model-invocation: true
---

# Doc authoring workflow (dev-docs)

Model training knowledge is **untrusted by default** for fast-moving tech. This repo extends the agent with a **verified documentation pipeline**.

## Skill chain (strict order for new topics)

| Step | Skill | Output |
| --- | --- | --- |
| 0 | `dev-docs` | Existing corpus check — avoid duplicates |
| 1 | `doc-research-plan` | `research/{slug}/brief.md` |
| 2 | `github-landscape-research` | `research/{slug}/` (reports, repo_db, blueprint) |
| 3 | `doc-research-validate` | `research/{slug}/validation.md` + gate verdict |
| 4 | `doc-write` | `docs/**/{topic}_en.md` + `{topic}_id.md` |
| 5 | `doc-self-review` | `research/reviews/{slug}-review.md` |
| 6 | `dev-docs` + shell | `node scripts/build-index.mjs` |

**Gate rule:** Do not run `doc-write` until `doc-research-validate` returns `pass` (or `pass-with-gaps` with human ack).

## When to skip steps

| Situation | Skip |
| --- | --- |
| Typo / link fix on stable principle | 1–3; run 5 lightly |
| Translation-only `_id` sync | 1–3; run 5 bilingual section |
| New cloud API / plugin / agent tooling | **None** — full pipeline |
| Cross-link from existing doc | 0 only |

## Trust model (all steps)

| Source | Use |
| --- | --- |
| `docs/` + `index.json` | Canonical for stable patterns |
| `research/{slug}/` | Canonical for facts in new docs |
| Live fetch / GitHub / official docs | Required to overturn stale training |
| Training memory | Hypothesis only — must pass validate or review |

## Repo paths

- Skills: `.agents/skills/`
- Published: `docs/`
- Working: `research/` (gitignored)
- Index: `index.json`, `routing-table.md` (generated)

## Related

Load the step skill when executing that step — do not improvise the pipeline.
