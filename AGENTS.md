# Instructions for Technical Documentation

## Repository Overview
This repository serves as a comprehensive knowledge base for technical documentation. It focuses on clear, consistent writing practices for multilingual technical content (English/Indonesian).

## Writing Style and Conventions

### Voice and depth

Write like a **technical mini-journal combined with Wikipedia**: neutral, precise, readable by humans and AI agents. Explain *what* something is, *why* it exists, *how* it works, and *when* to choose or avoid it. No rigid 4W1H template — use sections that fit the topic.

**Minimum bar per topic:** substantive Overview (2–4 short paragraphs), explicit when-to-use / when-not-to-use, at least one concrete example, trade-offs or pitfalls where relevant, **Related** (internal links), and **References** or **Links** when external sources matter. Avoid one-screen stubs (~15 lines) unless the concept is truly trivial.

**Do not:** generic filler, duplicate paragraphs, ecommerce-only examples unless the topic is ecommerce, huge copy-paste code dumps, or training-memory claims without marking uncertainty.

### Multilingual pairs

- Every concept: `_en.md` + `_id.md`, **same section order and claims**.
- **`_en`:** professional English.
- **`_id`:** natural Indonesian narrative; **system/infra/engineering terms stay in English** (*hot path*, *webhook*, *rollback*, *marketplace*, *deploy*, *fail-closed*, etc.). Avoid awkward literal translations.

### Structure (flexible)

Common sections (pick what fits): `Overview` · `How it works` · `Key ideas` · `When to use` · `When not to use` · `Trade-offs` · `Example` · `Related` · `References` / `Links`

Use consistent heading casing within a pair (`When to use`, not mixed with `When to Use` unless migrating a whole category at once).

### Corpus hygiene

- Fix duplicate or corrupted content immediately (e.g. pasted twice in one file).
- Cross-link 2–4 related docs in the same pillar when they exist.
- After bulk edits: `node scripts/build-index.mjs`.
- Fast-moving topics (cloud APIs, plugins, agents): prefer `doc-authoring` research pipeline before large rewrites.
- **Clear Linking**: Use relative paths for internal documentation links (e.g., `docs/best-practices/patterns/...`). Include cross-references to related concepts for better navigation.
- **Code Samples**: Use concise code snippets or partial examples rather than full implementations to keep documentation engaging and readable. Format code blocks with appropriate language syntax highlighting.
- **Tone and Audience**: Write in a professional, neutral tone. Assume readers are technical professionals; avoid overly simplistic explanations or advanced jargon without context.
- **Updates and Reviews**: Regularly review and update documentation for accuracy. Encourage contributions via pull requests with clear descriptions of changes.

## Folder Structure and Document Placement
- **Main Structure**: Documentation is organized under `docs/` with subfolders for different categories:
  - `docs/architecture/`: Architectural styles and patterns (e.g., microservices, monolithic).
  - `docs/best-practices/`: Principles, patterns, practices, and anti-patterns.
  - `docs/ecosystem/`: Cloud platforms and services (AWS, Azure, Google Cloud).
  - `docs/technologies/`: Infrastructure tools and communication protocols.
- **File Naming Convention**: Use `_en.md` for English versions and `_id.md` for Indonesian versions (e.g., `factory_en.md` and `factory_id.md`).
- **Subfolder Organization**: Within each category, use subfolders for subcategories (e.g., `docs/best-practices/patterns/design/` for design patterns).
- **Document Placement**: Place new documents in the appropriate category and subcategory based on content. For example, a new design pattern goes in `docs/best-practices/patterns/design/`.
- **Consistency**: Maintain alphabetical order and consistent naming across folders to ensure easy navigation.

## Documentation Maintenance
- **Contributing Guidelines**: Follow established writing standards; update documentation for any structural changes.
- **Hosting Compatibility**: Content is designed for GitHub Pages or GitLab Wiki platforms.
- **Documentation-Only Focus**: This repository contains documentation; avoid including buildable code or executable scripts.

## Linking Documentation
- Reference existing documentation files for related concepts (e.g., link to `docs/best-practices/principles/solid_en.md` for SOLID principles).
- Maintain consistency in file naming and path structures for easy navigation.

## Agent skills (`.agents/skills/`)

Training knowledge goes stale (tools, cloud APIs, IDE agents). For **new or updated topics**, use the pipeline — do not write from model memory alone.

**Orchestrator:** `doc-authoring` — start here for new documentation.

| Step | Skill | Role |
| --- | --- | --- |
| 0 | `dev-docs` | Lookup existing corpus (`index.json`) |
| 1 | `doc-research-plan` | Scope, questions, `research/{slug}/brief.md` |
| 2 | `github-landscape-research` | OSS discovery, compare, blueprint (scripts in skill folder) |
| 3 | `doc-research-validate` | Claims ledger, phase gates — **blocks write until pass** |
| 4 | `doc-write` | Bilingual `_en` / `_id` from validated research |
| 5 | `doc-self-review` | Staleness + 3-persona review |
| 6 | shell | `node scripts/build-index.mjs` |

`github-landscape-research` scripts adapted from [agent-research-skills](https://github.com/lingzhi227/agent-research-skills) (attribution in skill frontmatter).  
Working tree: `research/` (gitignored). Published corpus: `docs/` only after validate + review.