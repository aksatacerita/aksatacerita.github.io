# Aksata Cerita

Website photobooth Aksata Cerita (Tulungagung).

- **Situs:** https://aksatacerita.github.io/
- **Panduan admin (interaktif):** https://aksatacerita.github.io/panduan.html

## Struktur

| Folder | Isi |
|---|---|
| `docs/` | Situs statis yang tayang di GitHub Pages (`index.html`, `css/`, `js/`, `img/`, `data.json`) |
| `apps-script/` | Admin (Google Apps Script) — `Code.gs`, `Admin.html`, `appsscript.json` |

## Cara kerja

```
Admin (Apps Script) → Google Sheet (data) → Terbitkan → commit ke repo ini (docs/data.json + img/) → GitHub Pages
```

- Isi situs dibaca dari `docs/data.json`; semua halaman memuatnya lewat `docs/js/config.js`.
- Tombol **Terbitkan ke situs** di admin menulis `data.json` dan foto baru ke `docs/` dalam satu commit.
- Rahasia (token GitHub, daftar email admin) hanya ada di *Script properties* Apps Script, **tidak** di repo ini.

## Mengembangkan admin

```bash
cd apps-script
npx @google/clasp login      # sekali, dengan akun Aksata
npx @google/clasp push -f
npx @google/clasp create-version "catatan"
npx @google/clasp update-deployment <deploymentId> -V <versi>
```

`.clasp.json` tidak ikut di-commit.
