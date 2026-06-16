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

## References

- GitHub Docs: “Creating a footer or sidebar for your wiki”
- Gollum Wiki: link/tag behavior and special pages (`_Sidebar`, `_Footer`)

