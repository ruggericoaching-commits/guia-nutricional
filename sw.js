/* Service worker: la app funciona sin internet y se actualiza sola.
   Al publicar cambios, subí el número de versión de CACHE. */
const CACHE = 'guia-nutricional-v24';
const ASSETS = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest',
  'js/foods.js', 'js/content.js', 'js/engine.js', 'js/cloud-config.js', 'js/store.js', 'js/cloud.js', 'js/ui.js', 'js/client.js', 'js/form.js', 'js/coach.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Página: primero la red (para recibir actualizaciones), si no hay conexión la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Resto: la copia guardada al instante y se refresca en segundo plano
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
