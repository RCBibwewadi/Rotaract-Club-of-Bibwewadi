// Rotaract Club of Bibwewadi — service worker.
// Caches only immutable build assets, icons and the offline fallback page.
// HTML documents and /api/* responses are NEVER cached: pages such as /profile,
// /admin and /directory render member data, and the API carries JWT-authorised
// payloads. Bump CACHE when the logic below changes.
const CACHE = 'rcb-v1';

const PRECACHE = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // per-item so one missing asset cannot fail the whole install
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (request.headers.has('Authorization')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Documents always come from the network; offline they fall back to /offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match('/offline');
        return fallback || Response.error();
      })
    );
    return;
  }

  // Content-hashed build output and icons are safe to serve from cache.
  // shortcut: the offline page's CSS chunk is only cached once some page has been
  // loaded with this worker active, so a visitor who goes offline during their very
  // first page view sees it unstyled. Precache the chunk from the build manifest if
  // that ever matters.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request));
  }
});
