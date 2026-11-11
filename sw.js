// Service worker · Ranking Zona Sul. Ao alterar qualquer arquivo do app, incremente VERSION.
const VERSION = 'zs-v9';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Devolve o cache na hora e atualiza em segundo plano.
function swr(key, req) {
  return caches.open(VERSION).then(c => c.match(key).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) c.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Dados do ADM: rede primeiro (sempre o mais novo); sem rede, usa a última cópia.
  if (url.pathname.endsWith('/dados.json')) {
    const key = url.origin + url.pathname;
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key)));
    return;
  }
  if (req.mode === 'navigate') { e.respondWith(swr('./index.html', req)); return; }
  e.respondWith(swr(req, req));
});
