// Animasi tampilan. Dipanggil setiap halaman digambar (juga saat data diperbarui dari Sheet).
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let booted = false;   // sudah pernah menggambar → gambar ulang tidak boleh berkedip
  let globalsBound = false;

  const groups = [
    ['.manifesto-inner > *', 90], ['.section-heading > *', 110], ['.package-grid .package-card', 110],
    ['.package-footnote', 0], ['.frames-section .filters', 0], ['.frames-scroll .frame-wrap', 70],
    ['.booth-copy > *', 90], ['.booth-machine', 0, 'pop'], ['.gallery-title > *', 90],
    ['.gallery-section .filters', 0], ['.masonry figure', 60, 'pop'], ['.ig-item', 90, 'pop'],
    ['.visit-copy > *', 80], ['.cta-section > h2, .cta-section > p, .cta-section > .btn', 110],
    ['.footer-top > *', 90],
  ];

  function initMotion() {
    const app = document.getElementById('app');
    if (!app) return;
    const redraw = booted;
    booted = true;
    const vh = window.innerHeight;
    const targets = [];

    // Hero: masuk saat pertama kali dibuka saja
    if (!redraw && !reduce) {
      app.querySelectorAll('.hero-copy > *').forEach((el, i) => {
        el.classList.add('reveal', 'in', 'hero'); el.style.setProperty('--d', 120 + i * 110 + 'ms');
      });
      const col = app.querySelector('.hero-collage');
      if (col) { col.classList.add('reveal', 'in', 'pop'); col.style.setProperty('--d', '350ms'); }
    }

    groups.forEach(([sel, step, mode]) => {
      app.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal'); if (mode) el.classList.add(mode);
        el.style.setProperty('--d', Math.min(i, 8) * step + 'ms');
        targets.push(el);
      });
    });

    const show = (el, instant) => { el.classList.add('in'); if (instant) el.classList.add('static'); };

    if (reduce || !('IntersectionObserver' in window)) { targets.forEach((el) => show(el, true)); }
    else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { show(e.target, false); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      targets.forEach((el) => {
        // Gambar ulang karena data baru: yang sudah terlihat langsung tampil tanpa animasi (tidak berkedip)
        if (redraw && el.getBoundingClientRect().top < vh) show(el, true); else io.observe(el);
      });
      // Pengaman: apa pun yang terjadi, semua konten terlihat setelah 5 detik
      setTimeout(() => app.querySelectorAll('.reveal:not(.in)').forEach((el) => show(el, true)), 5000);
    }

    // Kartu paket miring mengikuti kursor (hanya mouse)
    app.querySelectorAll('.package-card').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); });
      });
      card.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });

    // Kolase hero bergeser halus mengikuti kursor
    const hero = app.querySelector('.hero'), col = app.querySelector('.hero-collage');
    if (hero && col) {
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = hero.getBoundingClientRect();
        col.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        col.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => { col.style.setProperty('--mx', 0); col.style.setProperty('--my', 0); });
    }

    // Saring kategori/jenis: item yang tampil muncul bergantian lagi (dipasang sekali saja)
    if (!globalsBound) {
      globalsBound = true;
      document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.filters button, .gallery-toggle-btn, .frames-more button');
        if (!btn || reduce) return;
        requestAnimationFrame(() => {
          const scope = btn.closest('section') || document;
          const items = Array.from(scope.querySelectorAll('.masonry figure, .frame-wrap')).filter((el) => !el.hidden);
          items.forEach((el, i) => {
            el.classList.remove('in', 'static'); void el.offsetWidth;
            el.classList.add('reveal', 'pop'); el.style.setProperty('--d', Math.min(i, 10) * 45 + 'ms'); el.classList.add('in');
          });
        });
      });
    }
  }

  window.initMotion = initMotion;
})();
