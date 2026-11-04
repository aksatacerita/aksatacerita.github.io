// Kursor "bingkai fokus kamera": empat siku yang mengikuti mouse dan "mengunci" di atas tombol/kartu.
// Hanya untuk perangkat bermouse; mati bila pengunjung memilih "kurangi gerakan". Kursor asli tidak disembunyikan.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SEL = 'a, button, [role="button"], input, select, textarea, label, summary, .package-card, .frame-wrap, .masonry figure';
  const el = document.createElement('div');
  el.className = 'vf';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="vf-in"><i></i><i></i><i></i><i></i></div>';
  document.body.appendChild(el);

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, shown = false;
  const loop = () => {
    x += (tx - x) * 0.4;
    y += (ty - y) * 0.4;
    el.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1 ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; x = tx; y = ty; el.classList.add('on'); }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  // Warna bingkai mengikuti terang/gelapnya latar di bawah kursor (dicek sekali per elemen, bukan tiap frame)
  const cache = new WeakMap();
  const isDark = (node) => {
    let n = node;
    while (n && n.nodeType === 1) {
      if (cache.has(n)) return cache.get(n);
      const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) {
        const dark = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) < 140;
        cache.set(node, dark);
        return dark;
      }
      n = n.parentElement;
    }
    return false;
  };

  // Tunda sebentar supaya tidak berkedip saat kursor melintasi banyak elemen dengan cepat
  let lockTimer = 0;
  document.addEventListener('mouseover', (e) => {
    const on = !!(e.target.closest && e.target.closest(SEL));
    clearTimeout(lockTimer);
    const dark = isDark(e.target);
    lockTimer = setTimeout(() => { el.classList.toggle('lock', on); el.classList.toggle('inv', dark); }, on ? 60 : 0);
  });
  document.addEventListener('mousedown', () => el.classList.add('press'));
  document.addEventListener('mouseup', () => el.classList.remove('press'));
  document.documentElement.addEventListener('mouseleave', () => { shown = false; el.classList.remove('on', 'press'); });
})();
