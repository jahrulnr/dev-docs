---
name: doc-research-plan
description: >-
  Plan dev-docs research before landscape scan: scope, questions, success criteria,
  corpus gap analysis, and artifact checklist. Use when starting a new documentation
  topic on fast-moving or contested technology (plugins, cloud, agents, infra tools).
upstream:
  project: agent-research-skills
  author: lingzhi227
  repo: https://github.com/lingzhi227/agent-research-skills
  skill: research-planning
  commit: 9e6c085d65e313e475e921fdfe795ac11eb7589e
  note: Prompt-only adaptation for SE documentation, not ML papers.
disable-model-invocation: true
---

# Doc research plan (dev-docs)

Define **what** to research and **done** criteria before running scripts or writing docs.

## When to use

- New topic not adequately covered in `docs/`
- Updating a doc where facts may have changed since last review
- Before `github-landscape-research`

## Step 0: Corpus check

1. `grep -i "<topic>" index.json`
2. Read up to **2** existing related docs via `dev-docs` routing
3. Record: extend existing doc vs new file vs new pillar subfolder

## Step 1: Write `research/{slug}/brief.md`

Use slug: lowercase, hyphens (e.g. `go-plugin-runtimes`).

```markdown
# Research brief: {title}

## Why document this
- Problem / reader need
- Why training knowledge alone is insufficient

## Scope
- In scope:
- Out of scope:

## Research questions (answerable from OSS + official docs)
1. ...
2. ...
3. ...

## Success criteria (for validate gate)
- [ ] ≥3 authoritative repos or docs identified
- [ ] Trade-offs table (≥2 approaches)
- [ ] When to use / when not
- [ ] No claim without planned source

## Search plan (for github-landscape-research)
- Keywords:
- Languages / ecosystems:
- Seed repos/URLs:
- Comparison dimensions:

## Target doc placement
- Pillar: best-practices | technologies | ecosystem
- Path: `docs/.../{name}_en.md` + `_id.md`
- Related docs to link:

## Risks
- Staleness areas (APIs, versions):
- Known controversial points:
```

## Step 2: Task order

Output a short dependency list:

```
corpus check → landscape research → validate → write → review → index
```

## Step 3: Handoff

Tell the executor to run `github-landscape-research` with slug and queries from the brief.

## Rules

- Do not start landscape scan without a written brief
- If corpus already answers the topic, stop — update links or a short addendum instead
- Prefer **engineering** sources over academic papers unless the topic is research-heavy

## Related

- `doc-authoring` — full pipeline
- `github-landscape-research` — next step
- `dev-docs` — corpus lookup
