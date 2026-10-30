// Satu-satunya tempat yang menentukan dari mana data situs diambil.
// Tahap GitHub Pages : file data.json di folder ini (diperbarui oleh admin Apps Script lewat GitHub).
// Tahap uji coba     : isi API_URL dengan alamat web app Apps Script (…/exec) agar data langsung dari Sheets.
window.AKSATA_CONFIG = {
  DATA_URL: 'data.json',
  API_URL: '',
};
