---
name: github-landscape-research
description: >-
  Systematic open-source landscape research for software engineering topics
  (plugin systems, control planes, infra tools). Discovers and ranks GitHub repos,
  deep-reads code, and produces comparison matrices and integration blueprints.
  Output feeds dev-docs (_en/_id) or product ADRs. Use when surveying implementations,
  competitive analysis, or "find repos for X" before architecture docs.
upstream:
  project: agent-research-skills
  author: lingzhi227
  repo: https://github.com/lingzhi227/agent-research-skills
  skill: github-research
  commit: 9e6c085d65e313e475e921fdfe795ac11eb7589e
disable-model-invocation: true
---

# GitHub landscape research (dev-docs)

Adapted from upstream **github-research** (see frontmatter `upstream`).  
Scripts live in this skill's `scripts/` — not the other 30 ML/paper skills from upstream.

## When to use

- **After** `doc-research-plan` (`research/{slug}/brief.md` exists)
- **Before** `doc-research-validate` and `doc-write`
- Landscape scan for fast-moving tech (plugin architecture, Go runtimes, agent tooling)
- Compare OSS implementations (KrakenD, go-plugin, panel ecosystems)

## Paths (repo root)

| Item | Path |
| --- | --- |
| Scripts | `.agents/skills/github-landscape-research/scripts/` |
| Phase guide | `.agents/skills/github-landscape-research/references/phase-guide.md` |
| Working output | `research/{slug}/` (gitignored) |
| Published docs | `docs/best-practices/...` or `docs/technologies/...` |

## Prerequisites

- Python 3
- `gh` authenticated **or** GitHub MCP when `gh` fails

## 6-phase pipeline

See `references/phase-guide.md` and upstream skill at commit in frontmatter. Order:

1. **Intake** — topic slug, keywords, seed repos
2. **Discovery** — `search_github.py`, `search_github_code.py`
3. **Filtering** — `repo_db.py score/rank/filter`
4. **Deep dive** — `clone_repo.py`, `analyze_repo_structure.py`, read source
5. **Analysis** — `compare_repos.py`, comparison matrix
6. **Blueprint** — `compile_github_report.py`, integration plan

### Example

```bash
ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS="$ROOT/.agents/skills/github-landscape-research/scripts"
SLUG="go-plugin-runtimes"
OUT="$ROOT/research/$SLUG"
mkdir -p "$OUT/phase2_discovery/search_results"

python3 "$SCRIPTS/search_github.py" \
  --query "krakend go plugin" --language go --min-stars 50 --max-results 40 \
  --output "$OUT/phase2_discovery/search_results/krakend.jsonl"
```

## Handoff

Do **not** write `docs/` yet. Next step: `doc-research-validate` on `research/{slug}/`.

## Refresh from upstream

Re-copy `skills/github-research/scripts/` and `references/` from upstream repo; bump `upstream.commit` in this frontmatter.

## Related

- `doc-authoring` — full pipeline
- `doc-research-plan` — upstream brief
- `doc-research-validate` — next step after this skill
- `dev-docs` — corpus lookup during planning
