/**
 * Aksata Cerita — backend admin (Google Apps Script, terikat ke Google Sheets).
 *
 * Sheet : Paket, Frame, Galeri, Instagram, Pengaturan (urutan baris = urutan tampil di situs).
 * Admin : web app (Admin.html). Hanya email di ADMIN_EMAILS yang boleh.
 * Situs : doGet?action=public mengeluarkan JSON; publishSite() menulis docs/data.json + foto ke GitHub (GitHub Pages).
 *
 * Pengaturan rahasia ada di Project Settings → Script properties:
 *   ADMIN_EMAILS   email admin dipisah koma (wajib)
 *   GITHUB_TOKEN   token (fine-grained, izin Contents: read & write pada repo ini) — opsional sampai tahap GitHub
 *   GITHUB_REPO    mis. rania-n/Aksatacerita
 *   GITHUB_BRANCH  mis. gas
 *   SITE_DIR       folder situs di repo, bawaan: docs
 */

var DEFAULT_SETTINGS = {
  studio_name: 'Aksata Cerita Photobooth', city: 'Tulungagung',
  address: 'Jl. I Gusti Ngurah Rai Gg. 7 No.73,\nJepun, Kec. Tulungagung, Kabupaten Tulungagung, Jawa Timur 66218',
  latitude: '-8.0412672', longitude: '111.9158272', maps_url: 'https://maps.app.goo.gl/8VrbRe4nmPsAG6Jf8',
  open_days: 'Setiap Hari', open_hours: '10.00 — 22.00 WIB', last_session: 'Last session 21.30',
  ticker: 'STUDIO OPEN DAILY · 10.00—22.00 WIB',
  whatsapp: '6285117375305', wa_message: 'Halo Aksatacerita! Aku mau pesan ', email: '', instagram: 'aksatacerita', tiktok: '', facebook: '',
  hero_line1: 'Abadikan cerita', hero_line2: 'serumu di', hero_highlight: 'Aksata.',
  hero_text: 'Masuk, pilih pose paling random, lalu bawa pulang potongan cerita yang nggak akan terulang dua kali.',
  proof_show: '1', proof_rating: '4.9 / 5', proof_text: 'disayang 2,000+ teman cerita',
  show_frames: '1', show_booth: '1', show_instagram: '1',
  gallery_categories: 'Event, Wisuda, Couple, Bestie',
  options_package_tag: 'Most Picked, Best Seller, Promo, Baru, Hemat, Slow & Sweet, Ready in 10 min',
  options_package_note: 'Mulai dari, Hanya, Per sesi',
  options_frame_type: 'Frame Biasa, Frame Koran, ID Card',
  options_frame_size: '2R, 4R',
  options_frame_label: 'NEW DROP, SIGNATURE, LIMITED, FAVORITE, BEST SELLER',
  meta_title: 'Aksata Cerita — Photobooth Studio Tulungagung',
  meta_description: 'Aksata Cerita, photobooth studio di Tulungagung. Pilih paket, pilih frame, abadikan ceritamu.'
};

/** t: text | longtext | number | bool | color | list | image | select. Kolom pertama tiap sheet selalu "id". */
var SCHEMA = {
  paket: { sheet: 'Paket', label: 'Paket', singular: 'paket', imgDir: null, titleKey: 'name', fields: [
    { k: 'active', h: 'aktif', t: 'bool', label: 'Tampilkan di situs' },
    { k: 'name', h: 'nama', t: 'text', req: 1, label: 'Nama paket' },
    { k: 'description', h: 'deskripsi', t: 'longtext', label: 'Deskripsi singkat' },
    { k: 'duration_value', h: 'durasi', t: 'number', label: 'Durasi' },
    { k: 'duration_unit', h: 'satuan_durasi', t: 'select', opts: ['menit', 'detik'], label: 'Satuan durasi' },
    { k: 'price_note', h: 'catatan_harga', t: 'text', list: 'options_package_note', label: 'Catatan harga (Mulai dari, Hanya…)' },
    { k: 'price_amount', h: 'harga', t: 'number', req: 1, label: 'Harga (angka, mis. 25000)' },
    { k: 'price_style', h: 'gaya_harga', t: 'select', opts: ['k', 'rp'], optLabels: { k: 'Singkat (35K)', rp: 'Lengkap (35.000)' }, label: 'Tampilan harga' },
    { k: 'old_price_amount', h: 'harga_coret', t: 'number', label: 'Harga coret (opsional)' },
    { k: 'addon_price_amount', h: 'harga_addon', t: 'number', label: 'Harga add-on (opsional)' },
    { k: 'addon_text', h: 'teks_addon', t: 'text', label: 'Keterangan add-on' },
    { k: 'tag', h: 'tag', t: 'text', list: 'options_package_tag', label: 'Label (Best Seller, Promo…)' },
    { k: 'color', h: 'warna', t: 'color', label: 'Warna kartu' },
    { k: 'features', h: 'fitur', t: 'list', label: 'Isi paket (satu baris satu poin)' },
    { k: 'is_featured', h: 'unggulan', t: 'bool', label: 'Paket unggulan' }
  ] },
  frame: { sheet: 'Frame', label: 'Frame', singular: 'frame', imgDir: 'frames', titleKey: 'name', fields: [
    { k: 'active', h: 'aktif', t: 'bool', label: 'Tampilkan di situs' },
    { k: 'name', h: 'nama', t: 'text', req: 1, label: 'Nama frame' },
    { k: 'image', h: 'gambar', t: 'image', label: 'Gambar frame' },
    { k: 'label', h: 'label', t: 'text', list: 'options_frame_label', label: 'Label (NEW DROP, LIMITED…)' },
    { k: 'type', h: 'jenis', t: 'text', list: 'options_frame_type', label: 'Jenis' },
    { k: 'size', h: 'ukuran', t: 'text', list: 'options_frame_size', label: 'Ukuran' },
    { k: 'color', h: 'warna', t: 'color', label: 'Warna (dipakai bila tanpa gambar)' }
  ] },
  galeri: { sheet: 'Galeri', label: 'Galeri', singular: 'foto', imgDir: 'gallery', titleKey: 'title', fields: [
    { k: 'active', h: 'aktif', t: 'bool', label: 'Tampilkan di situs' },
    { k: 'title', h: 'judul', t: 'text', req: 1, label: 'Judul' },
    { k: 'image', h: 'gambar', t: 'image', req: 1, label: 'Foto' },
    { k: 'category', h: 'kategori', t: 'text', list: 'gallery_categories', label: 'Kategori' }
  ] },
  instagram: { sheet: 'Instagram', label: 'Instagram', singular: 'postingan', imgDir: null, titleKey: 'url', fields: [
    { k: 'active', h: 'aktif', t: 'bool', label: 'Tampilkan di situs' },
    { k: 'url', h: 'link', t: 'text', req: 1, label: 'Link postingan (instagram.com/p/… atau /reel/…)' }
  ] }
};

var SETTINGS_SHEET = 'Pengaturan';

/* ---------- Menu & penyiapan ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Aksata')
    .addItem('Siapkan sheet (sekali saja)', 'setupSheets')
    .addItem('Impor data dari GitHub (docs/data.json)', 'importFromGithub')
    .addItem('Terbitkan ke situs', 'publishFromMenu')
    .addToUi();
}

function setupSheets() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (kind) {
    var def = SCHEMA[kind];
    var sh = ss.getSheetByName(def.sheet) || ss.insertSheet(def.sheet);
    var headers = ['id'].concat(def.fields.map(function (f) { return f.h; }));
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    formatSheet_(kind);
  });
  var st = ss.getSheetByName(SETTINGS_SHEET) || ss.insertSheet(SETTINGS_SHEET);
  st.getRange(1, 1, 1, 2).setValues([['kunci', 'nilai']]).setFontWeight('bold');
  plainText_(st, 1, 0); plainText_(st, 2, 0);
  var have = readSettings_();
  var add = Object.keys(DEFAULT_SETTINGS).filter(function (k) { return !(k in have); })
    .map(function (k) { return [k, DEFAULT_SETTINGS[k]]; });
  if (add.length) st.getRange(st.getLastRow() + 1, 1, add.length, 2).setValues(add);
  var first = ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1 && first.getLastRow() === 0) ss.deleteSheet(first);
  return 'Sheet siap.';
}


/* ---------- Penyiapan satu kali ---------- */

/**
 * Jalankan SEKALI dari editor Apps Script (pilih fungsi ini → Run).
 * Pemilik script otomatis jadi admin. Tambahkan email admin lain di EXTRA_ADMINS bila perlu.
 * GITHUB_TOKEN TIDAK diisi di sini (rahasia) — isi manual di Project Settings → Script properties.
 */
function setConfig() {
  var EXTRA_ADMINS = [];
  var owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  var admins = [owner].concat(EXTRA_ADMINS).filter(String);
  props_().setProperties({
    ADMIN_EMAILS: admins.join(','),
    GITHUB_REPO: 'aksatacerita/aksatacerita.github.io',
    GITHUB_BRANCH: 'main',
    SITE_DIR: 'docs'
  });
  return 'Admin: ' + admins.join(', ');
}

/* ---------- Akses ---------- */

function props_() { return PropertiesService.getScriptProperties(); }

function adminEmails_() {
  return String(props_().getProperty('ADMIN_EMAILS') || '').toLowerCase().split(/[,\s;]+/).filter(String);
}

function requireAdmin_() {
  var email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email || adminEmails_().indexOf(email) === -1) throw new Error('Akses ditolak. Email ini belum terdaftar sebagai admin.');
  return email;
}

/* ---------- Web app ---------- */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'admin';
  if (action === 'public') {
    return ContentService.createTextOutput(JSON.stringify(getPublicData_())).setMimeType(ContentService.MimeType.JSON);
  }
  var tpl = HtmlService.createTemplateFromFile('Admin');
  return tpl.evaluate().setTitle('Admin Aksata Cerita')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- Baca / tulis sheet ---------- */

/** Kolom teks diset "teks biasa" supaya Sheets (locale Indonesia) tidak mengubah mis. 111.9158272 menjadi angka ribuan. */
function plainText_(sh, col, rows) {
  sh.getRange(2, col, Math.max(rows, 1000), 1).setNumberFormat('@');
}

function formatSheet_(kind) {
  var def = SCHEMA[kind];
  var sh = sheet_(def.sheet);
  plainText_(sh, 1, 0);
  def.fields.forEach(function (f, i) { if (f.t !== 'number' && f.t !== 'bool') plainText_(sh, i + 2, 0); });
}


function sheet_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" belum ada. Jalankan menu Aksata → Siapkan sheet.');
  return sh;
}

function fromCell_(f, v) {
  if (f.t === 'bool') return v === true || String(v).toUpperCase() === 'TRUE' || String(v) === '1';
  if (f.t === 'number') return v === '' || v === null ? '' : Number(v);
  return v === null || v === undefined ? '' : String(v);
}

function toCell_(f, v) {
  if (f.t === 'bool') return !!v;
  if (f.t === 'number') return v === '' || v === null || v === undefined || isNaN(Number(v)) ? '' : Number(v);
  return v === null || v === undefined ? '' : String(v);
}

function readRows_(kind) {
  var def = SCHEMA[kind];
  var sh = sheet_(def.sheet);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var width = def.fields.length + 1;
  return sh.getRange(2, 1, last - 1, width).getValues()
    .filter(function (r) { return r[0] !== '' || r.slice(1).join('') !== ''; })
    .map(function (r) {
      var o = { id: String(r[0] || Utilities.getUuid()) };
      def.fields.forEach(function (f, i) { o[f.k] = fromCell_(f, r[i + 1]); });
      return o;
    });
}

function writeRows_(kind, rows) {
  var def = SCHEMA[kind];
  var sh = sheet_(def.sheet);
  var width = def.fields.length + 1;
  formatSheet_(kind);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, width).clearContent();
  if (rows.length) {
    var values = rows.map(function (r) {
      return [r.id || Utilities.getUuid()].concat(def.fields.map(function (f) { return toCell_(f, r[f.k]); }));
    });
    sh.getRange(2, 1, values.length, width).setValues(values);
  }
}

function readSettings_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0] !== '') out[String(r[0])] = String(r[1] === null ? '' : r[1]); });
  return out;
}

function writeSettings_(obj) {
  var sh = sheet_(SETTINGS_SHEET);
  var keys = Object.keys(obj);
  plainText_(sh, 1, 0); plainText_(sh, 2, 0);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  if (keys.length) sh.getRange(2, 1, keys.length, 2).setValues(keys.map(function (k) { return [k, String(obj[k])]; }));
}

function settings_() {
  var s = readSettings_();
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { if (!(k in s)) s[k] = DEFAULT_SETTINGS[k]; });
  return s;
}

/* ---------- Data publik (bentuk sama dengan docs/data.json) ---------- */

function buildPublicData_() {
  var active = function (rows) { return rows.filter(function (r) { return r.active; }); };
  return {
    settings: settings_(),
    packages: active(readRows_('paket')).map(function (p) {
      return {
        id: p.id, name: p.name, description: p.description,
        duration_value: p.duration_value === '' ? null : p.duration_value, duration_unit: p.duration_unit || 'menit',
        price_note: p.price_note, price_amount: p.price_amount === '' ? 0 : p.price_amount, price_style: p.price_style || 'k',
        old_price_amount: p.old_price_amount === '' ? null : p.old_price_amount,
        addon_price_amount: p.addon_price_amount === '' ? null : p.addon_price_amount, addon_text: p.addon_text,
        tag: p.tag, color: p.color,
        features: String(p.features || '').split('\n').map(function (x) { return x.trim(); }).filter(String),
        is_featured: !!p.is_featured
      };
    }),
    frames: active(readRows_('frame')).map(function (f) {
      return { id: f.id, name: f.name, label: f.label, type: f.type, size: f.size, color: f.color, image: f.image || null };
    }),
    gallery: active(readRows_('galeri')).map(function (g) {
      return { id: g.id, title: g.title, category: g.category, image: g.image || null };
    }),
    instagram: active(readRows_('instagram')).map(function (i) { return { id: i.id, url: i.url }; }),
    updated_at: new Date().toISOString()
  };
}

function getPublicData_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('public');
  if (hit) return JSON.parse(hit);
  var data = buildPublicData_();
  try { cache.put('public', JSON.stringify(data), 300); } catch (e) { /* terlalu besar: lewati cache */ }
  return data;
}

function clearCache_() { CacheService.getScriptCache().remove('public'); }

/* ---------- API untuk Admin.html (google.script.run) ---------- */

function api_bootstrap() {
  var email = requireAdmin_();
  var data = {};
  Object.keys(SCHEMA).forEach(function (k) { data[k] = readRows_(k); });
  return { email: email, schema: SCHEMA, data: data, settings: settings_(), defaults: DEFAULT_SETTINGS, assetBase: assetBase_(), github: githubConfigured_() };
}

function api_saveRows(kind, rows) {
  requireAdmin_();
  if (!SCHEMA[kind]) throw new Error('Jenis data tidak dikenal.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var def = SCHEMA[kind];
    rows.forEach(function (r) {
      def.fields.forEach(function (f) {
        if (f.req && (r[f.k] === '' || r[f.k] === null || r[f.k] === undefined)) throw new Error('"' + f.label + '" wajib diisi.');
      });
      if (kind === 'instagram') {
        var m = /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i.exec(String(r.url).trim());
        if (!m) throw new Error('Link Instagram tidak valid: ' + r.url);
        r.url = 'https://www.instagram.com/' + m[1].toLowerCase() + '/' + m[2] + '/';
      }
    });
    writeRows_(kind, rows);
    clearCache_();
  } finally { lock.releaseLock(); }
  return readRows_(kind);
}

function api_saveSettings(obj) {
  requireAdmin_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var merged = settings_();
    Object.keys(obj).forEach(function (k) { merged[k] = String(obj[k]); });
    writeSettings_(merged);
    clearCache_();
  } finally { lock.releaseLock(); }
  return settings_();
}

/** Simpan foto (sudah diperkecil di browser) ke Drive, bisa dilihat siapa saja yang punya link. */
function api_upload(dataUrl, name) {
  requireAdmin_();
  var m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error('Berkas bukan gambar.');
  var folder = driveFolder_();
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name || 'foto'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1600';
}

function driveFolder_() {
  var up = PropertiesService.getUserProperties();
  var id = up.getProperty('DRIVE_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* dibuat ulang */ } }
  var folder = DriveApp.createFolder('Aksata Cerita — foto situs');
  up.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function api_publish() {
  requireAdmin_();
  return publishSite_();
}

function publishFromMenu() {
  var ui = SpreadsheetApp.getUi();
  try { ui.alert(publishSite_().message); } catch (e) { ui.alert('Gagal: ' + e.message); }
}

/* ---------- GitHub ---------- */

function githubConfigured_() {
  var p = props_();
  return !!(p.getProperty('GITHUB_TOKEN') && p.getProperty('GITHUB_REPO'));
}

function ghConf_() {
  var p = props_();
  return { token: p.getProperty('GITHUB_TOKEN'), repo: p.getProperty('GITHUB_REPO'), branch: p.getProperty('GITHUB_BRANCH') || 'main', dir: (p.getProperty('SITE_DIR') || 'docs').replace(/^\/|\/$/g, '') };
}

function assetBase_() {
  var c = ghConf_();
  return c.repo ? 'https://raw.githubusercontent.com/' + c.repo + '/' + c.branch + '/' + c.dir + '/' : '';
}

function gh_(method, path, body) {
  var c = ghConf_();
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + c.repo + path, {
    method: method, muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    payload: body ? JSON.stringify(body) : undefined
  });
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code >= 300) throw new Error('GitHub ' + code + ': ' + text.slice(0, 200));
  return text ? JSON.parse(text) : {};
}

var DRIVE_ID_RE = /(?:drive\.google\.com\/.*[?&]id=|googleusercontent\.com\/d\/)([\w-]+)/;

/** Tulis docs/data.json + foto baru ke GitHub dalam satu commit; foto yang tidak dipakai lagi dihapus. */
function publishSite_() {
  if (!githubConfigured_()) return { ok: true, message: 'Tersimpan. (Penerbitan ke GitHub belum diatur — situs membaca langsung dari Sheets.)' };
  var c = ghConf_();
  var data = buildPublicData_();
  var uploads = {}; // path relatif -> blob
  var used = {};

  var localize = function (item, dir) {
    var img = item.image;
    if (!img) return;
    var m = DRIVE_ID_RE.exec(img);
    if (m) {
      var res = UrlFetchApp.fetch('https://lh3.googleusercontent.com/d/' + m[1] + '=w1600', { muteHttpExceptions: true, followRedirects: true });
      if (res.getResponseCode() !== 200) throw new Error('Foto ' + item.name + item.title + ' tidak bisa diambil dari Drive.');
      var type = res.getBlob().getContentType();
      var ext = /png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : 'jpg';
      var rel = 'img/' + dir + '/' + m[1] + '.' + ext;
      uploads[rel] = res.getBlob();
      item.image = rel;
    }
    if (!/^https?:/.test(item.image)) used[item.image] = true;
  };
  data.frames.forEach(function (f) { f.name = f.name || ''; localize(f, 'frames'); });
  data.gallery.forEach(function (g) { g.title = g.title || ''; localize(g, 'gallery'); });

  var headRef = gh_('GET', '/git/ref/heads/' + c.branch);
  var headCommit = gh_('GET', '/git/commits/' + headRef.object.sha);
  var tree = gh_('GET', '/git/trees/' + headCommit.tree.sha + '?recursive=1');
  var existing = {};
  tree.tree.forEach(function (n) { if (n.type === 'blob' && n.path.indexOf(c.dir + '/img/') === 0) existing[n.path.slice(c.dir.length + 1)] = true; });

  var entries = [];
  Object.keys(uploads).forEach(function (rel) {
    if (existing[rel]) return;
    var blob = gh_('POST', '/git/blobs', { content: Utilities.base64Encode(uploads[rel].getBytes()), encoding: 'base64' });
    entries.push({ path: c.dir + '/' + rel, mode: '100644', type: 'blob', sha: blob.sha });
  });
  var json = JSON.stringify(data, null, 2) + '\n';
  var dataBlob = gh_('POST', '/git/blobs', { content: json, encoding: 'utf-8' });
  entries.push({ path: c.dir + '/data.json', mode: '100644', type: 'blob', sha: dataBlob.sha });
  Object.keys(existing).forEach(function (rel) {
    if (!used[rel] && /^img\/(frames|gallery)\//.test(rel)) entries.push({ path: c.dir + '/' + rel, mode: '100644', type: 'blob', sha: null });
  });

  var newTree = gh_('POST', '/git/trees', { base_tree: headCommit.tree.sha, tree: entries });
  if (newTree.sha === headCommit.tree.sha) return { ok: true, message: 'Tidak ada perubahan untuk diterbitkan.' };
  var commit = gh_('POST', '/git/commits', { message: 'Admin: perbarui isi situs', tree: newTree.sha, parents: [headRef.object.sha] });
  gh_('PATCH', '/git/refs/heads/' + c.branch, { sha: commit.sha });
  return { ok: true, message: 'Terbit! Situs akan diperbarui dalam 1–2 menit.', commit: commit.sha };
}

/** Isi sheet dari docs/data.json di GitHub (untuk memulai dari data yang sudah diekspor dari Laravel). */
function importFromGithub() {
  var ui = SpreadsheetApp.getUi();
  var c = ghConf_();
  if (!c.repo) { ui.alert('Isi GITHUB_REPO dan GITHUB_BRANCH di Script properties dulu.'); return; }
  setupSheets();
  var res = UrlFetchApp.fetch('https://raw.githubusercontent.com/' + c.repo + '/' + c.branch + '/' + c.dir + '/data.json?t=' + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) { ui.alert('data.json tidak ditemukan (' + res.getResponseCode() + ').'); return; }
  var d = JSON.parse(res.getContentText());
  writeRows_('paket', (d.packages || []).map(function (p) {
    return { id: p.id, active: true, name: p.name, description: p.description || '', duration_value: p.duration_value, duration_unit: p.duration_unit,
      price_note: p.price_note || '', price_amount: p.price_amount, price_style: p.price_style, old_price_amount: p.old_price_amount,
      addon_price_amount: p.addon_price_amount, addon_text: p.addon_text || '', tag: p.tag || '', color: p.color, features: (p.features || []).join('\n'), is_featured: p.is_featured };
  }));
  writeRows_('frame', (d.frames || []).map(function (f) {
    return { id: f.id, active: true, name: f.name, image: f.image || '', label: f.label || '', type: f.type || '', size: f.size || '', color: f.color };
  }));
  writeRows_('galeri', (d.gallery || []).map(function (g) {
    return { id: g.id, active: true, title: g.title, image: g.image || '', category: g.category || '' };
  }));
  writeRows_('instagram', (d.instagram || []).map(function (i) { return { id: i.id, active: true, url: i.url }; }));
  var cur = readSettings_();
  writeSettings_(Object.assign({}, DEFAULT_SETTINGS, cur, d.settings || {}));
  clearCache_();
  ui.alert('Impor selesai.');
}
