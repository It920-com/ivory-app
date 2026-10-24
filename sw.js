/* Ivory service worker: keeps a copy of the app so it opens offline. The build fills in VERSION and FILES.
   A new version installs in the background and takes over once every Ivory window has closed, so the app
   never changes under someone mid-task, or sooner when people tap Reload on the notice that it's ready.
   Saved data lives in IndexedDB and is never touched here. */
const VERSION = '7ce0d29a608c';
const FILES = ["./","assets/index-4RmjKtCT.js","assets/pdf-DlnNKjkD.js","assets/pdf.worker.min-BsH4xb_6.js","assets/geist-cyrillic-ext-wght-normal-DjL33-gN.woff2","assets/geist-cyrillic-wght-normal-BEAKL7Jp.woff2","assets/geist-latin-ext-wght-normal-DC-KSUi6.woff2","assets/geist-latin-wght-normal-BgDaEnEv.woff2","assets/geist-vietnamese-wght-normal-6IgcOCM7.woff2","assets/index-BcfoUZia.css","assets/pdf.worker.min-rsCePomN.mjs","assets/unbounded-cyrillic-wght-normal-C627f1f8.woff2","assets/unbounded-latin-ext-wght-normal-D6H-S6MW.woff2","assets/unbounded-latin-wght-normal-D5afBTBx.woff2","assets/unbounded-vietnamese-wght-normal-rat7GD3o.woff2","manifest.webmanifest","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon.svg"];
const CACHE = 'ivory-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

// Reload on the notice: take over now instead of waiting for every window to close
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ivory-') && k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Ivory's own page opens from the cached app shell, whatever follows the ?; other pages (ru/, which leads on to it) and
  // files come from the cache, falling back to the network.
  const app = req.mode === 'navigate' && new URL(req.url).pathname === new URL(self.registration.scope).pathname;
  const key = app ? './' : req;
  // ignoreVary: servers often send Vary: Origin, and module scripts are requested with an Origin header the install step did not send.
  e.respondWith(caches.open(CACHE).then(c => c.match(key, { ignoreVary: true }).then(hit => hit || fetch(req))));
});
