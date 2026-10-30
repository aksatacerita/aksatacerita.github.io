// Merender seluruh halaman dari data (padanan home.blade.php di versi Laravel).
(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl2br = (v) => esc(v).replace(/\n/g, '<br>');
  const list = (v) => [...new Set(String(v || '').split(/[,\n]+/).map((s) => s.trim()).filter(Boolean))];
  const uniq = (arr) => [...new Set(arr)];

  const money = (amount, style) => {
    amount = Number(amount) || 0;
    if (style !== 'rp' && amount >= 1000 && amount % 1000 === 0) return amount / 1000 + 'K';
    return amount.toLocaleString('id-ID');
  };
  const LEGACY = { blue: '#0022ff', orange: '#ff6738', pink: '#ff79b8', green: '#b7e433' };
  const hexOf = (c) => {
    c = String(c || '').trim().toLowerCase();
    if (LEGACY[c]) return LEGACY[c];
    return /^#[0-9a-f]{6}$/.test(c) ? c : '#0022ff';
  };
  const textOn = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexOf(hex).slice(i, i + 2), 16));
    return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
  };

  const PATHS = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
    camera: '<path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="4" />',
    clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
    grid: '<rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" />',
    map: '<path d="M12 22s7-6.3 7-13a7 7 0 1 0-14 0c0 6.7 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" />',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" />',
    sparkle: '<path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" />',
    whatsapp: '<path d="M20 11.5A8.5 8.5 0 0 1 7.4 19l-4.4 1 1.1-4.2A8.5 8.5 0 1 1 20 11.5z" /><path d="M8 8c.5 3 2 4.5 5 5" />',
    x: '<path d="M6 6l12 12M18 6L6 18" />',
  };
  const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  const brand = (light) => `<a class="brand official-brand ${light ? 'brand-light' : ''}" href="./" aria-label="Aksata Cerita"><span class="brand-crop"><img src="assets/aksata-logo.png" alt="Aksata Cerita"></span></a>`;

  function packageCard(pkg, active, iconName) {
    const color = hexOf(pkg.color);
    const old = pkg.old_price_amount ? money(pkg.old_price_amount, pkg.price_style) : '';
    const addon = pkg.addon_price_amount ? money(pkg.addon_price_amount, pkg.price_style) : '';
    const duration = pkg.duration_value ? `${pkg.duration_value} ${pkg.duration_unit || 'menit'}` : '';
    return `<article class="package-card ${active ? 'active' : ''}" style="--card: ${color}">
      <div class="package-top"><span ${pkg.tag ? '' : 'hidden'}>${esc(pkg.tag)}</span>${icon(iconName, 28)}</div>
      <div>
        <h3>${esc(pkg.name)}</h3>
        ${pkg.description ? `<p class="package-desc">${esc(pkg.description)}</p>` : ''}
        ${pkg.price_note ? `<p>${esc(pkg.price_note)}</p>` : ''}
        <strong><small>Rp</small><span>${money(pkg.price_amount, pkg.price_style)}</span></strong>
        ${old ? `<s class="package-old">Rp${old}</s>` : ''}
      </div>
      ${duration ? `<div class="package-duration">${icon('clock', 14)} <span>${esc(duration)}</span></div>` : ''}
      <ul>${(pkg.features || []).map((f) => `<li><span>✓</span>${esc(f)}</li>`).join('')}</ul>
      ${addon ? `<div class="package-addon"><b>Add On <span>Rp${addon}</span></b><span>${esc(pkg.addon_text)}</span></div>` : ''}
      <button class="package-select" data-open-booking data-session="${esc(pkg.name)}">Pilih paket ${icon('arrow')}</button>
    </article>`;
  }

  window.renderSite = function (data) {
    const s = data.settings || {};
    const packages = data.packages || [];
    const frames = data.frames || [];
    const gallery = data.gallery || [];
    const instagram = data.instagram || [];

    const wa = 'https://wa.me/' + s.whatsapp;
    const waText = wa + '?text=' + encodeURIComponent(s.wa_message || '');
    const photos = gallery.map((g) => g.image).filter(Boolean);
    const p = (i) => (photos.length ? photos[i % photos.length] : '');
    const icons = ['camera', 'sparkle', 'grid'];
    const hasPin = s.latitude !== '' && s.longitude !== '' && !isNaN(Number(s.latitude)) && !isNaN(Number(s.longitude));
    const mapQuery = hasPin ? s.latitude + ',' + s.longitude : (s.studio_name + ' ' + String(s.address || '').replace(/\n/g, ' '));
    const mapsUrl = s.maps_url || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery);
    const showFrames = s.show_frames === '1' && frames.length > 0;
    const featured = (packages.find((x) => x.is_featured) || packages[0] || {}).id;

    const usedCats = gallery.map((g) => (g.category || '').toLowerCase());
    const categories = uniq([...list(s.gallery_categories), ...gallery.map((g) => g.category)].filter(Boolean).map((c) => c.toLowerCase()))
      .map((lc) => [...list(s.gallery_categories), ...gallery.map((g) => g.category)].find((c) => c && c.toLowerCase() === lc))
      .filter((c) => usedCats.includes(c.toLowerCase()));
    const frameTypes = uniq(frames.map((f) => f.type).filter(Boolean));

    const navItems = [['Beranda', true], ['Paket', true], ['Frame', showFrames], ['Galeri', gallery.length > 0], ['Lokasi', true]]
      .filter(([, v]) => v).map(([n]) => `<a href="#${n.toLowerCase()}">${n}</a>`).join('');
    const marquee = Array(8).fill('<span>SMILE BIG</span><i>✦</i><span>KEEP THE STORY</span><i>✦</i><span>BE YOURSELF</span><i>✦</i>').join('');

    const frameHtml = frames.map((f, i) => {
      const code = String(i + 1).padStart(2, '0');
      const color = hexOf(f.color);
      const visual = f.image
        ? `<div class="frame-photo"><img src="${esc(f.image)}" alt="Frame ${esc(f.name)}" loading="lazy">${f.label ? `<span class="frame-tag">${esc(f.label)}</span>` : ''}</div>`
        : `<div class="frame-strip" style="background:${color};color:${textOn(color)}"><div class="frame-head"><b>AKSATA<br>CERITA</b><span>${esc(f.label)}</span></div>${photos.length ? `<img src="${esc(p(i + 1))}" alt=""><img src="${esc(p(i + 2))}" alt="">` : ''}<div class="frame-bottom"><span>${esc(f.name)}</span><b>${code} / ${String(frames.length).padStart(2, '0')}</b></div></div>`;
      return `<article class="frame-wrap" data-type="${esc(f.type)}">${visual}<div class="frame-meta"><span>${code}</span><h3>${esc(f.name)}</h3>${f.size ? `<em class="frame-size">${esc(f.size)}</em>` : ''}<a href="${wa}?text=${encodeURIComponent('Halo Aksatacerita! Aku tertarik dengan frame ' + f.name)}" target="_blank" rel="noreferrer" aria-label="Tanya frame ${esc(f.name)}" style="width:34px;height:34px;border:1px solid;display:grid;place-items:center">${icon('arrow')}</a></div></article>`;
    }).join('');

    return `<div class="scroll-progress"></div>
    ${s.ticker || s.last_session ? `<div class="ticker"><span>${esc(s.ticker)}</span><span>WALK IN WELCOME${s.last_session ? ' · ' + esc(String(s.last_session).toUpperCase()) : ''}</span><span>${esc(s.ticker)}</span></div>` : ''}
    <nav class="nav shell">
      ${brand(false)}
      <div class="nav-links">${navItems}</div>
      <button class="btn btn-primary nav-cta" data-open-booking>Pesan sesi ${icon('arrow')}</button>
      <button class="menu-btn" aria-label="Buka menu">${icon('menu')}</button>
    </nav>

    <section class="hero shell" id="beranda">
      <div class="hero-copy">
        <div class="eyebrow"><span></span><span>PHOTOBOOTH STUDIO · ${esc(String(s.city || '').toUpperCase())}</span></div>
        <h1>${esc(s.hero_line1)}<br>${esc(s.hero_line2)} <em>${esc(s.hero_highlight)}</em></h1>
        <p>${esc(s.hero_text)}</p>
        <div class="hero-actions"><a class="btn btn-primary" href="#paket">Lihat paket ${icon('arrow')}</a><a class="text-link" href="#galeri">Intip cerita mereka <span>↘</span></a></div>
        ${s.proof_show === '1' && (s.proof_rating || s.proof_text) ? `<div class="hero-proof">${photos.length ? `<div class="avatar-stack">${[0, 1, 2].slice(0, Math.min(3, photos.length)).map((i) => `<img src="${esc(p(i))}" alt="">`).join('')}</div>` : ''}<div><b>${esc(s.proof_rating)}</b><span>${esc(s.proof_text)}</span></div></div>` : ''}
      </div>
      <div class="hero-collage">
        <div class="sunburst"></div>
        <div class="flash flash-one">✦</div><div class="flash flash-two">✦</div>
        ${photos.length ? `<div class="photo-card card-one"><img src="${esc(p(0))}" alt="Teman-teman berfoto bersama"><span>say cheese!</span></div><div class="photo-card card-two"><img src="${esc(p(1))}" alt="Pasangan berpose di studio"><span>♥ 14.02.25</span></div>` : ''}
        <div class="sticker sticker-blue">GOOD<br>TIMES!</div>
        <div class="sticker sticker-orange">#aksata<br>cerita</div>
        <div class="scribble">Our kind of<br><b>FUN!</b></div>
      </div>
    </section>

    <section class="manifesto"><div class="shell manifesto-inner"><p>Bukan cuma foto.</p><h2>Ini cara kita <span>menyimpan</span><br>hari-hari paling seru.</h2><div class="mini-note">NO AWKWARD POSES.<br>JUST BE YOU.</div></div></section>
    <div class="moving-type"><div>${marquee}</div></div>

    <section class="section shell" id="paket">
      <div class="section-heading"><div><span class="kicker">01 — PILIH CERITAMU</span><h2>Good moments,<br><i>fair prices.</i></h2></div><p>Dari foto formal sampai pose paling chaos—ada sesi untuk setiap cerita.</p></div>
      <div class="package-grid">${packages.length ? packages.map((pkg, i) => packageCard(pkg, pkg.id === featured, icons[i % 3])).join('') : '<p class="package-footnote" style="grid-column:1/-1">Paket segera hadir. Hubungi kami lewat WhatsApp untuk info terbaru.</p>'}</div>
      <p class="package-footnote">Butuh photobooth untuk wedding, brand activation, atau event? <a href="${waText.split('?')[0]}?text=${encodeURIComponent('Halo, aku mau tanya photobooth untuk event.')}" target="_blank" rel="noreferrer">Let's collaborate ↗</a></p>
    </section>

    ${showFrames ? `<section class="frames-section" id="frame"><div class="shell">
      <div class="section-heading compact"><div><span class="kicker">02 — FRAME OF THE MONTH</span><h2>Pilih mood.<br><i>Cetak ceritamu.</i></h2></div><p class="limited-note">Updated monthly</p></div>
      ${frameTypes.length > 1 ? `<div class="filters frame-filters">${['Semua', ...frameTypes].map((t, i) => `<button type="button" data-type="${esc(t)}" class="${i === 0 ? 'active' : ''}">${esc(t)}</button>`).join('')}</div>` : ''}
      <p class="frames-hint">Geser ke samping →</p>
      <div class="frames-scroll">${frameHtml}</div>
      <div class="frames-more" hidden><button type="button" class="btn btn-dark">Lihat semua frame ${icon('arrow')}</button></div>
    </div></section>` : ''}

    ${s.show_booth === '1' ? `<section class="booth-lab"><div class="shell booth-grid">
      <div class="booth-copy"><span class="kicker">AKSATA PLAYGROUND — BETA</span><h2>Try the booth.<br><i>Strike a pose!</i></h2><p>Pemanasan dulu sebelum datang ke studio. Tekan tombol shutter dan tunjukkan pose paling ikonikmu.</p><div class="booth-tips"><span>01&nbsp; LOOK</span><span>02&nbsp; POSE</span><span>03&nbsp; SNAP!</span></div></div>
      <div class="booth-machine" data-photos="${esc(JSON.stringify(photos))}">
        <div class="machine-top">${brand(false)}<span>LIVE PREVIEW <i></i></span></div>
        <div class="booth-screen">${photos.length ? `<img src="${esc(p(0))}" alt="Preview photobooth interaktif">` : ''}<div class="screen-grid"></div><span class="rec-badge">● REC</span><span class="frame-counter">FRAME 01</span><div class="screen-caption">YOU LOOK<br><b>AMAZING!</b></div></div>
        <div class="machine-controls"><div><span>FILTER</span><button class="color-dot blue" aria-label="Filter biru"></button><button class="color-dot orange" aria-label="Filter oranye"></button><button class="color-dot pink" aria-label="Filter merah muda"></button></div><button class="shutter"><span>${icon('camera', 25)}</span><b class="shutter-label" style="font:inherit">Take a photo</b></button><div class="machine-status"><i></i> READY</div></div>
        <div class="print-slot"><span>YOUR STORY COMES OUT HERE</span><i></i></div>
      </div></div></section>` : ''}

    ${gallery.length ? `<section class="section gallery-section shell" id="galeri">
      <div class="gallery-title"><span class="kicker">03 — TEMAN CERITA</span><h2>Real people.<br><i>Real fun.</i></h2><p>Tag <b>@${esc(s.instagram)}</b> supaya ceritamu bisa ikut tampil di sini.</p></div>
      ${categories.length > 1 ? `<div class="filters">${['Semua', ...categories].map((c, i) => `<button data-cat="${esc(c)}" class="${i === 0 ? 'active' : ''}">${esc(c)}</button>`).join('')}</div>` : ''}
      <div class="masonry">${gallery.map((g) => `<figure data-cat="${esc(g.category)}"><img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy"><figcaption><span>${esc(g.category)}</span><b>${esc(g.title)}</b></figcaption></figure>`).join('')}</div>
      <div class="gallery-more" hidden><button type="button" class="btn btn-dark gallery-toggle-btn">Lihat semua cerita (${gallery.length}) ${icon('arrow')}</button></div>
    </section>` : ''}

    ${s.show_instagram === '1' && instagram.length ? `<section class="instagram-section shell" id="instagram">
      <div class="gallery-title"><span class="kicker">FROM INSTAGRAM</span><h2>Lagi seru<br><i>di feed.</i></h2><p>Ikuti <a href="https://instagram.com/${esc(s.instagram)}" target="_blank" rel="noreferrer"><b>@${esc(s.instagram)}</b></a> untuk cerita terbaru.</p></div>
      <div class="ig-grid">${instagram.map((i) => `<div class="ig-item"><blockquote class="instagram-media" data-instgrm-permalink="${esc(i.url)}" data-instgrm-version="14"><a href="${esc(i.url)}" target="_blank" rel="noreferrer">Lihat di Instagram</a></blockquote></div>`).join('')}</div>
    </section>` : ''}

    <section class="visit" id="lokasi">
      <div class="visit-map"><iframe title="Lokasi ${esc(s.studio_name)}" src="https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
      <div class="visit-copy">
        <span class="kicker">04 — COME SAY HI</span><h2>Sampai ketemu<br>di <i>studio!</i></h2>
        <div class="info-row">${icon('map')}<div><b>${esc(s.studio_name)}</b><p>${nl2br(s.address)}</p></div></div>
        <div class="info-row">${icon('clock')}<div><b>${esc(s.open_days)}</b><p>${esc(s.open_hours)}${s.last_session ? `<br><small>${esc(s.last_session)}</small>` : ''}</p></div></div>
        ${s.email ? `<div class="info-row">${icon('whatsapp')}<div><b>Email</b><p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p></div></div>` : ''}
        <a class="btn btn-dark" href="${esc(mapsUrl)}" target="_blank" rel="noreferrer">Buka di Google Maps ${icon('arrow')}</a>
      </div>
    </section>

    <section class="cta-section"><div class="cta-orbit orbit-one">SAY CHEESE · SAY CHEESE ·</div><div class="cta-stars">✦　✧　✦</div><h2>Ready to make<br>your own <i>story?</i></h2><p>Nggak perlu jago pose. Datang aja, sisanya biar kami yang bikin seru.</p><button class="btn btn-light" data-open-booking>${icon('camera')} Mulai ceritamu</button></section>
    <footer><div class="shell footer-top">${brand(true)}<div><b>Explore</b><a href="#paket">Paket &amp; Harga</a>${showFrames ? '<a href="#frame">Katalog Frame</a>' : ''}${gallery.length ? '<a href="#galeri">Galeri Momen</a>' : ''}</div><div><b>Social</b><a href="https://instagram.com/${esc(s.instagram)}" target="_blank" rel="noreferrer">@${esc(s.instagram)} ↗</a>${s.tiktok ? `<a href="https://www.tiktok.com/@${esc(s.tiktok)}" target="_blank" rel="noreferrer">TikTok ↗</a>` : ''}${s.facebook ? `<a href="${esc(s.facebook)}" target="_blank" rel="noreferrer">Facebook ↗</a>` : ''}<a href="${waText}" target="_blank" rel="noreferrer">WhatsApp ↗</a></div><div class="footer-note">Made for<br><i>good stories.</i></div></div>
    <div class="shell footer-bottom"><span>© ${new Date().getFullYear()} AKSATACERITA PHOTOBOOTH · ${esc(String(s.city || '').toUpperCase())}</span></div>
    <div class="shell"><p class="credit credit-footer"><span class="credit-mark">✦</span><span>Dibuat oleh <b>Siswa RPL SMKN 1 Boyolangu</b></span></p></div></footer>
    <a class="floating-wa" href="${waText}" target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">${icon('whatsapp')}</a>
    <div class="booking-backdrop" data-close-booking></div>
    <aside class="booking-drawer" aria-hidden="true">
      <div class="booking-head"><div><span>RESERVE YOUR MOMENT</span><h2>Pesan sesi.</h2></div><button data-close-booking aria-label="Tutup">${icon('x')}</button></div>
      <div class="booking-step"><span>01</span><div><b>Pilih sesi favoritmu</b><p>Kamu bisa konfirmasi ulang lewat WhatsApp.</p></div></div>
      <div class="session-options">${packages.map((pkg) => `<button data-name="${esc(pkg.name)}"><span>${icon('camera')}</span><div><b>${esc(pkg.name)}</b><small>${esc(pkg.price_note || 'Harga')} Rp${money(pkg.price_amount, pkg.price_style)}</small></div><i>○</i></button>`).join('')}</div>
      <div class="booking-step"><span>02</span><div><b>Pilih waktu datang</b><p>${esc(s.open_days)}, ${esc(s.open_hours)}</p></div></div>
      <div class="date-chips"><button type="button" data-when="hari ini" class="active">Hari ini<small>Walk in</small></button><button type="button" data-when="besok">Besok<small>Datang besok</small></button><button type="button" data-when="date">Pilih tanggal<small>Kalender</small></button></div>
      <input type="date" class="booking-date" aria-label="Tanggal kedatangan" hidden>
      <a class="btn btn-primary booking-submit" href="${waText}" data-wa="${wa}" data-message="${esc(s.wa_message)}" target="_blank" rel="noreferrer">${icon('whatsapp')} Lanjut via WhatsApp ${icon('arrow')}</a>
      <p class="booking-note">Tidak perlu bayar sekarang · Dibalas cepat di jam operasional</p>
    </aside>`;
  };

  // Judul & deskripsi halaman, data terstruktur Google, dan embed Instagram.
  window.applyMeta = function (data) {
    const s = data.settings || {};
    if (s.meta_title) document.title = s.meta_title;
    const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', s.meta_description);
    const ld = {
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'Aksata Cerita', description: s.meta_description,
      url: location.origin + location.pathname, telephone: '+' + s.whatsapp,
      address: { '@type': 'PostalAddress', streetAddress: String(s.address || '').replace(/\n/g, ' '), addressLocality: s.city, addressCountry: 'ID' },
      sameAs: ['https://instagram.com/' + s.instagram, s.tiktok ? 'https://www.tiktok.com/@' + s.tiktok : null, s.facebook || null].filter(Boolean),
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
    if (s.show_instagram === '1' && (data.instagram || []).length) {
      const embed = document.createElement('script');
      embed.async = true;
      embed.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(embed);
    }
  };
})();
