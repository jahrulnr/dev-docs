#!/usr/bin/env node
/**
 * Fast doc lookup: node scripts/lookup.mjs "circuit breaker" [--lang id]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const lang = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1] ?? 'en'
  : 'en';
const query = args.join(' ').toLowerCase().trim();

if (!query) {
  console.error('Usage: node scripts/lookup.mjs <query> [--lang en|id]');
  process.exit(1);
}

const index = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'));

function score(entry) {
  const tokens = query.split(/\s+/).filter(Boolean);
  let s = 0;
  if (entry.slug === query || entry.id === query) s += 100;
  if (entry.slug.includes(query)) s += 50;
  if (entry.title.toLowerCase().includes(query)) s += 40;
  for (const kw of entry.keywords) {
    if (kw === query) s += 80;
    else if (kw.includes(query) || query.includes(kw)) s += 20;
    for (const t of tokens) {
      if (kw === t) s += 60;
      else if (kw.includes(t) || t.includes(kw)) s += 15;
    }
  }
  return s;
}

const ranked = index.entries
  .map((e) => ({ e, s: score(e) }))
  .filter(({ s }) => s > 0)
  .sort((a, b) => b.s - a.s)
  .slice(0, 8);

if (ranked.length === 0) {
  console.log('No matches. Try pillar browse in SKILL.md or rebuild index.');
  process.exit(2);
}

for (const { e, s } of ranked) {
  const path = lang === 'id' ? e.path_id : e.path_en;
  console.log(`${s.toString().padStart(3)}  ${path}  (${e.title})`);
}
