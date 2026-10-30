window.initSite = function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Scroll progress
  const bar = $('.scroll-progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const links = $('.nav-links');
  const menuBtn = $('.menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.dataset.open = open;
  });
  $$('a', links).forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));

  // Package cards
  const cards = $$('.package-card');
  cards.forEach((card) => {
    const activate = () => { cards.forEach((c) => c.classList.toggle('active', c === card)); };
    card.addEventListener('mouseenter', activate);
    card.addEventListener('click', (e) => {
      activate();
      const btn = $('.package-select[data-open-booking]', card);
      if (btn && !e.target.closest('a, button')) btn.click();
    });
  });

  // Booking drawer
  const drawer = $('.booking-drawer');
  const backdrop = $('.booking-backdrop');
  const submit = $('.booking-submit');
  const options = $$('.session-options > button');
  const setBooking = (open) => {
    drawer.classList.toggle('show', open);
    backdrop.classList.toggle('show', open);
    drawer.setAttribute('aria-hidden', String(!open));
  };
  let session = '';
  let when = 'hari ini';
  const dateInput = $('.booking-date');
  const chips = $$('.date-chips button');
  const updateLink = () => {
    const text = submit.dataset.message + session + (when ? ' untuk ' + when : '');
    submit.href = submit.dataset.wa + '?text=' + encodeURIComponent(text);
  };
  const selectSession = (name) => {
    let found = false;
    options.forEach((o) => {
      const on = o.dataset.name === name;
      found = found || on;
      o.classList.toggle('active', on);
      $('i', o).textContent = on ? '✓' : '○';
    });
    if (found) { session = name; updateLink(); }
  };
  $$('[data-open-booking]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.session) selectSession(b.dataset.session);
    setBooking(true);
  }));
  $$('[data-close-booking]').forEach((b) => b.addEventListener('click', () => setBooking(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setBooking(false); });
  options.forEach((o) => o.addEventListener('click', () => selectSession(o.dataset.name)));
  if (options[0]) selectSession(options[0].dataset.name);

  // Waktu datang (ikut masuk ke pesan WhatsApp)
  const pad = (n) => String(n).padStart(2, '0');
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const pickDate = () => {
    if (!dateInput.value) { when = ''; return updateLink(); }
    const [y, m, d] = dateInput.value.split('-').map(Number);
    when = new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    updateLink();
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.classList.toggle('active', x === c));
    if (c.dataset.when === 'date') {
      dateInput.hidden = false;
      pickDate();
      if (dateInput.showPicker) { try { dateInput.showPicker(); } catch (e) { /* abaikan */ } }
    } else {
      dateInput.hidden = true;
      when = c.dataset.when;
      updateLink();
    }
  }));
  dateInput.addEventListener('change', pickDate);
  updateLink();

  // Gallery filter & expandable view
  const filters = $$('.gallery-section .filters button');
  const figures = $$('.masonry figure');
  const galleryMoreBox = $('.gallery-more');
  const galleryToggleBtn = $('.gallery-toggle-btn');
  const FIRST_GALLERY = 6;
  let currentCat = 'Semua';
  let galleryExpanded = false;

  const renderGallery = () => {
    const matching = figures.filter((fig) => currentCat === 'Semua' || fig.dataset.cat.toLowerCase() === currentCat.toLowerCase());
    figures.forEach((fig) => { fig.hidden = true; });
    let n = 0;
    matching.forEach((fig, i) => {
      const show = galleryExpanded || i < FIRST_GALLERY;
      fig.hidden = !show;
      if (show) {
        fig.classList.toggle('tall', n++ % 3 === 1);
      }
    });

    if (galleryMoreBox && galleryToggleBtn) {
      if (matching.length > FIRST_GALLERY) {
        galleryMoreBox.hidden = false;
        galleryToggleBtn.innerHTML = galleryExpanded
          ? 'Tampilkan lebih sedikit ↑'
          : `Lihat semua cerita (${matching.length}) <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-left:4px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      } else {
        galleryMoreBox.hidden = true;
      }
    }
  };

  filters.forEach((f) => f.addEventListener('click', () => {
    currentCat = f.dataset.cat;
    filters.forEach((x) => x.classList.toggle('active', x === f));
    galleryExpanded = false;
    renderGallery();
  }));
  if (galleryToggleBtn) {
    galleryToggleBtn.addEventListener('click', () => {
      galleryExpanded = !galleryExpanded;
      renderGallery();
    });
  }
  if (figures.length) renderGallery();

  // Katalog frame: batasi preview default (4 frame), tombol untuk tampilkan semua
  const frameCards = $$('.frame-wrap');
  const frameFilters = $$('.frame-filters button');
  const moreBox = $('.frames-more');
  const moreBtn = moreBox ? $('button', moreBox) : null;
  const FIRST_FRAMES = 4;
  let frameType = 'Semua';
  let frameExpanded = false;

  const renderFrames = () => {
    const matching = frameCards.filter((c) => frameType === 'Semua' || c.dataset.type === frameType);
    frameCards.forEach((c) => { c.hidden = true; });
    matching.forEach((c, i) => {
      c.hidden = !(frameExpanded || i < FIRST_FRAMES);
    });

    if (moreBox && moreBtn) {
      if (matching.length > FIRST_FRAMES) {
        moreBox.hidden = false;
        moreBtn.innerHTML = frameExpanded
          ? 'Tampilkan lebih sedikit ↑'
          : `Lihat semua frame (${matching.length}) <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-left:4px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      } else {
        moreBox.hidden = true;
      }
    }
  };

  frameFilters.forEach((b) => b.addEventListener('click', () => {
    frameType = b.dataset.type;
    frameFilters.forEach((x) => x.classList.toggle('active', x === b));
    frameExpanded = false;
    renderFrames();
  }));
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      frameExpanded = !frameExpanded;
      renderFrames();
    });
  }
  if (frameCards.length) renderFrames();
  frameCards.forEach((c) => c.addEventListener('click', (e) => {
    const link = $('.frame-meta a', c);
    if (link && !e.target.closest('a')) window.open(link.href, '_blank', 'noopener');
  }));
  // Pastikan filter default selalu "Semua"
  [frameFilters, filters].forEach((group) => group.forEach((b, i) => b.classList.toggle('active', i === 0)));

  // Photobooth playground
  const machine = $('.booth-machine');
  if (machine) {
    const photos = JSON.parse(machine.dataset.photos || '[]');
    const img = $('.booth-screen > img', machine);
    const counter = $('.frame-counter', machine);
    const shutter = $('.shutter', machine);
    const label = $('.shutter-label', machine);
    const screen = $('.booth-screen', machine);
    let index = 0;
    let busy = false;
    shutter.addEventListener('click', () => {
      if (busy || !photos.length) return;
      busy = true;
      shutter.disabled = true;
      label.textContent = 'Hold that pose...';
      const show = (n) => {
        let el = $('.countdown', screen);
        if (!n) { if (el) el.remove(); return; }
        if (!el) { el = document.createElement('strong'); el.className = 'countdown'; screen.appendChild(el); }
        el.textContent = n;
        el.style.animation = 'none'; el.offsetWidth; el.style.animation = '';
      };
      show(3);
      setTimeout(() => show(2), 650);
      setTimeout(() => show(1), 1300);
      setTimeout(() => {
        show(0);
        index = (index + 1) % photos.length;
        img.src = photos[index];
        counter.textContent = 'FRAME 0' + (index + 1);
        machine.classList.add('is-flashing');
      }, 1950);
      setTimeout(() => {
        machine.classList.remove('is-flashing');
        busy = false;
        shutter.disabled = false;
        label.textContent = 'Take a photo';
      }, 2400);
    });
  }
};
