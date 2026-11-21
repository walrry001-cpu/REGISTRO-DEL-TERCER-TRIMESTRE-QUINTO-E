/* Registro 5.° E — Service Worker
   Cada vez que cambies VERSION, el navegador instala esta versión y BORRA todos los cachés anteriores.
   (Las notas guardadas en el celular —localStorage— no se tocan.) */
const VERSION = '2026-11-21-2';
const CACHE = 'registro5e-' + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icono-192-v2.png', 'icons/icono-512-v2.png', 'icons/icono-maskable-512-v2.png', 'icons/apple-touch-icon-v2.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));   // borra el caché anterior
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Archivos propios: primero la red (sin caché HTTP) para recibir siempre la última versión; sin internet, usa el caché.
    e.respondWith((async () => {
      try {
        const r = await fetch(new Request(req.url, { cache: 'no-store' }));
        if (r && r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
        return r;
      } catch (_) {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html')) || Response.error();
      }
    })());
  } else if (url.hostname === 'cdnjs.cloudflare.com') {
    // Librerías (pdf.js, jszip): caché primero, para que funcione sin internet.
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque')) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
      return r;
    })());
  }
});
