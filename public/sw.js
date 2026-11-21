/* Diwaniya+ service worker: makes repeat visits faster and keeps the app shell available offline.
   It never touches anything live: the API (balance, login, payments), game launches, rooms and payment pages
   always go straight to the network. */
const VERSION = 'dw-shell-v4';
const SHELL = ['/', '/posters.js?v=3', '/qr.js', '/m8p.js?v=2', '/favicon.svg', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const NEVER = /^\/(api|play|rooms|payments|media)\//;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || NEVER.test(url.pathname)) return;

  // Pages: always try the network first so a new release shows at once; fall back to the saved page when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok && url.pathname === '/') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/', copy)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static files (scripts, posters, icons): answer from the cache and refresh it in the background.
  if (/\.(js|svg|png|webmanifest|css)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then((cache) => cache.match(req).then((hit) => {
        const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      }))
    );
  }
});
