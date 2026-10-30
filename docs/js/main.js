(function () {
  const cfg = window.AKSATA_CONFIG;

  // Sumber data tunggal: ganti di config.js, bagian lain tidak perlu berubah.
  async function loadData() {
    const url = cfg.API_URL ? cfg.API_URL + (cfg.API_URL.includes('?') ? '&' : '?') + 'action=public' : cfg.DATA_URL + '?v=' + Date.now();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  loadData()
    .then((data) => {
      document.getElementById('app').innerHTML = window.renderSite(data);
      window.applyMeta(data);
      window.initSite();
    })
    .catch((err) => {
      console.error(err);
      document.getElementById('app').innerHTML = '<p style="padding:40px;text-align:center;font-family:sans-serif">Situs sedang tidak bisa dimuat. Coba lagi sebentar lagi.</p>';
    });
})();
