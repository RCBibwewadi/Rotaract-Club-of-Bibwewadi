// Rotaract Club of Bibwewadi — service worker.
// Caches only immutable build assets, icons and the offline fallback page.
// HTML documents and /api/* responses are NEVER cached: pages such as /profile,
// /admin and /directory render member data, and the API carries JWT-authorised
// payloads. Bump CACHE when the logic below changes.
const CACHE = 'rcb-v3';

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

// ── Push notifications ───────────────────────────────────────────────────────
// Payload shape: { title, body, tab, url } — see app/api/lib/push.ts.

async function appIsOpen() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windows.some((client) => client.visibilityState === 'visible');
}

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A push with no (or non-JSON) data still deserves a notification: some
    // browsers drop the subscription if we show nothing at all.
  }

  const title = payload.title || 'Rotaract Club of Bibwewadi';
  const url = payload.url || '/app';

  event.waitUntil(
    (async () => {
      // The member is looking at the app right now: tell it to refresh its
      // badges instead of interrupting them with a banner.
      if (await appIsOpen()) {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        windows.forEach((client) => client.postMessage({ type: 'rcb-unread' }));
        return;
      }

      await self.registration.showNotification(title, {
        body: payload.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        // One notification per section: a second idea replaces the first
        // rather than stacking up while the app is closed.
        tag: payload.tab || 'rcb',
        renotify: true,
        data: { url },
      });

      // shortcut: the home-screen number counts the notifications still on
      // screen, not the server's unread total — the push is the same payload
      // for every member, so it cannot carry a per-member count. The app
      // corrects it from /api/notifications the moment it is opened.
      if (self.navigator.setAppBadge) {
        const shown = await self.registration.getNotifications();
        await self.navigator.setAppBadge(shown.length).catch(() => {});
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/app';

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Only the installed app, never a website tab: every app screen lives
      // under /app, so a same-origin tab on any other path is the website and
      // focusing it would drop the member into the browser.
      for (const client of windows) {
        const url = new URL(client.url);
        if (
          url.origin === self.location.origin &&
          url.pathname.startsWith('/app') &&
          'focus' in client
        ) {
          if ('navigate' in client) await client.navigate(target).catch(() => {});
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
