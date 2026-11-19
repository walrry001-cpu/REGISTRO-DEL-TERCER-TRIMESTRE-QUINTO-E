// Service worker · Registro 5.° E · versión 20261118c
const CACHE = 'registro-5e-20261118c';
const LOCAL = ['./', './index.html', './manifest.json', './favicon.ico',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-16.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(LOCAL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Borra solo las cachés viejas de ESTA app
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('registro-5e-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('/index.html'))) {
    // Página: primero la red (siempre la versión nueva); sin internet, la copia guardada
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Íconos, pdf.js y ExcelJS: caché primero y se guardan al usarlos (sirve sin internet)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  }).catch(() => hit)));
});
