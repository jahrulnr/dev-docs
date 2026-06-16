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
- `_Sidebar` dan `Sidebar-id` (halaman navigasi Bahasa Indonesia)

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

## Referensi

- GitHub Docs: “Creating a footer or sidebar for your wiki”
- Gollum Wiki: link/tag behavior dan special pages (`_Sidebar`, `_Footer`)

