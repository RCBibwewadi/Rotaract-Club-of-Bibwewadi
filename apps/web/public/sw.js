// Rotaract Club of Bibwewadi — service worker.
// Caches only immutable build assets, icons and the offline fallback page.
// HTML documents and /api/* responses are NEVER cached: pages such as /profile,
// /admin and /directory render member data, and the API carries JWT-authorised
// payloads. Bump CACHE when the logic below changes.
const CACHE = 'rcb-v2';

const PRECACHE = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];

// The offline page's stylesheet is content-hashed, so its name is only known at
// runtime: read the page we just precached and cache the same-origin
// stylesheets it links. Without this the offline page is unstyled for a visitor
// who loses connectivity during their very first page view.
async function precacheOfflineStyles(cache) {
  try {
    const response = await fetch('/offline');
    const html = await response.text();
    const hrefs = html.match(/href="(\/_next\/static\/[^"]+\.css)"/g) || [];
    await Promise.all(
      hrefs
        .map((attr) => attr.slice(6, -1))
        .map((href) => cache.add(href).catch(() => {}))
    );
  } catch {
    // never let this fail the install
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // per-item so one missing asset cannot fail the whole install
      .then(async (cache) => {
        await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})));
        await precacheOfflineStyles(cache);
      })
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
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request));
  }
});
