# GitHub Wiki (Gollum)

## Overview

GitHub Wiki is a documentation feature powered by the **Gollum** wiki engine. Under the hood, it is a separate Git repository: `OWNER/REPO.wiki.git`.

In dev-docs, we auto-export `docs/` into the GitHub Wiki, so Wiki behavior (page naming, internal links, sidebar rules) becomes part of our “docs-as-code” workflow.

## Key constraints that affect our SOP

### 1) Flat page namespace (no real folders)

Wiki pages do not have real directories. A “hierarchy” is only a **naming convention**.

- Prefer: `Architecture Patterns - Bff`
- Avoid: `Architecture Patterns / Bff` (slashes are not supported in page titles)

### 2) Special pages

GitHub Wiki recognizes special filenames:

- `_Sidebar.md`: custom sidebar content
- `_Footer.md`: custom footer content

Anything else is a normal wiki page.

### 3) Internal link rules (most common source of breakage)

When linking to **another wiki page**:

- **Do not** link to `*.md`
- Use the **page title** (or its wiki URL slug), not a file path
- If the destination includes spaces, the safest form is to **URL-encode** the destination (spaces → `%20`)

Examples:

- Good: `[BFF](Architecture%20Patterns%20-%20Bff)`
- Bad: `[BFF](Architecture Patterns - Bff)` (may render as plain text)
- Bad: `[BFF](Architecture-Patterns---Bff.md)` (can route to raw content)

## dev-docs SOP: file naming → wiki page naming

### Source files

In `docs/`, we keep paired files:

- `..._en.md`
- `..._id.md`

The “slug” (path without suffix) stays stable and is used to build the wiki page title.

### Exported wiki pages

Our exporter generates:

- One wiki page per doc (EN + ID)
- `Home` and `Home-id`
- `_Sidebar` and `Sidebar-id` (Indonesian navigation page)

#### Naming convention

We use a human-readable hierarchy in titles:

`{Parents joined with spaces} - {Leaf Title Case}`

Example:

- `best-practices/architecture/patterns/bff_*` → `Architecture Patterns - Bff`

#### Language convention

Indonesian pages use a suffix:

- EN: `Architecture Patterns - Bff`
- ID: `Architecture Patterns - Bff-id`

## Troubleshooting checklist

### Sidebar shows text like `[Title](Some Page ...)` (not clickable)

Cause: the Markdown renderer did not parse the link destination (usually because of spaces).

Fix:

- Ensure the destination is URL-encoded: `Some%20Page%20Name`
- Ensure it’s a wiki page name (not a `.md` file path)

### Clicking a sidebar link opens raw markdown

Cause: link target includes `.md` or an absolute/raw URL.

Fix:

- Link to the page name only (no `.md`)

## Landscape: common automation approaches

This section maps the most common “GitHub Wiki automation” approaches found in the ecosystem, and how they relate to a docs-as-code pipeline like dev-docs.

### A) Sync a folder to `REPO.wiki.git` (GitHub Action)

These actions mirror a folder (e.g. `docs/` or `wiki/`) into the wiki Git repository:

- **`Andrew-Chen-Wang/github-wiki-action`**: supports `strategy: clone|init`, optional preprocess (move `README.md` → `Home.md`, rewrite `.md` links to bare links), supports cross-repo publishing via PAT.[^aw]
- **`victor-public/wiki-automation`**: simple “copy folder to wiki + force push” composite action; expects you to maintain `_Sidebar.md` / `_Footer.md` in that folder.[^vp]
- **`ineshbose/wiki-action`**: syncs a `WIKI_DIR` folder and can auto-generate `_Sidebar.md` from directory structure (see caveats below).[^ib]

**Where it helps**: removes manual cloning/pushing of `*.wiki.git`, and can keep deletions in sync.

**Where it hurts**: auto-generated sidebars are usually directory-tree-based and tend to be weak at “semantic grouping” (by pillar/subpillar) unless you already model that in folders.

### B) Generate `_Sidebar.md` from wiki pages (CLI)

- **`adriantanasa/github-wiki-sidebar`**: interactive CLI with exclude list, ordering, and template injection; it delegates actual menu generation to `git-wiki-to-html --template=markdown`.[^gws][^gwth]

**Key point for our incident**: default templates generate Markdown links like `* [Title](./Some Page)`; if the destination contains spaces, many Markdown parsers will not treat it as a link. Our dev-docs exporter avoids this by URL-encoding internal destinations (spaces → `%20`).

### C) Generate and inject a TOC into `Home.md` / `_Sidebar.md` (CLI)

- **`droctothorpe/toco`**: builds a TOC from wiki files and injects it between `<!--starttoc-->` and `<!--endtoc-->` blocks in `Home.md` and `_Sidebar.md`.[^toco]

This is useful when you want a TOC block inside the page bodies, not only the sidebar menu.

### D) “How to make GitHub Wiki look good” (style & content hacks)

- **`practicalseries/GitHub-Wiki-Design-and-Implementation`**: a deep guide on GitHub Wiki constraints and workarounds (GFM limitations, HTML tricks, navigation patterns, and “imposed folder structure”).[^ps]

If you want polished wiki UX (buttons/badges, per-section nav bars, rich layout), this is the best reference among the ones reviewed.

## Practical guidance for dev-docs

- If you already have an **index-driven corpus** (like dev-docs), keep generation deterministic from `index.json` and treat the wiki as a **rendered mirror**.
- If you want to switch to “folder mirroring” later, evaluate `Andrew-Chen-Wang/github-wiki-action` first (preprocess + deletion sync), then decide whether sidebar should be generated by folder tree or by metadata (our current approach).

## References

- GitHub Docs: “Creating a footer or sidebar for your wiki”
- Gollum Wiki: link/tag behavior and special pages (`_Sidebar`, `_Footer`)

[^aw]: `https://github.com/Andrew-Chen-Wang/github-wiki-action`
[^vp]: `https://github.com/victor-public/wiki-automation`
[^ib]: `https://github.com/ineshbose/wiki-action`
[^gws]: `https://github.com/adriantanasa/github-wiki-sidebar`
[^gwth]: `https://www.npmjs.com/package/git-wiki-to-html`
[^toco]: `https://github.com/droctothorpe/toco`
[^ps]: `https://github.com/practicalseries/GitHub-Wiki-Design-and-Implementation`

