(function () {
  const cfg = window.AKSATA_CONFIG;
  const app = document.getElementById('app');

  const getJson = async (url, timeoutMs) => {
    const ctl = new AbortController();
    const timer = timeoutMs ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { if (timer) clearTimeout(timer); }
  };
  // Bandingkan isi tanpa cap waktu supaya tidak menggambar ulang kalau datanya sama.
  const fingerprint = (d) => JSON.stringify(Object.assign({}, d, { updated_at: 0 }));

  const draw = (data) => {
    const y = window.scrollY;
    app.innerHTML = window.renderSite(data);
    window.applyMeta(data);
    window.initSite();
    if (window.initMotion) window.initMotion();
    if (y) window.scrollTo(0, y);
  };

  const refreshFromSheet = async (shown) => {
    if (!cfg.API_URL) return;
    try {
      const fresh = await getJson(cfg.API_URL + (cfg.API_URL.includes('?') ? '&' : '?') + 'action=public', cfg.API_TIMEOUT_MS);
      if (!fresh || !fresh.settings || !Array.isArray(fresh.packages)) return;
      if (fingerprint(fresh) === fingerprint(shown)) return;
      if (document.querySelector('.booking-drawer.show')) return; // jangan ganggu pengunjung yang sedang memesan
      draw(fresh);
    } catch (e) { console.warn('Data terbaru tidak terjangkau, memakai salinan statis.', e); }
  };

  getJson(cfg.DATA_URL + '?v=' + Date.now())
    .then((data) => { draw(data); refreshFromSheet(data); })
    .catch(async (err) => {
      console.error(err);
      if (!cfg.API_URL) { app.innerHTML = '<p style="padding:40px;text-align:center;font-family:sans-serif">Situs sedang tidak bisa dimuat. Coba lagi sebentar lagi.</p>'; return; }
      try { const d = await getJson(cfg.API_URL + '?action=public', cfg.API_TIMEOUT_MS); draw(d); }
      catch (e2) { app.innerHTML = '<p style="padding:40px;text-align:center;font-family:sans-serif">Situs sedang tidak bisa dimuat. Coba lagi sebentar lagi.</p>'; }
    });
})();
