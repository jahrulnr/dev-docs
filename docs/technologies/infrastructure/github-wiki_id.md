# GitHub Wiki (Gollum)

## Gambaran Umum

GitHub Wiki adalah fitur dokumentasi yang ditenagai engine **Gollum**. Di belakang layar, wiki adalah repo Git terpisah: `OWNER/REPO.wiki.git`.

Di dev-docs, kita auto-export `docs/` ke GitHub Wiki, jadi perilaku Wiki (page naming, internal link, aturan sidebar) itu bagian dari workflow “docs-as-code”.

## Constraint penting (yang jadi dasar SOP)

### 1) Namespace halaman itu flat (tidak ada folder beneran)

Wiki tidak punya folder sungguhan. “Hierarchy” hanya **konvensi penamaan**.

- Prefer: `Architecture Patterns - Bff`
- Hindari: `Architecture Patterns / Bff` (slash tidak didukung di judul halaman)

### 2) Halaman spesial

GitHub Wiki mengenali nama file spesial:

- `_Sidebar.md`: custom sidebar
- `_Footer.md`: custom footer

Selain itu dianggap halaman wiki biasa.

### 3) Aturan internal link (sumber error paling sering)

Kalau link ke **halaman wiki lain**:

- Jangan link ke `*.md`
- Pakai **nama halaman** (atau URL slug wiki), bukan path file
- Kalau destination mengandung spasi, cara paling aman adalah **URL-encode** destination (spasi → `%20`)

Contoh:

- Good: `[BFF](Architecture%20Patterns%20-%20Bff)`
- Bad: `[BFF](Architecture Patterns - Bff)` (bisa kebaca sebagai teks doang)
- Bad: `[BFF](Architecture-Patterns---Bff.md)` (bisa nyasar ke raw)

## SOP dev-docs: file naming → wiki page naming

### File sumber

Di `docs/`, kita simpan pasangan:

- `..._en.md`
- `..._id.md`

“Slug” (path tanpa suffix) harus stabil, karena itu dipakai buat membangun title halaman wiki.

### Halaman wiki hasil export

Exporter kita menghasilkan:

- 1 halaman per doc (EN + ID)
- `Home` dan `Home-id`
- `_Sidebar` saja — navigasi bilingual per baris topik (lihat di bawah)

#### Sidebar bilingual (UX dalam limitasi GitHub)

GitHub Wiki hanya punya satu `_Sidebar.md` global. Tidak ada sidebar per bahasa atau switch locale.

Pola kita: **satu baris per topik**, dengan link bahasa yang bisa diklik:

```markdown
- Clean Architecture · [EN](Architecture%20Patterns%20-%20Clean%20Architecture) · [ID](Architecture%20Patterns%20-%20Clean%20Architecture-id)
```

Header link `Home (EN)` dan `Beranda (ID)`. User pilih bahasa per topik dari sidebar — tanpa halaman `Sidebar-id` duplikat.

#### Konvensi penamaan

Kita pakai hierarchy yang mudah dibaca:

`{Parents digabung spasi} - {Leaf Title Case}`

Contoh:

- `best-practices/architecture/patterns/bff_*` → `Architecture Patterns - Bff`

#### Konvensi bahasa

Halaman Bahasa Indonesia pakai suffix:

- EN: `Architecture Patterns - Bff`
- ID: `Architecture Patterns - Bff-id`

## Checklist troubleshooting

### Sidebar tampil seperti teks `[Title](Some Page ...)` (nggak clickable)

Penyebab: Markdown renderer tidak nge-parse link destination (umumnya karena ada spasi).

Fix:

- Pastikan destination di-URL-encode: `Some%20Page%20Name`
- Pastikan destination itu nama halaman wiki (bukan `.md` file path)

### Klik link sidebar malah buka raw markdown

Penyebab: target link mengandung `.md` atau pakai URL raw/absolute.

Fix:

- Link ke nama halaman saja (tanpa `.md`)

## Landscape: pendekatan otomasi yang umum

Bagian ini merangkum pendekatan otomasi GitHub Wiki yang sering dipakai, berdasarkan beberapa repo/tool yang memang populer di ekosistem.

### A) Sync folder → `REPO.wiki.git` (GitHub Action)

Action tipe ini “mirror” folder (mis. `docs/` atau `wiki/`) ke repo wiki:

- **`Andrew-Chen-Wang/github-wiki-action`**: punya `strategy: clone|init`, opsi preprocess (pindah `README.md` → `Home.md`, rewrite link `.md` jadi bare link), dan bisa publish ke wiki repo lain via PAT.[^aw]
- **`victor-public/wiki-automation`**: composite action yang simpel (copy folder → wiki repo + force push); sidebar/footer di-maintain sebagai file `_Sidebar.md` / `_Footer.md` di folder docs.[^vp]
- **`ineshbose/wiki-action`**: sync `WIKI_DIR` dan bisa auto-generate `_Sidebar.md` dari struktur folder (ada caveat soal kualitas grouping).[^ib]

**Cocok untuk**: ngilangin step manual clone/push `*.wiki.git`, dan sinkron termasuk delete.

**Kurang cocok untuk**: sidebar yang perlu grouping “semantik” (pillar/subpillar) kalau struktur folder-nya bukan representasi grouping itu.

### B) Generate `_Sidebar.md` dari daftar halaman wiki (CLI)

- **`adriantanasa/github-wiki-sidebar`**: CLI interaktif (exclude list, ordering, template) dan sebenarnya “delegasi” ke `git-wiki-to-html --template=markdown` untuk generate menu.[^gws][^gwth]

**Catatan penting (nyambung ke bug kita)**: template default biasanya membuat link Markdown seperti `* [Title](./Some Page)`. Kalau destination mengandung spasi, beberapa parser Markdown akan gagal nge-render link (jadinya tampil sebagai teks). Exporter dev-docs menghindari ini dengan URL-encoding destination internal (spasi → `%20`).

### C) Generate + inject TOC ke `Home.md` / `_Sidebar.md` (CLI)

- **`droctothorpe/toco`**: bikin TOC dari file wiki, lalu inject ke `Home.md` dan `_Sidebar.md` di antara marker `<!--starttoc-->` dan `<!--endtoc-->`.[^toco]

Ini berguna kalau kamu ingin ada “TOC block” di body halaman, bukan hanya menu sidebar.

### D) “Gimana bikin GitHub Wiki kelihatan rapi” (style & trik)

- **`practicalseries/GitHub-Wiki-Design-and-Implementation`**: guide yang dalam tentang constraint GitHub Wiki + workaround (GFM limitation, HTML tricks, navigation pattern, dan “imposed folder structure”).[^ps]

Kalau targetnya UI/UX wiki yang lebih polished (badge/button/nav bar/per-page sidebar), referensi ini paling kaya dari yang kita review.

## Panduan praktis untuk dev-docs

- Kalau corpus kamu sudah **index-driven** (kayak dev-docs), paling aman: generation tetap deterministic dari `index.json` dan wiki dianggap **mirror** (render target).
- Kalau nanti mau pindah ke “folder mirroring”, evaluasi `Andrew-Chen-Wang/github-wiki-action` dulu (preprocess + sinkron delete), lalu putuskan sidebar mau folder-tree-based atau metadata-based (approach kita sekarang).

## Referensi

- GitHub Docs: “Creating a footer or sidebar for your wiki”
- Gollum Wiki: link/tag behavior dan special pages (`_Sidebar`, `_Footer`)

[^aw]: `https://github.com/Andrew-Chen-Wang/github-wiki-action`
[^vp]: `https://github.com/victor-public/wiki-automation`
[^ib]: `https://github.com/ineshbose/wiki-action`
[^gws]: `https://github.com/adriantanasa/github-wiki-sidebar`
[^gwth]: `https://www.npmjs.com/package/git-wiki-to-html`
[^toco]: `https://github.com/droctothorpe/toco`
[^ps]: `https://github.com/practicalseries/GitHub-Wiki-Design-and-Implementation`

