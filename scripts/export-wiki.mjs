#!/usr/bin/env node
/**
 * Export dev-docs corpus to GitHub Wiki markdown (bilingual EN + *-id pages).
 * Reads index.json; writes wiki-export/*.md, Home, and _Sidebar.
 *
 * Regenerate index first: node scripts/build-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');
const OUT = join(ROOT, 'wiki-export');
const REPO = process.env.DEV_DOCS_REPO ?? 'jahrulnr/dev-docs';
const BRANCH = process.env.DEV_DOCS_BRANCH ?? 'master';
const BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;

const index = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'));

function segmentLabel(seg) {
  return seg
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Path segments for hierarchy (drops best-practices prefix). */
function wikiPathParts(slug) {
  const parts = slug.split('/');
  if (parts[0] === 'best-practices') return parts.slice(1);
  if (parts[0] === 'ecosystem') return ['ecosystem', ...parts.slice(1)];
  if (parts[0] === 'technologies') return parts;
  return parts;
}

/**
 * Wiki page name: "Architecture Patterns - Bff" (space within group, " - " before leaf).
 * GitHub Wiki does not allow "/" in page names — use " - " not " / ".
 */
function hierarchicalWikiName(entry) {
  const parts = wikiPathParts(entry.slug);
  if (parts.length === 1) return entry.title;
  const parents = parts.slice(0, -1).map(segmentLabel).join(' ');
  const leaf = segmentLabel(parts[parts.length - 1]);
  return `${parents} - ${leaf}`;
}

/** Assign unique wiki page names; disambiguate collisions with slug suffix. */
function buildWikiNameMap(entries) {
  const map = new Map();
  const seen = new Map();

  for (const e of entries) {
    let base = hierarchicalWikiName(e);
    const count = seen.get(base) ?? 0;
    if (count > 0) {
      const suffix = e.slug.split('/').pop();
      base = `${base} (${segmentLabel(suffix)})`;
    }
    seen.set(hierarchicalWikiName(e), count + 1);
    map.set(e.slug, { en: base, id: `${base}-id` });
  }
  return map;
}

const wikiNames = buildWikiNameMap(index.entries);

/** Indonesian navigation page (not `_Sidebar-id` — leading `_Sidebar*` confuses Gollum). */
const SIDEBAR_ID_PAGE = 'Sidebar-id';

function wikiPage(slug, lang) {
  const n = wikiNames.get(slug);
  if (!n) throw new Error(`No wiki name for slug: ${slug}`);
  return lang === 'id' ? n.id : n.en;
}

/** Link target for markdown — GitHub Wiki resolves hyphens as spaces; `-id` → ` id`. */
function wikiLink(page) {
  return page.replace(/-id$/, ' id');
}

/** Markdown destination wrapper: required when the target contains spaces. */
function mdDest(target) {
  return target.includes(' ') ? `<${target}>` : target;
}

/** Resolve internal markdown link targets to wiki page names. */
function buildLinkResolver(entries) {
  const rules = [];
  for (const e of entries) {
    const enPage = wikiPage(e.slug, 'en');
    const idPage = wikiPage(e.slug, 'id');
    const patterns = [
      e.path_en,
      e.path_id,
      e.path_en.replace(/^docs\//, ''),
      e.path_id.replace(/^docs\//, ''),
      `${e.slug}_en.md`,
      `${e.slug}_id.md`,
      posix.join('docs', `${e.slug}_en.md`),
      posix.join('docs', `${e.slug}_id.md`),
    ];
    for (const p of patterns) {
      rules.push({ pattern: p, en: enPage, id: idPage });
    }
  }
  rules.sort((a, b) => b.pattern.length - a.pattern.length);

  return (href, lang) => {
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return null;
    const [path, hash] = href.split('#');
    const normalized = path.replace(/^\.\//, '').replace(/\\/g, '/');
    for (const r of rules) {
      if (normalized === r.pattern || normalized.endsWith('/' + r.pattern) || normalized.endsWith(r.pattern)) {
        const page = lang === 'id' && (normalized.includes('_id') || normalized.endsWith('_id.md'))
          ? r.id
          : lang === 'id' && normalized.includes('_en')
            ? r.en
            : normalized.includes('_id')
              ? r.id
              : r.en;
        const target = wikiLink(page);
        return hash ? `${target}#${hash}` : target;
      }
    }
    // Relative paths within docs/
    if (normalized.startsWith('docs/')) {
      const m = normalized.match(/docs\/(.+?)_(en|id)\.md$/);
      if (m) {
        const slug = m[1];
        const entry = entries.find((e) => e.slug === slug);
        if (entry) {
          const page = wikiPage(slug, m[2] === 'id' ? 'id' : 'en');
          const target = wikiLink(page);
          return hash ? `${target}#${hash}` : target;
        }
      }
    }
    return null;
  };
}

const resolveLink = buildLinkResolver(index.entries);

function rewriteLinks(content, lang) {
  return content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href) => {
    const resolved = resolveLink(href, lang);
    if (resolved) return `[${text}](${resolved})`;
    if (href.startsWith('docs/') && !href.startsWith('http')) {
      return `[${text}](${BLOB}/${href})`;
    }
    return match;
  });
}

function addLangBanner(content, slug, lang) {
  const enPage = wikiPage(slug, 'en');
  const idPage = wikiPage(slug, 'id');
  if (lang === 'id') {
    return `> **English:** [${enPage}](${mdDest(wikiLink(enPage))})\n\n${content}`;
  }
  return `> **Bahasa Indonesia:** [${idPage}](${mdDest(wikiLink(idPage))})\n\n${content}`;
}

function pillarLabel(pillar, subpillar) {
  if (pillar === 'ecosystem') return `Ecosystem · ${subpillar ?? ''}`.trim();
  if (pillar === 'technologies') return `Technologies · ${subpillar ?? ''}`.trim();
  if (pillar === 'architecture') return `Architecture · ${subpillar ?? 'styles'}`.trim();
  if (pillar === 'anti-patterns') return 'Anti-patterns';
  return [pillar, subpillar].filter(Boolean).join(' · ');
}

function buildHome(lang) {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const docsReadme = existsSync(join(DOCS, lang === 'id' ? 'README_id.md' : 'README.md'))
    ? readFileSync(join(DOCS, lang === 'id' ? 'README_id.md' : 'README.md'), 'utf8')
    : '';

  if (lang === 'id') {
    return `# Dev-docs

Knowledge base teknis bilingual (EN / ID) untuk arsitektur, patterns, cloud, dan infrastructure.

> **English:** [Home](Home)

## Navigasi

- Lihat **Sidebar-id** di sidebar wiki untuk daftar lengkap topik.
- Sumber di repo: [${REPO}](https://github.com/${REPO})

## Kategori

${docsReadme.split('\n').filter((l) => l.startsWith('- [')).slice(0, 8).join('\n') || '- Lihat sidebar untuk indeks penuh.'}

_Sync otomatis dari \`master\` via GitHub Actions._
`;
  }

  return `# Dev-docs

Bilingual technical knowledge base (EN / ID) for architecture, patterns, cloud, and infrastructure.

> **Bahasa Indonesia:** [Home-id](${wikiLink('Home-id')})

## Navigation

- Use **_Sidebar** in the wiki sidebar for the full topic list.
- Source repo: [${REPO}](https://github.com/${REPO})

## Categories

Browse by pillar in the sidebar: architecture, principles, patterns, practices, anti-patterns, ecosystem (AWS/Azure/GCP), and technologies.

_Auto-synced from \`master\` via GitHub Actions._
`;
}

function buildSidebar(lang) {
  const groups = new Map();
  for (const e of index.entries) {
    const key = `${e.pillar}|${e.subpillar ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const lines = lang === 'id'
    ? [`### [EN](_Sidebar) · Bahasa Indonesia`, '']
    : [`### English · [ID](${mdDest(wikiLink(SIDEBAR_ID_PAGE))})`, ''];

  const sortedKeys = [...groups.keys()].sort();
  for (const key of sortedKeys) {
    const [pillar, subpillar] = key.split('|');
    const label = pillarLabel(pillar, subpillar || null);
    lines.push(`### ${label}`, '');
    const items = groups.get(key).sort((a, b) => a.title.localeCompare(b.title));
    for (const e of items) {
      const page = wikiPage(e.slug, lang);
      lines.push(`- [${e.title}](${mdDest(wikiLink(page))})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT).filter((n) => n.endsWith('.md'))) {
  unlinkSync(join(OUT, f));
}

let exported = 0;
for (const e of index.entries) {
  for (const lang of ['en', 'id']) {
    const rel = lang === 'en' ? e.path_en : e.path_id;
    const src = join(ROOT, rel);
    if (!existsSync(src)) {
      console.warn(`WARN: missing ${rel}`);
      continue;
    }
    let content = readFileSync(src, 'utf8');
    content = rewriteLinks(content, lang);
    content = addLangBanner(content, e.slug, lang);
    const page = wikiPage(e.slug, lang);
    writeFileSync(join(OUT, `${page}.md`), content);
    exported++;
  }
}

writeFileSync(join(OUT, 'Home.md'), buildHome('en'));
writeFileSync(join(OUT, 'Home-id.md'), buildHome('id'));
writeFileSync(join(OUT, '_Sidebar.md'), buildSidebar('en'));
writeFileSync(join(OUT, `${SIDEBAR_ID_PAGE}.md`), buildSidebar('id'));

console.log(`Wiki export: ${exported} topic pages + Home + Sidebars → ${OUT}`);
